# Calendar service: scheduled jobs

This document lists **NestJS `@nestjs/schedule` cron jobs** run by `calendar-service` and the safety measures that apply to them.

## Jobs

| Job              | Schedule                            | Class                                                            | Purpose                                                                                                                                                                                   |
| ---------------- | ----------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lock maintenance | Every 10 seconds (`*/10 * * * * *`) | `LockHandoffPoller` (`src/locks/lock-handoff-poller.service.ts`) | Runs `LocksService.processDueHandoffsOnce()` (one due edit-lock handoff, if any), then `LocksService.cleanupExpiredLocks()` (delete expired lease or idle edit locks and notify viewers). |

There are no other `@Cron` tasks in this repository’s TypeScript sources today.

## Safety measures

### 1. No second pool checkout inside an open transaction

`postgres.js` keeps **one connection** checked out for the full `db.transaction()` callback. Any `await` that runs queries on the **global** Drizzle client during that window needs **another** connection from the pool. If the pool is exhausted or sized to one connection, the app can **deadlock** (first connection stays `idle in transaction` in Postgres while Node waits forever for a free client).

Handoff finalization and related reads (username, idle-timeout setting) therefore use the **transaction client `tx`** passed into `LocksService.finalizeHandoffTransferInTransaction`, not `this.databaseService.db`. The holder-save path claims a pending handoff and finalizes in a **single** transaction so there is no redundant nested transaction.

### 2. Overlap guard on the cron handler

If a maintenance run takes longer than the cron interval, Nest will schedule another tick. `LockHandoffPoller` uses a simple **in-process flag** (`maintenanceInFlight`): while a run is active, the next tick returns immediately. That limits stacked work and pool pressure under slowdowns.

**Note:** This does not coordinate across multiple app replicas. If you run several `calendar-service` pods, each replica still runs its own cron on the same schedule; handoff processing remains safe because of DB row locking (`FOR UPDATE SKIP LOCKED`), but you may prefer a single runner or Postgres advisory locks later if you need strictly one maintainer cluster-wide.

### 3. Operational follow-up (optional)

Database settings such as `idle_in_transaction_session_timeout` are **not** set by the application code; they are optional DBA controls if you want idle transactions terminated by the server. Size `DB_MAX_CONNECTIONS` appropriately for concurrency; relying on a pool of one while any code path could still nest transactions would be unsafe.
