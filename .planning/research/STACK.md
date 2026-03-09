# Technology Stack

**Project:** iFlat TV Shelves — HLS Preview on Hover
**Researched:** 2026-03-09
**Confidence:** HIGH (based on existing codebase + package.json audit)

---

## Context: Brownfield, Not Greenfield

The stack is largely **already installed**. This document prescribes which parts of the installed stack to USE for the TV shelf feature, what is MISSING, and what NOT to introduce. Decisions are grounded in `package.json`, the existing component code, and the architectural constraints in `PROJECT.md`.

---

## Installed Stack Audit

```
next:             16.1.6  (App Router, Turbopack) — USE
react:            19.2.3                           — USE
typescript:       ^5                               — USE
tailwindcss:      ^4      (CSS-first, @theme)      — USE for spacing/utilities only
hls.js:           ^1.6.15                          — USE (already in ChannelCard)
framer-motion:    ^12.34.5                         — DO NOT USE for hover card expansion
embla-carousel-react: ^8.6.0                       — DO NOT USE (scroll-snap is simpler)
lucide-react:     ^0.577.0                         — USE for shelf arrows only
clsx / tailwind-merge: installed                  — USE via cn() util
```

No SWR, no React Query, no Zustand — not installed.

---

## Recommended Stack by Feature Area

### 1. HLS Video Streaming

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| hls.js | ^1.6.15 (installed) | MSE-based HLS for Chrome/Firefox | HIGH |
| Native `<video>` | Browser built-in | HLS for Safari via `canPlayType` | HIGH |
| AbortController | Web API | Cancellation of in-flight stream load | HIGH |

**Why hls.js and NOT video.js:**
`hls.js` is 80 KB gzipped vs ~450 KB for video.js. The project only needs HLS preview playback — no player controls, no playlist UI, no plugins. The existing `ChannelCard.tsx` already implements the correct pattern: dynamic `import("hls.js")` inside `startStream()`, guarded by `Hls.isSupported()` and AbortController. This is correct and must not be replaced.

**Configuration for preview-only mode (keep buffer tiny):**
```typescript
const hls = new Hls({
  maxBufferLength: 3,       // 3s buffer — fast start, low RAM
  maxMaxBufferLength: 5,    // hard cap
  startLevel: -1,           // auto quality selection
  enableWorker: true,       // offload MSE work to worker thread
});
```

**Why dynamic import is mandatory:**
hls.js uses `window` / `document` at import time. In Next.js App Router, components run on server during SSR even when marked `"use client"` for the initial render. Dynamic import defers the module to browser-only execution, preventing `ReferenceError: window is not defined`.

---

### 2. CSS Hover Expansion Animation (Netflix-style 140%)

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| Plain CSS transitions | Browser built-in | Card expand 140% width | HIGH |
| CSS `transform: scaleX()` + negative margins | Browser built-in | Overlap neighboring cards | HIGH |
| CSS custom properties | Browser built-in | Parameterize scale factor | HIGH |

**Why CSS and NOT Framer Motion:**
Framer Motion is installed but is wrong for this animation because:
1. It uses JS-driven `requestAnimationFrame` loops, adding JS thread work during hover
2. CSS `transform` with `will-change: transform` is handled 100% on the GPU compositor thread — zero JS cost
3. The "overlap neighbors" pattern requires `position: relative` + `z-index` + negative margins. Framer Motion `layout` animations would recalculate layout on every frame (expensive with 6+ cards)

**The correct CSS pattern for 140% expand with neighbor overlap:**

The current code uses `scale(1.05)` which is wrong because:
- `scale()` scales both X and Y equally
- It does not expand the card's layout footprint — neighbors don't move apart
- The card appears to float over neighbors but the row height stays compressed

The correct approach is **width expansion via CSS**, NOT scale:

```css
/* Shelf scroll container must NOT clip overflow */
.tv-shelf__scroll {
  overflow-x: auto;
  overflow-y: visible;   /* CRITICAL: allow card to expand upward/downward */
}

/* Channel card base */
.channel-card {
  position: relative;
  flex: 0 0 var(--card-base-width);   /* exact px, not calc% */
  min-width: var(--card-base-width);
  transition: none;
}

/* The inner element does the expanding */
.channel-card-inner {
  width: 100%;
  transition: width 0.25s ease-out, transform 0.25s ease-out, box-shadow 0.25s ease-out;
  transition-delay: 0.2s;  /* 200ms hover intent delay */
}

@media (hover: hover) and (min-width: 768px) {
  .channel-card:hover .channel-card-inner {
    width: 140%;           /* expand inner to 140% of card slot */
    transform: translateY(-8px);   /* lift slightly */
    z-index: 20;
    position: relative;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
    transition-delay: 0s;
  }
}
```

**Why `width: 140%` on inner element instead of `scaleX(1.4)`:**
- `scaleX(1.4)` stretches the content including text — ugly
- `width: 140%` reflows the inner content to the new width — correct
- The outer `.channel-card` keeps its original flex width, so neighbors don't jump

**The z-index stacking context trap to avoid:**
The `.tv-shelf__scroll` container must NOT have `overflow: hidden` or it will clip the expanded card. The current CSS has `overflow-x: auto` — which creates a stacking context on some browsers. The fix: set `overflow-y: visible` explicitly (some browsers require both to be set).

---

### 3. API Integration (24h.tv)

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| Next.js Route Handlers | Built-in (16.1.6) | Proxy API calls to 24h.tv, hide tokens | HIGH |
| `fetch` with `next: { revalidate }` | React 19 built-in | Server-side data fetching with ISR | HIGH |
| In-memory token cache (module scope) | No library needed | Store guest access_token server-side | HIGH |

**Why a server-side API proxy is mandatory:**
1. The 24h.tv `access_token` must never appear in the browser — it would be visible in DevTools
2. The 24h.tv API may have CORS restrictions (`Access-Control-Allow-Origin` not set to `*`) — `PROJECT.md` explicitly flags this
3. Next.js Route Handlers run on the server and can add auth headers transparently to the client

**API proxy architecture (no extra libraries):**

```
Browser Component
  → GET /api/24tv/channels          (Next.js Route Handler)
      → POST https://api.24h.tv/v2/users { is_guest: true }  (get token, cache 1h)
      → GET  https://api.24h.tv/v2/channels (Bearer token)
      → return sanitized channel list

Browser Component
  → GET /api/24tv/stream?id=123     (Next.js Route Handler)
      → GET  https://api.24h.tv/v2/channels/123/stream (Bearer token)
      → return { url: "https://..." }
```

**Token caching — module-level variable, NOT a database:**
```typescript
// src/app/api/24tv/_token.ts
let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getGuestToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch("https://api.24h.tv/v2/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_guest: true }),
  });
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + 55 * 60 * 1000; // 55 min (token likely valid 1h)
  return cachedToken!;
}
```

This works because Next.js server processes are long-lived in development and on Vercel (within the same invocation window). No Redis, no database needed.

**Why NOT SWR or React Query for API calls:**
- Neither is installed — adding them for 2 API endpoints is not justified
- Next.js App Router's `fetch` with `revalidate` handles ISR caching natively
- Channel data changes slowly (current program updates every ~30 min) — `revalidate: 300` is sufficient
- Stream URLs are fetched on hover (client-side) — a simple `fetch` wrapper in the component is sufficient

---

### 4. Responsive Card Layout

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| CSS custom properties | Browser built-in | Card count per breakpoint | HIGH |
| CSS `calc()` | Browser built-in | Card width from container | HIGH |

**Responsive card counts (from PROJECT.md):**

| Breakpoint | Cards visible | Formula |
|------------|--------------|---------|
| ≥1280px | 6 | `calc((100% - 10px * 5) / 6)` |
| 1024-1279px | 5 | `calc((100% - 10px * 4) / 5)` |
| 768-1023px | 4 | `calc((100% - 10px * 3) / 4)` |
| <768px | 2.5 | `calc((100% - 8px * 1.5) / 2.5)` |

This is already implemented. The 2.5 cards on mobile is intentional — the partial card signals that scrolling is possible (a standard streaming platform pattern).

---

### 5. State Management for Hover

No state library needed. The existing pattern in `ChannelCard.tsx` is correct:

```typescript
const [isHovered, setIsHovered] = useState(false);
const [videoReady, setVideoReady] = useState(false);
const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

- `isHovered`: drives CSS class that triggers the animation
- `videoReady`: drives video opacity fade-in AFTER stream starts playing
- `hoverTimerRef`: implements the 200ms hover intent delay (prevents flash on mouse-over)

**Why this is correct:**
- State is local to each card — no global store needed
- The 200ms delay (`setTimeout` in `handleMouseEnter`) prevents starting HLS loads when the user is just moving the mouse across the shelf
- `AbortController` ensures that if the user un-hovers before the stream starts, the HLS instance is not created at all

---

## What NOT to Use

| Library | Why Avoid |
|---------|-----------|
| **Framer Motion** (for hover card) | GPU-composite CSS is faster; Framer Motion layout animations are expensive for 6+ cards; already mis-used in current `scale(1.05)` pattern |
| **Embla Carousel** | Installed but overkill. Native `overflow-x: auto` + `scroll-snap-type: x mandatory` + `scroll-behavior: smooth` handles everything needed. Embla adds JS overhead and event conflicts with the hover expand animation |
| **SWR / React Query** | Not installed, not justified for 2 endpoints. Next.js fetch with revalidate covers server-side. Client-side stream URLs need only a bare `fetch()` |
| **video.js** | 450 KB bundle for something `hls.js` (80 KB) already does |
| **Zustand / Jotai** | No shared state between cards — local `useState` is correct |
| **CSS Modules** | The project uses global CSS classes (`.channel-card`, `.tv-shelf`). Mixing CSS Modules would create naming inconsistency. Stick with globals |

---

## Installation Delta

No new packages are needed. The entire feature is buildable from the installed stack:

```bash
# Nothing to install. All dependencies are present:
# hls.js@1.6.15      ✓ installed
# next@16.1.6        ✓ installed (Route Handlers available)
# react@19.2.3       ✓ installed
# typescript@5       ✓ installed
# tailwindcss@4      ✓ installed
# lucide-react       ✓ installed
```

---

## Key Constraints That Affect Implementation

1. **`overflow-y: visible` on shelf container** — mandatory for card expansion to not be clipped. Current CSS has `overflow-x: auto` which implicitly makes `overflow-y: auto` in some browsers (W3C spec). Explicit `overflow-y: visible` must be set.

2. **`"use client"` boundary** — `ChannelCard` must remain a client component (uses refs, effects, state). `TvChannelShelf` also needs `"use client"` (scroll state). Server Components can render the shelf wrapper and pass static props.

3. **`dynamic import` for hls.js is non-negotiable** — see above. Do not change to top-level import.

4. **CORS for stream URLs** — stream URLs from `/api/24tv/stream?id=X` will be HLS manifests (`.m3u8`). The browser fetches these directly from 24h.tv CDN (not through the proxy — video data goes direct). CDN URLs may not have CORS issues; the API auth call does. Validate this early.

5. **SSL in dev** — `PROJECT.md` notes `strict-ssl false` in current network. This affects npm install only, not runtime fetch calls.

---

## Sources

- `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/package.json` — installed versions (HIGH confidence)
- `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/components/sections/ChannelCard.tsx` — existing implementation (HIGH confidence)
- `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/app/globals.css` — existing CSS patterns (HIGH confidence)
- `/Users/vasilymaslovsky/Desktop/redesign/.planning/PROJECT.md` — constraints, decisions, API spec (HIGH confidence)
- hls.js GitHub README (training data, MEDIUM confidence) — maxBufferLength config options
- MDN Web Docs (training data, HIGH confidence) — CSS overflow stacking context behavior
- W3C CSS Overflow spec (training data, HIGH confidence) — overflow-x:auto implies overflow-y:auto rule
