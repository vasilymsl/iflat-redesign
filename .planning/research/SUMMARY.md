# Project Research Summary

**Project:** iFlat TV Shelves — HLS Preview on Hover
**Domain:** TV/Streaming content shelves with live HLS video preview (Netflix/24h.tv style)
**Researched:** 2026-03-09
**Confidence:** HIGH

## Executive Summary

This is a brownfield enhancement to an existing Next.js 16 / React 19 site: replacing placeholder TV channel shelves with production-quality, Netflix-style content rows featuring 140% card expansion on hover, real-time HLS video preview, and live data from the 24h.tv API. The foundation is already built — components exist, hls.js is installed, CSS structure is present — but the current implementation is a placeholder: cards only scale 5% on hover, only one channel has a real stream URL, all data is hardcoded, and the overflow structure on the scroll container guarantees the expand effect will be clipped until fixed. The gap between current and target is implementation depth, not architecture invention.

The recommended approach follows three parallel tracks that converge: (1) fix the CSS overflow/expand architecture first since every visual milestone depends on it, (2) build the API layer (guest token + channel data + stream URL proxy) in parallel since it has no CSS dependencies, and (3) wire both together in ChannelCard with proper HLS lifecycle management. No new packages are needed — the entire feature builds from the installed stack. The critical architectural decision is to implement card expansion via `position: absolute` overlay (not layout-changing width/scale), which avoids the scroll-snap conflict and overflow-clipping trap simultaneously.

The primary risks are: (1) CORS blocking HLS manifest/segment fetching from 24h.tv CDN — must be validated before any player code is written; (2) the overflow-clipping trap where `overflow: hidden` on the scroll container silently breaks the entire expand effect; (3) hls.js memory leaks from fast hover/unhover without proper AbortController guards. All three risks have documented mitigations and the existing code already partially addresses #3. The main gap is that CORS behavior of 24h.tv CDN is unknown until tested.

---

## Key Findings

### Recommended Stack

The stack requires zero new packages. All dependencies are present: `hls.js@1.6.15` for HLS streaming, Next.js Route Handlers for server-side API proxy (hiding auth tokens), plain CSS transitions for GPU-composited expand animations (not Framer Motion), and native `overflow-x: auto` + scroll logic already in `TvChannelShelf`. The key constraint is that hls.js must remain a dynamic import — static import causes `document is not defined` during Next.js SSR. Framer Motion and Embla Carousel are installed but must NOT be used for this feature: CSS transforms are GPU-composited at zero JS cost, and native scroll handles mobile correctly.

**Core technologies:**
- `hls.js@1.6.15`: MSE-based HLS streaming for Chrome/Firefox — already installed, already used in ChannelCard
- Native `<video>` + `canPlayType`: Safari native HLS fallback — already implemented in ChannelCard
- Next.js Route Handlers: server-side proxy to hide 24h.tv `access_token` from browser — mandatory, no CORS leakage
- CSS `transform` + `position: absolute`: 140% card expand — GPU-composited, zero JS overhead
- `fetch` with `next: { revalidate: 3600 }`: channel list caching — avoids 24h.tv rate limiting
- Module-level token cache with promise deduplication: prevents race conditions on concurrent hover events

**What NOT to use:**
- Framer Motion for hover animations (JS-driven, expensive for 6+ cards)
- Embla Carousel (native scroll is simpler and conflicts with hover expansion)
- SWR/React Query (not installed, not justified for 2 endpoints)
- Zustand/Jotai (card state is local, no cross-card coordination needed)

### Expected Features

**Must have (table stakes — blocks milestone):**
- True 140% card expand with neighbor overlap — the #1 gap; current `scale(1.05)` is visually amateurish
- Real HLS streams from 24h.tv API via guest token flow — currently only 1 of ~15 channels has a stream
- TV shelves on home page (`app/page.tsx`) — currently shelves only exist on `/tv`
- Animated expand with 200ms hover intent delay — partial (JS delay exists, CSS transition needs alignment)

**Should have (milestone quality):**
- Dynamic channel data from 24h.tv API (not hardcoded `tv-shelves.ts`)
- Dynamic "Novinki" content from API
- Rating badge always visible on content cards (currently hidden until hover — simple CSS fix)
- Video crossfade from thumbnail to live stream (opacity transition exists but timing needs tuning)

**Defer:**
- Preload strategy for adjacent cards (out of scope per PROJECT.md)
- CORS stream proxy (only needed if CDN blocks direct browser requests — validate first)
- Server-side token caching with Redis/KV (module-level cache is sufficient for this scale)
- Keyboard navigation beyond basic arrow button support

**Anti-features (deliberately out of scope):**
- Full video player controls — preview only, no seek/fullscreen
- User auth / 24h.tv login — guest token only
- Mobile video on hover — touch events differ, tap should navigate to 24h.tv
- Multiple simultaneous streams — one active stream at a time, new hover cancels previous

### Architecture Approach

The architecture is a clear RSC-to-client boundary: Server Components fetch channel list at request time (with ISR cache), pass serializable `ChannelData[]` props to client shelf components, and stream URLs are fetched lazily via Next.js Route Handler on first hover (token never reaches browser). State is strictly local per card — no global store. The scroll container switches from native scroll-snap to JS-only scroll to enable `overflow: visible` for card expansion. hls.js lifecycle is a state machine (IDLE → PENDING → LOADING → BUFFERING → PLAYING → CLEANUP) with AbortController guards at every async boundary.

**Major components:**
1. `lib/api/tv.ts` — network layer: guest token management, channel list fetch, stream URL fetch; no React dependencies
2. `app/api/tv/stream/[id]/route.ts` — server proxy: adds Bearer token to 24h.tv requests, keeps token off client
3. `ChannelCard` (client) — single card: thumbnail + absolute-positioned hover overlay, HLS lifecycle state machine
4. `TvChannelShelf` (client) — scroll container with JS-only scroll (after removing scroll-snap), prev/next arrows
5. `ContentShelf` (client) — same scroll pattern for movie/series poster cards
6. `app/tv/page.tsx` + `app/page.tsx` — Server Components that fetch data and pass props to shelves

**Critical path:** `lib/api/tv.ts` → CSS expand architecture → `ChannelCard` with lazy stream fetch → data wiring → main page integration

### Critical Pitfalls

1. **`overflow: hidden` clips expanded cards** — `.tv-shelf__scroll` and `.channel-card-inner` both have `overflow: hidden`. Card expansion is completely invisible until this is fixed. Solution: `overflow-x: auto; overflow-y: visible` on scroll container, switch to absolute-positioned hover overlay on card.

2. **CORS blocking HLS manifests and TS segments** — 24h.tv CDN may not set `Access-Control-Allow-Origin`. Must validate in browser DevTools before writing any player code. If blocked, need `/api/stream?url=...` proxy route (adds ~50-100ms but acceptable for hover-triggered load).

3. **hls.js memory leak on fast hover/unhover** — dynamic import is async; if user leaves before promise resolves, the created `Hls()` instance is never destroyed. Fix: check `ac.signal.aborted` immediately after `await import("hls.js")`, destroy instance if aborted before assigning to ref.

4. **scroll-snap conflicts with card expansion** — `scroll-snap-type: x mandatory` triggers snap on layout changes caused by card expansion. Solution: implement expansion as `position: absolute` overlay (no layout change = no snap trigger). Remove scroll-snap from container when switching to JS scroll.

5. **Guest token race condition** — concurrent hovers trigger parallel `POST /v2/users` requests; each returns a new token, invalidating previous. Solution: singleton promise deduplication pattern — store pending token promise, new requests join the same promise rather than creating new ones.

---

## Implications for Roadmap

### Phase 1: CSS Expand Architecture
**Rationale:** Every subsequent phase depends on the expand effect being visually correct. Fixing the overflow/stacking structure first means ChannelCard work, API integration work, and home page integration can all be validated visually from day one. This phase has zero external dependencies.
**Delivers:** 140% card expansion with neighbor overlap, hover delay animation, correct z-index stacking (no clips, no conflicts with header), scroll-snap removed (JS scroll retained)
**Addresses:** Table stakes #1 (140% expand), Table stakes #2 (animated delay)
**Avoids:** Pitfall 1 (overflow clipping), Pitfall 4 (scroll-snap conflict), Pitfall 9 (z-index behind header)
**Stack:** Pure CSS changes to `globals.css`, position: absolute hover overlay on `.channel-card-inner`

### Phase 2: API Layer + Stream Proxy
**Rationale:** Can be built in parallel with Phase 1 (no CSS dependencies). Must be complete before ChannelCard can show real streams. The CORS validation step must happen first within this phase — if CORS is blocked, a proxy route is needed which adds scope.
**Delivers:** `lib/api/tv.ts` with guest token (singleton + deduplication), `getChannels()`, `getNewReleases()`, `getChannelStream(id)`; Route Handler proxy at `/api/tv/stream/[id]`; ISR-cached channel list fetch
**Addresses:** "Real HLS streams" requirement, "Dynamic channel data" requirement
**Avoids:** Pitfall 3 (CORS), Pitfall 5 (token race), Pitfall 7 (SSR import), Pitfall 8 (rate limiting)
**Stack:** Next.js Route Handlers, `fetch` with `next: { revalidate: 3600 }`, module-level token cache

### Phase 3: ChannelCard HLS Integration
**Rationale:** Depends on Phase 1 (CSS overlay structure) and Phase 2 (stream URL source). This is where the expand animation and live video preview merge into the final UX. AbortController hygiene and cleanup correctness are critical here.
**Delivers:** Working hover-triggered HLS preview on all channels, thumbnail-to-video crossfade, LIVE badge, stopStream on mouse leave, full AbortController guard at every async boundary, cleanup on unmount
**Addresses:** "Live video preview on hover" (table stakes #3), video crossfade differentiator
**Avoids:** Pitfall 2 (memory leak), Pitfall 11 (AbortError unhandled), Known issue #4 (unmount cleanup)
**Stack:** hls.js dynamic import, AbortController, `useRef` + `useState` local state machine

### Phase 4: Data Wiring + Home Page Integration
**Rationale:** After Phase 3 proves the end-to-end happy path on `/tv`, replace static config with live API data and replicate shelves on the home page. Low risk — component reuse, no new patterns.
**Delivers:** `app/tv/page.tsx` fetches live channels + new releases from API; `app/page.tsx` replicates the tv-section; static `tv-shelves.ts` retained as fallback
**Addresses:** "Shelves on home page" (table stakes, blocks milestone), "Dynamic data" should-haves
**Avoids:** Pitfall 8 (rate limiting via revalidate), Pitfall 9 (z-index on home page placement)
**Stack:** RSC data fetching, `lib/api/tv.ts`, existing TvChannelShelf + ContentShelf components

### Phase 5: Polish + Mobile
**Rationale:** Cleanup pass after functional milestone is achieved. Address minor pitfalls, fix known code issues, Lighthouse pass.
**Delivers:** Rating badge always visible, resize debounce on TvChannelShelf, scroll padding-right for last-card snap, `crossOrigin="anonymous"` on video for Safari, `loading="lazy"` + `priority` on first 6 images, video crossfade timing tuned
**Addresses:** Content card rating UX, responsive edge cases
**Avoids:** Pitfall 10 (Safari crossOrigin), Pitfall 12 (last card scroll), Pitfall 13 (image lazy loading), Known issue #5 (resize debounce)

### Phase Ordering Rationale

- CSS must precede ChannelCard because visual validation of the expand effect requires the overflow structure to be correct — otherwise every iteration of ChannelCard looks broken
- API layer is independent of CSS and can be built in parallel; decoupling these phases keeps each focused
- ChannelCard integration comes after both CSS and API are independently validated — reduces debugging surface
- Home page integration is last because it's a composition step, not a new pattern; reusing already-validated components
- Polish phase is always last to avoid premature optimization of things that may change

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (API Layer):** CORS behavior of 24h.tv CDN is unknown — must test empirically before finalizing proxy vs. direct approach. Guest token TTL is estimated (likely 1h) but not confirmed. `/v2/rows/novinki` endpoint existence is unconfirmed — may need alternate endpoint discovery.
- **Phase 3 (ChannelCard):** hls.js `Hls.Events.ERROR` handling strategy for production (network errors, stale tokens, unsupported format) needs decision — currently only happy path is implemented.

Phases with standard patterns (research not needed):
- **Phase 1 (CSS):** Well-documented CSS overflow/stacking context behavior. Solutions are established.
- **Phase 4 (Data Wiring):** Standard RSC data fetching pattern with Next.js. No unknowns.
- **Phase 5 (Polish):** All items are known fixes to known issues from code inspection.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on direct `package.json` audit and existing component code — no guesswork |
| Features | HIGH | Based on direct codebase analysis + PROJECT.md requirements; only API endpoint details are MEDIUM |
| Architecture | HIGH | Existing component structure read directly; target architecture follows established Next.js RSC patterns |
| Pitfalls | HIGH | Critical pitfalls from direct code inspection of actual bugs (overflow, scale, single streamUrl); domain knowledge for HLS/CORS/stacking context is well-established |

**Overall confidence:** HIGH

### Gaps to Address

- **24h.tv CDN CORS policy:** Unknown until tested in browser. Handle by making CORS validation the first step of Phase 2. If blocked, proxy route is pre-designed in ARCHITECTURE.md.
- **Guest token TTL:** Estimated as ~1h based on standard practices, but not confirmed. Token cache TTL of 55 min is conservative — adjust if 401s appear in testing.
- **`/v2/rows/novinki` endpoint:** Existence inferred from PROJECT.md, not verified against live API. Have static fallback ready (`tv-shelves.ts`) so failure here doesn't block milestone.
- **Safari HLS CORS:** `crossOrigin="anonymous"` may conflict with token-in-URL scheme (some CDNs reject credentialed requests if CORS is anonymous). Test Safari specifically.
- **transform-origin for first/last card:** Architecture recommends CSS `:first-child`/`:last-child` selectors for directional expansion. This may need JS `data-` attribute approach if card count varies dynamically.

---

## Sources

### Primary (HIGH confidence)
- `/iflat-redesign/src/components/sections/ChannelCard.tsx` — existing HLS implementation, state machine, AbortController usage
- `/iflat-redesign/src/components/sections/TvChannelShelf.tsx` — scroll logic, arrow visibility, resize handler
- `/iflat-redesign/src/components/sections/ContentShelf.tsx` — content card structure
- `/iflat-redesign/src/app/globals.css` — 350+ lines TV shelf CSS, current overflow structure, animation patterns
- `/iflat-redesign/src/config/tv-shelves.ts` — static data structure, ChannelData/ContentItem types
- `/iflat-redesign/package.json` — installed versions (all confirmed present)
- `.planning/PROJECT.md` — requirements, API spec, constraints, out-of-scope decisions

### Secondary (MEDIUM confidence)
- MDN Web Docs (training data) — CSS overflow stacking context, W3C overflow-x:auto implies overflow-y:auto
- hls.js GitHub README (training data) — maxBufferLength config, Hls.isSupported() API
- Netflix/Kinopoisk/24h.tv UX patterns (domain expertise) — 140% expand convention, one-stream-at-a-time rule, hover delay convention

### Tertiary (LOW confidence — needs runtime validation)
- 24h.tv API endpoint behavior: CORS headers, guest token TTL, `/v2/rows/novinki` existence
- Safari + crossOrigin + token-in-URL compatibility

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
