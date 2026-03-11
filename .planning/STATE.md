---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: QRATOR Stability Fix
status: planning
stopped_at: null
last_updated: "2026-03-12"
last_activity: 2026-03-12 — Milestone v1.1 started
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-12)

**Core value:** При наведении на карточку канала пользователь мгновенно видит живой эфир
**Current focus:** Milestone v1.1 — QRATOR Stability Fix

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-03-12 — Milestone v1.1 started

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-css-expand-architecture P01 | 10min | 1 tasks | 1 files |
| Phase 02-api-layer P01 | 3min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1: CSS expand через `position: absolute` overlay (не layout-изменение width/scale) — избегает scroll-snap конфликта и overflow-clipping одновременно
- Phase 1: `overflow-x: auto; overflow-y: visible` на scroll-контейнере — критично для видимости расширенных карточек
- Phase 2: Singleton promise deduplication для guest token — предотвращает race conditions при concurrent hover
- [Phase 01-css-expand-architecture]: Use width: 140% on .channel-card-inner (not scaleX) to preserve text/logo proportions during hover expansion
- [Phase 01-css-expand-architecture]: isolation: isolate on .tv-shelf__slider — z-index children contained within slider, not competing with header z-50
- [Phase 02-api-layer]: TOKEN_TTL_MS = 90 minutes with 401 auto-retry as reactive fallback for unknown real TTL
- [Phase 02-api-layer]: CHANNEL_ID_MAP uses '??' placeholders — requires manual discovery from GET /v2/channels
- [Phase 02-api-layer]: Silent fail on non-401 errors: null return lets Phase 3 player skip gracefully

### Pending Todos

None yet.

### Blockers/Concerns

- **Phase 2 риск**: CORS-поведение 24h.tv CDN неизвестно — нужна проверка в браузере до написания player-кода; если заблокировано, нужен `/api/stream?url=...` прокси
- **Phase 2 риск**: TTL гостевого токена неизвестен точно (предположительно ~1h), нужно подтвердить
- **Phase 2 риск**: Существование endpoint `/v2/rows/novinki` не подтверждено — есть статический fallback

## Session Continuity

Last session: 2026-03-09T19:17:43.056Z
Stopped at: Completed 02-api-layer-01-PLAN.md
Resume file: None
