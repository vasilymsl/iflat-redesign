# Feature Landscape: API Rate-Limit Fix (v1.1)

**Domain:** API client resilience for rate-limited third-party streaming API
**Project:** iFlat TV-шлейфы — fixing 24h.tv rate-limiting
**Researched:** 2026-03-12
**Research basis:** Codebase analysis (tv-token.ts, route.ts), PROJECT.md, MEMORY.md, domain expertise in API client patterns

---

## Context: What's Already Built

`tv-token.ts` already contains:
- `DELAY_BETWEEN_REQUESTS_MS = 350` — inter-request delay via `sleep()` + sync `execSync("sleep")` fallback
- `DELAY_AUTH_STEP_MS = 500` — delay between 4-step auth flow steps
- `MAX_RETRIES = 3` with `RETRY_BASE_DELAY_MS = 2000` (exponential backoff `2^attempt`)
- `PROACTIVE_REFRESH_RATIO = 0.25` — background token refresh when <25% TTL remains
- Promise deduplication via `inflightPromise` for tokens, channels, and novinki
- Circuit breaker logic for schedule batch: stops after 3 consecutive failures
- Persistent file cache (`.tv-token-cache.json`) survives server restarts
- Relogin with cached credentials (avoids full 4-step flow)

The problems reported:
1. **15 simultaneous schedule requests fire in a loop** even with delay — still hits rate-limit
2. **HLS streams fail** when stream requests get blocked
3. **Rate-limiter is server-side, not QRATOR** (different problem than auth was)

---

## Table Stakes

Must-have to fix the bug. Missing = streams don't work at all.

| Feature | Why Needed | Complexity | Current Status | Notes |
|---------|------------|------------|----------------|-------|
| Inter-request delay in schedule batch | 15 requests without spacing → rate-limit. Colleague confirmed delays help | Low | PARTIAL — delay logic exists in `curlJson()` but `fetchCurrentPrograms` calls it in fast loop; `lastRequestAt` tracking may not enforce spacing correctly across parallel async calls | Ensure each schedule request is spaced ≥350ms from the previous. The `lastRequestAt` global is synchronous but `curlJson` is async — race condition likely |
| Circuit breaker stops batch after N failures | Already implemented (`failCount >= 3`). Must keep working | Low | DONE — `failCount` counter in `fetchCurrentPrograms` | Verify it actually stops the loop, not just skips |
| Graceful degradation: partial schedule cache | If batch aborts at channel 8/15, cache what was collected (channels 1–7). Don't throw away partial results | Low | DONE — `if (result.size > 0)` caches partial | Good. Verify partial results render correctly in UI |
| Stream request after 401 refreshes token | When stream URL returns 401, invalidate token and retry once | Low | DONE — `invalidateToken()` + retry in `getStreamUrl()` | Good implementation |
| Static fallback when API is unavailable | If channels API fails entirely, show hardcoded fallback data from `tv-shelves.ts` | Low | PARTIAL — `dc.data ?? []` returns empty array. Fallback config exists in `tv-shelves.ts` but is not wired | Need to wire fallback: if API returns empty, use static config data |

---

## Differentiators

Nice-to-have for robustness. Not blocking fixes but improve reliability.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Sequential schedule requests with guaranteed spacing | Replace async loop + global `lastRequestAt` with explicit `await sleep(350)` after each request — removes race condition entirely | Low | Simple fix: add `await sleep(DELAY_BETWEEN_REQUESTS_MS)` at the end of each loop iteration instead of relying on elapsed-time check |
| Adaptive delay backoff for schedule batch | If first few schedule requests succeed, keep 350ms. If failures start, double the delay (700ms, 1400ms). More gentle than full circuit break | Med | Reduces false-positive circuit breaks when API is slow but not blocked |
| Schedule batch concurrency limit (N=2) | Instead of fully sequential (slow) or parallel (triggers rate-limit), fetch 2 channels at a time | Med | `p-limit` or manual semaphore. Halves schedule fetch time. Risk: adds complexity |
| Per-error-code response differentiation | Currently all errors increment `failCount`. `429 Too Many Requests` should pause longer than a network timeout | Med | Check if curl returns HTTP status. Add `if status === 429, sleep(5000)` |
| Stream URL client-side caching (short TTL) | If user hovers same channel twice within 60s, serve cached URL instead of hitting API again | Low | Add `Map<channelId, { url, expiresAt }>` in the route handler or token module. TTL: 60-90s |
| Health-check endpoint for token status | `GET /api/tv/health` returns token TTL, last successful schedule fetch time, failure counts | Low | Useful for debugging. Not needed for fix itself |

---

## Anti-Features

Explicitly do NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| True rate-limit queue with backpressure | Full queue implementation (bull, p-queue with concurrency control, priority queues) is engineering overkill for 15 channels and 1 concurrent user context | Simple sequential loop with `await sleep()` is sufficient. Add delay, done |
| 429 HTTP header parsing (`Retry-After`) | 24h.tv API via curl returns JSON, not standard HTTP 429 with headers. API may not even return `Retry-After`. Building header-parsing logic = fighting the wrong battle | Use fixed delay on failure, not header-based delay |
| Distributed rate-limit state | Redis/shared state for rate-limit tracking across multiple Node.js workers | Single Next.js dev server, single process. Global `lastRequestAt` is sufficient |
| Replacing curl with Node fetch | curl is used specifically to bypass QRATOR TLS fingerprinting — that problem is still real | Keep curl. The rate-limit fix is about timing, not transport |
| Re-architecting to client-side schedule fetching | Moving schedule requests to browser would bypass server rate-limiting but exposes tokens and adds per-user API load | Keep server-side. Fix the timing |
| Cancelling in-flight schedule requests on page leave | Complex AbortController wiring on server side for marginal gain | Schedule runs once, caches for 10 min. Just let it complete |
| Webhook / push-based schedule updates | Requires 24h.tv to support server-sent events or webhooks — they don't | Poll with cache TTL |

---

## Feature Dependencies

```
Fix: guaranteed inter-request spacing
  └── Simple: add explicit await sleep(350) at end of each schedule loop iteration
        └── Removes reliance on lastRequestAt race condition
              └── Prerequisite for: schedule requests reliably complete

Fix: static fallback wiring
  └── tv-shelves.ts (already exists — has STATIC_CHANNELS and STATIC_NOVINKI)
        └── In fetchChannelsFromApi catch → return STATIC_CHANNELS
              └── In fetchCurrentPrograms → if result empty, return empty Map (already done)

Fix: stream URL client-side cache
  └── getStreamUrl() already exists
        └── Add Map<string, {url:string, expiresAt:number}> cache in module scope
              └── Check cache before curl request
                    └── TTL: 60s (streams are short-lived tokens)

Proactive token refresh (already built)
  └── PROACTIVE_REFRESH_RATIO = 0.25
        └── Works correctly — no changes needed
              └── Prerequisite for: streams working on first hover without token wait

Circuit breaker (already built)
  └── failCount >= 3 in fetchCurrentPrograms
        └── Works correctly — no changes needed
              └── Prevents QRATOR block cascade
```

---

## MVP Recommendation

**Must have (minimal fix):**

1. **Explicit sleep after each schedule loop iteration** — one line of code, removes race condition in `fetchCurrentPrograms`. Replace elapsed-time check with unconditional `await sleep(DELAY_BETWEEN_REQUESTS_MS)` after each curl call.

2. **Wire static fallback** — in `getChannels()`, if API returns empty array, return `STATIC_CHANNELS` from `tv-shelves.ts`. One conditional, prevents blank shelf on API failure.

3. **Verify circuit breaker works correctly** — add a log when it stops (`[tv-token] Circuit break at channel N/15`) to confirm it fires. No code change needed if logic is correct.

**Should have (robustness):**

4. **Stream URL cache (60s TTL)** — prevents duplicate stream requests when user quickly hovers and unhovers same channel. ~10 lines.

5. **Increase DELAY_BETWEEN_REQUESTS_MS to 500ms for schedule batch** — colleague's advice confirmed: "add delays between API requests." 350ms may still be too aggressive. Use separate constant: `SCHEDULE_DELAY_MS = 500`.

**Defer:**

- Adaptive delay backoff — only if 500ms fixed delay still fails
- Concurrency limit N=2 — only if sequential is too slow in production
- Health check endpoint — debug tool, not a fix

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Schedule batch delay | `lastRequestAt` is a module-level global. Two async callers (e.g. page load + API request) can both read stale `lastRequestAt` before either updates it — race condition. `await sleep()` is not a mutex | Use explicit unconditional sleep instead of conditional elapsed-time check |
| Static fallback | `tv-shelves.ts` exports `STATIC_CHANNELS` with only 5 channels (hardcoded). Wiring fallback makes it visible in production when API fails — make sure static data is complete (15 channels) | Audit static data quality before wiring fallback |
| Stream URL TTL | 24h.tv stream URLs contain the `access_token` as query param. If token is refreshed, cached stream URLs become invalid | Cache stream URLs for max 60s, not the full token TTL |
| curlJsonSync inside async | `fetchCurrentPrograms` calls async `curlJson`, which internally calls sync `curlJsonSync` via `execSync`. The `execSync("sleep")` in `curlJsonSync` blocks the Node.js event loop. With 15 channels × 350ms = 5.25s of blocking | Replace the `execSync("sleep")` path with `await sleep()` — the elapsed check means it rarely fires, but when it does it blocks. Only async `sleep()` should be used |

---

## Sources

- **Codebase analysis** (HIGH confidence): `iflat-redesign/src/lib/tv-token.ts` — full implementation reviewed
- **Codebase analysis** (HIGH confidence): `iflat-redesign/src/app/api/tv/stream/[id]/route.ts`
- **PROJECT.md** (HIGH confidence): v1.1 milestone goals, out-of-scope list
- **MEMORY.md** (HIGH confidence): Known problems, colleague advice, persistent cache rationale
- **Domain expertise** (MEDIUM confidence): API client patterns — rate-limit handling, circuit breakers, token refresh strategies
