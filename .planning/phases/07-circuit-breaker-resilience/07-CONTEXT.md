# Phase 7: Circuit Breaker + Resilience - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Двойной circuit breaker для batch-запросов расписаний (consecutiveFailCount + totalFailCount), ограничение retry для stream API (MAX_RETRIES_STREAM=1), статический fallback каналов при недоступности API. Все изменения только в `src/lib/tv-token.ts` и связанных файлах. Нулевые новые зависимости.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- Пороги circuit breaker (consecutiveFailCount=3, totalFailCount — значения на усмотрение Claude)
- Стратегия recovery circuit breaker (half-open, timeout, cooldown)
- Формат логирования срабатывания circuit breaker
- Интеграция static fallback — где именно вставлять fallback из tv-shelves.ts (в getChannels или выше)
- MAX_RETRIES_STREAM=1 vs отдельная переменная retry для stream
- Таймаут stream-запроса (текущий curl `-m 15` → уменьшить для hover UX)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `requestQueue` Promise-chain mutex (Phase 6) — все запросы уже сериализованы
- `curlJson` с retry и `sleep()` — базовая retry-инфраструктура
- `fetchCurrentPrograms` уже имеет `failCount >= 3` break — начальная форма circuit breaker (строки 576-579)
- Static data: `src/config/tv-shelves.ts` — 15 каналов с id, name, logo, thumbnail, streamUrl

### Established Patterns
- Singleton кеш через `globalThis.__tvTokenCache` — можно расширить для circuit breaker state
- `DataCache<T>` с `inflightPromise` — дедупликация запросов
- Retry с exponential backoff внутри mutex — retry ВНУТРИ слота

### Integration Points
- `getChannels()` → `fetchChannelsFromApi()` — точка для fallback на static data
- `getStreamUrl()` — точка для уменьшения retry до 1
- `fetchCurrentPrograms()` — точка для усиления circuit breaker
- Route Handler `/api/tv/stream/[id]` вызывает `getStreamUrl()`

</code_context>

<specifics>
## Specific Ideas

- MAX_RETRIES_STREAM=1 — решено в STATE.md: "интерактивный UX требует быстрый fail, не 14s backoff"
- Текущий `failCount >= 3` в `fetchCurrentPrograms` — усилить до полноценного circuit breaker с totalFailCount

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-circuit-breaker-resilience*
*Context gathered: 2026-03-12*
