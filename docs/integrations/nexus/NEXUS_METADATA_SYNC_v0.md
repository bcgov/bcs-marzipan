# Nexus / Marzipan metadata integration contract proposal

> **Reference only.** The current integration agreement and OpenAPI stub live under
> [`integrations/nexus/INTEGRATION.md`](./nexus/INTEGRATION.md) and
> [`integrations/nexus/openapi.yaml`](./nexus/openapi.yaml). This file is kept for historical
> comparison with early payload sketches.

This document is a draft API contract only. It is intended to describe the request/response structures for the metadata handoff between Marzipan (Corpcal) and Nexus (NRMS), using the current Marzipan activity schema as the source of truth where available.

## Scope

The metadata ownership overview identifies a shared activity metadata model with fields owned by Marzipan, managed by Nexus, or synchronized between systems. This proposal separates the contracts into two sides:

1. Marzipan (Corpcal) outbound API contract: Marzipan sends activity metadata to Nexus.
2. Nexus (NRMS) inbound API contract: Nexus receives or creates metadata for a release activity.

The Marzipan fields below are mapped to the actual Drizzle/DB schema in `packages/database/src/schema/activity.ts` as much as possible. Nexus field types are approximate guesses and are intentionally documented as such.

---

## 1) Marzipan (Corpcal) side: outbound metadata sync

### Purpose

Marzipan publishes the canonical activity metadata to Nexus for downstream release handling.

### Suggested endpoint

```yaml
openapi: 3.0.3
info:
  title: Marzipan Corpcal Nexus Metadata Sync API
  version: 1.0.0
paths:
  /api/v1/nexus/activity-metadata/sync:
    post:
      tags: ['Nexus Sync']
      summary: Publish a Marzipan activity metadata payload to Nexus
      operationId: publishActivityMetadataToNexus
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/MarzipanActivityMetadataSyncRequest'
      responses:
        '200':
          description: Accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MarzipanActivityMetadataSyncResponse'
        '400':
          description: Validation error
        '404':
          description: Activity not found
```

### Request schema

Marzipan → Nexus metadata sync (v1)

- Dates: `YYYY-MM-DD`. Times: `HH:mm` / `HH:mm:ss` (wall, no TZ)
- Instants: ISO UTC (`timestamptz`)
- Lookup _names_ = stable DB `name`, not UI labels

```ts
export type MarzipanActivityMetadataSyncRequest = {
  payloadVersion: '1.0';
  activityId: number; // `activities.id`
  displayId?: string | null; // e.g. HLTH-000123; team-based prefix
  categories: Array<{ id: number; name: string; displayName: string }>;
  title: string;

  isAllDay: boolean;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null; // null if all-day or unset
  endTime?: string | null;
  dateStatusId: number;
  dateStatus?: string | null; // e.g. tbc, confirmed
  timeStatusId: number;
  timeStatus?: string | null;

  venueAddress?: {
    city?: string | null;
    provinceOrState?: string | null;
    country?: string | null;
  } | null;

  leadTeamId: number; // required FK to teams
  leadTeamDisplayName?: string | null; // computed
  organizations: SyncOrganization[]; // min 1, exactly one isLead
  leadMinistry?: string | null; // derived when lead org is ministry type
  leadMinistryAbbreviation?: string | null;

  newsReleaseOriginId?: number | null;
  newsReleaseOrigin?: string | null;
  newsReleaseDistributionId?: number | null;
  newsReleaseDistribution?: string | null;
  releaseSchedulingMode?: 'relative' | 'on_signal' | null;
  releaseTimeOffsetMinutes?: number | null; // minutes after start datetime anchor; null if on_signal/unset
  releaseTime?: string | null; // computed timestamptz

  translationsRequiredStatusId?: number | null;
  translationsRequiredStatus?: string | null;
  translationLanguages?: Array<{
    id: number; // translated_languages PK (no uuid in Marzipan)
    shortcode?: string | null;
    displayName: string;
  }>;
```

```ts
export type SyncOrganization =
  | {
      kind: 'catalog';
      organizationUuid: string; // organizations.uuid — Nexus primary key
      marzipanOrganizationId?: number; // optional Marzipan FK
      displayName: string;
      acronym?: string | null;
      isLead: boolean;
    }
  | {
      kind: 'freeform';
      organizationName: string; // junction free text only
      displayName: string;
      isLead: boolean;
    };
```

### Response schema

```ts
export type MarzipanActivityMetadataSyncResponse = {
  success: true;
  activityId: number;
  nexusCorrelationId?: string | null;
  status: 'accepted' | 'rejected' | 'partial';
  message?: string | null;
  payloadVersion: '1.0';
  syncedAt: string; // ISO timestamp UTC
  warnings?: string[];
};
```

### Notes

- This payload is designed as an outbound sync contract from Marzipan to Nexus.
- Marzipan should be the source of truth for activity scheduling, status fields, lead team/ministry, and translations metadata.
- More advanced fields such as distribution lists, news subscriptions, themes, and release contacts can be treated as optional in early versions.

---

## 2) Nexus (NRMS) side: inbound metadata receive / sync contract

### Purpose

Nexus provides authoritative metadata back to Marzipan, or accepts a Marzipan-triggered metadata event for release lifecycle management.

### Suggested endpoint

```yaml
openapi: 3.0.3
info:
  title: Nexus NRMS Marzipan Metadata Inbound API
  version: 1.0.0
paths:
  /api/v1/nrms/activity-metadata/ingest:
    post:
      tags: ['NRMS Metadata Ingest']
      summary: Receive or ingest activity metadata from Nexus into Marzipan
      operationId: ingestNexusActivityMetadata
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NexusActivityMetadataIngestRequest'
      responses:
        '200':
          description: Accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NexusActivityMetadataIngestResponse'
        '202':
          description: Accepted for async processing
        '400':
          description: Invalid payload
```

### Request schema

```ts
export type NexusActivityMetadataIngestRequest = {
  sourceSystem: 'nexus';
  nexusActivityId?: string | null;
  marzipanActivityId?: number | null;
  releaseStatus?: 'draft' | 'scheduled' | 'published' | 'archived' | null;
  releaseDateTime?: string | null; // ISO timestamp UTC
  releaseUrl?: string | null;
  mediaAdvisoryUrl?: string | null;
  backgrounderUrl?: string | null;
  translations?: Array<{
    languageCode: string;
    url?: string | null;
    status?: string | null;
  }>;
  jointMinistries?: Array<{
    uuid: string;
    displayName: string;
  }>;
  jointOrganizations?: Array<{
    uuid: string;
    displayName: string;
  }>;
  jointOrganizationNames?: Array<{
    name: string;
  }>;
  releaseContacts?: Array<{
    name?: string | null;
    email?: string | null;
    role?: string | null;
    organization?: string | null;
  }>;
  themes?: string[];
  subscriptions?: string[];
  distributionLists?: string[];
  lastUpdatedDateTime?: string | null;
  lastUpdatedBy?: string | null;
};
```

### Response schema

```ts
export type NexusActivityMetadataIngestResponse = {
  success: true;
  marzipanActivityId?: number | null;
  nexusActivityId?: string | null;
  status: 'accepted' | 'queued' | 'rejected';
  message?: string | null;
  processedAt: string; // ISO timestamp UTC
  warnings?: string[];
};
```

### Notes

- This contract represents the side that is authoritative for release lifecycle fields such as release status, publication URL, media advisory, translations, contacts, and contextual release metadata.
- This inbound schema should be treated as a read/write integration surface for Nexus metadata that Marzipan can consume and store as a read-only mirror, or enrich only with clearly marked fields.

---

## 3) Marzipan field mapping to actual database schema

The following mapping is based on the current Drizzle schema at `packages/database/src/schema/activity.ts`.

| Metadata ownership overview field         | Marzipan DB column / relation                                                         |                DB type in Drizzle | Notes                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------: | --------------------------------------------------------------- |
| Activity ID                               | `activities.id`                                                                       |             `serial` / integer PK | Primary DB identity in Corpcal                                  |
| Activity title                            | `activities.title`                                                                    |                    `varchar(255)` | Required                                                        |
| Activity start date/time                  | `activities.startDate`, `activities.startTime`                                        |                    `date`, `time` | Time is separate from date                                      |
| Activity end date/time                    | `activities.endDate`, `activities.endTime`                                            |                    `date`, `time` | Separate columns                                                |
| Date/time status                          | `activities.dateStatusId`, `activities.timeStatusId`                                  |                      `integer` FK | Lookup-based, not raw string                                    |
| Release date/time                         | `activities.newsReleaseDateTime`                                                      |        `timestamp with time zone` | This is the release scheduling moment                           |
| Release status                            | `activities.activityStatusId` or specific release lifecycle status if added later     |                      `integer` FK | In current schema, broader activity status is used              |
| City                                      | not in current `activities` table directly; likely mapped elsewhere or optional field | `varchar`/lookup pattern if added | May be represented in future separate venue metadata            |
| Lead team                                 | `activities.leadTeamId`                                                               |                      `integer` FK | Required in current schema                                      |
| Lead ministry / organization              | `activities.leadMinistryId`, `activities.leadOrgId`, `activities.leadOrgName`         |        `integer` / `varchar(255)` | Includes both structural and free-text options                  |
| Translations required status              | `activities.translationsRequiredStatusId`                                             |                      `integer` FK | Lookup, not raw enum                                            |
| Languages                                 | not directly on main activity row; likely relation/junction table                     |             likely junction table | Need relation tables or JSON to be added if not already modeled |
| Themes                                    | likely `activityThemes` relation table                                                |                    junction table | See `relations.ts`                                              |
| News on Demand subscriptions              | likely `activitySubscriptions` relation table                                         |                    junction table | See `relations.ts`                                              |
| Distribution lists                        | not directly in current base table                                                    |                  future extension | Not currently modeled in base activity schema                   |
| External organizations / joint ministries | `activities.leadOrgId` plus possible future relations                                 |      `integer` or junction tables | Not yet a clear first-class field                               |
| Release contacts                          | likely future `activityCommsContacts` relation table                                  |                    relation table | See `relations.ts`                                              |
| Release location                          | not in base `activities` table                                                        |             future metadata field | Example of a Nexus-specific field                               |
| Link document                             | not in current schema                                                                 |                      future field | Could be URL or attachment metadata                             |
| NRMS item ID                              | `activities.newsReleaseId`                                                            |                            `uuid` | This is closest current equivalent                              |
| Last updated, last updated by             | `activities.lastUpdatedDateTime`, `activities.lastUpdatedBy`                          |         `timestamp`, `integer` FK | Audit metadata                                                  |
| Created date/time and created by          | `activities.createdDateTime`, `activities.createdBy`                                  |         `timestamp`, `integer` FK | Audit metadata                                                  |
| Display ID                                | `activities.displayId`                                                                |                     `varchar(50)` | Computed and unique                                             |
| Is all day                                | `activities.isAllDay`                                                                 |                         `boolean` | Used in schedule                                                |
| Summary / significance                    | `activities.summary`, `activities.significance`                                       |                            `text` | Narrative fields                                                |
| Notes / strategy / executive summary      | `activities.notes`, `activities.strategy`, `activities.executiveSummary`              |                            `text` | Additional metadata                                             |

### Important caveat

The Marzipan schema contains the core scheduling and ownership data for activities, but not every field listed in the Metadata ownership overview is explicitly represented as a single column. Several values are likely represented by:

- lookup table foreign keys,
- junction tables (`activityThemes`, `activitySubscriptions`, `activityCommsContacts`, etc.),
- future extension fields,
- or values that are intentionally managed by another system and mirrored only for display.

This makes the most durable API design a hybrid contract: a core payload for canonical Marzipan activity data plus optional arrays for Nexus-managed metadata that can be present but not required.

---

## 4) Suggested minimal contract version

For the first integration iteration, keep the payload intentionally compact and strong:

Required in all outbound syncs:

- `activityId`
- `title`
- `leadTeamId`
- `startDate`
- `endDate`
- `dateStatus`
- `timeStatus`
- `lastUpdatedDateTime`
- `lastUpdatedBy`

Optional but useful:

- `newsReleaseDateTime`
- `releaseStatus`
- `leadMinistryId`
- `leadOrgId`
- `city`
- `translationsRequiredStatus`
- `languages`
- `themes`
- `subscriptions`
- `distributionLists`
- `releaseContacts`

This keeps the first version easy to validate while still covering the metadata ownership matrix that was provided.

---

## 5) Recommended swagger-style DTO shape summary

```ts
class MarzipanActivityMetadataSyncRequestDto {
  activityId: number;
  displayId?: string | null;
  title: string;
  summary?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  isAllDay: boolean;
  dateStatus?: string | null;
  timeStatus?: string | null;
  leadTeamId: number;
  leadMinistryId?: number | null;
  leadOrgId?: number | null;
  leadOrgName?: string | null;
  city?: string | null;
  releaseDateTime?: string | null;
  releaseStatus?: string | null;
  translationsRequiredStatus?: string | null;
  languages?: string[];
  themes?: string[];
  subscriptions?: string[];
  distributionLists?: string[];
  externalOrganizations?: any[];
  releaseContacts?: any[];
  lastUpdatedDateTime: string;
  lastUpdatedBy: number;
}

class MarzipanActivityMetadataSyncResponseDto {
  success: boolean;
  activityId: number;
  nexusCorrelationId?: string | null;
  status: 'accepted' | 'rejected' | 'partial';
  message?: string | null;
  payloadVersion: '1.0';
  syncedAt: string;
  warnings?: string[];
}
```

```ts
class NexusActivityMetadataIngestRequestDto {
  sourceSystem: 'nexus';
  marzipanActivityId?: number | null;
  nexusActivityId?: string | null;
  releaseStatus?: string | null;
  releaseDateTime?: string | null;
  releaseUrl?: string | null;
  mediaAdvisoryUrl?: string | null;
  backgrounderUrl?: string | null;
  translations?: any[];
  externalOrganizations?: any[];
  releaseContacts?: any[];
  lastUpdatedDateTime?: string | null;
  lastUpdatedBy?: string | null;
}

class NexusActivityMetadataIngestResponseDto {
  success: boolean;
  marzipanActivityId?: number | null;
  nexusActivityId?: string | null;
  status: 'accepted' | 'queued' | 'rejected';
  processedAt: string;
  warnings?: string[];
}
```

---

## 6) Final recommendation

For the first pass, the cleanest model is:

- Marzipan owns the canonical activity identity, scheduling, team/ministry ownership, and audit metadata.
- Nexus owns release-specific lifecycle metadata and publication artifacts.
- The shared interface is a structured metadata payload with `core` and `optional` sections, where the core is always required and the optional fields are extension points for future features.

This keeps the contract stable, matches the current activity schema more closely, and avoids forcing a one-to-one mapping of every concept from the ownership matrix before the data model is fully settled.
