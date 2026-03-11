# Project Research Summary

**Project:** iFlat TV — Rate-Limit Fix (Milestone v1.1)
**Domain:** API client resilience — rate-limited third-party streaming API (24h.tv / QRATOR)
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

Это brownfield-фикс, а не новая фича. Существующий `src/lib/tv-token.ts` (756 строк) уже содержит корректную основу: curl через execSync, retry с exponential backoff, circuit breaker, persistent file cache, proactive token refresh. Проблема не в отсутствии механизмов защиты, а в конкретных дырах реализации: `execSync('sleep')` блокирует Node.js event loop, race condition на `lastRequestAt` позволяет параллельным запросам обойти rate-limiting, а retry политика одинаковая для интерактивных stream-запросов (hover UX) и пакетных schedule-запросов (SSR).

Рекомендованный подход — минимальные хирургические изменения в одном файле без новых зависимостей. Три ключевых изменения: (1) заменить `execSync('sleep')` на `await sleep()` в async контексте, (2) добавить Promise-chain mutex для сериализации всех curl-запросов, (3) добавить раздельные счётчики `consecutiveFailCount` / `totalFailCount` в circuit breaker. Дополнительно: отдельная retry политика для stream API (MAX_RETRIES=1, быстрый fail), фиксация статичного fallback для каналов, сохранение `tokenIssuedAt` в persistent cache.

Главный риск — retry storm: при intermittent QRATOR блокировке 15 каналов × 3 попытки × 14 секунд = возможное зависание SSR на 90+ секунд. Это решается двойным circuit breaker (consecutive + total) и абсолютным timeout на весь batch. Второй риск — execSync блокирует весь Node.js при одновременных hover-запросах; полное решение через spawn() с Promise wrapper является желательным для v1.1 и обязательным при росте трафика.

## Key Findings

### Recommended Stack

Нулевые новые зависимости. Все паттерны реализуются через Node.js built-ins: Promise chaining для mutex, `setTimeout` для async sleep, `spawn` для non-blocking curl. Добавление npm-пакетов типа `bottleneck`, `p-limit`, `p-queue` — over-engineering для одного API-клиента с одним процессом.

**Core technologies:**
- `Promise chain mutex` (built-in) — сериализация curl-запросов, устранение race condition на `lastRequestAt`
- `async sleep` через `setTimeout` (built-in) — замена блокирующего `execSync('sleep')`, освобождает event loop
- `child_process.spawn` (built-in) — non-blocking curl для stream-запросов (желательно Phase 4)
- Именованные константы для delay/retry — `CIRCUIT_BREAKER_THRESHOLD`, `SCHEDULE_DELAY_MS` вместо hardcoded значений

**What NOT to use:**
- `bottleneck`, `p-limit`, `p-queue` — npm-пакеты для задачи решаемой 8 строками JS
- Node.js `fetch` вместо curl — curl используется специально для обхода QRATOR TLS fingerprinting (JA3)
- `Promise.all` для schedule batch — 15 параллельных запросов триггерят rate-limit

### Expected Features

**Must have (минимальный фикс — блокирует milestone):**
- Guaranteed inter-request spacing через Promise mutex — убирает race condition на `lastRequestAt`
- Убрать `execSync('sleep')` из `curlJsonSync` — async sleep только в `curlJson` (async контекст)
- Двойной circuit breaker (`consecutiveFailCount` + `totalFailCount`) — защита от retry storm
- Статичный fallback каналов — если API вернул пустой массив, использовать `STATIC_CHANNELS` из `tv-shelves.ts`

**Should have (надёжность):**
- Stream URL cache (60s TTL) — предотвращает повторные запросы при быстром hover/unhover
- `SCHEDULE_DELAY_MS = 500ms` отдельная константа — 350ms может быть слишком агрессивно
- `tokenIssuedAt` в persistent cache — proactive refresh не работает после рестарта без этого
- Отдельная retry политика для stream requests (MAX_RETRIES=1, быстрый fail для UX)
- Абсолютный timeout на весь `fetchCurrentPrograms` batch (8 секунд)

**Defer (v1.2+):**
- `spawn()` вместо `execSync` — полное решение event loop блокировки, значительный рефакторинг
- Adaptive delay backoff — только если 500ms fixed delay недостаточно
- Health check endpoint `/api/tv/health` — debug tool
- Concurrency limit N=2 для schedule — только если sequential слишком медленно в production

### Architecture Approach

Трёхслойная защита rate-limiting уже архитектурно правильная: Layer 1 (`curlJson` — inter-request spacing), Layer 2 (auth steps — `DELAY_AUTH_STEP_MS`), Layer 3 (`fetchCurrentPrograms` — circuit breaker). Проблема не в архитектуре слоёв, а в реализации Layer 1: async sleep без mutex не создаёт взаимоисключение, а `execSync('sleep')` — блокирующий паразит. Все исправления локальные — только `src/lib/tv-token.ts`.

**Major components:**
1. `curlJsonSync()` — sync curl через execSync; sleep убирается (паузы только в async curlJson через mutex)
2. `curlJson()` + `requestQueue` mutex — единственная точка rate-limiting для всех API-вызовов
3. `fetchCurrentPrograms()` — sequential loop с двойным circuit breaker (consecutive + total fail counts) + абсолютный timeout
4. `getStreamUrl()` — отдельная retry политика (MAX_RETRIES=1, быстрый fail для интерактивного UX)
5. Persistent cache (`PersistentTokenData`) — добавить `tokenIssuedAt` для восстановления proactive refresh после рестарта

### Critical Pitfalls

1. **Race condition на `lastRequestAt`** — два async вызова `curlJson` читают `lastRequestAt` до того как первый его обновил. Оба проходят проверку `elapsed < DELAY` и уходят почти одновременно. Решение: Promise-chain mutex (`requestQueue`), не elapsed-time check.

2. **Retry storm при intermittent блокировке** — если QRATOR пропускает каждый второй запрос, `consecutiveFailCount` сбрасывается на успехах. Все 15 каналов получают полный backoff (2s + 4s + 8s = 14s каждый). 15 × 14s = 210 секунд максимум. Решение: `totalFailCount >= 5` как второй триггер + абсолютный timeout.

3. **`execSync` блокирует event loop** — `execSync('sleep 0.35')` в `curlJsonSync` замораживает весь Node.js thread. При 15 schedule-запросах = 5.25s суммарной блокировки. При параллельных hover-запросах — весь сайт freezes. Решение: убрать sleep из `curlJsonSync`, async sleep только в `curlJson` через mutex.

4. **Stream requests с 14-секундным backoff** — пользователь убрал курсор, сервер ждёт 14 секунд прежде чем вернуть ошибку. Решение: `MAX_RETRIES_STREAM = 1` или AbortSignal timeout 3s для stream API route.

5. **Proactive refresh нефункционален после рестарта** — `tokenIssuedAt` не сохраняется в `.tv-token-cache.json`. После загрузки из файла `tokenIssuedAt = 0`, `totalTtl` огромный, условие `remaining < totalTtl * 0.25` никогда не срабатывает до самого истечения токена. Решение: добавить `tokenIssuedAt` в `PersistentTokenData`.

## Implications for Roadmap

Исследование показывает компактный scope с чёткой приоритизацией. Три обязательные фазы плюс одна опциональная. Все изменения в одном файле `src/lib/tv-token.ts`.

### Phase 1: Core Rate-Limit Fix
**Rationale:** Устраняет root cause — race condition и blocking sleep. Без этого остальные улучшения не имеют смысла и могут маскировать проблему.
**Delivers:** Promise mutex (`requestQueue`) в `curlJson`, убирается `execSync('sleep')` из `curlJsonSync`, `SCHEDULE_DELAY_MS = 500ms` как отдельная константа
**Addresses:** Must-have (guaranteed inter-request spacing, mutex)
**Avoids:** Pitfall 1 (race condition на `lastRequestAt`), Pitfall 3 (event loop blocking)

### Phase 2: Circuit Breaker Hardening
**Rationale:** Защищает от worst-case scenario (retry storm при intermittent блокировке). Зависит от Phase 1 mutex для корректного поведения.
**Delivers:** Двойной счётчик (`consecutiveFailCount` + `totalFailCount`), именованная константа `CIRCUIT_BREAKER_THRESHOLD = 3`, лог при срабатывании, абсолютный timeout 8s на весь batch
**Addresses:** Must-have (circuit breaker verification), Should-have (totalFailCount)
**Avoids:** Pitfall 2 (retry storm)

### Phase 3: Stream UX + Token Resilience
**Rationale:** Улучшение интерактивного UX и надёжности после рестартов. Независимо от Phase 1/2 по коду, но логично после основного фикса как validation.
**Delivers:** `MAX_RETRIES_STREAM = 1` для `getStreamUrl`, stream URL cache 60s TTL, `tokenIssuedAt` в persistent cache, статичный fallback каналов из `tv-shelves.ts`
**Addresses:** Should-have (stream cache, fast fail, tokenIssuedAt, static fallback)
**Avoids:** Pitfall 5 (stream timeout UX), Pitfall 3 (proactive refresh после рестарта)

### Phase 4: Event Loop Cleanup (optional)
**Rationale:** Полное решение execSync блокировки — замена на `spawn()` с Promise wrapper. Значительный рефакторинг, нужен только если Phase 1-3 недостаточны при росте параллельных hover-запросов.
**Delivers:** `curlJsonAsync` через `child_process.spawn`, non-blocking curl для всех API-вызовов
**Uses:** Node.js `child_process.spawn` (no new deps)
**Avoids:** Pitfall 5 (execSync blocking under concurrent stream requests)

### Phase Ordering Rationale

- Phase 1 первая: Promise mutex — фундамент, без него rate-limiting ненадёжен независимо от других улучшений
- Phase 2 после Phase 1: circuit breaker с двойным счётчиком работает корректно только при сериализованных запросах
- Phase 3 независима от Phase 1/2 по коду, но логически следует после — validation что core fix работает
- Phase 4 опциональная: значительный рефакторинг, откладывается до подтверждения необходимости при реальном трафике
- Все изменения в одном файле минимизируют риск regression в других компонентах

### Research Flags

Фазы с хорошо известными паттернами (дополнительный research не нужен):
- **Phase 1:** Promise chain mutex — стандартный JavaScript паттерн, хорошо документирован в MDN
- **Phase 2:** Circuit breaker с dual counter — established pattern (Netflix Hystrix / resilience4j)
- **Phase 3:** Stream TTL cache и persistent cache — тривиальная реализация

Фазы, требующие проверки при реализации:
- **Phase 1:** Точные значения задержек (350 → 500ms) — нет официальной документации rate-limit 24h.tv API. Начать с 500ms, скорректировать по наблюдениям за логами.
- **Phase 4:** Поведение `spawn()` при QRATOR — нужно подтверждение что spawn не меняет TLS fingerprint по сравнению с execSync curl.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Прямой анализ кода + Node.js documented behaviour (execSync blocks event loop) |
| Features | HIGH | Анализ tv-token.ts + PROJECT.md, конкретные проблемы идентифицированы в коде |
| Architecture | HIGH | Полный read tv-token.ts (756 строк), все компоненты описаны конкретно |
| Pitfalls | HIGH | Node.js event loop behaviour well-established, все pitfalls найдены в реальном коде |

**Overall confidence:** HIGH

### Gaps to Address

- **Точные значения rate-limit задержек** — нет официальной документации 24h.tv API. 350ms → 500ms — educated guess. Нужна эмпирическая проверка: мониторить логи на ошибки после деплоя Phase 1.
- **QRATOR поведение при IP блокировке** — неизвестно сколько длится блокировка и при каком количестве запросов триггерится. Если блокировка IP-уровня, code-fix не поможет (только manual token injection из браузера — задокументировано в MEMORY.md).
- **Proactive refresh после рестарта** — после добавления `tokenIssuedAt` в persistent cache нужна проверка: рестартнуть сервер и убедиться что в логах появляется `[tv-token] Proactive token refresh` через ~67 минут после получения токена.

## Sources

### Primary (HIGH confidence)
- `src/lib/tv-token.ts` (756 строк) — полная инспекция кода, все находки прямые
- `src/app/api/tv/stream/[id]/route.ts` (41 строка) — полная инспекция
- `.planning/PROJECT.md` — цели milestone v1.1, out-of-scope ограничения
- Node.js docs — `execSync` блокирует event loop (well-established, training data)

### Secondary (MEDIUM confidence)
- Domain expertise — Promise concurrency patterns, circuit breaker design
- MDN Web Docs — Promise chaining, event loop macrotask queue
- Netflix Hystrix / resilience4j patterns — dual failure counter circuit breaker

### Tertiary (inference — нужна валидация)
- Точные delay-значения (350/500ms) — нет официальной документации 24h.tv rate-limit
- Продолжительность QRATOR IP-блокировки — неизвестна, только empirical observation

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
