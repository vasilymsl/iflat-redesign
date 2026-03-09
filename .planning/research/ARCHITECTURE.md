# Architecture Patterns

**Domain:** TV content shelves with HLS preview (iFlat / 24h.tv integration)
**Researched:** 2026-03-09
**Based on:** Direct analysis of existing codebase at `iflat-redesign/src/`

---

## Existing Component Map

The v0 baseline already exists. Architecture analysis is based on what is built:

```
app/tv/page.tsx (Server Component)
  └── <section class="tv-section">           ← dark background wrapper
        ├── tv-section__header               ← 24TV logo + tagline (static)
        ├── <TvChannelShelf>                 ← "Бесплатные ТВ-каналы"
        │     └── <ChannelCard> × N          ← HLS preview card
        └── <ContentShelf>                   ← "Новинки"
              └── content-card × N           ← poster card (inline JSX, no sub-component)
```

---

## Recommended Architecture (target state)

```
app/tv/page.tsx (Server Component)
  └── TvSection (Server Component or thin wrapper)
        ├── TvSectionHeader                  ← logo + tagline, static
        ├── TvChannelShelf                   ← "use client", scroll + arrows
        │     └── ChannelCard × N            ← "use client", HLS lifecycle
        │           ├── <img> thumbnail      ← always rendered, placeholder
        │           ├── <video> element      ← always in DOM, src set on hover
        │           ├── LIVE badge           ← visible when videoReady
        │           └── progress bar         ← always rendered
        └── ContentShelf                     ← "use client", scroll + arrows
              └── ContentCard × N            ← can stay inline or extract

app/page.tsx (Server Component)
  └── TvSection (same component, reused)

lib/api/tv.ts                                ← API client (24h.tv)
  ├── getGuestToken()                        ← POST /v2/users
  ├── getChannels()                          ← GET /v2/channels
  ├── getChannelStream(id)                   ← GET /v2/channels/{id}/stream
  └── getNewReleases()                       ← GET /v2/rows/novinki or similar

config/tv-shelves.ts                         ← static fallback / seed data (exists)
```

---

## Component Boundaries

| Component | Responsibility | Knows About | Does NOT Know About |
|-----------|---------------|-------------|---------------------|
| `app/tv/page.tsx` | Page assembly, metadata | TvChannelShelf, ContentShelf, data fetching | HLS internals, scroll state |
| `TvChannelShelf` | Horizontal scroll container, prev/next arrows, scroll state | ChannelCard, ChannelData type | HLS, API |
| `ChannelCard` | Single channel: thumbnail, video lifecycle, hover state | hls.js (dynamic import), streamUrl | Shelf scroll, sibling cards |
| `ContentShelf` | Horizontal scroll container, prev/next arrows for posters | ContentItem type | Video, API details |
| `lib/api/tv.ts` | Network requests, token management, data normalization | 24h.tv API spec | React, components |
| `config/tv-shelves.ts` | Static seed data, used as fallback | ChannelData, ContentItem types | API, network |

---

## Data Flow

```
Build time (Server):
  app/tv/page.tsx
    → await getChannels()         ← lib/api/tv.ts → POST /v2/users (token) → GET /v2/channels
    → await getNewReleases()      ← lib/api/tv.ts → GET /v2/rows/novinki
    → passes ChannelData[] prop to <TvChannelShelf>
    → passes ContentItem[] prop to <ContentShelf>

Runtime (Client — hover):
  ChannelCard.handleMouseEnter()
    → setTimeout(200ms)
    → ChannelCard.startStream()
      → dynamic import("hls.js")       ← bundle split, loaded once
      → Hls.loadSource(streamUrl)       ← streamUrl from props (set at build/SSR)
      → video.play()
      → "playing" event → setVideoReady(true) → video fades in

  ChannelCard.handleMouseLeave()
    → clearTimeout
    → ChannelCard.stopStream()
      → AbortController.abort()         ← cancels pending event listeners
      → hls.destroy()
      → video.pause() + removeAttribute("src") + video.load()
      → setVideoReady(false)
```

**Token flow (to be implemented):**
```
Server (Next.js Route Handler or fetch at build):
  POST https://api.24h.tv/v2/users { is_guest: true }
  → { access_token: "..." }
  → GET /v2/channels?token=...
  → GET /v2/channels/{id}/stream → { url: "...m3u8?token=..." }
  → streamUrl baked into props passed to ChannelCard
  → No token exposed in client JS
```

---

## CSS Architecture for Expand-on-Hover

The current implementation uses `scale(1.05)` on `.channel-card-inner`. The target is 24h.tv-style expand (~140% width) that overlaps neighbors.

**The core problem:** overflow:hidden on `.tv-shelf__scroll` clips expanded cards. Two standard solutions:

### Solution A: overflow:visible on scroll container + JS-based scroll (recommended)

```
.tv-shelf__scroll {
  overflow: visible;           /* allow cards to expand outside */
  /* Native scroll-snap breaks when overflow:visible — use JS scroll only */
}

.channel-card {
  position: relative;
  z-index: 1;
  transition: z-index 0s 0.25s;   /* delay z-index reset until after shrink */
}

@media (hover: hover) and (min-width: 768px) {
  .channel-card:hover {
    z-index: 20;
    transition: z-index 0s;
  }

  .channel-card:hover .channel-card-inner {
    transform: scaleX(1.4) scaleY(1.3);
    transform-origin: center center;  /* or left/right based on position */
    transition: transform 0.25s ease-out;
    transition-delay: 0.2s;
  }
}
```

**Transform-origin rule:**
- First card: `transform-origin: left center`
- Last visible card: `transform-origin: right center`
- Middle cards: `transform-origin: center center`
- Detecting first/last requires JS or CSS `:first-child` / `:last-child`

### Solution B: position:absolute overlay (alternative)

On hover, clone/position a larger version of the card as `position:absolute` over the shelf. More complex but allows arbitrary size. Netflix uses this. Requires JS to calculate position.

**Recommendation: Solution A** for this project. The scroll container already uses JS for prev/next arrows. Switching from `overflow-x:auto` to `overflow:visible` with JS-only scroll is a contained change. The `scroll-snap-type` must be removed (it requires overflow scroll), and manual scroll behavior already exists in `TvChannelShelf.scroll()`.

---

## Video Lifecycle State Machine

```
IDLE
  → (mouseenter + streamUrl exists)
  → PENDING (200ms timer running)
    → (mouseleave before timer) → IDLE
    → (timer fires) → LOADING
      → (hls.js importing) → LOADING
        → (manifest parsed, play() called) → BUFFERING
          → (first frame, "playing" event) → PLAYING (videoReady=true, video visible)
            → (mouseleave) → CLEANUP
              → (hls.destroy, src removed) → IDLE
        → (fatal HLS error) → IDLE
        → (AbortController aborted) → IDLE
```

**Critical invariant:** AbortController is checked at every async step. If user moves mouse before hls.js finishes loading (~50-200ms dynamic import), the load is cancelled and no HLS instance is created.

**Memory leak risk:** If `hlsRef.current` is not destroyed on unmount. Already handled via `useEffect` cleanup returning `hls.destroy()`. Must be preserved in all future edits to ChannelCard.

---

## Scalability Considerations

| Concern | Current (static data) | With live API | With 50+ cards visible |
|---------|----------------------|---------------|------------------------|
| HLS instances | 1 max (only hovered) | Same — per-card lazy | Same — 1 active at a time |
| hls.js bundle | Dynamic import, split | Cached after first hover | Loaded once, reused |
| API token | N/A (hardcoded URLs) | Single guest token, server-side | Token refresh strategy needed |
| Image loading | Next.js Image (unoptimized=true) | Same, CDN URLs | Lazy via `sizes` attribute |
| scroll performance | Native scroll | Same | Same |

---

## Patterns to Follow

### Pattern 1: Server-Fetched, Client-Rendered Shelf

**What:** Page fetches channel data server-side (RSC), passes serializable props to client shelf.
**When:** Channel list changes at most hourly. Guest token is stable.
**Why:** No client-side loading state, no skeleton, instant render. streamUrl must be fetched at runtime (tokens expire), so a two-step approach is needed: channel list at build/request, individual streamUrls fetched lazily on hover.

```typescript
// app/tv/page.tsx (server)
const channels = await getChannels(); // no streamUrl yet
// streamUrl fetched in ChannelCard on hover:
// GET /v2/channels/{id}/stream via Next.js Route Handler (to hide token)
```

### Pattern 2: Route Handler as Token Proxy

**What:** Next.js Route Handler at `app/api/tv/stream/[id]/route.ts` calls 24h.tv with server-side token, returns stream URL.
**When:** CORS blocks direct client requests to 24h.tv API.
**Why:** Keeps access_token off the client. Adds ~50-100ms latency but acceptable for hover-triggered load.

```typescript
// app/api/tv/stream/[id]/route.ts
export async function GET(req, { params }) {
  const token = await getOrRefreshGuestToken(); // cached in memory/KV
  const data = await fetch(`https://api.24h.tv/v2/channels/${params.id}/stream`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return Response.json(await data.json());
}
```

### Pattern 3: Single hls.js Import Per Session

**What:** Dynamic import of hls.js at `startStream()` time; Next.js caches the module.
**When:** Always — never import hls.js at the top of the file.
**Why:** hls.js is ~200KB. Importing statically adds it to the initial bundle. After first hover loads it, subsequent hovers reuse the cached module instantly.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: overflow:hidden on Scroll Container During Hover Expand

**What:** Keeping `overflow-x:auto` (or hidden) on `.tv-shelf__scroll` while trying to expand cards with `transform: scale(1.4)`.
**Why bad:** Browser clips the expanded card at the scroll container boundary. The expansion appears to do nothing or gets clipped.
**Instead:** Use `overflow:visible` with JS scroll (already partially present) or use `position:absolute` overlay approach.

### Anti-Pattern 2: Fetching Stream URL on Page Load

**What:** Calling `GET /v2/channels/{id}/stream` for all channels during SSR or initial client render.
**Why bad:** Creates N concurrent requests (15+ channels), exhausts guest token rate limits, loads HLS manifests for streams nobody watches.
**Instead:** Fetch streamUrl lazily inside `startStream()` only when user actually hovers.

### Anti-Pattern 3: Creating HLS Instance Without Destroying Previous

**What:** Calling `startStream()` without checking/destroying an existing `hlsRef.current`.
**Why bad:** Memory leak — multiple Hls instances attached to the same video element, bandwidth waste.
**Instead:** Always call `stopStream()` before `startStream()`, and check `hlsRef.current` in every code path. Already implemented correctly, must not be regressed.

### Anti-Pattern 4: z-index Without Stacking Context Awareness

**What:** Setting `z-index: 20` on `.channel-card:hover` inside a scroll container that has `position:relative` but a parent with `transform` or `will-change`.
**Why bad:** CSS `transform` creates a new stacking context. If `.tv-shelf__scroll` or `.tv-shelf__slider` has `transform` applied, z-index of children is scoped to that context and cannot overlap outside it.
**Instead:** Ensure the stacking context hierarchy allows the hovered card to appear above siblings and the shelf chrome. Test in all target browsers.

### Anti-Pattern 5: Binding Scroll Events Without Passive Flag

**What:** `el.addEventListener("scroll", handler)` without `{ passive: true }`.
**Why bad:** Blocks the browser's scroll optimization, causes jank.
**Instead:** Always pass `{ passive: true }` for scroll handlers. Already done in both shelf components — must not be removed.

---

## Build Order (Phase Dependencies)

```
1. lib/api/tv.ts
   └── No dependencies. Pure fetch functions.
       Build first — all other phases depend on this.

2. app/api/tv/stream/[id]/route.ts  (if CORS proxy needed)
   └── Depends on: lib/api/tv.ts (token logic)
       Can be deferred if direct client calls work.

3. CSS: expand-on-hover animation
   └── Depends on: nothing (pure CSS change to globals.css)
       Can be built in parallel with API layer.
       Blocks: ChannelCard hover UX validation.

4. ChannelCard (hover expansion + lazy streamUrl fetch)
   └── Depends on: CSS animation (3), API proxy route (2) or direct URL
       Central piece — most work here.

5. TvChannelShelf (responsive cards: 6→5→4→2.5)
   └── Depends on: CSS (3), ChannelCard (4)
       Mostly CSS changes, low risk.

6. ContentShelf (hover on posters, rating badge, styling)
   └── Depends on: CSS (3)
       Independent of video/HLS work.

7. Data wiring: replace static config with API data
   └── Depends on: lib/api/tv.ts (1)
       Connect app/tv/page.tsx and app/page.tsx to live data.

8. Main page integration
   └── Depends on: all above
       Low risk — reuse same components.
```

**Critical path:** 1 → 3 → 4 → 7 → 8

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| CSS expand animation | overflow:hidden clips expanded card | Switch to overflow:visible before implementing scale |
| CSS expand animation | transform-origin: first/last card looks wrong | Use CSS :first-child/:last-child or JS dataset attribute |
| HLS stream fetch | CORS blocks client direct to api.24h.tv | Test first; add Route Handler proxy only if needed |
| HLS stream fetch | Guest token expires during session | Cache token with TTL (expiry - 60s buffer), refresh on 401 |
| API data | /v2/rows/novinki endpoint may not exist | Verify endpoint, have static fallback ready |
| Main page integration | TvSection adds ~200KB (hls.js) to main bundle | hls.js is dynamic import — only loads on first hover, not at page load |
| Responsive cards | 2.5 cards on mobile causes snap issues with overflow:visible | Test scroll-snap removal on mobile, may need overflow-x:auto only on mobile |

---

## Sources

- Codebase analysis: `iflat-redesign/src/components/sections/ChannelCard.tsx` (direct read)
- Codebase analysis: `iflat-redesign/src/components/sections/TvChannelShelf.tsx` (direct read)
- Codebase analysis: `iflat-redesign/src/components/sections/ContentShelf.tsx` (direct read)
- Codebase analysis: `iflat-redesign/src/app/globals.css` (direct read, lines 93-493)
- Project spec: `.planning/PROJECT.md` (direct read)
- Project context: `iflat-redesign/CLAUDE.md` (via system context)
- Confidence: HIGH for existing component structure (read directly), MEDIUM for API endpoint details (based on PROJECT.md spec, not verified against live API)
