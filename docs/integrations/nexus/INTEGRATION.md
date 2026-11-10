# Marzipan ↔ Nexus metadata integration

|                               |                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Contract revision**         | `0.0.2` (pre-release; keep in sync with `openapi.yaml` `info.version` / `x-contract-revision`)                                 |
| **Last updated**              | 2026-11-06                                                                                                                     |
| **Status**                    | Draft — partial **Decision** coverage; see [§0](#0-conformance-legend)                                                         |
| **Payload versions**          | Marzipan activity snapshot `1.0` · Nexus release mirror ingest `1.0` (wire `payloadVersion`; independent of contract revision) |
| **Canonical location**        | `docs/integrations/nexus/` in CorpCal (Marzipan); external copies should cite **Contract revision** above                      |
| **Changelog**                 | [`CHANGELOG-nexus-integration.md`](./CHANGELOG-nexus-integration.md)                                                           |
| **Machine-readable contract** | `[openapi.yaml](./openapi.yaml)` (operations tagged `x-integration-status`)                                                    |
| **Nexus schema snapshot**     | [`20261106_NEXUS_PRISMA_SCHEMA_REFERENCE.md`](./20261106_NEXUS_PRISMA_SCHEMA_REFERENCE.md)                                     |
| **Legacy reference**          | `[../NEXUS_METADATA_SYNC.md](../NEXUS_METADATA_SYNC.md)` (superseded for behaviour; kept for history)                          |

## 0. Conformance legend

Use these labels for v1 integration work. Do not treat **Proposed** or **Open** as contractual v1 requirements until promoted to **Decision** (record date and parties in [Appendix B](#appendix-b--decisions-and-open-items)).

| Label        | Meaning                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| **Decision** | Contractual v1 behaviour — both teams may implement against this without further product sign-off.    |
| **Proposed** | Current recommendation, not yet agreed — useful for spikes and mocks; not an implementation mandate.  |
| **Open**     | Requires an explicit decision — tracked in [Appendix B](#appendix-b--decisions-and-open-items) (O-*). |
| **Future**   | Explicitly not part of v1 — do not build unless promoted.                                             |

**OpenAPI:** Paths and schemas may exist for **Proposed** flows; check `x-integration-status` on each operation in `[openapi.yaml](./openapi.yaml)`. Only **Decision** operations are mandatory for v1 launch.

**Contract revision (0.0.x):** While integration docs are WIP, bump the **patch** (`0.0.N`) on any intentional change to `INTEGRATION.md`, `openapi.yaml`, or the Nexus schema reference mapping. Bump **minor** when promoting a stable integration milestone (e.g. v1 launch candidate); **major** for breaking wire/API semantics. Record entries in the changelog.

---

## 1. Purpose and scope

**Goal:** Link Corporate Calendar (Marzipan) activities to Nexus (NRMS) news releases; prepopulate shared metadata when a release is linked; keep agreed fields in sync; show Nexus-owned release data on the activity in Marzipan.

### Architecture principles (Decision)

Group fields by **coordination** vs **publication timing / editorial content**:

- **Internal coordination (gov workflows):** Identity, title, **calendar event timing** (start/end dates and times, all-day), **date/time confirmation status**, categories, lead team, venue subset for disambiguation, etc. These are **not** outward-facing release editor fields in Nexus — treat Nexus copy as **read-only** and keep it **in sync** with Marzipan after an agreed push (**silent apply** on the Nexus side; no manual accept step). Changes do **not** require a Nexus editor to click through simply to refresh read-only data.
- **Publication timing / content (Nexus editorial):** Recommended publish instant (`releaseTime` and scheduling inputs), **lead** ministry (recommendation), **joint** ministries, **translation languages**, mapping of Marzipan venue **city** into Nexus **location** (prefill/recommendation), accepted schedule, themes, URLs, workflow status, etc. Nexus users **review, accept or override**; **cherry-picking** parts of a snapshot is **Decision** (partial apply — **[Open O-17]** payload and UX details).

| Principle                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Status                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Marzipan owns the publication recommendation** (anchor, `releaseSchedulingMode`, offset, Marzipan-computed instant in `release_time`). Nexus must **not** silently overwrite Marzipan’s recommendation **columns** from Nexus saves; editors accept/reject in Nexus UX.                                                                                                                                                                                        | **Decision**                                |
| **Nexus owns the persisted publication schedule** on `Release.publishDateTime` after the Nexus user **saves** scheduling (draft or publishing). Recommendation and Nexus-persisted schedule may **differ**.                                                                                                                                                                                                                                                      | **Decision**                                |
| **Nexus owns actual publication execution** (e.g. completed-at). `PublicationJob` internals are Nexus details unless mirrored by contract (§5).                                                                                                                                                                                                                                                                                                                  | **Decision**                                |
| **Coordination fields** → Nexus: **silent apply** when Marzipan’s v1 push runs (see §3, **Reviewed** + significant diff — §7). **Publication-facing** slices → Nexus: **latest proposal**; editor **accept/override** (**Open O-17** section-scoped apply).                                                                                                                                                                                                      | **Decision** (split); **Open** (O-17, O-18) |
| **Nexus → Marzipan** for values that would change Marzipan **lead** or **joint** organizations or **translation languages:** ingest as **pending**; **admin confirms** before junction persist (**Decision**). **Joint** orgs are more likely to diverge in Nexus than **lead**; both use the same pending-review mechanism (**Decision**). Marzipan does **not** need to ingest Nexus **location** overwrites into venue if product defers that (**Decision**). | **Decision**                                |
| **`on_signal`:** Marzipan has **no** fixed recommended publish instant; the release is **not scheduled** in Nexus — users publish on an external cue (**Decision**). Nexus must still **show** updated **event start/end** and statuses from Marzipan (coordination, silent) so editors see internal timing changes (**Decision**; **Open O-5** Nexus UX detail).                                                                                                | **Decision** / **Open**                     |
| **Recommendation fields are shared across** linked Nexus releases for the same activity in practice (news release focus); mirror rows remain **per `nexus_release_id`** (**Decision**).                                                                                                                                                                                                                                                                          | **Decision**                                |

**Deferred:** **[Open O-6]** idempotency and stale ordering — see **[§9 Operational baseline (Proposed)](#9-operational-baseline--proposed)**; **[Open O-13]** Nexus → Marzipan transport — follow-up.

### In scope (v1) — Decision

- **[Decision]** Manual release creation in Nexus (external email cue remains outside both apps).
- **[Decision]** Nexus UI queries and selects a Marzipan activity to link; Nexus **pulls** activity snapshot to prepopulate.
- **[Decision]** Propagation of **significant** field changes on **push**: only when the activity is **Reviewed** **and** a diff matches the **explicit v1 significant-field list** (subset of `MarzipanActivitySnapshot`; excludes non-API fields such as long-form body copy) — **enumerate** in §3 Step 2, **Open O-9** / **O-18**. Coordination fields (calendar, statuses, title, categories, lead team, etc.) still **silent-apply** on that push when included in the payload; they are **not** individually confirmed in Nexus.
- **[Decision]** Persist **per-release** Nexus identity on Marzipan via a **link/mirror association** (0..n releases per activity) — not a single scalar `nexusReleaseId` on `activities` alone (see §4).
- **[Decision]** Read-only display in Marzipan of Nexus-owned metadata (themes, **per-release public URL**, `hasTranslations`, release lifecycle status, persisted schedule mirror, optional job schedule mirror).
- **[Decision]** Mirror **`actualPublishDateTime` / `completedAt`** (actual publication instant) **per release link row** from Nexus for “published at” in the Marzipan UI once the release has completed.

### Out of scope (v1) — Future

- **[Future]** Distribution list / subscription selections (`ReleaseDistributionSelection`) mirrored in Marzipan — **Open O-26** (Marzipan defers this UI in v1).
- **[Future]** Automated release creation from Marzipan without Nexus user action.
- **[Future]** Bulk catalog sync strategy for ministries/orgs/languages (mechanism **[Open O-12]**).

---

## 2. Systems and API ownership

| Flow                               | Provider          | Consumer | Direction               | Trigger                                                                                     | Status                                                         |
| ---------------------------------- | ----------------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Activity search for linking        | Marzipan          | Nexus    | Nexus → Marzipan        | User links draft release                                                                    | **Decision**                                                   |
| Activity metadata snapshot         | Marzipan          | Nexus    | Nexus → Marzipan (pull) | On link; refresh                                                                            | **Decision**                                                   |
| Marzipan proposal → Nexus          | Marzipan (sender) | Nexus    | Marzipan → Nexus        | **Reviewed** + diff on **significant** snapshot fields (see §3, §7; **Open O-9**, **O-15**) | **Decision** (push); **Open** (exact list, coalescing **O-6**) |
| Release mirror / lifecycle updates | Marzipan (ingest) | Marzipan | Nexus → Marzipan        | **[Open O-13]** mechanism                                                                   | **Open**                                                       |

- **[Decision]** Marzipan owns activity CRUD and hosts Marzipan-facing integration endpoints (activity list/snapshot; mirror ingest once transport is decided).
- **[Decision]** **Marzipan pushes versioned activity snapshots to Nexus** for ongoing proposal updates (authenticated HTTPS; **[Proposed]** transactional outbox + coalescing to limit noise — see §7). Nexus **pull** remains used for initial link snapshot and ad hoc refresh as needed.
- **[Open O-1]** Base URLs, authentication, connectivity.
- **[Open O-13]** Nexus → Marzipan: webhook vs poll vs both for mirror updates — **follow-up** (deferred).

---

## 3. Field ownership matrix

“Mirror” = stored or cached on Marzipan for UI; source of truth elsewhere.

**Contract shape:** v1 `MarzipanActivitySnapshot` properties are defined in `[openapi.yaml](./openapi.yaml)` (no long-form **summary** field on the snapshot; treat narrative body copy as out of scope for the API unless explicitly added later).

| Field group                                                                                         | Owner    | Marzipan UI        | Nexus UI                                                                                            | Integration flow                                                                                                                                                                                                                                                                 | Status       |
| --------------------------------------------------------------------------------------------------- | -------- | ------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Activity identity & title (`activityId`, `displayId`, `title`)                                      | Marzipan | Editable           | Read-only — coordination                                                                            | Pull + **Reviewed** push: **silent apply** (no Nexus confirm)                                                                                                                                                                                                                    | **Decision** |
| Activity **event timing** (calendar): `startDate`, `endDate`, `startTime`, `endTime`, `isAllDay`    | Marzipan | Editable           | Read-only — coordination                                                                            | Same — **silent apply**; **not** news publication timing (see `releaseTime` row). Editors must see updates when Marzipan event times change (including **`on_signal`**) — **Open O-5** UI                                                                                        | **Decision** |
| Date/time **confirmation status** (`dateStatusId`/`dateStatus`, `timeStatusId`/`timeStatus`)        | Marzipan | Editable           | Read-only — coordination                                                                            | Same — **silent apply**                                                                                                                                                                                                                                                          | **Decision** |
| Venue subset (`venueAddress`: city, province/state, country)                                        | Marzipan | Editable           | City maps to Nexus **location** (editable); province/country for **disambiguation** in payload only | Marzipan → Nexus: city (+ province/country) as **prefill/recommendation** for location; Nexus may override; **no** required mirror back into Marzipan venue (**Open O-19** wording / mapping)                                                                                    | **Decision** |
| Categories                                                                                          | Marzipan | Editable           | Read-only — coordination                                                                            | **Silent apply** on push                                                                                                                                                                                                                                                         | **Decision** |
| Lead team (`leadTeamId`, display name)                                                              | Marzipan | Editable           | Read-only — coordination                                                                            | **Silent apply**                                                                                                                                                                                                                                                                 | **Decision** |
| **Lead** + **joint** organizations (catalog UUIDs + freeform)                                       | Marzipan | Editable           | Editable; maps to Nexus ministries + external JSON                                                  | Marzipan → Nexus: **recommendation**; Nexus editor may **accept/override** (cherry-pick with other slices — **Open O-17**). Nexus → Marzipan: deltas → **pending** → **admin confirm**; **full replace** of accepted set on confirm (joint more likely divergent) — **Open O-4** | **Decision** |
| Nexus **`leadMinistryId` optional** in reference schema vs Marzipan **always has a lead**           | —        | —                  | —                                                                                                   | Contract must define behaviour if Nexus allows **null** lead while Marzipan does not — **Open O-20**                                                                                                                                                                             | **Open**     |
| Publication **recommendation** (`releaseSchedulingMode`, `releaseTimeOffsetMinutes`, `releaseTime`) | Marzipan | Editable           | **Prefill / proposal** until Nexus commit                                                           | Marzipan → Nexus: **significant-field** push includes changes that affect **`releaseTime`** (computed); editor **accept/override** **`on_signal`:** not scheduled in Nexus — **manual publish** on external cue (**Decision** §5)                                                | **Decision** |
| Accepted / scheduled publish (Nexus editorial)                                                      | Nexus    | Mirror             | Editable; persisted on Nexus save                                                                   | Nexus → Marzipan mirror on save/change (`scheduledPublishDateTime` ↔ `publishDateTime`); **Scheduled** status on Nexus also needs `isCommitted` + jobs — §12.1                                                                                                                   | **Decision** |
| Job queue instant (optional)                                                                        | Nexus    | Mirror optional    | —                                                                                                   | `publicationJobScheduledFor` — latest job; omit when null — **Decision** (O-16)                                                                                                                                                                                                  | **Decision** |
| Actual publish (`completedAt` / actual publish instant)                                             | Nexus    | Mirror per link    | System                                                                                              | Nexus → Marzipan                                                                                                                                                                                                                                                                 | **Decision** |
| **Translation languages**                                                                           | Marzipan | Editable           | Marzipan shows as **recommendation**                                                                | Same pattern as **releaseTime** / lead prefill: Nexus may override; Marzipan gets **pending** → **admin confirm**; **full replace** on confirm — **Open O-4**                                                                                                                    | **Decision** |
| **Translations required** (`translationsRequiredStatusId` / …)                                      | Marzipan | Editable           | TBD                                                                                                 | **May deprecate** from v1 API — **Open O-21**                                                                                                                                                                                                                                    | **Open**     |
| Themes                                                                                              | Nexus    | Display only       | Editable                                                                                            | Nexus → Marzipan (`ReleaseTheme`)                                                                                                                                                                                                                                                | **Decision** |
| Distribution / subscription selections                                                              | Nexus    | —                  | Editable (`ReleaseDistributionSelection`)                                                           | **Not** in v1 mirror — **Open O-26**                                                                                                                                                                                                                                             | **Open**     |
| Public URL per linked release                                                                       | Nexus    | Display only       | System                                                                                              | `releaseUrl` per `nexusReleaseId` — **Open O-27** provenance                                                                                                                                                                                                                     | **Decision** |
| Translation artifacts (per-locale URLs)                                                             | Nexus    | —                  | Future                                                                                              | v1 mirror: `hasTranslations` only                                                                                                                                                                                                                                                | **Future**   |
| Release workflow status                                                                             | Nexus    | Display only       | Editable                                                                                            | Derived `releaseStatus` string — §12.1                                                                                                                                                                                                                                           | **Decision** |
| Nexus release identity (`nexusReleaseId` per link row)                                              | Nexus    | Store per link row | Creates / owns id                                                                                   | Nexus → Marzipan                                                                                                                                                                                                                                                                 | **Decision** |
| Comms materials / release types                                                                     | Marzipan | Editable           | Read-only match                                                                                     | Not integration-synced                                                                                                                                                                                                                                                           | **Future**   |
| Release location (Nexus native city / `location` string)                                            | Nexus    | —                  | Editable                                                                                            | Aligned with Marzipan **city** prefill when linked; divergent copy need not sync back to Marzipan                                                                                                                                                                                | **Decision** |

### Step 2 — v1 significant-field list and receive semantics

**Push (Marzipan → Nexus):** **Decision** — enqueue when the activity is **Reviewed** **and** the diff touches at least one property in the **v1 significant-field** set below (subset of `MarzipanActivitySnapshot`; **Open O-18** locks the exact OpenAPI list). The set **includes** coordination fields that must reach Nexus even though Nexus **silent-applies** them (so editors see event moves, esp. **`on_signal`**). Re-saving **Reviewed** with **no** diff in that set does **not** need to push.

**Explicit v1 significant fields (working — align with OpenAPI, close O-9 / O-18):**

| Snapshot property / group                                          | Significant for push (triggers Nexus “proposal”)                                                                                           | Nexus receive                                                                             | Marzipan receive (Nexus → Marzipan)                                            |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `title`                                                            | **Yes**                                                                                                                                    | **Silent apply** (coordination)                                                           | —                                                                              |
| `startDate`, `endDate`, `startTime`, `endTime`, `isAllDay`         | **Yes** (coordination — **triggers push** so Nexus always sees event changes; **silent apply** in Nexus, incl. **`on_signal`**)            | **Silent apply**                                                                          | —                                                                              |
| `dateStatusId`, `timeStatusId` (and display strings if present)    | **Yes** (same — read-only in Nexus; silent)                                                                                                | **Silent apply**                                                                          | —                                                                              |
| `venueAddress` (city; province/country disambiguate)               | **Yes** if **city** changes (maps to Nexus **location** recommendation)                                                                    | **Prefill / recommendation**; editor may override                                         | Do not require venue ingest from Nexus (**Decision**)                          |
| `categories`                                                       | **Yes**                                                                                                                                    | **Silent apply**                                                                          | —                                                                              |
| `leadTeamId` (and display name)                                    | **Yes**                                                                                                                                    | **Silent apply**                                                                          | —                                                                              |
| `organizations` (lead + joint)                                     | **Yes**                                                                                                                                    | **Latest proposal**; **accept/override**; cherry-pick **Open O-17**                       | **Pending** → admin confirm; **full replace** **Open O-4**                     |
| `releaseSchedulingMode`, `releaseTimeOffsetMinutes`, `releaseTime` | **Yes** — any material change to **recommended** publish timing (including recomputation so **`releaseTime`** changes when calendar moves) | **Latest proposal**; editor **accept/override**; **`on_signal`** = not scheduled in Nexus | Nexus must not silently overwrite Marzipan **`release_*`** rows (**Decision**) |
| `translationLanguages`                                             | **Yes**                                                                                                                                    | **Latest proposal**; **accept/override**                                                  | **Pending** → admin confirm; **full replace** **Open O-4**                     |
| `translationsRequiredStatusId` / `translationsRequiredStatus`      | **Open O-21** — include or deprecate                                                                                                       | TBD                                                                                       | —                                                                              |
| Audit-only (`rowVersion`, `lastUpdatedDateTime`, `lastUpdatedBy`)  | **No** (always sent; do not alone trigger push)                                                                                            | Metadata                                                                                  | —                                                                              |

**Push trigger (when):** **Decision** — **Reviewed** + **significant-field** diff; **Open O-15** for coalescing window and edge cases; **O-6** deferred.

### Normative semantics (Decision)

- **[Decision]** **Link definition (Nexus):** A Nexus `Release` is **linked** to a Marzipan activity when `Release.activityId` equals `activities.id`. Unlink clears that reference per Nexus rules. Marzipan does not define linkage; it stores **mirrors** of linked releases.
- **[Decision]** Once a Nexus user **saves** an accepted schedule, **Nexus is authoritative** for that accepted publication instant (`publishDateTime` or equivalent). Until save, values copied from Marzipan at link or prefill time are **not** treated as accepted (**Decision** — see WF-1).
- **[Decision]** Marzipan `release_time` (computed from anchor + mode + offset when gates allow) is the **recommended publication instant** for integration purposes; Nexus must not write back into Marzipan’s recommendation fields silently. **Proposed:** rename to `recommendedReleaseDateTime` (or equivalent) in a future Marzipan schema/API pass for clarity — behaviour is as stated regardless of column name.
- **[Decision]** **Recommendation and accepted schedule may differ.** Example: activity moves → Marzipan recomputes recommendation; Nexus may still show prior accepted time until a Nexus user accepts the new proposal.
- **[Decision]** `on_signal`: Marzipan recommendation has no fixed instant; the release is **not scheduled** in Nexus — publish on an **external cue**. Switching Marzipan to `on_signal` does **not** by itself clear Nexus’s accepted `publishDateTime` — Nexus product UX (**Open O-5**). Nexus editors must still see **coordination** updates to event start/end and statuses (silent apply).
- **[Proposed]** On the Nexus side, maintain a single **latest Marzipan proposal** vs editor acceptance UX so rapid Marzipan saves do not flood editors. Reference schema has **`ActivityImportSnapshot`** (coordination at link) with `acceptedAt` — not a dual publish snapshot pair; exact proposal storage **Open** with Nexus.
- **[Proposed]** **Operational timing:** In practice, multiple Nexus releases linked to one activity may share the **same** accepted publish window; the integration still stores **per-`nexus_release_id`** mirror times on Marzipan. **Media advisories** (or other document types defined with Nexus) may use a **different** schedule path than the main news release — independent of `recommendedReleaseDateTime` / shared main release recommendation.
- **[Proposed]** Nexus may **partially apply** a Marzipan proposal (e.g. accept updated `publishDateTime` but defer org or language changes). That requires Nexus UX and/or **section-scoped** acceptance (schedule vs orgs vs languages) or equivalent metadata — **[Open O-17]**.
- **[Proposed]** **Catalog alignment:** `organizationUuid` (Marzipan `organizations.uuid` ↔ Nexus ministry/org id) is the **stable cross-system identity**; display names are secondary. Keeping catalog rows aligned when Marzipan admins edit organizations is **[Open O-12]** (seeds, sync job, or periodic reconciliation).

---

## 4. Identity and association rules

| Rule                                                                                                                                                                                                  | Status                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Business key: `marzipanActivityId` = `activities.id`                                                                                                                                                  | **Decision**                                                                                                                  |
| UI may search/display `displayId`                                                                                                                                                                     | **Decision**                                                                                                                  |
| **0..n** Nexus releases per activity; **0..1** activity per release                                                                                                                                   | **Decision**                                                                                                                  |
| **Marzipan persistence:** store **one row per linked release** (junction / link table: `activity_id` + `nexus_release_id` + mirror fields) — **not** a single global `nexusReleaseId` on `activities` | **Decision**                                                                                                                  |
| Nexus creates the release first in the primary manual flow; Marzipan receives `nexusReleaseId` via ingest or API response                                                                             | **Decision**                                                                                                                  |
| `activity_organizations` ↔ `news_release_ministry` + `external_organizations_json`; one lead                                                                                                          | **Decision**                                                                                                                  |
| Lead catalog org: `organizations.uuid` ↔ Nexus `Ministry.id` (stay aligned **[Open O-12]** process)                                                                                                   | **Decision** (requirement); **Open** (sync process)                                                                           |
| Freeform org → Nexus external JSON (exact shape)                                                                                                                                                      | **Open** (tie to O-4)                                                                                                         |
| Nexus overrides orgs/languages → Marzipan activity junctions                                                                                                                                          | **Decision:** ingest as **pending**; **admin confirm** in Marzipan before persist (see §8). Merge/delete rules **[Open O-4]** |
| Language: `translated_languages.shortcode` ↔ Nexus `Language.culture`                                                                                                                                 | **Decision**                                                                                                                  |

---

## 5. Time and release semantics

Integrators should name three **concepts** in payloads and UI (mapping to concrete Nexus columns is in `[NEXUS_PRISMA_SCHEMA_REFERENCE.md](./NEXUS_PRISMA_SCHEMA_REFERENCE.md)`):

| Concept                                        | Owner    | Typical Nexus / Marzipan                                              | Status                                                             |
| ---------------------------------------------- | -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Recommended publication**                    | Marzipan | Marzipan `release_scheduling_mode`, offset, `release_time` (computed) | **Decision**                                                       |
| **Persisted publication schedule (editorial)** | Nexus    | `Release.publishDateTime` on save (nullable)                          | **Decision** — mirror `scheduledPublishDateTime`                   |
| **Operational job schedule** (optional mirror) | Nexus    | Latest `PublicationJob.scheduledFor`                                  | **Decision** — `publicationJobScheduledFor`; omit when null (O-16) |
| **Actual publication**                         | Nexus    | Latest job `completedAt` / derived completion                         | **Decision** — `actualPublishDateTime`, `publicationCompleted`     |
| Activity event (for snapshot)                  | Marzipan | Map to Nexus `eventDateTime` / import snapshot                        | Mapping **[Open O-2]**                                             |

### Integration timezone (Decision)

- **[Decision]** Marzipan’s corp calendar uses **Pacific Time fixed at UTC−7 year-round (no DST)** for business meaning of **calendar dates** and **civil wall-clock times**: combine `startDate` + `startTime` in that zone when deriving a single instant. Cross-app normative detail: [`docs/DATE_AND_TIMEZONE.md`](../../DATE_AND_TIMEZONE.md) and `@corpcal/shared` (`CORP_PACIFIC_TIME_ZONE` = `Etc/GMT+7`, human label “Pacific Time (UTC-7)”).
- **[Decision]** **`releaseTime`** (and other **instants** on the snapshot, e.g. audit timestamps) are **UTC-backed** on the wire (ISO 8601 with `Z` or explicit offset per OpenAPI); they are the same **absolute** moments in Marzipan and Nexus.
- **[Open O-22]** Nexus **display and parsing** of those instants (fixed UTC−7 semantics vs `America/Vancouver` vs editor local time) — confirm aligned with Marzipan so editors do not see one-hour (or DST) skew relative to CorpCal.

### Activity calendar vs release scheduling (Decision)

These are separate: **when the activity runs** (coordination) vs **when the news release should publish** (editorial).

- **[Decision]** **Valid coordination instant from Marzipan:** If **`startDate` and `startTime` are both non-null**, treat that pair as **complete** for understanding “when the activity is scheduled” and for building a single timestamptz when Nexus needs one. **`dateStatusId` / `timeStatusId`** (and display strings on the snapshot) are **informational** for Nexus users (optional “heads up”); they are **not** part of the **completeness** rule for that pairing.
- **[Decision]** **`startTime` null** (date without clock time): Nexus must **not** fabricate a full `eventDateTime` from Marzipan data alone as a silent prefill. Nexus chooses UX and persistence (nullable `eventDateTime`, date-only display, sentinel, etc.) — **[Open O-2]** including Prisma shape (today `Activity.eventDateTime` is **required** in Nexus schema — may need nullability or parallel fields).
- **[Decision]** **`releaseTime`** (Marzipan recommended publish instant) is **prefill only** for Nexus `publishDateTime` when **present**; it may be **null** (e.g. `on_signal` or gates not met). If absent, Nexus does **not** auto-complete publish from Marzipan; editors may infer from **`startDate` / `startTime`** when shown read-only. Nexus `Release.publishDateTime` is **nullable** in reference schema — supports “no draft publish instant yet.”
- **[Decision]** **`isAllDay`:** Nexus **release** scheduling does **not** treat all-day as a first-class concept for **publish** prefill; it does not force a **`releaseTime`**. Activity coordination may still send `isAllDay`; Nexus shows Marzipan **event** fields read-only per §3.

**Notes (Decision)**

- **[Decision]** `publishDateTime` alone does **not** imply Nexus UI **Scheduled** (pipeline): that label requires **`isCommitted`**, future `publishDateTime`, and latest **PublicationJob** rules (see §12.1). Marzipan should use mirrored **`releaseStatus`** plus schedule fields, not recommendation columns.
- **[Decision]** Mirror ingest (**O-16**, closed): `scheduledPublishDateTime` = `Release.publishDateTime`; optional `publicationJobScheduledFor` = latest job’s `scheduledFor` (by `createdAt`); omit job field when null; **`updatedAt`** = `Release.updatedAt` (stale ordering). No **`updatedBy`** on wire until Nexus confirms **O-28**. Nexus should emit mirror updates when persisted schedule or relevant job rows change (**Open O-13** transport). Wire mapping: [`NEXUS_PRISMA_SCHEMA_REFERENCE.md`](./20261106_NEXUS_PRISMA_SCHEMA_REFERENCE.md).

### Marzipan UI — publish time display (Decision)

- **[Decision]** Until publication **completes**, show the **intended** time from **`scheduledPublishDateTime`** (and optional redundant `publicationJobScheduledFor`). Use **`releaseStatus`** for pipeline copy (**Scheduled**, **Publishing**, etc.).
- **[Decision]** Show **“Published at”** (actual instant from Nexus `completedAt` / `actualPublishDateTime` in ingest) **only after** publication has completed. After completion, optionally show both scheduled and actual (e.g. scheduled 11:00, published 11:02).

---

## 6. Business workflows

### WF-1 Link Nexus release to Marzipan activity — **Decision**

1. User creates a release in Nexus (often after external email); may be unlinked.
2. Nexus queries Marzipan for eligible activities (**exclude** **Completed** and **Deleted** — they are **not** valid for initial link lookup or prefill). Same exclusion applies to **direct snapshot fetch** by id for link flows (**Open O-3:** `404` vs `410` vs error body for deleted ids).
3. User selects activity (id; UI may use `displayId`).
4. Nexus **pulls** snapshot from Marzipan and **prefills** Nexus fields (including draft `publishDateTime` from Marzipan recommendation where applicable).
5. **[Decision]** Prefill is **not** the accepted Nexus schedule until the Nexus user **saves** (commits) in Nexus.
6. Nexus sets `Release.activityId`; Marzipan persists/updates the **per-release link row** with `nexus_release_id` and mirror fields when known.

### WF-2 Marzipan activity updated after link — **Decision** (push); **Open** (coalescing **O-6**)

1. User saves activity. **Decision:** enqueue push to Nexus **only** when the activity is **Reviewed** **and** the save produces a diff on the **v1 significant-field** list (§3 Step 2, **Open O-18**). Staying **Reviewed** with a significant change still pushes.
2. **[Decision]** Marzipan **pushes** a **full** versioned snapshot to Nexus (outbox). **Coalescing / stale handling — Open O-6** (deferred follow-up).
3. **[Decision]** Nexus **silent-applies** coordination fields from the payload; **publication-facing** slices update the **latest proposal** for editor **accept/override** (**cherry-pick** — **Open O-17**).
4. **[Decision]** When a Nexus user commits an accepted schedule, that does **not** silently overwrite Marzipan’s `release_*` recommendation columns.

### WF-3 Nexus release metadata updated — **Decision** (mirror); **Open O-13** (transport)

1. User/system updates Nexus release.
2. Nexus notifies Marzipan (**Open O-13**).
3. **[Decision]** Marzipan **auto-updates per-release mirror** for Nexus-only fields (`releaseStatus`, `releaseUrl`, themes, `hasTranslations`, schedule mirrors, optional job schedule, **`actualPublishDateTime` / `completedAt`**).
4. **[Decision]** Changes that would alter Marzipan-owned **organizations** or **translation languages** are stored as **pending**; an **admin** completes a **review** (card/dialog) and **confirms** before junction rows on the activity are updated (**Decision** §1, §8).

### WF-4 Marzipan delete-requested / soft-deleted — **Decision** (partial); **Open O-3** (remaining scenarios)

**Delete requested**

- **[Decision]** **No Nexus impact.** Marzipan does **not** send integration signals solely because an activity entered **delete-requested**; Nexus behaviour is unchanged.

**Soft-deleted (`Deleted`)**

- **[Decision]** When Marzipan marks an activity **Deleted** (and it was or is still **linked**): Marzipan sends a **signal** to Nexus so editors can **deactivate** the related release(s) (`isActive: false` — there is no **Archived** `releaseStatus` in Nexus today). **Deactivation in Nexus remains a manual user confirmation** (not automatic on ingest).
- **[Proposed]** Signal transport and payload align with Marzipan → Nexus **push** / notify (same auth and operational patterns as §9); exact endpoint and body **`Open O-3`** until `openapi.yaml` is updated.
- **[Open O-3]** If multiple releases link to one activity: deactivate **all** vs prompt **per release**; default text or Nexus UX.

**Link / prefill eligibility**

- **[Decision]** **Completed** and **Deleted** activities are **not eligible** for initial link search or snapshot prefill (WF-1 step 2). Nexus must not rely on snapshots for **new** linking to those rows.

**Still open — O-3**

- **Completed** (non-deleted): unlink, clear `Release.activityId`, or leave linked?
- **Restore** from Deleted: mirror and Nexus `Release.activityId` reconciliation.
- **Unlink** (Nexus user clears **`Release.activityId`** or equivalent — release no longer linked to the activity):
  - **[Proposed]** Nexus sends a **mirror ingest** (or Marzipan observes via poll/refresh) so Marzipan can reconcile **per `nexus_release_id` link row** — **Open O-13** transport.
  - **Options for review:** (a) **Soft-unlink:** keep the link row with `unlinkedAt` / `deletedAt` (or `linkStatus: unlinked`) for audit and reporting; (b) **Hard-remove:** delete the mirror row when the activity is not **Deleted** and the release is explicitly disconnected; (c) **Hard-remove always** on unlink — simplest list views but loses history.
  - **Proposed side-effects:** **Dismiss** any **pending** org/language proposal tied to that unlink so stale reviews do not apply after disconnect (**Open** exact behaviour).
  - **Re-link later:** same `nexusReleaseId` may link again to the same or another activity — uniqueness and idempotency (**Open** O-14 / OpenAPI).
- Exact **HTTP/event** shape for the “activity deleted → suggest deactivate” signal; idempotency (**§9**).

### WF-5 Category/comms eligibility filters — **Future**

---

## 7. Synchronization behaviour

| Topic                         | Status        | Notes                                                                                                |
| ----------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| Payload shape: full snapshot  | **Proposed**  | PATCH deferred to post-v1                                                                            |
| Marzipan → Nexus transport    | **Decision**  | **Push** (HTTPS) of versioned snapshot                                                               |
| Push trigger                  | **Decision**  | **Reviewed** + diff on **significant-field** list (§3); **Open O-15** coalescing window / edge cases |
| Coalescing / noise control    | **Proposed**  | Outbox, debounce, replace pending message; Nexus keeps single “latest Marzipan snapshot” for review  |
| Nexus → Marzipan              | **Open O-13** | Webhook **Proposed** primary + refresh-on-open fallback                                              |
| Stale / ordering              | **Proposed**  | `row_version` monotonic; duplicate/stale handling — **§9.5**; promote with **O-6**                   |
| Idempotency / delivery id     | **Proposed**  | **`eventId`** in body + **`row_version`** ordering — **§9.3**; **O-6**                               |
| Partial success               | **Proposed**  | **v1: none** — atomic snapshot apply — **§9.6**; **O-10**                                            |
| Retries / errors / visibility | **Proposed**  | Sender-side bounded retry; **§9.4**, **§9.7**; **O-11**                                              |
| API routes / HTTP verbs       | **Proposed**  | **`/api/v1`** prefix alignment — **§9.1**; **Open O-23** path shapes                                 |
| Conflict resolution           | **Decision**  | Ownership per §3; no silent merge of Nexus accepted → Marzipan recommendation                        |

---

## 8. Marzipan read model (mirror)

- **[Decision]** Nexus is source of truth for Nexus-owned mirror fields on **each** `nexus_release_id` link row (schedule mirrors, optional job schedule, **`actualPublishDateTime` / `completedAt`**, derived `releaseStatus`, `releaseUrl`, themes, `hasTranslations`).
- **[Decision]** Do not duplicate Nexus **theme** master data in Marzipan lookup tables for v1. Distribution lists are out of mirror scope (**Open O-26**).
- **[Decision]** **Organizations** (lead + joint) and **translation languages** originating from Nexus are **not** written directly to activity junction tables on ingest. They are stored as **pending** until a **Marzipan admin** confirms; on confirm use **full replace** of the accepted set (**Open O-4** edge cases). **Dismiss** or **defer** leaves Marzipan-owned data unchanged.
- **[Proposed]** Marzipan does **not** need a second “latest vs accepted” snapshot store **for releases** mirroring Nexus’s activity snapshot pair. For **pending** org/language proposals, track enough state to show diffs and avoid duplicate applies (e.g. last seen mirror `updatedAt` / payload hash per pending) — **Open** exact fields.

---

## 9. Operational baseline — **Proposed**

This section is **Proposed** until promoted in Appendix B (**O-1**, **O-6**, **O-10**, **O-11**, **O-23**). Align request/response schemas in `[openapi.yaml](./openapi.yaml)` when promoted (**O-25**). It records **recommended defaults** and **alternatives** for team review. Neither application has final integration routes yet—align OpenAPI when paths are **Decision**.

### 9.1 API surface and routes — **Proposed** (**Open O-23**)

**Agreed constraint:** Both applications use an **`/api/v1`** prefix on the integration HTTP API (e.g. Nexus uses paths such as `/api/v1/notifications/summary` under the service host).

| Flow                                         | Host     | **Proposed** path pattern                                                          | Notes                                                                                                              |
| -------------------------------------------- | -------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Nexus → Marzipan (link/search, snapshot GET) | Marzipan | `/api/v1/integration/activities` and `/api/v1/integration/activities/{activityId}` | Resource-oriented; indicates **integration DTO**, distinct from internal CRUD.                                     |
| Marzipan → Nexus (activity snapshot push)    | Nexus    | `/api/v1/integration/marzipan-activities/{marzipanActivityId}`                     | **PUT** = idempotent “latest snapshot for this activity” (see §9.4). **Open:** POST if teams prefer command-style. |
| Nexus → Marzipan (release mirror ingest)     | Marzipan | `/api/v1/integration/nexus-releases/{nexusReleaseId}`                              | **PUT** = idempotent “mirror state for this release id.”                                                           |

**Current contract assumption:** `[openapi.yaml](./openapi.yaml)` still lists `/api/v1/integrations/nexus/...` — treat as **draft** until **O-23** closes; migrate paths in OpenAPI when both teams sign off.

**Options for review (O-23):**

1. **Proposed (above):** `/api/v1/integration/...` — neutral third-consumer naming; no partner name in every segment.
2. **Consumer-scoped:** `/api/v1/integrations/nexus/...` (current OpenAPI) — explicit consumer; fine if Nexus is the only consumer for the life of v1.
3. **Namespace mirror:** align Marzipan integration routes with Nexus’s broader `/api/v1/<area>/...` pattern (e.g. `/api/v1/activity-link/...`) — requires naming workshop.

Hostnames and ports stay **out of the contract**; configure per environment (e.g. `MARZIPAN_API_BASE_URL`, `NEXUS_API_BASE_URL`).

### 9.2 Authentication and environments — **Proposed** (**Open O-1**)

- **Proposed:** **Application-to-application** HTTPS only (not end-user browser session). **Dev/Test/Prod** pairwise isolation (Marzipan dev ↔ Nexus dev only, etc.); never cross-environment calls.
- **Proposed:** **Bearer token** or platform-standard service identity (mTLS, workload identity)—**confirm with Emerald / platform** before marking **Decision**.
- **HTTP semantics:** **`401`** = not authenticated; **`403`** = authenticated but not authorized (see OpenAPI `responses`).

### 9.3 Message identity: `eventId` vs `Idempotency-Key` — **Proposed** (**Open O-6**)

Two distinct needs:

| Concept                    | Purpose                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ordering / freshness**   | **`rowVersion`** (maps to Marzipan `activities.row_version`) — receiver applies only if **newer** than stored; duplicates and stale versions are safe. |
| **Delivery deduplication** | **`eventId`** (UUID) — “have we processed this exact network delivery before?”                                                                         |

**Proposed (v1):**

- Include **`eventId`** (UUID) **in the JSON body** of every outbound snapshot (Marzipan → Nexus, Nexus → Marzipan) so logs, outbox rows, and replays carry a single copy-pastable id.
- Optionally send **`Idempotency-Key: <same as eventId>`** on **POST**-style calls for clients that follow [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) idempotent retry semantics; for **PUT**, reuse of the same URL + body versioning is already idempotent—**`eventId`** still helps dedupe duplicate deliveries.

**Options for review:**

| Option           | Body `eventId` | Header                                                                                            |
| ---------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| **A (Proposed)** | Required       | Optional mirror `Idempotency-Key` for POST compatibility                                          |
| **B**            | Required only  | Rely on header only — weaker for log/trace correlation from payload alone                         |
| **C**            | Either/or      | Support both; receiver treats duplicate if `eventId` **or** `(Idempotency-Key)` already processed |

### 9.4 HTTP status: `200` vs `202` — **Proposed**

**Proposed (v1):** Process mirror/snapshot **synchronously** in the request thread: persist, return **`200 OK`** with a small JSON body (e.g. `success`, `status`: `accepted` \| `ignored_duplicate` \| `ignored_stale`, `sourceVersion` / `rowVersion` processed).

| Code              | **Proposed** use                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **200**           | Applied, or **no-op** duplicate/stale (sender should **not** retry)                                                      |
| **400**           | Schema/body invalid — **do not** auto-retry                                                                              |
| **401** / **403** | Auth — **do not** auto-retry                                                                                             |
| **404**           | Resource not found (e.g. unknown release id) — **do not** auto-retry without fix                                         |
| **409**           | Optional: **true conflict** (rare); **Open:** many teams prefer **200 + `ignored_stale`** so dumb retries stop—see below |
| **422**           | Semantically invalid for integration rules — **do not** auto-retry without data fix                                      |
| **429**           | Rate limit — retry with **`Retry-After`**                                                                                |
| **5xx**           | Transient — sender retries with backoff (**§9.7**)                                                                       |

**Options for stale duplicate:**

1. **Proposed:** **`200`** + body `status: ignored_stale` or `ignored_duplicate` — sender treats as success for delivery; ordering is purely **`rowVersion`**.
2. **Alternative:** **`409 Conflict`** or **`422`** for stale — can cause unnecessary retries if clients only treat 200 as success; document client behaviour explicitly.

**`202 Accepted`:** **Proposed: omit for v1** integration apply path—enqueue work **before** the HTTP handler returns only if Nexus/Marzipan introduces a **second async stage**; otherwise **`202`** in `[openapi.yaml](./openapi.yaml)` is **legacy draft** until removed or promoted.

### 9.5 Ordering and staleness — **Proposed** (**Open O-6**)

- Every snapshot carries **`rowVersion`** (monotonic per activity or per release mirror, as agreed) and **`lastUpdatedDateTime`** (or equivalent).
- **Apply rule:** if `incoming.rowVersion` **<** `stored.rowVersion` → **do not apply** business state; return **200** + **`ignored_stale`** (**Proposed**).
- If `incoming.rowVersion` **==** `stored.rowVersion` and same payload hash → **idempotent duplicate** → **200** + **`ignored_duplicate`** (**Proposed**).

### 9.6 Atomicity and partial success — **Proposed** (**Open O-10**)

**Proposed (v1):** Each inbound message is **all-or-nothing** for persistence in one transaction:

- **Auto-mirror** fields (schedule mirror, URLs, status, etc.) and **pending** org/language blobs (if present) **commit together** or **roll back together**.
- **No** response `status: partial` for v1; remove or ignore **`partial`** in `[openapi.yaml](./openapi.yaml)` until a future version explicitly supports it.

### 9.7 Retries, errors, and operator visibility — **Proposed** (**Open O-11**)

- **Sender** (outbox worker): retry only on **timeouts** and **5xx** / **429** (with **`Retry-After`**); **bounded** exponential backoff + jitter; max attempts then **failed** state for manual replay.
- **Do not** auto-retry **4xx** except **429** (and optionally **503** with explicit retry policy).
- Persist minimal fields per outbound/inbound attempt: **`eventId`**, **`sourceSystem`**, entity ids, **`rowVersion`**, **`attemptCount`**, **`lastError`**, **`status`**, **`correlationId`** (for log tracing across hosts).

---

## 10. Versioning and breaking changes — **Decision**

- Payloads include `payloadVersion` (e.g. `1.0`).
- Additive optional fields = non-breaking; semantic or type changes = breaking (coordinate major bump).

---

## 11. Independent development

- **[Decision]** Both apps in active development; shared `[openapi.yaml](./openapi.yaml)` + fixtures for contract tests.
- **[Proposed]** Mock Marzipan integration API for Nexus link UI before endpoints ship.
- **[Open O-12]** Catalog alignment process (ministry UUIDs, language codes).

---

## 12. Domain lifecycle, reference data, and deletion — **Proposed / Open**

Normative enums and wire shapes live in `[openapi.yaml](./openapi.yaml)` when **Decision**; this section lists **agreed direction** and **remaining gaps** (O-3, O-4, O-12, **O-24**).

### 12.1 Nexus release lifecycle (`releaseStatus`) — **Open O-24**

- **[Decision]** Mirror ingest carries Nexus-derived **`releaseStatus`** (not a database column). Nexus computes it from `isCommitted`, `isPublished`, `publishDateTime`, `documentTypeId`, and the **latest** `PublicationJob` (by `createdAt`).
- **[Proposed]** v1 wire values align with Nexus UI: **Draft**, **Scheduled**, **Publishing**, **Published**, **Sent** (advisory success path), **Failed**. There is **no** **Archived** status — deactivate uses `Release.isActive` (excluded from Nexus lists).
- **[Open O-24]** Confirm exact **casing**, display labels, **allowed transitions**, and Marzipan copy for **Sent** vs **Published**; promote OpenAPI enum to **Decision**.
- **[Decision]** **Scheduled** in Nexus means committed to the publication pipeline with a **future** `publishDateTime` (plus job rules), not merely a future time saved on a **Draft** row.

### 12.2 Reference data — **Open O-12**

- **[Decision]** Stable cross-system identity: lead catalog org **`organizations.uuid`** ↔ Nexus **`Ministry.id`** (UUID); language **`translated_languages.shortcode`/`culture`** ↔ Nexus **`Language.culture`** — see §4 and `NEXUS_PRISMA_SCHEMA_REFERENCE.md`.
- **[Open O-12]** Per-environment **fixtures** (seeds or import contracts), drift handling, and admin-edit reconciliation (see §1 Future / O-12).

### 12.3 Free-form organizations (Nexus `externalOrganizations`) — **Open O-4**

- **[Decision]** Nexus-sourced org/language changes that would alter Marzipan junctions arrive as **pending**; **confirm** applies **full replace** of the accepted set (§8); **merge vs replace** edge cases remain **Open O-4**.
- **[Open O-4]** Exact **JSON wire shape** for free-form / external orgs (Nexus `external_organizations_json` / Marzipan representation); idempotency of pending payloads.

### 12.4 Deletion, completion, and unlink — **Open O-3**

- **[Decision]** **Delete requested:** no Nexus integration impact — see **WF-4**.
- **[Decision]** **Deleted:** signal Nexus so editors may **deactivate** linked release(s) (`isActive`) — **manual confirm** in Nexus — see **WF-4**. Not eligible for initial link / prefill with **Completed** — see **WF-1**.
- **[Open O-3]** **Completed** activity: keep or clear `Release.activityId`; push/mirror behaviour. **Restore** from deleted. **Unlink** from Nexus: mirror row and idempotency. **Snapshot GET** for excluded ids (`404` / `410`). Signal **payload** and **transport** for soft-delete → archive suggestion.

---

## Appendix A — Marzipan activity snapshot (v1)

Normative shape for **Decision** pull flow: `[openapi.yaml](./openapi.yaml)` (`MarzipanActivitySnapshot`, operations with `x-integration-status: decision`).

Snapshot should carry **recommendation** release fields and audit/version fields (`last_updated_date_time`, `row_version` as source version — align field name in OpenAPI when updated).

**Nexus → Marzipan mirror:** `NexusReleaseMirrorIngestRequest` in the same file — auto-mirror fields per `nexus_release_id`; optional `organizationsPendingReview` and `translationLanguagesPendingReview` for admin confirm; schedule mirrors (§5, O-16); `publicationCompleted` + `actualPublishDateTime` for “Published at” UI. Nexus column mapping: [`NEXUS_PRISMA_SCHEMA_REFERENCE.md`](./20261106_NEXUS_PRISMA_SCHEMA_REFERENCE.md).

---

## Appendix B — Decisions and open items

### Open items (require decision)

| ID   | Question                                                                                                                                                                                                                                                                                          | Status                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| O-1  | Authentication, environments, HTTPS S2S — **Proposed** baseline §9.2; confirm Emerald mechanism                                                                                                                                                                                                   | **Open**                                     |
| O-2  | **Nexus `eventDateTime` when Marzipan `startTime` is null** (and related): no silent full prefill from incomplete coordination data; nullable vs required column; UX for date-only — see §5                                                                                                       | **Open**                                     |
| O-3  | **Remaining lifecycle:** completed / restored / unlink; soft-delete → deactivate **signal** wire+transport; multi-release UX; mirror when `isActive: false`; snapshot **GET** for deleted ids — **Decision:** delete-requested no-op; deleted → suggest deactivate (manual) — **WF-4**, **§12.4** | **Open**                                     |
| O-4  | **Nexus → Marzipan org/language:** merge vs replace edge cases; **free-form JSON wire shape** (Nexus `external_organizations_json`); pending idempotency — **§12.3**; **Decision:** admin confirm + full replace (§8)                                                                             | **Open**                                     |
| O-17 | Nexus **partial accept** of Marzipan proposal (e.g. schedule only, not orgs yet) — UX and payload                                                                                                                                                                                                 | **Open**                                     |
| O-5  | Nexus UX for Marzipan `on_signal` release mode                                                                                                                                                                                                                                                    | **Open**                                     |
| O-6  | **`eventId`**, **`rowVersion`** ordering, duplicate/stale — **Proposed** §9.3–§9.5; align OpenAPI                                                                                                                                                                                                 | **Open**                                     |
| O-7  | ~~Push vs pull Marzipan → Nexus~~                                                                                                                                                                                                                                                                 | **Closed** → **Decision:** push (see §2, §7) |
| O-8  | Marzipan relative release UI when Nexus accepted schedule differs from recommendation                                                                                                                                                                                                             | **Open**                                     |
| O-9  | Complete list of “significant fields” for push — working enumeration in §3 Step 2; normative **OpenAPI property** list with Nexus (**O-18**)                                                                                                                                                      | **Open**                                     |
| O-10 | **v1: no partial success** — atomic apply — **Proposed** §9.6; drop `partial` from OpenAPI when **Decision**                                                                                                                                                                                      | **Open**                                     |
| O-11 | Retries, error semantics, operator visibility — **Proposed** §9.4, §9.7                                                                                                                                                                                                                           | **Open**                                     |
| O-12 | **Reference-data alignment:** ministry/org UUIDs, language codes; per-env fixtures/seeds; drift when admins edit catalogs — **§12.2**                                                                                                                                                             | **Open**                                     |
| O-13 | Nexus → Marzipan: webhook vs poll vs both (mirror updates)                                                                                                                                                                                                                                        | **Open**                                     |
| O-14 | Exact Marzipan DDL/API shape for `activity` ↔ `nexus_release` link table (0..n)                                                                                                                                                                                                                   | **Open**                                     |
| O-15 | Push trigger: **Reviewed** + significant-field diff; coalescing window and edge cases (**O-6** deferred)                                                                                                                                                                                          | **Open**                                     |
| O-16 | Mirror schedule fields: `scheduledPublishDateTime` ↔ `publishDateTime`; optional `publicationJobScheduledFor` (latest job) — see §5, schema reference                                                                                                                                             | **Closed**                                   |
| O-26 | **Distribution lists:** Marzipan v1 does not mirror `ReleaseDistributionSelection`; product/UI if any                                                                                                                                                                                             | **Open**                                     |
| O-27 | **`releaseUrl`:** which `DestinationResult` / destination wins per document type                                                                                                                                                                                                                  | **Open**                                     |
| O-18 | **Normative v1 significant-field list** — exact `MarzipanActivitySnapshot` properties that (a) **trigger push** when diffed on a **Reviewed** save and (b) their Nexus **receive** mode (**silent apply** vs **proposal**/editor)                                                                 | **Open**                                     |
| O-19 | **`venueAddress` → Nexus `location`:** city as primary prefill; province/country for disambiguation; confirm **no** ingest of Nexus `location` back to Marzipan venue                                                                                                                             | **Open**                                     |
| O-20 | **Linked release:** Nexus `Release.leadMinistryId` (and catalog `Activity.leadMinistryId`) optional vs Marzipan **always has lead** — validation, rejection, or default                                                                                                                           | **Open**                                     |
| O-21 | **`translationsRequiredStatusId` / `translationsRequiredStatus`:** keep in v1 snapshot API or **deprecate**/remove                                                                                                                                                                                | **Open**                                     |
| O-22 | **Timezone alignment:** Nexus interpretation/display of ingested instants vs Marzipan **corp Pacific fixed UTC−7** (`Etc/GMT+7`) — confirm no skew vs `America/Vancouver` or viewer local                                                                                                         | **Open**                                     |
| O-23 | **Integration URL paths** under `/api/v1` — **Proposed** patterns §9.1 vs draft OpenAPI (`/integrations/nexus/...`); verb choice (PUT vs POST)                                                                                                                                                    | **Open**                                     |
| O-24 | **`releaseStatus` (and related):** authoritative **enum**, labels, **transitions** from Nexus; promote OpenAPI from provisional string — **§12.1**                                                                                                                                                | **Open**                                     |
| O-25 | **OpenAPI ↔ §9:** normative **`eventId`** / response `status` values (`accepted`, `ignored_stale`, `ignored_duplicate`); shared error body on integration ops; deprecate **`partial`** / **`202`** when operational baseline is **Decision**                                                      | **Open**                                     |
| O-28 | **`Release.updatedBy`:** Nexus `news_release` has `createdByUserId` and `updatedAt` but **no** `updatedBy` — confirm whether to add a column, derive from audit log/draft save, or keep mirror ingest **`updatedAt` only** (no actor on wire)                                                     | **Open**                                     |

### Decision log (promote here when Open/Proposed items are agreed)

| Date       | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                          | Was        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 2026-11-06 | Marzipan owns publication **recommendation**; Nexus owns **accepted** schedule after save; they may differ; no silent overwrite of Marzipan recommendation fields from Nexus.                                                                                                                                                                                                                                                                     | Discussion |
| 2026-11-06 | **Linked** = Nexus `Release.activityId` = Marzipan `activities.id`; Marzipan stores **per-release** link rows (not a single activity-level id for 0..n).                                                                                                                                                                                                                                                                                          | Discussion |
| 2026-11-06 | Ongoing Marzipan → Nexus = **versioned snapshot push**; Nexus pull retained for link/refresh.                                                                                                                                                                                                                                                                                                                                                     | O-7        |
| 2026-11-06 | Nexus-sourced **organizations** and **translation languages** require **admin review + confirm** in Marzipan before persisting to junction tables; other mirror fields auto-update.                                                                                                                                                                                                                                                               | Discussion |
| 2026-11-06 | Mirror **`actualPublishDateTime` / `completedAt`** per release link; show **Published at** in UI only after completion.                                                                                                                                                                                                                                                                                                                           | Discussion |
| 2026-11-06 | **Coordination** fields (calendar, date/time statuses, title, categories, lead team) → Nexus **silent apply** on push; **publication/editorial** slices → Nexus **proposal** with editor **accept/override**; push when **Reviewed** + diff on v1 significant-field list (§3).                                                                                                                                                                    | Discussion |
| 2026-11-06 | **Integration timezone:** Marzipan **date + civil time** use **Pacific fixed UTC−7** (`Etc/GMT+7`); instants on the wire UTC-backed; Nexus alignment **Open O-22**. **Activity when:** `startDate` + `startTime` both non-null ⇒ complete for coordination instant; statuses informational; **`startTime` null** ⇒ Nexus does not silently full-prefill `eventDateTime` (**Open O-2**). **`releaseTime`** optional prefill for `publishDateTime`. | Discussion |
| 2026-11-06 | **Operational baseline (Proposed):** §9 — `/api/v1` routes, S2S auth, `eventId` + `rowVersion`, **`200`** apply/no-op vs **`202`** only if async stage, atomic v1 apply, sender retries + visibility; **Open O-1**, **O-6**, **O-10**, **O-11**, **O-23**.                                                                                                                                                                                        | Discussion |
| 2026-11-06 | **Domain lifecycle & reference (Proposed structure):** §12 — `releaseStatus` **O-24**; reference data **O-12**; free-form org wire **O-4**; delete/unlink **O-3**.                                                                                                                                                                                                                                                                                | Discussion |
| 2026-11-06 | **Delete-requested:** no Nexus impact. **Deleted** activity: signal Nexus to **deactivate** linked release(s) with **manual** editor confirm. **Completed** + **Deleted** ineligible for initial link/prefill (WF-1).                                                                                                                                                                                                                             | O-3        |
| 2026-11-06 | **O-16:** `scheduledPublishDateTime` = `Release.publishDateTime`; optional `publicationJobScheduledFor` from latest job; mirror freshness = `Release.updatedAt` (wire `updatedAt`); `nexusDocumentTypeKey` = `DocumentType.name`. Removed v1 mirror: subscriptions, translation URL array, MA/backgrounder URL triple.                                                                                                                            | O-16       |
| 2026-11-06 | Mirror ingest: wire field **`updatedAt`** (`Release.updatedAt`); removed **`sourceUpdatedBy`**. **`Release.updatedBy`** flagged **O-28** for Nexus schema confirmation.                                                                                                                                                                                                                                                                           | Contract   |
| 2026-11-06 | **`releaseStatus`:** Nexus-derived enum (no **Archived**); distribution lists **O-26**; `releaseUrl` provenance **O-27**.                                                                                                                                                                                                                                                                                                                         | O-24       |

---

## Appendix C — Drizzle mapping (Marzipan)

Reference only — does not imply **Decision** for every listed field.

| Integration field          | Marzipan source                                                                                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activityId`               | `activities.id`                                                                                                                                                                                           |
| `displayId`                | `activities.display_id`                                                                                                                                                                                   |
| `title`                    | `activities.title`                                                                                                                                                                                        |
| Event timing (snapshot)    | `start_date`, `end_date`, `start_time`, `end_time`, `is_all_day`, `date_status_id`, `time_status_id` — OpenAPI `startDate`, `endDate`, `startTime`, `endTime`, `isAllDay`, `dateStatusId`, `timeStatusId` |
| Venue (`venueAddress`)     | `venue_addresses` via `venueAddress` — city maps to Nexus **`location`**; province/country for disambiguation (**Open O-19**)                                                                             |
| `leadTeamId`               | `activities.lead_team_id`                                                                                                                                                                                 |
| `organizations`            | `activity_organizations` + `organizations` join                                                                                                                                                           |
| Categories                 | `activity_categories` → `categories`                                                                                                                                                                      |
| Release **recommendation** | `release_scheduling_mode`, `release_time_offset_minutes`, `release_time` (computed)                                                                                                                       |
| Languages                  | `activity_translation_languages` → `translated_languages`                                                                                                                                                 |
| Translations required      | `translations_required_status_id` / lookup — **Open O-21** include or deprecate in snapshot API                                                                                                           |
| Audit / snapshot version   | `last_updated_date_time`, `last_updated_by`, `row_version`                                                                                                                                                |

Nexus **accepted** schedule, job queue, and actual publish times live on Nexus `Release` / jobs — mirrored on `activity_nexus_release_link` rows (name TBD, **Open O-14**), not as a single column on `activities`.

There is no `newsReleaseDateTime` or `newsReleaseId` on `activities` in Drizzle today; use the link table + ingest payload for `nexus_release_id` and mirror fields.
