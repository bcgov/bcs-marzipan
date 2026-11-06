# Marzipan–Nexus Integration Contract: Feedback Synthesis and Remaining Work

## Purpose

This document summarizes the key findings from the original contract feedback and assesses the second iteration of the Marzipan–Nexus integration contract. It is intended as a handoff document for another agent or contributor who will help close the remaining gaps.

## Executive synthesis

The original feedback identified a fundamental issue: the material described many fields and possible endpoints, but did not yet establish a sufficiently clear, agreed integration contract. The missing pieces were primarily workflow, ownership, identity, interface direction, and operational behaviour rather than API syntax alone.

The second iteration [INTEGRATION.md](./INTEGRATION.md) substantially addresses that concern by separating:

- **Human-readable integration behaviour** in `INTEGRATION.md`
- **Machine-readable API definitions** in `openapi.yaml`
- **Agreed, proposed, open, and future behaviour** through an explicit conformance legend
- **Business workflows** from payload and endpoint definitions

The result is now a recognizable integration contract rather than a combined proposal, schema inventory, and gap analysis. It is conceptually coherent, but several architectural and operational decisions must still be closed before it should be treated as implementation-ready.

## What the second iteration resolves

### 1. Business workflows are now explicit

The contract defines concrete workflows for:

- Linking a Nexus release to a Marzipan activity
- Propagating changes after linkage
- Mirroring Nexus-owned release metadata in Marzipan
- Handling future delete and eligibility scenarios

This gives the interface definitions a real user and system context.

### 2. System and field ownership are much clearer

The field ownership matrix distinguishes:

- Marzipan-owned planning information
- Nexus-owned editorial and publication information
- Read-only mirrored data
- Fields that are recommendations rather than authoritative values

The distinction between Marzipan's recommended release time, Nexus's scheduled publication time, and Nexus's actual publication time is particularly important and resolves a major ambiguity in the earlier material.

### 3. Record identity and cardinality are defined

The contract establishes:

- `marzipanActivityId` as the activity business key
- `nexusReleaseId` as the Nexus release identifier stored by Marzipan
- Zero-to-many Nexus releases per Marzipan activity
- Zero-or-one Marzipan activity per Nexus release
- `displayId` as a UI/search identifier rather than the technical relationship key

### 4. Conflicting schemas have been replaced by one machine-readable contract

`openapi.yaml` is now the authoritative location for endpoint and payload definitions. This is a major improvement over maintaining multiple similar but incompatible DTO examples in narrative documentation.

### 5. Agreed and unresolved material is visibly separated

The **Decision**, **Proposed**, **Open**, and **Future** labels provide useful governance. Teams can distinguish what they may implement now from what is suitable only for discussion, prototyping, or later scope.

## Overall assessment

The first iteration could be summarized as:

> There is not yet an agreed integration contract.

The second iteration is better summarized as:

> There is now a coherent contract structure and an agreed core workflow, but several architectural, field-level, and operational decisions remain open.

The recommended approach is therefore **not to expand the prose document significantly**. The next phase should focus on resolving open items, updating the decision log, and promoting agreed items from **Open** or **Proposed** to **Decision**.

# Five areas that still need attention

## 1. Decide the post-link synchronization architecture

### Status (updated)

- **O-7 (Closed):** Marzipan → Nexus is **push** of a **versioned full snapshot** after link. See [INTEGRATION.md §2](./INTEGRATION.md) and the decision log.
- **O-13 (Open):** Nexus → Marzipan mirror updates: **webhook vs poll vs both** — transport and freshness still need closure; webhook remains **Proposed** with refresh-on-open as fallback.

### Remaining work

- Finalize **O-13** (delivery mechanism, auth on callback URL, retry alignment with [§9](./INTEGRATION.md)).
- Align **`openapi.yaml`** paths and verbs with **§9.1** / **O-23** when both teams sign off.

---

## 2. Define the exact v1 field synchronization matrix

### Problem

The contract says “significant” Marzipan changes propagate to Nexus, but O-9 does not yet define the complete field set or the receiving behaviour.

There is also potential ambiguity where a field group is marked as v1 in the ownership matrix but its synchronization details remain open.

### Work required

Create an authoritative table covering every candidate v1 field:

| Field/group                 | Source of truth          | Sync after link? | Trigger                | Consumer behaviour             | Confirmation required? | Conflict rule             |
| --------------------------- | ------------------------ | ---------------: | ---------------------- | ------------------------------ | ---------------------: | ------------------------- |
| Title                       | Marzipan                 |              Yes | Significant change     | Update linked release metadata |                     No | Marzipan wins             |
| Activity schedule           | Marzipan                 |              Yes | Significant change     | Update activity event data     |               Possibly | Marzipan wins             |
| Release-time recommendation | Marzipan                 |              Yes | Significant change     | Present recommendation         |                    Yes | Nexus confirms schedule   |
| Organizations               | Marzipan                 |              TBD | Significant change     | Update or prompt               |                    TBD | TBD                       |
| Translation languages       | Marzipan                 |              Yes | Significant change     | Update requirement             |                    TBD | Marzipan owns requirement |
| Nexus release status        | Nexus                    |              Yes | Nexus lifecycle change | Update Marzipan mirror         |                     No | Nexus wins                |
| Scheduled publication       | Nexus after confirmation |              Yes | Nexus schedule change  | Update Marzipan mirror         |                     No | Nexus wins                |
| Actual publication and URLs | Nexus                    |              Yes | Publication            | Update Marzipan mirror         |                     No | Nexus wins                |

The agent should validate this table against both the business workflows and `openapi.yaml`.

### Definition of done

- O-9 is closed.
- Every v1 field has an owner, trigger, direction, receiving behaviour, and conflict rule.
- Contract tests or fixtures cover the agreed fields.

---

## 3. Complete the time and scheduling semantics

### Problem

The high-level concepts are now correctly separated, but three related gaps remain:

- **O-2:** Mapping TBD or unconfirmed Marzipan schedules to Nexus `eventDateTime`
- **O-5:** Nexus behaviour and UX for Marzipan `on_signal` release mode
- **O-8:** Marzipan UI behaviour when Nexus changes scheduled publication time

### Work required

Treat these as one decision set rather than independent questions. Define behaviour for:

- Confirmed activity date and time
- Date known but time TBD
- Date and time both TBD
- Relative release recommendation
- Fixed release recommendation
- `on_signal`
- Nexus confirming or changing scheduled publication
- Nexus publishing at a different time than scheduled

### Recommended invariant

> A Nexus scheduled publication change updates the Nexus-owned schedule mirror in Marzipan. It does not silently rewrite the Marzipan activity schedule or the original Marzipan release-time recommendation.

### Definition of done

- O-2, O-5, and O-8 are closed.
- Example timelines demonstrate the expected values in both systems.
- Time zones, wall times, offsets, null values, and daylight-saving behaviour are explicitly defined.

---

## 4. Define authentication, reliability, and failure handling

### Progress

A **Proposed** operational baseline is now in [INTEGRATION.md §9](./INTEGRATION.md): `/api/v1` route alignment (**O-23**), S2S auth and env pairing (**O-1**), **`eventId`** + **`rowVersion`** ordering (**O-6**), **`200`** vs **`202`**, atomic v1 apply and **no** `partial` (**O-10**), retries and operator visibility (**O-11**). Promotion to **Decision** and OpenAPI alignment are still open (**O-25**: response `status` values, `eventId` on schemas, deprecate draft **`partial`** / **`202`**).

### Remaining (still open)

- **O-1:** Concrete Emerald / platform service-to-service authentication
- **O-6** / **O-25:** Normative OpenAPI fields and responses vs §9
- **O-10:** Drop or gate **`partial`** in mirror response schema when atomic apply is **Decision**
- **O-11:** Shared error envelope across integration operations; contract tests for duplicate, stale, timeout, 4xx

### Work required (close the loop)

Define at least these behaviours:

1. **Authentication:** service-to-service identity, authorization scope, secret/certificate management, and environment-specific configuration.
2. **Idempotency:** repeating the same request must not create additional or different state.
3. **Ordering:** older updates must not overwrite newer state.
4. **Retryability:** identify which HTTP responses are retryable and specify bounded backoff.
5. **Failure visibility:** failed synchronization must be observable and recoverable by an operator.
6. **Atomicity:** decide whether updates are all-or-nothing.

### Simplification to consider

Avoid `partial` success in v1 if each snapshot or mirror update can be applied atomically. Removing partial success would reduce contract and recovery complexity.

### Definition of done

- O-1, O-6, O-10, O-11, and **O-25** are closed (or O-25 folded into O-6/O-11 once OpenAPI matches §9).
- The OpenAPI error responses match the documented behaviour.
- Duplicate, stale, invalid, unauthorized, unavailable, and timeout scenarios are represented in contract tests.

---

## 5. Finalize lifecycle values, reference-data mapping, and deletion behaviour

### Progress

- [INTEGRATION.md §12](./INTEGRATION.md) **Proposed** structure: **`releaseStatus` (O-24)**, reference data (**O-12**), free-form org wire (**O-4**), deletion/unlink (**O-3**).
- **O-4 (partially clear):** Nexus-sourced org/language deltas that would change junctions are **pending** in Marzipan with **admin confirm** and **full replace** on confirm; **merge/replace edge cases** and **JSON shape** for free-form orgs remain open.
- **O-3 (partially clear):** [INTEGRATION.md §6 WF-4](./INTEGRATION.md) — **delete-requested:** no Nexus impact. **Deleted:** signal Nexus to **archive** linked release(s) with **manual** editor confirm. **Completed** + **Deleted** ineligible for initial link/prefill (already in WF-1).

### Problem (remaining)

Several domain-level details remain too loose for predictable implementation:

- Nexus `releaseStatus` is still provisional in OpenAPI — needs authoritative **enum** and **transitions** (**O-24**).
- **O-12:** Per-environment reference-data fixtures and drift handling (ministries, UUIDs, language codes).
- **O-4:** Exact wire shape for free-form organizations (`external_organizations_json`); idempotency of pending payloads.
- **O-3 (remaining):** archive **signal** transport and OpenAPI shape; multi-release archive UX; **Completed** (non-deleted) behaviour; **Restore**; **Unlink**; **GET snapshot** for deleted id (`404` vs `410`).

### Work required

- Obtain the authoritative Nexus lifecycle values and define the allowed transitions (**O-24**).
- Confirm stable cross-system identifiers and fixtures per environment (**O-12**).
- Define the exact wire shape for free-form organizations (**O-4**).
- Close remaining **O-3**: wire the soft-delete → archive **signal**, complete lifecycle matrix for completed/restored/unlink.

### Definition of done

- `releaseStatus` is an agreed enum in `openapi.yaml` (**O-24**).
- O-3, O-4, and O-12 are closed or explicitly deferred with safe v1 behaviour.
- Reference-data fixtures exist for each environment.
- Lifecycle and unlink/delete scenarios have acceptance tests.

# Suggested work order for the next agent

1. **Transport:** close **O-13** (Nexus → Marzipan); O-7 is already **Decision** (push).
2. **Routes:** close **O-23**; update `openapi.yaml` paths to match [§9.1](./INTEGRATION.md).
3. **Field-level contract:** close **O-9** / **O-18** and reconcile with the ownership matrix and schemas.
4. **Time semantics:** close **O-2**, **O-5**, and **O-8** using worked scenarios.
5. **Operational contract:** promote [§9](./INTEGRATION.md) to **Decision** where agreed; close **O-1**, **O-6**, **O-10**, **O-11**, **O-25**; align OpenAPI.
6. **Domain consistency:** close **O-3**, **O-4**, **O-12**, **O-24** ([§12](./INTEGRATION.md)).
7. Update `INTEGRATION.md`, the decision log, and `openapi.yaml` together.
8. Add fixtures and contract tests for every operation marked **Decision**.

# Near-term implementation-ready milestone

The contract will be close to implementation-ready when the following are complete:

- **O-13:** Nexus → Marzipan transport (webhook/poll/hybrid)
- **O-23:** Integration URL paths and verbs aligned in OpenAPI
- **O-9 / O-18:** Significant-field matrix locked to OpenAPI property names
- **O-1:** Authentication and environments
- **O-6** (and **O-25**): Idempotency, stale handling, and OpenAPI parity with §9
- **O-11:** Errors and retry/recovery behaviour
- **O-24:** Final Nexus `releaseStatus` enum (and transitions)

The remaining items may still matter, but these decisions form the minimum coherent operational contract for independent development.

# Guardrails for future revisions

- Keep business behaviour and decisions in `INTEGRATION.md` (including **§9** operational baseline and **§12** domain/lifecycle).
- Keep exact paths, payloads, constraints, and responses in `openapi.yaml`.
- Do not duplicate schemas in prose unless they are clearly non-normative examples.
- Promote an item to **Decision** only after both teams agree.
- Record the date and parties in the decision log.
- Require fixtures and contract tests for all Decision operations.
- Treat the legacy combined proposal as historical reference, not an implementation source of truth.
