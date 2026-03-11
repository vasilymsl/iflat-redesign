---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: QRATOR Stability Fix
status: planning
stopped_at: null
last_updated: "2026-03-12"
last_activity: 2026-03-12 — Roadmap v1.1 создан, фазы 6–8 определены
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 3
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-12)

**Core value:** При наведении на карточку канала пользователь мгновенно видит живой эфир — это главная фишка, которая должна работать безупречно.
**Current focus:** Phase 6 — Core Rate-Limit Fix (v1.1 start)

## Current Position

Phase: 6 of 8 (v1.1 phases: 6, 7, 8)
Plan: 0 of 1 in current phase
Status: Ready to plan
Last activity: 2026-03-12 — Roadmap v1.1 создан, все 10 требований распределены по фазам 6–8

Progress (v1.1): [░░░░░░░░░░] 0% (0/3 фаз v1.1 завершено)

## Performance Metrics

**Velocity:**
- Total plans completed (v1.1): 0
- v1.0 total: 6 plans за 3 дня

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 6. Core Rate-Limit Fix | TBD | - | - |
| 7. Circuit Breaker + Resilience | TBD | - | - |
| 8. Token & Stream Hardening | TBD | - | - |

*Updated after each plan completion*

## Accumulated Context

### Decisions

- [v1.0]: curl вместо fetch — QRATOR блокирует Node.js по TLS fingerprint (JA3)
- [v1.0]: Persistent token cache (.tv-token-cache.json) — credentials переживают рестарт
- [v1.1]: Promise mutex вместо elapsed-time check — единственный способ гарантировать serialization запросов
- [v1.1]: MAX_RETRIES_STREAM=1 для stream API — интерактивный UX требует быстрый fail, не 14s backoff
- [v1.1]: Все изменения только в src/lib/tv-token.ts — нулевые новые зависимости

### Pending Todos

None.

### Blockers/Concerns

- QRATOR может блокировать по IP (не по rate-limit) — code-fix не поможет. Workaround: manual token injection из браузера в .tv-token-cache.json
- Точные значения задержек (350/500ms) — empirical guess, нет официальной документации 24h.tv rate-limit

## Session Continuity

Last session: 2026-03-12
Stopped at: Roadmap v1.1 создан (фазы 6–8), REQUIREMENTS.md traceability обновлён
Resume file: None
