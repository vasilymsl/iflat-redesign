# Feature Landscape: TV Content Shelves

**Domain:** TV/Streaming content shelves (Netflix/24h.tv style)
**Project:** iFlat TV-шлейфы — brownfield integration into Next.js ISP website
**Researched:** 2026-03-09
**Research basis:** Existing codebase analysis (ChannelCard.tsx, TvChannelShelf.tsx, ContentShelf.tsx, globals.css ~350 lines), PROJECT.md, site analysis, expert knowledge of Netflix/Kinopoisk/24h.tv UX patterns

---

## Table Stakes

Features users expect from a streaming content shelf. Missing = shelf feels broken or unprofessional.

| Feature | Why Expected | Complexity | Current Status | Notes |
|---------|--------------|------------|----------------|-------|
| Hover expand: card grows to ~140% width, overlaps neighbors | Every major streaming platform (Netflix, Kinopoisk, 24h.tv) does this — users are trained to expect it | Med | NOT DONE — current code only does scale(1.05), no neighbor overlap | This is the #1 gap. Requires `position: absolute`, negative margins, z-index management |
| Animated expand with 200ms delay | Prevents accidental triggers when mousing through the shelf | Low | Partial — delay exists in JS (setTimeout 200ms) but CSS transition doesn't match | JS delay for stream start exists, CSS transition delay needs alignment |
| Live video preview on hover (channels) | Main value prop stated in PROJECT.md: "пользователь мгновенно видит живой эфир" | High | Partially done — hls.js code exists, streamUrl present only for 1 channel (Perviy) | HLS tokens from 24h.tv API are the blocker |
| LIVE badge during video playback | Users need to know they're watching live, not a frozen thumbnail | Low | DONE — red pulse dot + "LIVE" text in ChannelCard.tsx | Good implementation |
| Progress bar for current program | Shows how far into a broadcast users are — standard for IPTV | Low | DONE — progress prop exists, 3px bar at card bottom | Good |
| Channel logo in info panel | Brand recognition, looks professional | Low | DONE — 84px logo area in .channel-card__info | Good |
| Current program name | Tells user what's on right now | Low | DONE — channel.currentProgram field displayed | Good |
| Navigation arrows (prev/next) | Without arrows, users don't know they can scroll; discovery problem | Low | DONE — ChevronLeft/ChevronRight, appear on shelf hover, hidden at <768px | Good — arrows fade in on shelf hover |
| Arrows visible only when scrollable | Showing arrows when nothing to scroll is confusing | Low | DONE — canScrollPrev/canScrollNext state | Good |
| Horizontal scroll, hidden scrollbar | Standard scroll UX, visual cleanliness | Low | DONE — scrollbar-width: none | Good |
| scroll-snap per card | Prevents stopping mid-card | Low | DONE — scroll-snap-type: x mandatory on container | Good |
| Responsive card count | 6→5→4→2.5 cards per row based on viewport | Low | DONE — CSS breakpoints for .channel-card and .content-card | All 4 breakpoints present |
| Dark background for shelf section | Streaming shelves live on dark backgrounds; light background kills the cinematic feel | Low | DONE — .tv-section gradient #0a0a0a→#161616 | Good |
| Rating badge on content cards | Kinopoisk/IMDb ratings are table stakes for movie content | Low | DONE — .content-card__rating, color-coded green/yellow/red | Good, but opacity 0 until hover — consider always visible |
| Title + subtitle below poster | Minimum metadata for content identification | Low | DONE — content-card__title + content-card__subtitle | Good |
| "See all" link | Exit ramp to full catalog page | Low | DONE — showAllHref prop on both shelf components | Good |
| Smooth scroll by 3 cards | Scrolling one card at a time is tedious; 3-card jump matches user expectations | Low | DONE — scrollAmount = cardWidth * 3 | Good |
| Image optimization for CDN | Slow poster load = bad UX | Med | DONE for local; CDN images use `unoptimized` prop — acceptable for 24h.tv CDN | next/image handles optimization |
| `muted` + `playsInline` on video | Without these, browsers block autoplay | Low | DONE — both attributes present on <video> element | Correct |

---

## Differentiators

Features that create competitive advantage or match 24h.tv UX specifically.

| Feature | Value Proposition | Complexity | Status | Notes |
|---------|-------------------|------------|--------|-------|
| True 140% card expand with neighbor overlap | The 24h.tv signature interaction — card pushes neighbors aside, doesn't just scale in place. Creates sense of depth. Current scale(1.05) looks amateurish by comparison | High | NOT DONE | Requires absolute positioning during hover, negative margins on neighbors, or translateX on siblings. CSS-only approach preferred (GPU composited). Key challenge: overflow:hidden on parent clips the expanded card — need overflow:visible on scroll container while keeping scroll working |
| Video crossfade: thumbnail→live stream | Smooth transition from static image to live video. Currently jumps abruptly when videoReady fires. Netflix uses a 0.4s crossfade | Med | Partial — opacity transition exists with 0.4s delay, but timing feels abrupt | Code has transition-delay but needs tuning |
| Scroll container overflow fix for expand | The #1 technical pitfall: overflow-x:auto clips overflowing cards. Need padding-based trick or clip-path: none during expand | High | NOT DONE — will clip expanded cards | Critical dependency for the expand effect |
| HLS stream from real 24h.tv API | Currently only 1 channel has a real stream URL (3rd party, not 24h.tv). Real streams require guest token from POST /v2/users | High | NOT DONE — API integration pending | Guest token flow: POST /v2/users {is_guest:true} → access_token → GET /v2/channels/{id}/stream → m3u8 URL |
| Dynamic channel data from API | Currently all channel data is hardcoded in tv-shelves.ts | Med | NOT DONE | GET /v2/channels with Authorization: Bearer {token} |
| Dynamic "Novinki" from API | Currently newReleases array is hardcoded | Med | NOT DONE | GET /row/novinki endpoint on 24h.tv API |
| Content poster hover: scale + show rating | Rating badge currently opacity:0 by default, reveals on hover. This is correct behavior for 2:3 poster cards | Low | DONE but subtly | Rating color coding (green≥7, yellow≥5, red<5) is a nice touch |
| Shelf on home page | Currently shelves only on /tv. PROJECT.md requires them on main page too | Med | NOT DONE | Need to replicate .tv-section on app/page.tsx with same components |
| 24TV logo/branding in shelf header | Shows the partnership, drives users to the full service | Low | DONE — tv-section__header with 24TV logo image | Image path /images/24tv_logo.svg needed |
| Preload strategy for adjacent cards | Preload next card's stream on hover intent (not yet started) to reduce latency | High | NOT DONE — out of scope per PROJECT.md | Mark as stretch goal |

---

## Anti-Features

Features to deliberately NOT build for this project scope.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full video player controls (play/pause/seek/fullscreen) | Complexity explosion, out of scope per PROJECT.md, users should go to 24h.tv for full experience | Preview only — muted, no controls, stops on mouse leave |
| User authentication / 24h.tv login | Full auth flow would require OAuth or redirect, far beyond scope. Risk of session management bugs | Use guest token only (POST /v2/users {is_guest:true}) |
| Client-side stream caching / proxy backend | Adds infrastructure complexity. CDN handles it. Guest token is short-lived anyway | Let hls.js handle buffering; request new token if expired |
| Mobile touch swipe gestures (custom) | Native overflow-x:auto scroll is better on mobile — OS-level momentum, accessibility, no JS weight | Keep native scroll. No swipe library needed |
| Video playback on mobile hover | Hover events don't fire on touchscreens. Touch = intent to navigate, not preview | No video on mobile; show thumbnail + tap → navigate to 24h.tv |
| Infinite scroll / pagination | Adds complexity, and these are curated shelves (not full catalogs) | Fixed number of items from API, "see all" link to 24h.tv |
| Shelf reordering / personalization | Requires user profile, preferences backend — out of scope | Static shelf order: "Бесплатные каналы" then "Новинки" |
| Autoplay on page load | Kills performance (multiple HLS streams), drains battery, annoying for users | Hover-only trigger |
| Multiple simultaneous streams | Only one card should stream at a time. Allow multiple = bandwidth explosion and CPU spike | Cancel previous stream when new hover starts |
| Keyboard-navigable card selection | Would require focus management complexity. Low value for this embed context | Basic button keyboard support on arrows is sufficient |

---

## Feature Dependencies

```
Real HLS streams
  └── Guest token from 24h.tv API (POST /v2/users)
        └── CORS check (may need proxy)
              └── env var: NEXT_PUBLIC_24TV_GUEST_TOKEN or server-side fetch

Dynamic channel data
  └── Guest token (same as above)
        └── GET /v2/channels
              └── Map response to ChannelData interface

Dynamic "Novinki"
  └── Guest token
        └── GET /row/novinki
              └── Map to ContentItem interface

140% card expand effect
  └── overflow:visible on .tv-shelf__scroll (breaks scrollbar)
        └── Alternative: padding trick + clip-path or margin-based expand
              └── Must NOT break scroll-snap behavior

Video crossfade quality
  └── videoReady state (already exists)
        └── Transition timing tuning (opacity + transition-delay)

Shelves on home page
  └── TvChannelShelf and ContentShelf components (already exist)
        └── Same freeChannels + newReleases data (or API)
              └── .tv-section CSS (already exists in globals.css)
```

---

## MVP Recommendation

For this milestone, the minimum viable shelf implementation that matches 24h.tv UX:

**Must have (blocks milestone):**
1. True 140% card expand with neighbor overlap — this is the stated goal in PROJECT.md Active requirements
2. Real HLS streams from 24h.tv API (guest token flow) — stated as Active requirement
3. Shelves on home page — stated as Active requirement

**Should have (milestone quality):**
4. Dynamic channel data from API (not hardcoded)
5. Dynamic "Novinki" from API
6. Rating badge always visible (not hover-only) on content cards — simple CSS fix, better UX
7. Visual polish: fonts, colors, spacing aligned with 24h.tv

**Defer (future milestone):**
- CORS proxy if needed (depends on whether 24h.tv streams block browser requests)
- Preload strategy for adjacent cards
- Server-side token caching (if guest token expires during session)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| 140% expand | `overflow: hidden` on scroll container clips expanded cards. The expand will be invisible | Use padding + `overflow: visible` carefully, or implement via scale with `transform-origin: center left/right` depending on card position. Test: first card expands right, last card expands left |
| 140% expand | `z-index` on expanded card won't work if parent has stacking context | Ensure `.tv-shelf__scroll` has no `z-index` set; set z-index only on .channel-card-inner during hover |
| HLS streams | CORS policy on 24h.tv stream URLs — browser may block cross-origin HLS manifests | Test in browser devtools first. If CORS blocked, need Next.js API route proxy: `/api/stream?url=...` |
| HLS streams | Guest token expiry — tokens may be short-lived (minutes to hours) | Fetch token server-side in Next.js (route handler), cache in memory with TTL, refresh before expiry |
| HLS streams | hls.js bundle size — imports the full library for all shelf visitors | Already using dynamic import (`await import("hls.js")`) — correct approach |
| Shelves on home page | Dark .tv-section breaks page visual flow if placed between light sections | Wrap with a section that has top/bottom gradient fade matching adjacent section colors |
| Video on Safari | Safari uses native HLS (canPlayType check). If `loadedmetadata` fires but play() rejects, stream silently fails | Already handled in ChannelCard.tsx with `.catch(() => {})` — good. Add error state for user feedback |
| 4 channels with logo-as-thumbnail | 4 channels (Россия 1, Россия 24, ТВЦ, СТС) use channel logo as thumbnail preview | When real API data arrives, filter for channels with actual thumbnails, or fallback gracefully |

---

## Sources

- **Codebase analysis** (HIGH confidence): `/src/components/sections/ChannelCard.tsx`, `TvChannelShelf.tsx`, `ContentShelf.tsx`, `globals.css` (~350 lines TV styles), `tv-shelves.ts`
- **PROJECT.md** (HIGH confidence): Requirements, constraints, decisions, out-of-scope list
- **iflat_site_analysis.md** (HIGH confidence): Full site structure and 24TV service context
- **Expert knowledge** (MEDIUM confidence): Netflix, Kinopoisk, 24h.tv UX patterns — overflow-clipping pitfall, one-stream-at-a-time rule, hover delay convention, mobile hover absence
- **No web search available**: WebSearch, WebFetch, Brave Search all unavailable in this environment. Findings based on codebase and domain expertise.
