---
phase: 07-circuit-breaker-resilience
verified: 2026-03-12T00:30:00Z
status: passed
score: 3/3 must-haves verified
---

# Phase 7: Circuit Breaker & Resilience Verification Report

**Phase Goal:** Пакетные запросы расписаний защищены от retry storm, при недоступности API сайт работает со статическими данными
**Verified:** 2026-03-12T00:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | После 3 последовательных ошибок расписаний batch останавливается — в логах видно 'circuit breaker OPEN' | VERIFIED | `recordScheduleFailure()` проверяет `consecutiveFailCount >= SCHEDULE_CB_CONSECUTIVE_THRESHOLD` (3) и логирует `[tv-token] Schedule circuit breaker OPEN: ...`. `fetchCurrentPrograms` вызывает `isScheduleCBOpen()` до получения токена и внутри цикла по каналам. |
| 2 | При hover на канал и недоступности stream API ответ приходит за <=5s (не 14s) | VERIFIED | `getStreamUrl` использует `curlJsonStream` (синхронный, curl `-m 5`, `MAX_RETRIES_STREAM=1`) вместо `curlJson` (15s timeout, 3 retries, очередь). Оба вызова в функции заменены — `await` убран. |
| 3 | Если API каналов вернул пустой массив, шлейфы показывают статические каналы из tv-shelves.ts | VERIFIED | `getChannels()` содержит блок `if (channels.length === 0)` (строка 762), который возвращает `freeChannels.map(...)` с полями id/name/logo/currentProgram/thumbnail (без progress). `freeChannels` импортирован из `@/config/tv-shelves` (строка 18). |

**Score:** 3/3 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `iflat-redesign/src/lib/tv-token.ts` | Circuit breaker state, curlJsonStream, static fallback | VERIFIED | Файл существует. Содержит `SCHEDULE_CB_CONSECUTIVE_THRESHOLD` (строка 30), `MAX_RETRIES_STREAM` (строка 34), `ScheduleCBState` интерфейс, `globalThis.__tvScheduleCB`, все 4 CB-функции, `curlJsonStream`, импорт `freeChannels`. |
| `iflat-redesign/src/lib/tv-token.ts` | Fast-fail stream function | VERIFIED | `curlJsonStream()` определена на строке 359. Использует `STREAM_CURL_TIMEOUT_SEC=5`, `MAX_RETRIES_STREAM=1`, обходит `requestQueue`. |
| `iflat-redesign/src/lib/tv-token.ts` | Static channel fallback | VERIFIED | `freeChannels` импортирован (строка 18). Используется в `getChannels` при `channels.length === 0` (строки 762–771). |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `fetchCurrentPrograms` | `globalThis.__tvScheduleCB` | `isScheduleCBOpen` / `recordScheduleSuccess` / `recordScheduleFailure` | WIRED | Проверка CB до получения токена (строка 669), внутри цикла (строка 680), `recordScheduleSuccess()` при успехе (строка 701), `recordScheduleFailure()` при ошибке (строка 704). Локальный `failCount` удалён. |
| `getStreamUrl` | `curlJsonStream` | fast-fail stream request bypassing requestQueue | WIRED | Оба вызова в `getStreamUrl` используют `curlJsonStream(...)` без `await` (строки 592 и 603). `curlJson` в этой функции не используется. |
| `getChannels` | `freeChannels` из `tv-shelves.ts` | fallback when channels.length === 0 | WIRED | Блок `if (channels.length === 0)` возвращает `freeChannels.map(ch => ({ id, name, logo, currentProgram, thumbnail }))` (строки 762–771). |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| RESIL-01 | 07-01-PLAN.md | Circuit breaker останавливает batch расписаний при 3+ последовательных ошибках | SATISFIED | `SCHEDULE_CB_CONSECUTIVE_THRESHOLD=3`, `globalThis.__tvScheduleCB`, `recordScheduleFailure/Success`, оба check в `fetchCurrentPrograms` реализованы и связаны. |
| RESIL-02 | 07-01-PLAN.md | Stream-запросы фейлятся быстро (max 1 retry) — не 14 секунд на hover | SATISFIED | `curlJsonStream` с `curl -m 5`, `MAX_RETRIES_STREAM=1`, bypass `requestQueue`. Оба вызова в `getStreamUrl` используют её. |
| RESIL-03 | 07-01-PLAN.md | При недоступности API каналов используется статический fallback из tv-shelves.ts | SATISFIED | `if (channels.length === 0)` в `getChannels` возвращает `freeChannels` из `@/config/tv-shelves`. |

**Orphaned requirements check:** Только RESIL-01, RESIL-02, RESIL-03 маппированы на Phase 7 в REQUIREMENTS.md. Все три покрыты планом 07-01. Orphaned requirements: нет.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tv-token.ts` | 354–357 | JSDoc note: execSync блокирует event loop | Info | Документированное known limitation. curlJsonStream синхронная — acknowledged trade-off до spawn() миграции (Future Requirement). Не блокирует цель фазы. |

Нет: пустых реализаций, TODO/FIXME, return null/return {} без обоснования, console.log-only обработчиков.

---

### Human Verification Required

#### 1. Circuit Breaker срабатывает в реальных условиях

**Test:** Поднять сервер, заблокировать доступ к `api.24h.tv` (hosts или iptables). Открыть страницу TV. Наблюдать в логах сервера.
**Expected:** После 3 ошибок расписаний появляется сообщение `[tv-token] Schedule circuit breaker OPEN: 3 consecutive failures`. Последующие запросы страницы показывают `Schedule circuit breaker is OPEN, skipping batch` без новых запросов к API.
**Why human:** Требует реальной сетевой блокировки и наблюдения за серверными логами.

#### 2. Stream hover время отклика при недоступном API

**Test:** Заблокировать `api.24h.tv`. Навести мышь на канал на странице TV.
**Expected:** Ответ (ошибка) приходит максимум за 7 секунд (5s curl timeout + 2s buffer), а не 14+ секунд.
**Why human:** Требует таймера в реальных условиях и сетевой блокировки.

#### 3. Static fallback отображается на UI

**Test:** Сымитировать пустой ответ API (или заблокировать API до первого кеша). Открыть главную или страницу TV.
**Expected:** Шлейфы каналов показывают статические каналы из tv-shelves.ts (Первый канал, Россия-1, МАТЧ!, ...).
**Why human:** Требует контроля сетевого ответа и визуальной проверки UI.

---

### Build Verification

TypeScript check: `npx tsc --noEmit` — прошёл без ошибок.

Commit history:
- `8daac57` — добавлены CB state, curlJsonStream, константы (97 строк добавлено)
- `2ba8188` — подключены CB в fetchCurrentPrograms, curlJsonStream в getStreamUrl, fallback в getChannels (25 добавлено, 11 удалено)

Оба коммита существуют и подтверждены в iflat-redesign репозитории.

---

## Gaps Summary

Gaps не обнаружены. Все три observable truths подтверждены на трёх уровнях:
- **Существование:** все артефакты присутствуют в файле
- **Содержательность:** реализации не являются заглушками — содержат полную логику CB с threshold/cooldown, синхронный curlJsonStream с timeout, полный mapping freeChannels
- **Подключение:** все key links активно используются в целевых функциях (fetchCurrentPrograms, getStreamUrl, getChannels)

Требования RESIL-01, RESIL-02, RESIL-03 выполнены. Orphaned requirements отсутствуют.

---

_Verified: 2026-03-12T00:30:00Z_
_Verifier: Claude (gsd-verifier)_
