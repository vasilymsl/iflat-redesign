---
phase: 07-circuit-breaker-resilience
plan: 01
subsystem: api
tags: [circuit-breaker, resilience, curl, tv-api, fallback, rate-limit]

# Dependency graph
requires:
  - phase: 06-core-rate-limit-fix
    provides: Promise-chain mutex (requestQueue) and curlJson with retry/backoff

provides:
  - Circuit breaker state (globalThis.__tvScheduleCB) for schedule batch requests
  - curlJsonStream() function bypassing requestQueue with 5s timeout
  - Static channel fallback when API returns empty array
  - SCHEDULE_CB_CONSECUTIVE_THRESHOLD=3 stops batch after 3 consecutive failures
  - SCHEDULE_CB_COOLDOWN_MS=5min resets circuit breaker after cooldown

affects:
  - 08-token-stream-hardening
  - Any future work on tv-token.ts resilience

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Circuit breaker pattern using globalThis for state survival across hot-reload
    - Fast-fail synchronous curl bypassing async request queue for interactive UX
    - Static data fallback for graceful degradation when API is unavailable

key-files:
  created: []
  modified:
    - iflat-redesign/src/lib/tv-token.ts

key-decisions:
  - "Circuit breaker state in globalThis.__tvScheduleCB — survives Next.js hot-reload like other TV caches"
  - "curlJsonStream is synchronous (execSync) — known limitation, acceptable for stream requests until spawn() migration"
  - "CB check BEFORE getGuestToken() in fetchCurrentPrograms — saves a network request when CB is open"
  - "Static freeChannels fallback excludes progress field — return type of getChannels does not have it"

patterns-established:
  - "Circuit breaker: isScheduleCBOpen/recordScheduleSuccess/recordScheduleFailure pattern for idempotent state updates"
  - "curlJsonStream: synchronous fast-fail alternative to curlJson for interactive (hover) endpoints"

requirements-completed: [RESIL-01, RESIL-02, RESIL-03]

# Metrics
duration: 12min
completed: 2026-03-12
---

# Phase 7 Plan 01: Circuit Breaker + Resilience Summary

**Three resilience mechanisms added to tv-token.ts: globalThis circuit breaker for schedule batch, synchronous curlJsonStream with 5s timeout for hover stream requests, and static channel fallback when API returns empty array**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-12T00:00:00Z
- **Completed:** 2026-03-12T00:12:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Circuit breaker state stored in `globalThis.__tvScheduleCB` with consecutive/total fail counters, 5-minute cooldown
- `curlJsonStream()` bypasses `requestQueue` and uses 5s curl timeout (vs 15s) with MAX_RETRIES_STREAM=1 (vs 3)
- `fetchCurrentPrograms` checks CB before getting token (saves a request) and mid-batch (stops on 3rd failure)
- `getStreamUrl` uses `curlJsonStream` instead of `curlJson` — interactive hover response guaranteed <=7s
- `getChannels` returns static `freeChannels` from tv-shelves.ts when API returns empty array

## Task Commits

Each task was committed atomically:

1. **Task 1: Circuit breaker state + curlJsonStream + static fallback constants** - `8daac57` (feat)
2. **Task 2: Wire CB into fetchCurrentPrograms, fast-fail into getStreamUrl, fallback into getChannels** - `2ba8188` (feat)

## Files Created/Modified
- `iflat-redesign/src/lib/tv-token.ts` - Added circuit breaker infrastructure and wired into existing functions

## Decisions Made
- Circuit breaker state in `globalThis.__tvScheduleCB` — consistent with existing pattern for `__tvTokenCache`, `__tvChannelsCache`, `__tvScheduleCache` — all survive hot-reload
- `curlJsonStream` is synchronous (`execSync`) — known limitation documented in JSDoc, acceptable since stream requests are rare and interactive; spawn() migration is a Future Requirement
- CB is checked BEFORE calling `getGuestToken()` when CB is open — this saves an auth request which itself goes through `requestQueue`
- `freeChannels` import from `tv-shelves.ts` has no circular import risk — `ChannelCard.tsx` does NOT import from `tv-token.ts`

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- `npm run build` without `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1` fails with Google Fonts SSL errors — pre-existing issue documented in MEMORY.md, not related to our changes. Build with the env var passes cleanly.

## Next Phase Readiness
- Resilience layer complete: circuit breaker, fast-fail stream, static fallback all in place
- Ready for Phase 8 (Token & Stream Hardening)
- No blockers

## Self-Check: PASSED

- FOUND: `.planning/phases/07-circuit-breaker-resilience/07-01-SUMMARY.md`
- FOUND: `iflat-redesign/src/lib/tv-token.ts`
- FOUND: commit `8daac57` (iflat-redesign repo)
- FOUND: commit `2ba8188` (iflat-redesign repo)

---
*Phase: 07-circuit-breaker-resilience*
*Completed: 2026-03-12*
