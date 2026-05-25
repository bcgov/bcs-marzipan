# CorpCal performance tests (k6)

k6 scripts exercise the calendar API and (optionally) the Vite UI. See `performance_tests/.env.example` for environment variables.

## Prerequisites

- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) on `PATH`
- For API tests: `calendar-service` running (default `http://127.0.0.1:3001`) or a deployed `BASE_URL`
- For browser tests: k6 with browser support (Chromium), plus `npm --prefix calendar-ui run dev`

## Scripts

| Script                                 | Purpose                                    | Writes data?             |
| -------------------------------------- | ------------------------------------------ | ------------------------ |
| `tests/corpcal-api-smoke.js`           | Read-only API smoke (14 endpoint groups)   | No                       |
| `tests/corpcal-api.js`                 | Load scenario; includes `POST /activities` | Yes — creates activities |
| `browser/corpcal-frontend-smoke.js`    | Headless UI shell on `/login`              | No                       |
| `browser/corpcal-login-public-flow.js` | Unauthenticated login surface              | No                       |
| `browser/corpcal-mock-auth-flow.js`    | Mock login + History tab                   | No                       |

## Auth strategies

| Variable                          | Use when                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `PERF_USERNAME` / `PERF_PASSWORD` | Local mock or password-based login                                              |
| `PERF_BEARER_TOKEN`               | Shared DEV or CI — skips `POST /auth/login` (throttled to **5 req/min per IP**) |
| `API_KEY`                         | Optional `X-API-Key` header when required by the environment                    |

Load and smoke API scripts obtain a token once per run via `setup()` (or `PERF_BEARER_TOKEN`). Prefer `PERF_BEARER_TOKEN` for multi-VU runs against shared hosts.

## Profiles (`PERF_PROFILE`)

- **smoke** — 1 VU, ~20s, relaxed thresholds (used by `corpcal-api-smoke.js` and local runners)
- **standard** — 3 VUs, ~1m (used by `corpcal-api.js` load script)

Override with `VUS` and `DURATION`.

## npm commands

```bash
# API smoke (read-only; loads performance_tests/.env when present)
npm run perf:k6:local

# API smoke (direct k6; sets PERF_PROFILE=smoke)
npm run perf:k6:api-smoke

# API load (POST /activities)
npm run perf:k6

# Validate all k6 scripts (CI uses this)
npm run perf:k6:inspect

# Browser (needs UI dev server)
npm run perf:k6:browser:local
npm run perf:k6:browser:flow:local
npm run perf:k6:browser:auth:local
```

## Environment matrix

| Context        | `BASE_URL`                  | Auth                                                         | Script                                    |
| -------------- | --------------------------- | ------------------------------------------------------------ | ----------------------------------------- |
| Local API      | `http://127.0.0.1:3001`     | mock user / optional password                                | smoke or load                             |
| Vite proxy     | `http://127.0.0.1:3000/api` | same                                                         | smoke or load                             |
| Shared DEV     | `https://<host>/api`        | `PERF_BEARER_TOKEN` strongly recommended                     | **smoke only** unless load is intentional |
| GitHub Actions | workflow input `base_url`   | `PERF_PASSWORD`, `PERF_BEARER_TOKEN`, `PERF_API_KEY` secrets | smoke or load per `profile` input         |
| Tekton         | `BASE_URL` param            | optional `PERF_*` / `API_KEY` params                         | default smoke script                      |

## CI / Tekton

- **CI/CD** (`ci-cd.yaml`): `npm run perf:k6:inspect` on every push to `main`
- **Manual workflow** (`.github/workflows/k6-performance.yaml`): `profile=smoke` runs `corpcal-api-smoke.js`; `profile=standard` runs `corpcal-api.js`
- **OpenShift** (`openshift/ci/k6-smoke-task.yaml`): Tekton task `corpcal-k6-api-smoke` with optional auth params

## Rate limits (calendar-service)

- `POST /auth/login`: **5 requests / minute / IP** (`@Throttle` on auth controller)
- Global: `ThrottlerModule` **200/min**; `RateLimitInterceptor` default **100/min** (health/ready excluded)

Load tests sleep between iterations to stay under general limits; login is handled once via `setup()` or `PERF_BEARER_TOKEN`.

## When to use smoke vs load

- **Smoke** — shared DEV, CI gates, permission-aware read-only checks
- **Load** — local or dedicated environments only; creates real activities via `POST /activities`
