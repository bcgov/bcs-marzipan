# Nexus integration contract changelog

Monotonic **contract revision** for the bundle `INTEGRATION.md` + `openapi.yaml` + Nexus schema reference mapping.  
Not the same as JSON **`payloadVersion`** (`1.0` on snapshot/mirror bodies).

| Revision | Date       | Summary                                                                                                                                                                                             |
| -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.0.2    | 2026-11-06 | Mirror ingest: `sourceUpdatedDateTime` → **`updatedAt`** (`Release.updatedAt`); removed **`sourceUpdatedBy`**. **`Release.updatedBy`** gap tracked as **O-28** (confirm with Nexus).                |
| 0.0.1    | 2026-11-06 | Initial revision id. Schema-aligned mirror fields (O-16 closed); removed v1 mirror subscriptions/translation URLs/MA-backgrounder URL triple; `releaseStatus` / document type / versioning headers. |

**Bump rules (WIP):** patch `0.0.N` for doc/contract edits; minor when approaching v1 RC; major for breaking wire semantics.
