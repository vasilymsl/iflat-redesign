---
phase: 01-css-expand-architecture
plan: 01
subsystem: ui
tags: [css, hover, animation, overflow, stacking-context, transition, z-index]

# Dependency graph
requires: []
provides:
  - "CSS architecture for 140% channel card hover expansion"
  - "isolation: isolate stacking context on .tv-shelf__slider"
  - "overflow-y: visible on .tv-shelf__scroll"
  - "z-index hierarchy: card z-1 default, z-20 hover, arrows z-10, header z-50"
  - "transition-delay: 0.2s hover-intent on .channel-card-inner"
affects:
  - "02-css-expand-architecture (Phase 1 Plan 2 — visual verification)"
  - "Phase 2 (HLS player layer depends on channel-card expand foundation)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS width: 140% for card expansion (not scaleX — avoids text/logo distortion)"
    - "isolation: isolate for stacking context containment without numeric z-index on container"
    - "overflow-x: auto + overflow-y: visible combination to allow vertical growth"
    - "scroll-snap-type disabled on desktop, restored via @media (max-width: 767px)"
    - "transition-delay: 0.2s on default state, 0s on hover — hover-intent pattern"

key-files:
  created: []
  modified:
    - "iflat-redesign/src/app/globals.css"

key-decisions:
  - "Use width: 140% on .channel-card-inner (not scaleX) — preserves text/logo proportions"
  - "z-index: 20 on outer .channel-card:hover (not on inner) — inner inherits stacking context from outer"
  - "isolation: isolate on .tv-shelf__slider — z-index children contained within slider, not competing with header z-50"
  - "Remove scroll-snap-type on desktop — JS .scrollBy() handles navigation, snap causes jerk on hover"
  - "Keep overflow: hidden on .channel-card__preview — needed for 16:9 aspect-ratio, only remove from .channel-card-inner"

patterns-established:
  - "Pattern: CSS hover-intent via transition-delay: 0.2s on default state, 0s on hover state"
  - "Pattern: stacking isolation via isolation: isolate instead of high numeric z-index"
  - "Pattern: mobile/desktop CSS differentiation via @media (max-width: 767px) + @media (hover: hover) and (min-width: 768px)"

requirements-completed: [HOVER-01, HOVER-02, HOVER-03, HOVER-04, HOVER-06]

# Metrics
duration: 10min
completed: 2026-03-09
---

# Phase 1 Plan 01: CSS Expand Architecture Summary

**CSS-only 140%-expansion foundation for channel cards: overflow-y visible, isolation isolate, width 140% hover, 200ms transition-delay — build and lint pass, visual verification pending**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-09T18:20:00Z
- **Completed:** 2026-03-09T18:30:02Z
- **Tasks:** 1 of 2 (Task 2 is checkpoint:human-verify — awaiting user)
- **Files modified:** 1

## Accomplishments
- Removed `scroll-snap-type: x mandatory` from desktop `.tv-shelf__scroll` (prevents snap-jerk on hover)
- Added `overflow-y: visible` to `.tv-shelf__scroll` — allows expanded cards to be visible (HOVER-04)
- Added `isolation: isolate` to `.tv-shelf__slider` — stacking context, z-index children isolated from header z-50
- Replaced `transform: scale(1.05)` with `width: 140%` on `.channel-card:hover .channel-card-inner` (HOVER-01)
- Added `z-index: 20` on `.channel-card:hover` outer card — correct stacking (HOVER-01)
- Removed `overflow: hidden` from `.channel-card-inner` — was clipping expansion (HOVER-04)
- Added `transition-delay: 0.2s` for hover-intent delay (HOVER-02)
- Restored `scroll-snap-type` and `scroll-snap-align` in mobile `@media (max-width: 767px)` queries
- Build passes: `npm run build` — success
- Lint passes: `npm run lint` — success

## Task Commits

Each task was committed atomically:

1. **Task 1: CSS-архитектура для 140%-расширения карточек** - `21b1e34` (feat) — in `iflat-redesign/` git repo
2. **Task 2: Визуальная верификация 140%-расширения** - PENDING (checkpoint:human-verify)

## Files Created/Modified
- `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/app/globals.css` — CSS architecture changes for TV shelf expand-on-hover

## Decisions Made
- **width: 140% not scaleX(1.4):** scaleX distorts text and logos; width causes real layout reflow with proper content
- **z-index on outer .channel-card:hover, not on inner:** inner's z-index requires outer to have z-index context. Plain position:relative on inner without z-index on outer doesn't create stacking context
- **isolation: isolate on slider:** isolates child z-indices from competing with header z-50, cleaner than setting numeric z-index on container
- **Remove scroll-snap on desktop:** JS scrollBy() already handles navigation; scroll-snap causes jerk when hover triggers layout recalculations
- **Keep overflow:hidden on .channel-card__preview:** 16:9 padding-bottom trick requires overflow:hidden — only .channel-card-inner had it removed

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- **Git repo structure:** `iflat-redesign/` has its own git repo separate from the planning repo. Commits made to `iflat-redesign` git repo (main branch), not the planning repo. This is correct behavior.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Task 1 CSS complete — ready for visual verification (Task 2)
- After user approves Task 2, Phase 1 Plan 01 is fully complete
- Phase 2 (HLS player) depends on this CSS foundation being confirmed working

## Self-Check: PASSED

- FOUND: `.planning/phases/01-css-expand-architecture/01-01-SUMMARY.md`
- FOUND: `iflat-redesign/src/app/globals.css`
- FOUND: commit `21b1e34` in iflat-redesign repo

---
*Phase: 01-css-expand-architecture*
*Completed: 2026-03-09*
