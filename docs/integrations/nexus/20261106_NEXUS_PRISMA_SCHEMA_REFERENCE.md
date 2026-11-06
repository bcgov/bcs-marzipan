# Nexus Prisma schema reference (snapshot)

Point-in-time copy of Nexus NRMS PostgreSQL models for integration planning. When behaviour diverges from this file, prefer Nexus engineering confirmation and update the snapshot date.

**Integration contract bundle:** revision `0.0.2` (see [`INTEGRATION.md`](./INTEGRATION.md) header · [`CHANGELOG-nexus-integration.md`](./CHANGELOG-nexus-integration.md)). Bump contract revision when this mapping table or snapshot changes materially.

## Marzipan mirror ingest — wire field mapping (v1)

| Marzipan mirror / OpenAPI field     | Nexus source                                  | Notes                                                                                                                                    |
| ----------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `nexusReleaseId`                    | `Release.id`                                  | UUID                                                                                                                                     |
| `nexusDocumentTypeKey`              | `DocumentType.name`                           | API exposes `name` as bootstrap `key` (e.g. `NEWS_RELEASE`, `ADVISORY`); FK on row is `documentTypeId`                                   |
| `releaseStatus`                     | _(derived)_                                   | `deriveReleaseStatus()` from `isCommitted`, `isPublished`, `publishDateTime`, latest `PublicationJob`, `documentTypeId` — **not** stored |
| `scheduledPublishDateTime`          | `Release.publishDateTime`                     | Persisted on draft/publishing save; nullable when not scheduled / publish-now                                                            |
| `publicationJobScheduledFor`        | `PublicationJob.scheduledFor`                 | Latest job by `createdAt`; optional on wire when null; today matches `publishDateTime` for normal scheduled path                         |
| `actualPublishDateTime`             | `PublicationJob.completedAt`                  | Latest job (same ordering policy)                                                                                                        |
| `publicationCompleted`              | _(derived)_                                   | From job success + `isPublished` / advisory **Sent** rules — contract convenience                                                        |
| `releaseUrl`                        | `DestinationResult.publicUrl` (typical)       | **Open O-27** — which destination/attempt wins; not `Release.assetUrl`                                                                   |
| `themes[]`                          | `ReleaseTheme` → `Theme.key` or `displayName` | Junction, not a release column                                                                                                           |
| `hasTranslations`                   | `Release.hasTranslations`                     | Boolean only; per-locale URLs are future Nexus work                                                                                      |
| `updatedAt`                         | `Release.updatedAt`                           | Mirror freshness / stale ordering; not `Activity.sourceUpdatedAt`                                                                        |
| `updatedBy`                         | _(not on `Release` today)_                    | **Open O-28** — confirm with Nexus: no `updated_by` on `news_release`; only `createdByUserId`. v1 mirror wire omits actor.               |
| `translationLanguagesPendingReview` | `ReleaseLocalization` + languages             | Distinct from published translation **artifacts**                                                                                        |
| —                                   | `ReleaseDistributionSelection`                | Distribution lists exist in Nexus; **not** mirrored as Marzipan “subscriptions” in v1 — **Open O-26**                                    |

**Release lifecycle labels:** Nexus UI uses **Draft**, **Scheduled**, **Publishing**, **Published**, **Sent**, **Failed**. There is **no** **Archived** status; deactivate uses `Release.isActive = false` (**Open O-3** / mirror visibility).

**Names:** Nexus `Activity` is a **catalog/sync** table; Marzipan link uses `Release.activityId` (integer Marzipan id). `ActivityImportSnapshot.acceptedAt` is coordination import time, not publication schedule confirmation.

```prisma
generator client {
provider = "prisma-client-js"
}

datasource db {
provider = "postgresql"
url = env("DATABASE_URL")
}

enum PublicationOperation {
PUBLISH
UNPUBLISH
REPUBLISH
}

enum PublicationJobStatus {
PENDING
RUNNING
SUCCEEDED
FAILED
}

enum NotificationType {
RELEASE_PUBLISHED
RELEASE_PUBLICATION_FAILED
}

enum PublicationDestination {
BC_GOV_NEWS
NEWS_ON_DEMAND
MEDIA_DISTRIBUTION
}

enum DestinationResultStatus {
PENDING
RUNNING
SUCCEEDED
FAILED
}

enum UserRole {
EDITOR
APPROVER
ADMIN
}

// Integration: DocumentType.name is the stable string key on the API (bootstrap `key`); Release.documentTypeId references id.
model DocumentType {
id Int @id @default(autoincrement()) @map("id")
name String @unique @map("name")
displayName String @map("display_name")
description String @map("description")
icon String @map("icon")
iconClass String @map("icon_class")
sortOrder Int @map("sort_order")
isActive Boolean @default(true) @map("is_active")

releases Release[]
@@map("document_type")
}

model Ministry {
id String @id @default(uuid()) @map("id") @db.Uuid
key String @unique @map("key") @db.VarChar(100)
sortOrder Int @default(0) @map("sort_order")
abbreviation String @map("abbreviation") @db.VarChar(10)
displayName String @map("display_name") @db.VarChar(255)
isActive Boolean @default(true) @map("is_active")
leadReleases Release[] @relation("LeadMinistry")
jointReleases ReleaseJointMinistry[]

@@map("ministry")
}

model Language {
id Int @id @map("id")
sortOrder Int @default(0) @map("sort_order")
name String @default("") @map("name")
culture String @unique @map("culture")
displayName String @map("display_name")
isActive Boolean @default(true) @map("is_active")
isDefault Boolean @default(false) @map("is_default")
localizations ReleaseLocalization[]

@@map("language")
}

model Theme {
id String @id @default(uuid()) @map("id") @db.Uuid
key String @default("") @map("key")
displayName String @map("display_name")
timestamp DateTime @default(now()) @map("timestamp") @db.Timestamptz(3)
sortOrder Int @map("sort_order")
isActive Boolean @default(true) @map("is_active")
releases ReleaseTheme[]

@@map("theme")
}

model Country {
id String @id @default(uuid()) @map("id") @db.Uuid
name String @map("name") @db.VarChar(255)
displayName String @map("display_name") @db.VarChar(255)
sortOrder Int @default(0) @map("sort_order")
isActive Boolean @default(true) @map("is_active")
createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
createdBy String @map("created_by") @db.Uuid
updatedAt DateTime @default(now()) @map("updated_at") @db.Timestamptz(6)
updatedBy String @map("updated_by") @db.Uuid

@@map("country")
}

model Province {
id String @id @default(uuid()) @map("id") @db.Uuid
name String @map("name") @db.VarChar(255)
shortName String @map("short_name") @db.VarChar(255)
displayName String @map("display_name") @db.VarChar(255)
sortOrder Int @default(0) @map("sort_order")
isActive Boolean @default(true) @map("is_active")
countryId String @map("country_id") @db.Uuid
createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
createdBy String @map("created_by") @db.Uuid
updatedAt DateTime @default(now()) @map("updated_at") @db.Timestamptz(6)
updatedBy String @map("updated_by") @db.Uuid

@@map("province")
}

// provinceId and countryId are mutually exclusive: cities outside Canada record countryId only.
model City {
id String @id @default(uuid()) @map("id") @db.Uuid
name String @map("name") @db.VarChar(255)
displayName String @map("display_name") @db.VarChar(255)
sortOrder Int @default(0) @map("sort_order")
isActive Boolean @default(true) @map("is_active")
provinceId String? @map("province_id") @db.Uuid
countryId String? @map("country_id") @db.Uuid
createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
createdBy String @map("created_by") @db.Uuid
updatedAt DateTime @default(now()) @map("updated_at") @db.Timestamptz(6)
updatedBy String @map("updated_by") @db.Uuid

@@map("city")
}

model Activity {
id Int @id @map("id")
title String @map("title")
eventDateTime DateTime @map("event_date_time") @db.Timestamptz(3)
leadMinistryId String? @map("lead_ministry_id") @db.Uuid
jointMinistryIds Json @map("joint_ministry_ids")
location String @map("location")
languageIds Json @map("language_ids")
sourceUpdatedAt DateTime @map("source_updated_at") @db.Timestamptz(3)
isApproved Boolean @default(true) @map("is_approved")

@@map("activity")
}

model Contact {
id String @id @default(uuid()) @map("id") @db.Uuid
externalId String? @unique @map("external_id") @db.Uuid
contactType String @default("Ministry") @map("contact_type")
name String @map("name")
title String @map("title")
organization String @map("organization")
email String @map("email")
phone String @map("phone")
additionalDetails String? @map("additional_details")
isActive Boolean @default(true) @map("is_active")
sourceUpdatedAt DateTime? @map("source_updated_at") @db.Timestamptz(3)
syncedAt DateTime? @map("synced_at") @db.Timestamptz(3)

@@map("contact")
}

model DistributionList {
id String @id @default(uuid()) @map("id") @db.Uuid
externalId String? @unique @map("external_id") @db.Uuid
key String @unique @map("key")
displayName String @map("display_name")
sortOrder Int @map("sort_order")
isActive Boolean @default(true) @map("is_active")
sourceUpdatedAt DateTime? @map("source_updated_at") @db.Timestamptz(3)
syncedAt DateTime? @map("synced_at") @db.Timestamptz(3)
selections ReleaseDistributionSelection[]

@@map("media_distribution_list")
}

model User {
id String @id @map("id") @db.Uuid
displayName String @map("display_name") @db.VarChar(256)
emailAddress String @map("email_address") @db.VarChar(256)
isActive Boolean @default(true) @map("is_active")
logs NewsReleaseLog[]
draftVersions ReleaseDraftVersion[] @relation("ReleaseDraftVersionSavedBy")
draftVersionTranslations ReleaseDraftVersionTranslation[] @relation("ReleaseDraftVersionTranslationSavedBy")
credential UserCredential?
createdReleases Release[] @relation("ReleaseCreatedBy")
requestedPublicationJobs PublicationJob[] @relation("PublicationJobRequestedBy")
receivedNotifications UserNotification[] @relation("UserNotificationRecipient")

@@map("user")
}

model UserCredential {
id String @id @default(uuid()) @map("id") @db.Uuid
userId String @unique @map("user_id") @db.Uuid
username String @unique @map("username") @db.VarChar(256)
passwordHash String @map("password_hash")
role UserRole @map("role")
isActive Boolean @default(true) @map("is_active")
passwordUpdatedAt DateTime @default(now()) @map("password_updated_at") @db.Timestamptz(3)
createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

@@map("user_credential")
}

// Integration: release workflow "status" is derived in application code — see mapping table above.
// Integration: Release has updatedAt but no updatedBy (confirm O-28); v1 mirror carries updatedAt only.
model Release {
id String @id @default(uuid()) @map("id") @db.Uuid
documentTypeId Int @default(1) @map("document_type_id")
reference String? @unique @map("reference") @db.VarChar(50)
activityId Int? @map("activity_id") // Marzipan activities.id when linked
leadMinistryId String? @map("ministry_id") @db.Uuid
publishDateTime DateTime? @map("publish_date_time") @db.Timestamptz(3) // Mirror: scheduledPublishDateTime
isCommitted Boolean @default(false) @map("is_committed")
isPublished Boolean @default(false) @map("is_published")
isActive Boolean @default(true) @map("is_active") // Deactivate (not an "Archived" status enum)
publishOptions Json? @map("publish_options_json")
hasMediaAssets Boolean @default(false) @map("has_media_assets")
assetUrl String @default("") @map("asset_url")
featuredImageAltText String? @map("featured_image_alt_text")
hasTranslations Boolean @default(false) @map("has_translations")
externalOrganizations Json? @map("external_organizations_json")
version Int @default(1) @map("version")
createdByUserId String? @map("created_by_user_id") @db.Uuid
createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

documentType DocumentType @relation(fields: [documentTypeId], references: [id])
leadMinistry Ministry? @relation("LeadMinistry", fields: [leadMinistryId], references: [id])
localizations ReleaseLocalization[]
jointMinistries ReleaseJointMinistry[]
themes ReleaseTheme[]
activitySnapshot ActivityImportSnapshot?
contactSnapshots ReleaseContactSnapshot[]
distributionSelections ReleaseDistributionSelection[]
publicationJobs PublicationJob[]
draftVersions ReleaseDraftVersion[]
draftVersionTranslations ReleaseDraftVersionTranslation[] @relation("ReleaseDraftVersionTranslations")
createdBy User? @relation("ReleaseCreatedBy", fields: [createdByUserId], references: [id], onDelete: SetNull)
notificationEvents NotificationEvent[]

@@index([documentTypeId])
@@index([activityId])
@@index([leadMinistryId])
@@index([createdByUserId])
@@map("news_release")
}

model ReleaseLocalization {
releaseId String @map("release_id") @db.Uuid
languageId Int @map("language_id")

release Release @relation(fields: [releaseId], references: [id], onDelete: Cascade)
language Language @relation(fields: [languageId], references: [id])

@@id([releaseId, languageId])
@@map("news_release_language")
}

model NewsReleaseLog {
id Int @id @default(autoincrement()) @map("id")
releaseId String @map("release_id") @db.Uuid
dateTime DateTime @map("date_time") @db.Timestamptz(3)
userId String? @map("user_id") @db.Uuid
description String @map("description")
user User? @relation(fields: [userId], references: [id])

@@map("news_release_log")
}

model ReleaseDraftVersion {
id String @id @default(uuid()) @map("id") @db.Uuid
releaseId String @map("release_id") @db.Uuid
versionNumber Int @map("version_number")
schemaVersion Int @map("schema_version")
savedAt DateTime @default(now()) @map("saved_at") @db.Timestamptz(3)
savedByUserId String? @map("saved_by_user_id") @db.Uuid
snapshot Json @map("snapshot")

release Release @relation(fields: [releaseId], references: [id], onDelete: Cascade)
savedByUser User? @relation("ReleaseDraftVersionSavedBy", fields: [savedByUserId], references: [id], onDelete: SetNull)

@@unique([releaseId, versionNumber])
@@index([releaseId, savedAt])
@@map("release_draft_version")
}

model ReleaseDraftVersionTranslation {
id String @id @default(uuid()) @map("id") @db.Uuid
releaseId String @map("release_id") @db.Uuid
languageId Int @map("language_id")
versionNumber Int @map("version_number")
schemaVersion Int @map("schema_version")
savedAt DateTime @default(now()) @map("saved_at") @db.Timestamptz(3)
savedByUserId String? @map("saved_by_user_id") @db.Uuid
snapshot Json @map("snapshot")

release Release @relation("ReleaseDraftVersionTranslations", fields: [releaseId], references: [id], onDelete: Cascade)
savedByUser User? @relation("ReleaseDraftVersionTranslationSavedBy", fields: [savedByUserId], references: [id], onDelete: SetNull)

@@unique([releaseId, languageId, versionNumber])
@@index([releaseId, languageId, savedAt])
@@map("release_draft_version_translation")
}

model ReleaseJointMinistry {
releaseId String @map("release_id") @db.Uuid
ministryId String @map("ministry_id") @db.Uuid
release Release @relation(fields: [releaseId], references: [id], onDelete: Cascade)
ministry Ministry @relation(fields: [ministryId], references: [id])

@@id([releaseId, ministryId])
@@map("news_release_ministry")
}

model ReleaseTheme {
releaseId String @map("release_id") @db.Uuid
themeId String @map("theme_id") @db.Uuid
release Release @relation(fields: [releaseId], references: [id], onDelete: Cascade)
theme Theme @relation(fields: [themeId], references: [id])

@@id([releaseId, themeId])
@@map("news_release_theme")
}

// Coordination snapshot at link — not the Marzipan mirror schedule.
model ActivityImportSnapshot {
id String @id @default(uuid()) @map("id") @db.Uuid
releaseId String @unique @map("release_id") @db.Uuid
activityId Int @map("activity_id")
activityTitle String @map("activity_title")
eventDateTime DateTime @map("event_date_time") @db.Timestamptz(3)
leadMinistryId String? @map("lead_ministry_id") @db.Uuid
jointMinistryIds Json @map("joint_ministry_ids")
location String @map("location")
languageIds Json @map("language_ids")
sourceUpdatedAt DateTime @map("source_updated_at") @db.Timestamptz(3)
pulledAt DateTime @default(now()) @map("pulled_at") @db.Timestamptz(3)
acceptedAt DateTime @default(now()) @map("accepted_at") @db.Timestamptz(3) // Import accepted — not ConfirmedAt / publish schedule
release Release @relation(fields: [releaseId], references: [id], onDelete: Cascade)

@@map("activity_import_snapshot")
}

model ReleaseContactSnapshot {
id String @id @default(uuid()) @map("id") @db.Uuid
releaseId String @map("release_id") @db.Uuid
languageId Int @map("language_id")
sourceContactId String? @map("source_contact_id") @db.Uuid
contactType String @map("contact_type")
name String @map("name")
title String @map("title")
organization String @map("organization")
email String @map("email")
phone String @map("phone")
additionalDetails String? @map("additional_details")
sortOrder Int @default(0) @map("sort_order")
capturedAt DateTime @default(now()) @map("captured_at") @db.Timestamptz(3)
release Release @relation(fields: [releaseId], references: [id], onDelete: Cascade)

@@index([releaseId, sortOrder])
@@map("release_contact_snapshot")
}

model ReleaseDistributionSelection {
releaseId String @map("release_id") @db.Uuid
distributionListId String @map("distribution_list_id") @db.Uuid
selectedAt DateTime @default(now()) @map("selected_at") @db.Timestamptz(3)
release Release @relation(fields: [releaseId], references: [id], onDelete: Cascade)
distributionList DistributionList @relation(fields: [distributionListId], references: [id])

@@id([releaseId, distributionListId])
@@map("release_distribution_selection")
}

// Integration: pick latest job by createdAt for mirror job fields.
model PublicationJob {
id String @id @default(uuid()) @map("id") @db.Uuid
releaseId String @map("release_id") @db.Uuid
operation PublicationOperation @map("operation")
scheduledFor DateTime? @map("scheduled_for") @db.Timestamptz(3) // Mirror: publicationJobScheduledFor (optional)
status PublicationJobStatus @default(PENDING) @map("status")
createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
startedAt DateTime? @map("started_at") @db.Timestamptz(3)
completedAt DateTime? @map("completed_at") @db.Timestamptz(3) // Mirror: actualPublishDateTime when completed
requestedByUserId String? @map("requested_by_user_id") @db.Uuid
release Release @relation(fields: [releaseId], references: [id], onDelete: Cascade)
requestedBy User? @relation("PublicationJobRequestedBy", fields: [requestedByUserId], references: [id], onDelete: SetNull)
attempts PublicationAttempt[]
notificationEvents NotificationEvent[]

@@index([releaseId, createdAt])
@@index([requestedByUserId])
@@map("publication_job")
}

model PublicationAttempt {
id String @id @default(uuid()) @map("id") @db.Uuid
publicationJobId String @map("publication_job_id") @db.Uuid
attemptNumber Int @map("attempt_number")
startedAt DateTime @default(now()) @map("started_at") @db.Timestamptz(3)
completedAt DateTime? @map("completed_at") @db.Timestamptz(3)
errorMessage String? @map("error_message")
publicationJob PublicationJob @relation(fields: [publicationJobId], references: [id], onDelete: Cascade)
destinationResults DestinationResult[]

@@unique([publicationJobId, attemptNumber])
@@map("publication_attempt")
}

model DestinationResult {
id String @id @default(uuid()) @map("id") @db.Uuid
publicationAttemptId String @map("publication_attempt_id") @db.Uuid
destination PublicationDestination @map("destination")
status DestinationResultStatus @default(PENDING) @map("status")
externalReference String? @map("external_reference")
publicUrl String? @map("public_url")
errorMessage String? @map("error_message")
publicationAttempt PublicationAttempt @relation(fields: [publicationAttemptId], references: [id], onDelete: Cascade)

@@unique([publicationAttemptId, destination])
@@map("destination_result")
}

model NotificationEvent {
id String @id @default(uuid()) @map("id") @db.Uuid
type NotificationType @map("type")
releaseId String? @map("release_id") @db.Uuid
publicationJobId String? @map("publication_job_id") @db.Uuid
payload Json @map("payload")
occurredAt DateTime @default(now()) @map("occurred_at") @db.Timestamptz(3)
processedAt DateTime? @map("processed_at") @db.Timestamptz(3)
release Release? @relation(fields: [releaseId], references: [id], onDelete: SetNull)
publicationJob PublicationJob? @relation(fields: [publicationJobId], references: [id], onDelete: SetNull)
userNotifications UserNotification[]

@@unique([publicationJobId, type])
@@index([processedAt, occurredAt])
@@index([releaseId, occurredAt])
@@map("notification_event")
}

model UserNotification {
id String @id @default(uuid()) @map("id") @db.Uuid
notificationEventId String @map("notification_event_id") @db.Uuid
recipientUserId String @map("recipient_user_id") @db.Uuid
createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
readAt DateTime? @map("read_at") @db.Timestamptz(3)
notificationEvent NotificationEvent @relation(fields: [notificationEventId], references: [id], onDelete: Cascade)
recipientUser User @relation("UserNotificationRecipient", fields: [recipientUserId], references: [id], onDelete: Cascade)

@@unique([notificationEventId, recipientUserId])
@@index([recipientUserId, createdAt])
@@index([recipientUserId, readAt, createdAt])
@@map("user_notification")
}
```
