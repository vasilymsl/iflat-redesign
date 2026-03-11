# Phase 6: Core Rate-Limit Fix - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Сериализация запросов к API 24h.tv через Promise mutex: устранение race condition на `lastRequestAt`, замена `execSync('sleep')` на async sleep, именованные константы задержек. Все изменения только в `src/lib/tv-token.ts`. Нулевые новые зависимости.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- Тайминги и настройки: 350ms/500ms хардкод vs env/конфиг
- Поведение очереди при множественных concurrent запросах
- Уровень логирования rate-limit поведения
- Стратегия миграции execSync sleep → async sleep (полное удаление curlJsonSync или сохранение для fallback)
- Детали реализации Promise mutex (простая цепочка vs Semaphore-паттерн)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sleep()` async функция уже существует (строка 28-30)
- `curlJson()` async обёртка уже есть (строка 260-286) — использует curlJsonSync внутри
- Константы `DELAY_BETWEEN_REQUESTS_MS`, `DELAY_AUTH_STEP_MS` уже определены (строки 23-24)

### Established Patterns
- Singleton кеш через `globalThis.__tvTokenCache` — promise deduplication для токена уже работает
- `DataCache<T>` с `inflightPromise` — дедупликация для каналов и новинок
- Auth flow (fetchNewGuestToken, reloginWithCachedCredentials) уже async с await sleep между шагами

### Integration Points
- `curlJsonSync` вызывается из `curlJson` — можно заменить вызов внутри, не меняя внешний API
- `lastRequestAt` — единственная точка race condition (глобальная переменная, проверяется без mutex)
- `fetchCurrentPrograms` — batch запросов расписаний, уже последовательный (for-of), но rate-limit через curlJson ненадёжен
- Route Handler `/api/tv/stream/[id]` — вызывает `getStreamUrl()` → `curlJson()`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-core-rate-limit-fix*
*Context gathered: 2026-03-12*
