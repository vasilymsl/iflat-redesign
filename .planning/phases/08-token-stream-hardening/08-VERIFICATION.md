---
phase: 08-token-stream-hardening
verified: 2026-03-12T00:00:00Z
status: passed
score: 3/3 must-haves verified
---

# Phase 8: Token & Stream Hardening Verification Report

**Phase Goal:** Токен проактивно обновляется до истечения даже после рестарта сервера, повторный hover не бьёт API
**Verified:** 2026-03-12
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | После рестарта сервера tokenIssuedAt восстанавливается из .tv-token-cache.json — proactive refresh корректно вычисляет TTL ratio | VERIFIED | `PersistentTokenData.tokenIssuedAt` (line 238); `savePersistentCache()` writes it (line 258); singleton init: `persisted.tokenIssuedAt ?? Date.now()` (line 274); `getGuestToken()` ratio uses `expiresAt - tokenIssuedAt` denominator (lines 554-557) |
| 2 | Повторное наведение на тот же канал в течение 60s не создаёт нового API-запроса к stream endpoint | VERIFIED | `cache.streamUrlCache.get(internalId)` checked before `curlJsonStream` call (lines 602-606); constant `STREAM_URL_CACHE_TTL_MS = 60_000` (line 38); cache written on hit path (line 641) and 401-retry path (line 629) |
| 3 | .tv-token-cache.json содержит поле tokenIssuedAt после получения токена | VERIFIED | `savePersistentCache()` at line 258 serialises `tokenIssuedAt: cache.tokenIssuedAt` into JSON; called in `fetchNewGuestToken()` (line 482) and `reloginWithCachedCredentials()` (line 533); file not present in working dir only because no token has been fetched in this environment — the write path is implemented correctly |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `iflat-redesign/src/lib/tv-token.ts` | tokenIssuedAt persistence + stream URL cache | VERIFIED | File exists at 897 lines; contains all required implementations |
| `.tv-token-cache.json` | Persistent token data with tokenIssuedAt field | VERIFIED (runtime) | File written by `savePersistentCache()` at runtime; write path confirmed in code; absent only because no active token session in this environment |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `savePersistentCache()` | `.tv-token-cache.json` | `writeFileSync` with `tokenIssuedAt` field | WIRED | Line 258: `tokenIssuedAt: cache.tokenIssuedAt` serialised in JSON object passed to `writeFileSync` |
| `loadPersistentCache()` | `cache.tokenIssuedAt` | `data.tokenIssuedAt ?? Date.now()` fallback | WIRED | Line 274: `tokenIssuedAt: persisted.tokenIssuedAt ?? Date.now()` in singleton init block |
| `getStreamUrl()` | `streamUrlCache` Map | cache hit check before `curlJsonStream` | WIRED | Lines 602-607: `cache.streamUrlCache.get(internalId)` with TTL guard; `curlJsonStream` only called on miss |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TOKEN-01 | 08-01-PLAN.md | Проактивное обновление токена при <25% оставшегося TTL | SATISFIED | `PROACTIVE_REFRESH_RATIO = 0.25` (line 544); ratio computed as `remaining / totalTTL` where `totalTTL = expiresAt - tokenIssuedAt` (lines 554-557) |
| TOKEN-02 | 08-01-PLAN.md | `tokenIssuedAt` сохраняется в persistent cache для корректного расчёта TTL после рестарта | SATISFIED | `PersistentTokenData.tokenIssuedAt` field present; written by `savePersistentCache()`; restored in singleton init with fallback |
| PERF-02 | 08-01-PLAN.md | Stream URL кешируется на 60s — повторный hover не бьёт API | SATISFIED | `streamUrlCache: Map<string, StreamUrlEntry>` in `TvTokenCache`; `STREAM_URL_CACHE_TTL_MS = 60_000`; lookup before every `curlJsonStream` call |

No orphaned requirements — all three IDs from PLAN frontmatter are accounted for and satisfied. REQUIREMENTS.md traceability table confirms TOKEN-01, TOKEN-02, PERF-02 map to Phase 8.

### Anti-Patterns Found

None found. No TODO/FIXME/placeholder comments in the modified file. No stub implementations. No hardcoded TTL for proactive refresh ratio (ratio computed dynamically from `tokenIssuedAt`). The one fallback `90 * 60 * 1000` is only used when `tokenIssuedAt == 0` (line 556) — an acceptable defensive default for zero-value edge case.

### Human Verification Required

#### 1. Stream URL cache hit in logs

**Test:** Start dev server, open a channel card, hover it to trigger stream fetch, hover the same card again within 60 seconds.
**Expected:** Second hover shows `[tv-token] Stream URL cache hit: {channelId}` in server logs — no second curl call to `24h.tv`.
**Why human:** Cannot verify runtime log output programmatically without running the server.

#### 2. tokenIssuedAt in cache file after token fetch

**Test:** Start dev server, let it fetch a guest token (open a TV page), then `cat .tv-token-cache.json` in the `iflat-redesign/` directory.
**Expected:** JSON file contains a numeric `tokenIssuedAt` field close to the current epoch timestamp in milliseconds.
**Why human:** Cache file is only written at runtime; environment has no active token session.

#### 3. Proactive refresh after server restart

**Test:** Let server obtain a token. Stop server. Restart. Observe logs.
**Expected:** Server logs `[tv-token] Restored credentials from persistent cache` and does NOT immediately trigger a new guest auth; when token nears expiry (<25% remaining), logs `[tv-token] Proactive token refresh (expiring soon)...` before actual expiry.
**Why human:** Requires time-based observation across server restarts.

### Gaps Summary

No gaps. All three must-have truths are verified at all three levels (exists, substantive, wired). All requirement IDs are satisfied by concrete code evidence. No anti-patterns or stubs detected.

---

_Verified: 2026-03-12_
_Verifier: Claude (gsd-verifier)_
