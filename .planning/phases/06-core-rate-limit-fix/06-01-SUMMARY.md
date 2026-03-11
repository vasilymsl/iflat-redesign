---
phase: 06-core-rate-limit-fix
plan: 01
subsystem: api
tags: [promise-mutex, rate-limiting, curl, execSync, tv-token, 24h.tv, QRATOR]

# Dependency graph
requires:
  - phase: 05-visual-polish
    provides: "Полностью реализованный tv-token.ts с curl-based API клиентом"
provides:
  - "Promise-chain mutex requestQueue сериализует все запросы к 24h.tv API"
  - "execSync('sleep') полностью удалён — event loop не блокируется при hover"
  - "lastRequestAt race condition переменная удалена"
  - "curlJsonSync: чистый curl-исполнитель без rate-limit логики"
  - "curlJson: async оркестратор очереди с await sleep + retry"
affects: [07-circuit-breaker-resilience, 08-token-stream-hardening]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Promise-chain mutex: requestQueue = new Promise; синхронное присвоение ДО первого await"
    - "Retry внутри захваченного слота mutex — не внешний re-queue"
    - "releaseSlot() в каждом пути выхода (success + final throw) —防止 deadlock"

key-files:
  created: []
  modified:
    - "iflat-redesign/src/lib/tv-token.ts"

key-decisions:
  - "Promise-chain mutex (requestQueue) вместо elapsed-time check (lastRequestAt) — единственный способ устранить race condition"
  - "Retry-логика остаётся ВНУТРИ захваченного слота mutex — при ошибке задерживаем очередь, не даём параллельным запросам пройти"
  - "execSync('sleep') полностью удалён из curlJsonSync, заменён на await sleep() в curlJson — event loop свободен"
  - "Присвоение requestQueue = new Promise() синхронно до первого await — критично для корректного захвата слота"

patterns-established:
  - "Promise mutex: const waitForPrev = requestQueue; requestQueue = new Promise(resolve => { releaseSlot = resolve; })"
  - "releaseSlot() вызывается при каждом пути выхода из curlJson (успех и последний retry)"

requirements-completed: [RATE-01, RATE-02, RATE-03, PERF-01]

# Metrics
duration: 2min
completed: 2026-03-12
---

# Phase 6 Plan 01: Core Rate-Limit Fix Summary

**Promise-chain mutex в curlJson устраняет race condition на lastRequestAt и заменяет execSync('sleep') на async sleep — event loop остаётся отзывчивым при параллельных hover-запросах к 24h.tv API**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-12T00:57:02Z
- **Completed:** 2026-03-12T00:59:51Z
- **Tasks:** 2/2
- **Files modified:** 1

## Accomplishments
- Удалена переменная `lastRequestAt` — race condition невозможен (RATE-02)
- Добавлен `requestQueue: Promise<void>` mutex — все вызовы curlJson строго сериализованы (RATE-01)
- `curlJsonSync` очищен: убраны execSync sleep и lastRequestAt = Date.now() (PERF-01)
- `curlJson` переписан с Promise-chain mutex: синхронный захват слота до любого await, await waitForPrev, await sleep(350ms), retry внутри слота (RATE-01)
- Auth flow сохраняет паузы через существующие await sleep(DELAY_AUTH_STEP_MS) (RATE-03)
- TypeScript, build, lint — все проходят без ошибок

## Task Commits

Каждая задача зафиксирована атомарно:

1. **Task 1: Promise-chain mutex + убрать execSync sleep** - `57df4ba` (feat)
2. **Task 2: Верификация build/lint/grep** - нет отдельного коммита (только проверка, файлы не изменены)

## Files Created/Modified
- `iflat-redesign/src/lib/tv-token.ts` - Promise-chain mutex в curlJson, очищен curlJsonSync, удалена lastRequestAt

## Decisions Made
- Promise-chain mutex вместо elapsed-time check: присвоение `requestQueue = new Promise(...)` синхронно, до первого `await` — это ключевое условие корректности
- `releaseSlot()` вызывается в каждом пути выхода: при успехе и при последнем throw — предотвращает deadlock
- Retry остаётся внутри захваченного слота: при ошибке API лучше задержать очередь, не давая параллельным запросам пройти к упавшему сервису

## Deviations from Plan

None — план выполнен точно по спецификации.

## Issues Encountered

- `git add iflat-redesign/src/lib/tv-token.ts` из корневого репозитория не сработал — оказалось, `iflat-redesign/` имеет собственный git-репозиторий. Коммит выполнен внутри `iflat-redesign/`.

## User Setup Required

None — изменения только в коде, внешняя конфигурация не требуется.

## Next Phase Readiness

- Phase 6 завершена: core rate-limit fix реализован
- Phase 7 (Circuit Breaker + Resilience): готово к старту. tv-token.ts теперь имеет правильный mutex-фундамент для добавления circuit breaker паттерна
- Открытый вопрос: точные значения задержек (350/500ms) — эмпирические, без официального SLA от 24h.tv

## Self-Check: PASSED

- SUMMARY.md exists at `.planning/phases/06-core-rate-limit-fix/06-01-SUMMARY.md`
- Task 1 commit `57df4ba` found in git history

---

*Phase: 06-core-rate-limit-fix*
*Completed: 2026-03-12*
