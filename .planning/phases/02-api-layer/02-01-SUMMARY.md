---
phase: 02-api-layer
plan: 01
subsystem: api-layer
tags: [token-management, route-handler, caching, singleton, nextjs]
dependency_graph:
  requires: []
  provides: [GET /api/tv/stream/[id], TokenManager singleton, getGuestToken, getStreamUrl]
  affects: [Phase 3 - HLS Player]
tech_stack:
  added: []
  patterns: [globalThis singleton, Promise deduplication, TTL cache, 401 retry]
key_files:
  created:
    - iflat-redesign/src/lib/tv-token.ts
    - iflat-redesign/src/app/api/tv/stream/[id]/route.ts
  modified:
    - iflat-redesign/src/lib/tv-token.ts (lint fix: removed unused eslint-disable)
decisions:
  - "TOKEN_TTL_MS = 90 minutes (conservative, unknown real TTL — 401 retry as safety net)"
  - "CHANNEL_ID_MAP uses placeholder '??' values — requires manual fill from GET /v2/channels"
  - "Silent fail on non-401 errors: null return allows Phase 3 to skip player gracefully"
  - "TV_API_BASE reads from process.env.TV_API_BASE_URL with fallback to hardcoded value"
metrics:
  duration: "3 minutes"
  completed_date: "2026-03-09"
  tasks_completed: 2
  files_changed: 2
---

# Phase 2 Plan 01: TV Token Manager & Stream Route Handler Summary

Server-side token manager for 24h.tv with globalThis singleton, promise deduplication, TTL caching, 401 auto-refresh, and a Next.js 16 dynamic Route Handler that proxies stream URL requests without exposing the token to the browser.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | TokenManager singleton (tv-token.ts) | 82eb25c | iflat-redesign/src/lib/tv-token.ts |
| 2 | Route Handler GET /api/tv/stream/[id] | f38304b | iflat-redesign/src/app/api/tv/stream/[id]/route.ts |

## What Was Built

### tv-token.ts — TokenManager Singleton

`iflat-redesign/src/lib/tv-token.ts` implements:

- **globalThis singleton guard** (`globalThis.__tvTokenCache`) — survives Next.js hot-reload. Without this, each webpack module rebuild would reset the token and hammer the 24h.tv auth API during development.
- **Three-path `getGuestToken()`** — fast path (cached), deduplication path (inflight promise), new fetch path. Concurrent hover events on multiple channels trigger only one POST /v2/users.
- **90-minute TTL** via `TOKEN_TTL_MS = 90 * 60 * 1000` — conservative estimate, 401 retry as reactive fallback for when the real TTL is shorter.
- **401 auto-retry in `getStreamUrl()`** — invalidates `cache.token` and `cache.expiresAt`, calls `getGuestToken()` for fresh token, retries the stream fetch once.
- **`CHANNEL_ID_MAP`** with all 15 channels from `tv-shelves.ts` — all set to `"??"` placeholder pending manual discovery from `GET /v2/channels`. `getStreamUrl()` returns null with `console.warn` for any unmapped channel.
- **`TV_API_BASE`** reads from `process.env.TV_API_BASE_URL` with fallback to `https://api.24h.tv`.

### route.ts — GET /api/tv/stream/[id]

`iflat-redesign/src/app/api/tv/stream/[id]/route.ts` implements:

- Awaits `params` per Next.js 15+ async params requirement
- Delegates all business logic to `getStreamUrl(id)` from `@/lib/tv-token`
- Returns `{ streamUrl }` with `Cache-Control: no-store` on success (200)
- Returns `{ error: "Channel not found or stream unavailable" }` (404) when streamUrl is null
- Returns `{ error: "Failed to fetch stream URL" }` (500) on unexpected errors
- Listed as `ƒ (Dynamic)` in Next.js build output — correct for token-gated endpoint

## Verification Results

- `npm run build` — PASSED. Route appears as `ƒ /api/tv/stream/[id]`
- `npm run lint` — PASSED. Zero errors, zero warnings.
- TypeScript `--noEmit` on tv-token.ts — PASSED.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused eslint-disable directive**
- **Found during:** Task 2 lint verification
- **Issue:** `// eslint-disable-next-line no-var` from RESEARCH.md pattern caused lint warning "Unused eslint-disable directive" because the project's ESLint config doesn't enable the `no-var` rule
- **Fix:** Removed the eslint-disable comment entirely — the `declare global { var ... }` syntax is valid TypeScript without it
- **Files modified:** iflat-redesign/src/lib/tv-token.ts
- **Commit:** f38304b (included in Task 2 commit)

## Known Limitations (by design)

- **Channel IDs are placeholders** — `getStreamUrl()` returns null for all 15 channels until `CHANNEL_ID_MAP` is filled with real API IDs. This is documented in RESEARCH.md as a LOW confidence area requiring empirical discovery.
- **CORS behavior unknown** — Phase 3 must test whether `cdn.media.24h.tv` HLS streams are accessible cross-origin from the browser. If not, a proxy endpoint will be needed.
- **Real TTL unknown** — 90 minutes is a conservative guess. If the real TTL is shorter, the 401 retry mechanism will handle it transparently.

## Self-Check: PASSED

- `iflat-redesign/src/lib/tv-token.ts` — FOUND
- `iflat-redesign/src/app/api/tv/stream/[id]/route.ts` — FOUND
- Commit `82eb25c` — FOUND (feat(02-01): implement TokenManager singleton)
- Commit `f38304b` — FOUND (feat(02-01): add GET /api/tv/stream/[id] Route Handler)
