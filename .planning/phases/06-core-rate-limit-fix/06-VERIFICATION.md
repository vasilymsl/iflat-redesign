---
phase: 06-core-rate-limit-fix
verified: 2026-03-12T00:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 6: Core Rate-Limit Fix — Verification Report

**Phase Goal:** Запросы к 24h.tv API сериализованы через Promise mutex — race condition устранён, event loop не блокируется
**Verified:** 2026-03-12
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                                    | Status     | Evidence                                                                                          |
|----|----------------------------------------------------------------------------------------------------------|------------|---------------------------------------------------------------------------------------------------|
| 1  | При одновременном наведении на карточки запросы к API идут последовательно — QRATOR не получает burst   | VERIFIED   | `requestQueue` mutex: каждый вызов `curlJson` синхронно захватывает слот до первого `await` (строка 258), затем ждёт предыдущего (`await waitForPrev`, строка 261) |
| 2  | В логах видна пауза между curl-запросами (>=350ms для обычных, >=500ms для auth)                        | VERIFIED   | `await sleep(DELAY_BETWEEN_REQUESTS_MS)` (строка 264, 350ms) внутри mutex; `await sleep(DELAY_AUTH_STEP_MS)` (строки 312, 329, 351, 402, 429, 504, 500ms) между шагами auth |
| 3  | Node.js event loop не блокируется — страница остаётся отзывчивой при hover-запросах                     | VERIFIED   | `grep -c "execSync.*sleep"` = 0. `execSync` используется только для curl (строка 239). Все паузы через `await sleep()` (Promise/setTimeout), не `execSync('sleep')` |
| 4  | Авторизация проходит без 429 ошибок при первом запуске сервера                                          | VERIFIED   | Auth flow (`fetchNewGuestToken`) использует `curlJson` который сериализован через mutex + имеет `await sleep(DELAY_AUTH_STEP_MS)` между шагами 1→2→3→4 |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact                                    | Provides                                           | Status    | Details                                                                 |
|---------------------------------------------|----------------------------------------------------|-----------|-------------------------------------------------------------------------|
| `iflat-redesign/src/lib/tv-token.ts`        | Promise-chain mutex для сериализации запросов      | VERIFIED  | Файл существует, 758 строк, содержит `requestQueue`, не содержит `lastRequestAt` или `execSync.*sleep` |

**Artifact levels:**
- Level 1 (exists): файл существует
- Level 2 (substantive): 758 строк реальной логики, не заглушка
- Level 3 (wired): является единственным модулем для работы с API 24h.tv, используется в `getStreamUrl`, `getChannels`, `getNovinki`, `fetchCurrentPrograms`

---

### Key Link Verification

| From          | To              | Via                                                             | Status   | Details                                                                                                              |
|---------------|-----------------|-----------------------------------------------------------------|----------|----------------------------------------------------------------------------------------------------------------------|
| `curlJson()`  | `requestQueue`  | Promise-chain mutex — синхронное присвоение до первого `await` | WIRED    | Строки 256-258: `const waitForPrev = requestQueue; requestQueue = new Promise<void>(resolve => { releaseSlot = resolve; });` — ДО первого `await` |
| `curlJson()`  | `curlJsonSync()`| вызов curl только после `await sleep` в захваченном слоте mutex | WIRED    | Строки 261, 264, 269: `await waitForPrev` → `await sleep(DELAY_BETWEEN_REQUESTS_MS)` → `curlJsonSync()`             |

**Key link correctness:**
- Присвоение `requestQueue = new Promise(...)` на строке 258 выполняется синхронно, до `await waitForPrev` на строке 261. Race condition невозможен — новый вызов `curlJson` всегда видит актуальный `requestQueue`.
- `releaseSlot()` вызывается на строке 270 (успех) и строке 274 (последний retry). Deadlock невозможен.

---

### Requirements Coverage

| Requirement | Описание                                                                            | Status    | Evidence                                                                                      |
|-------------|-------------------------------------------------------------------------------------|-----------|-----------------------------------------------------------------------------------------------|
| RATE-01     | Запросы расписаний каналов идут последовательно с гарантированной паузой ≥350ms    | SATISFIED | `await sleep(DELAY_BETWEEN_REQUESTS_MS)` (350ms) в mutex до каждого `curlJsonSync()` (строка 264) |
| RATE-02     | Race condition на `lastRequestAt` устранён — Promise-chain mutex                   | SATISFIED | `grep -c "lastRequestAt"` = 0. `requestQueue` mutex на строках 33, 256-258, 261              |
| RATE-03     | Auth-flow (4 шага) выполняется с паузами ≥500ms между шагами                       | SATISFIED | `await sleep(DELAY_AUTH_STEP_MS)` (500ms) на строках 312, 329, 351 в `fetchNewGuestToken()`  |
| PERF-01     | `execSync('sleep')` заменён на async sleep — event loop не блокируется             | SATISFIED | `grep -c "execSync.*sleep"` = 0. Все паузы через `await sleep()` (setTimeout-based)          |

Все 4 требования, заявленные в плане, закрыты.

**Orphaned requirements check:** REQUIREMENTS.md сопоставляет RATE-01, RATE-02, RATE-03, PERF-01 с Phase 6 — все покрыты планом 06-01.

---

### Anti-Patterns Found

| File                                      | Line | Pattern | Severity | Impact |
|-------------------------------------------|------|---------|----------|--------|
| `iflat-redesign/src/lib/tv-token.ts`      | —    | Нет     | —        | —      |

Сканирование: TODO/FIXME/HACK — 0; `return null` заглушки — нет (только `return null` как валидный ответ при ошибке stream); `console.log` only — нет (только информационные логи рядом с реальной логикой).

---

### Human Verification Required

#### 1. Реальная сериализация под нагрузкой

**Test:** Запустить dev-сервер, навести курсор быстро на 5-6 карточек каналов подряд.
**Expected:** В логах сервера запросы к API 24h.tv появляются с интервалом ~350ms, не одновременно.
**Why human:** Программно нельзя воспроизвести параллельные hover-события в браузере без запуска сервера.

#### 2. Отсутствие 429 при первом запуске

**Test:** Удалить `.tv-token-cache.json`, перезапустить сервер, открыть главную страницу.
**Expected:** Auth flow завершается успешно (4 шага), токен кешируется, каналы загружаются без ошибок 429.
**Why human:** QRATOR rate-limit зависит от реального IP и состояния внешнего сервиса.

---

### Gaps Summary

Gaps не обнаружены. Все автоматически проверяемые must-haves подтверждены в коде.

---

## Commit Verification

Коммит `57df4ba` ("feat(06-01): Promise-chain mutex в curlJson + убрать execSync sleep из curlJsonSync") существует в git-истории `iflat-redesign/`. Изменён 1 файл: `src/lib/tv-token.ts` (+676/-95 строк).

---

_Verified: 2026-03-12_
_Verifier: Claude (gsd-verifier)_
