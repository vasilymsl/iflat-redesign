# Architecture Patterns

**Domain:** TV content shelves with HLS preview (iFlat / 24h.tv integration)
**Researched:** 2026-03-12
**Based on:** Direct analysis of existing codebase — `iflat-redesign/src/lib/tv-token.ts` (complete read)
**Milestone scope:** v1.1 QRATOR Stability Fix — rate-limiting integration

---

## Current Architecture (as-built, v1.0)

```
src/lib/tv-token.ts                          ← singleton, all 24h.tv I/O
  ├── curlJsonSync()                         ← sync curl via execSync, rate-limit via sleep cmd
  ├── curlJson()                             ← async wrapper: rate-limit + retry/backoff
  ├── fetchNewGuestToken()                   ← 4-step auth: create user → login → device → auth
  ├── reloginWithCachedCredentials()         ← 2-step re-auth using saved username/password
  ├── getGuestToken()                        ← public: token cache + proactive refresh at 25% TTL
  ├── getStreamUrl(internalId)               ← public: curlJson GET /stream + 401 retry
  ├── fetchChannelsFromApi()                 ← curlJson GET /v2/rows/freechannels
  ├── fetchCurrentPrograms(channelIds[])     ← sequential loop: curlJson per channel, circuit breaker at 3 fails
  ├── fetchNovinkiFromApi()                  ← curlJson GET /v2/rows/novinki-*
  ├── getChannels()                          ← public: cache + dedup + calls fetchCurrentPrograms
  └── getNovinki()                           ← public: cache + dedup

src/app/api/tv/stream/[id]/route.ts          ← thin proxy: calls getStreamUrl(), returns { streamUrl }

Global state (process lifetime):
  globalThis.__tvTokenCache                  ← token, expiresAt, tokenIssuedAt, serial, username, password
  globalThis.__tvChannelsCache               ← channels array, expiresAt, inflightPromise
  globalThis.__tvNovinkiCache                ← content array, expiresAt, inflightPromise
  globalThis.__tvScheduleCache               ← Map<channelId, { title, img }>, expiresAt

Persistent state (disk):
  .tv-token-cache.json                       ← survives server restart: token, expiresAt, serial, username, password
```

---

## Rate-Limiting Architecture (v1.1 target)

### Layered Defense Model

Rate-limiting is structured in three layers. Each layer has a distinct responsibility and scope.

```
Layer 1: Inter-request spacing (curlJson level)
  → Enforces minimum gap between consecutive API calls
  → Scope: ALL requests through curlJson

Layer 2: Auth-step spacing (fetchNewGuestToken / reloginWithCachedCredentials)
  → Additional delay between each of the 4 auth steps
  → Scope: auth flows only

Layer 3: Batch circuit breaker (fetchCurrentPrograms)
  → Stops schedule batch if N consecutive failures
  → Scope: schedule loop only
```

This is the correct layering. Putting rate-limiting at the `curlJson` level (Layer 1) is the right call:
- Single enforcement point: impossible to accidentally bypass it
- Auth callers naturally get inter-request spacing without extra code
- Data callers (channels, novinki, schedule) get it automatically

**Do NOT move rate-limiting to the caller level** — that creates N separate enforcement points that will diverge.

---

## Component Boundaries (v1.1 scope)

| Function | Responsibility | Rate-limit layer | Status |
|----------|---------------|-----------------|--------|
| `curlJsonSync()` | Sync HTTP via curl, enforces `DELAY_BETWEEN_REQUESTS_MS` via execSync sleep | Layer 1 (sync) | Implemented |
| `curlJson()` | Async wrapper: async sleep before call + retry/backoff on failure | Layer 1 (async) | Implemented |
| `fetchNewGuestToken()` | Full 4-step auth with `DELAY_AUTH_STEP_MS` between steps | Layer 2 | Implemented |
| `reloginWithCachedCredentials()` | 2-step re-auth with `DELAY_AUTH_STEP_MS` delays | Layer 2 | Implemented |
| `getGuestToken()` | Cache check + proactive refresh at `PROACTIVE_REFRESH_RATIO=0.25` | Token lifecycle | Implemented |
| `fetchCurrentPrograms()` | Sequential loop, `failCount` circuit breaker stops at 3 consecutive fails | Layer 3 | Implemented (verify circuit breaker threshold) |
| `getStreamUrl()` | 401 detection → invalidate token → sleep → retry | 401 recovery | Implemented |

---

## Data Flow (with rate-limiting)

### SSR page load (app/page.tsx and app/tv/page.tsx)

```
Server render request
  → getChannels()
      → getGuestToken()
          If cache hit and TTL > 25%: return cached token (no API call)
          If cache hit and TTL < 25%: return cached token + start background refresh
          If cache miss: reloginWithCachedCredentials() or fetchNewGuestToken()
            → curlJson (enforces 350ms gap + retry/backoff)
            → DELAY_AUTH_STEP_MS (500ms) between each auth step
      → curlJson GET /v2/rows/freechannels
          → enforces 350ms minimum gap from lastRequestAt
      → fetchCurrentPrograms([15 channel IDs])
          → for each channelId:
              → curlJson GET /v2/channels/{id}/schedule
                  → 350ms gap enforced
              → if failCount >= 3: STOP LOOP (circuit breaker)
  → getNovinki()
      → getGuestToken() (likely cache hit after above)
      → curlJson GET /v2/rows/novinki-*
          → 350ms gap enforced
```

**Total schedule batch worst case:** 15 channels × 350ms = ~5.25 seconds. With circuit breaker, stops at 3 consecutive failures.

**Cache hit case:** If __tvScheduleCache is warm (within 10min) and __tvChannelsCache is warm (within 15min), zero API calls on page render. This is the steady-state.

### Client hover (ChannelCard → /api/tv/stream/[id])

```
User hovers card
  → ChannelCard: 200ms debounce timer
  → GET /api/tv/stream/[id]
      → route.ts → getStreamUrl(internalId)
          → getGuestToken() (almost always cache hit)
          → curlJson GET /v2/channels/{apiId}/stream
              → 350ms gap enforced (shared lastRequestAt with all other requests)
          → If status_code === 401:
              → invalidateToken()
              → sleep(500ms)
              → getGuestToken() (triggers re-auth)
              → curlJson retry
  → returns { streamUrl }
  → ChannelCard: hls.js loads stream
```

---

## Sync vs Async: The execSync Bridge

**Current pattern:** `curlJsonSync` uses `execSync("sleep X")` for rate-limiting, then `curlJson` adds an async `sleep()` before calling `curlJsonSync`. This creates double-enforcement, which is safe but slightly redundant.

**Why this is acceptable:**
- `execSync` blocks the Node.js event loop thread. This is already the case for the curl call itself.
- Adding async sleep before the sync call just shifts the block slightly later, preventing the async sleep from being skipped.
- The `lastRequestAt` timestamp is updated inside `curlJsonSync` after the call completes, so the next `curlJson` call correctly measures elapsed time.

**The bridge flow:**
```
curlJson() [async]:
  1. async sleep if elapsed < 350ms  ← yields event loop
  2. curlJsonSync() [sync]:
     a. sync sleep via execSync if STILL elapsed < 350ms  ← safety net
     b. execSync("curl ...")  ← blocks thread
     c. updates lastRequestAt
  3. return result or retry with backoff
```

**Critical constraint:** `lastRequestAt` is a module-level `let` variable. It is shared across ALL concurrent callers. If two requests arrive simultaneously, the second will correctly wait. This is the intended behavior — there is one shared "last request" clock for the whole process.

---

## Proactive Token Refresh Architecture

```
getGuestToken() logic:

if token valid AND remaining > 25% of total TTL:
  return cached token                        ← zero latency

if token valid AND remaining < 25% of total TTL:
  if no inflight refresh:
    fire relogin/fetchNewGuestToken() in background
    .catch: log warning, return current token (still valid)
    .finally: clear inflightPromise
  return current token immediately            ← zero latency, refresh happening in background

if token expired:
  if inflight: await it                      ← deduplicate
  else: fire new auth, await it              ← blocking refresh
```

**Why 25% threshold works:** 24h.tv tokens appear to last ~90 minutes. 25% = ~22 minutes of buffer. Auth flow takes at most ~4 requests × 350ms + 3 × 500ms delays ≈ 2.9 seconds. The buffer is more than sufficient.

**Proactive refresh protects against:** Server staying up for hours, token silently expiring, next user getting a slow blocking re-auth. With proactive refresh, re-auth happens in the background during a cache hit period.

---

## Schedule Batch: Circuit Breaker Design

`fetchCurrentPrograms` iterates 15 channel IDs sequentially. The circuit breaker:

```typescript
let failCount = 0;
for (const chId of channelIds) {
  if (failCount >= 3) { break; }  // circuit opens
  try {
    // ... curlJson ...
    failCount = 0;  // reset on success
  } catch {
    failCount++;
  }
}
```

**Why 3 consecutive failures:** QRATOR blocks at the IP level. If it's blocking, all requests will fail. Three failures is enough signal that the block is active — continuing wastes time and burns rate-limit budget.

**What happens on partial results:** `fetchCurrentPrograms` caches partial results if `result.size > 0`. This means even 1 successful schedule fetch preserves those thumbnails. Channels with no schedule data fall back to `ch.cover.color_bg` (logo with background color), which is a decent visual fallback.

**Potential improvement:** The circuit breaker threshold (3) is hardcoded. Consider making it a constant like the other delay values. Not blocking for v1.1 but worth noting.

---

## Retry/Backoff Architecture

`curlJson` implements exponential backoff:

```
Attempt 0: fails → wait 2000ms × 2^0 = 2000ms
Attempt 1: fails → wait 2000ms × 2^1 = 4000ms
Attempt 2: fails → wait 2000ms × 2^2 = 8000ms
Attempt 3: final throw
```

**Total wait before failure:** 2 + 4 + 8 = 14 seconds. Plus ~3 × 350ms for the requests themselves ≈ 15 seconds total.

**Implication for SSR:** If QRATOR is actively blocking AND the cache is cold, a page render can take up to 15 seconds before giving up. This is acceptable for server-side behavior (Next.js renders on demand). The solution is ensuring caches are warm.

**Implication for /api/tv/stream/[id]:** Stream URL requests happen on user hover (client-triggered). A 15-second timeout is too long for interactive UX. The route handler's `getStreamUrl()` wraps its call in a try/catch that returns `null` on error, which the client handles gracefully (no stream shown). The backoff in `curlJson` runs before returning null, so a blocked stream request will still wait 14 seconds server-side before the 404 response. This is a known limitation.

---

## Persistent Cache: Restart Resilience

`.tv-token-cache.json` contains: token, expiresAt, serial, username, password.

**Critical path on server restart:**
```
module load → loadPersistentCache() → populate globalThis.__tvTokenCache
  → if token exists AND expiresAt > now: serve immediately (zero auth requests)
  → if token expired but username/password exist: reloginWithCachedCredentials() (2 requests)
  → if nothing: fetchNewGuestToken() (4 requests including POST /v2/users)
```

**The POST /v2/users problem:** QRATOR rate-limits this endpoint most aggressively. The persistent cache avoids it entirely on restarts if credentials are saved. The fallback (`fetchNewGuestToken`) only triggers when the persistent cache is empty — meaning a fresh install or manual cache deletion.

**Manual recovery path** (documented in MEMORY.md): Open 24h.tv in browser → DevTools → copy access_token → paste into `.tv-token-cache.json`. This bypasses the blocked endpoint entirely.

---

## Integration Points for New Work

The existing implementation is substantially complete. The gap between current state and v1.1 requirements is primarily validation and edge-case hardening, not new architecture.

### What is implemented and working:
- `curlJson`: async rate-limiting + retry/backoff — complete
- `curlJsonSync`: sync rate-limiting via execSync sleep — complete
- `fetchNewGuestToken`: step delays — complete
- `reloginWithCachedCredentials`: step delays — complete
- `getGuestToken`: proactive refresh at 25% TTL — complete
- `fetchCurrentPrograms`: sequential with circuit breaker — complete
- Persistent file cache — complete

### What needs verification/hardening:
1. **Stream request timeout under backoff:** `/api/tv/stream/[id]` can timeout for 14+ seconds during backoff. Consider adding a separate shorter timeout for stream requests vs auth requests.
2. **Circuit breaker threshold as constant:** `3` is hardcoded in `fetchCurrentPrograms`. Should be a named constant alongside `MAX_RETRIES`, `DELAY_BETWEEN_REQUESTS_MS`.
3. **Schedule cache invalidation on 401:** If the token expires mid-schedule-fetch and `curlJson` gets a non-exception error response (e.g., `{ status_code: 401 }`), the schedule loop does not detect it as a failure — it counts as success (no exception thrown). The `failCount` mechanism only catches exceptions (network errors, timeouts). Add status_code checking in the schedule loop.
4. **Proactive refresh + inflight dedup interaction:** The proactive refresh fires a background promise but does NOT deduplicate with a concurrent blocking refresh. If a token expires exactly at page render time and proactive refresh is also running, two auth flows could run concurrently. The `inflightPromise` check prevents this for blocking requests, but proactive refresh bypasses it. This is low-probability but should be verified.

---

## Build Order (v1.1 scope)

```
1. Add CIRCUIT_BREAKER_THRESHOLD constant to tv-token.ts
   └── trivial, low risk, improves readability

2. Add schedule loop 401 detection
   └── fetchCurrentPrograms: check Array.isArray(schedule) is already done,
       but need to also check for { status_code: 401 } response
   └── increment failCount on non-array response, not just exceptions

3. Add stream-specific timeout
   └── getStreamUrl: wrap curlJson with a shorter timeout OR
       add separate MAX_RETRIES_STREAM=1 constant (no backoff for interactive requests)
   └── Tradeoff: faster UX failure vs reliability

4. Verify proactive refresh race condition
   └── Code review: getGuestToken() proactive path vs concurrent expiry
   └── Low risk, may not need code change — just confirmation

5. Integration test: cold start with blocked IP
   └── Delete .tv-token-cache.json, simulate QRATOR block, verify fallback behavior
   └── Not code, but critical for v1.1 sign-off
```

**Critical path:** 2 → 3 (both are small, isolated changes to tv-token.ts)

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Moving Rate-Limiting Out of curlJson

**What goes wrong:** Adding per-caller delays (e.g., delays in `getChannels`, `getNovinki` before calling the API) instead of at the transport layer.
**Why bad:** Creates multiple enforcement points that diverge as code evolves. One missed call bypasses rate-limiting entirely.
**Instead:** All rate-limiting stays in `curlJson`/`curlJsonSync`. Callers should NOT add their own delays.

### Anti-Pattern 2: Parallel Schedule Requests

**What goes wrong:** Converting `fetchCurrentPrograms` loop to `Promise.all(channelIds.map(...))`.
**Why bad:** Fires 15 concurrent requests to QRATOR simultaneously. This is exactly the pattern that triggers the block.
**Instead:** Sequential loop with per-request rate-limiting. Current implementation is correct.

### Anti-Pattern 3: Treating execSync Sleep as Reliable Wait

**What goes wrong:** Relying ONLY on `execSync("sleep X")` inside `curlJsonSync` for rate-limiting, removing the async pre-sleep in `curlJson`.
**Why bad:** If two async callers check `lastRequestAt` at nearly the same time (before either makes a request), both calculate `elapsed < DELAY` as false — but by different amounts. The sync sleep inside `curlJsonSync` is a safety net, not the primary mechanism. The async sleep in `curlJson` is what provides cooperative scheduling.
**Instead:** Keep both: async sleep in `curlJson` (cooperative) + sync sleep in `curlJsonSync` (safety net).

### Anti-Pattern 4: Invalidating Schedule Cache on Token Refresh

**What goes wrong:** Clearing `__tvScheduleCache` whenever the token is refreshed (because "the old token was used to fetch it").
**Why bad:** Schedule data (program titles and thumbnails) has its own TTL (10 minutes). It doesn't become invalid when the auth token rotates.
**Instead:** Token cache and data caches are independent. Only invalidate schedule/channels/novinki caches based on their own TTL.

### Anti-Pattern 5: Blocking SSR on Schedule Fetch Failure

**What goes wrong:** Propagating `fetchCurrentPrograms` errors up through `getChannels` as an unhandled rejection.
**Why bad:** Schedule fetch failing (common when QRATOR is active) kills the entire page render.
**Instead:** Current pattern is correct — `fetchCurrentPrograms` catches internally and returns partial results. `getChannels` has a separate `try/catch` around it. Channels render without schedule thumbnails, which is graceful.

---

## Scalability Considerations

| Concern | Current state | With heavy traffic | Notes |
|---------|--------------|-------------------|-------|
| Rate-limiting under concurrent requests | Single `lastRequestAt` variable serializes requests | Multiple simultaneous SSR renders will queue behind each other | Acceptable — Next.js caches SSR, rare for many concurrent cold renders |
| Token refresh storms | `inflightPromise` deduplicates | Multiple renders hitting expired token: one refreshes, others await | Correctly handled |
| Schedule batch on every SSR render | 10min TTL prevents re-fetching | Cache hit = zero API calls | Correct |
| Stream requests per user hover | 1 request per hover | N users hovering N channels: N concurrent requests | Each goes through curlJson queue — they serialize. Adds latency but prevents block |
| QRATOR IP block | Persistent cache avoids POST /v2/users | Block affects all requests until IP clears | No code solution — operator must use manual token injection |

---

## Sources

- Direct code read: `iflat-redesign/src/lib/tv-token.ts` (full file, 756 lines)
- Direct code read: `iflat-redesign/src/app/api/tv/stream/[id]/route.ts` (full file, 41 lines)
- Project spec: `.planning/PROJECT.md` (direct read)
- Memory context: `.planning/../MEMORY.md` (system context)
- Confidence: HIGH for all findings — based on direct codebase analysis, not inferred
