# Phase 8: Token & Stream Hardening - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Проактивный refresh токена до истечения (при <25% оставшегося TTL), сохранение `tokenIssuedAt` в persistent cache для корректного расчёта TTL после рестарта, кеширование stream URL на 60s для исключения повторных API-запросов при hover. Все изменения только в `src/lib/tv-token.ts`. Нулевые новые зависимости.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- Структура stream URL кеша (Map vs globalThis singleton)
- TTL stream кеша (60s указано в REQUIREMENTS.md)
- Формат `tokenIssuedAt` в persistent cache (timestamp vs ISO string)
- Логирование cache hit/miss для stream URL
- Поведение при истёкшем stream URL кеше (silent refetch vs force clear)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tokenIssuedAt` поле уже существует в `TvTokenCache` interface (Phase 6)
- `cache.tokenIssuedAt = Date.now()` уже записывается при получении токена
- `PROACTIVE_REFRESH_RATIO = 0.25` уже определена
- Проактивный refresh уже реализован в `getGuestToken()` — фоновое обновление при <25% TTL
- `savePersistentCache()` / `loadPersistentCache()` — механизм persistence

### Established Patterns
- `globalThis.__tvTokenCache` singleton — persistent across hot-reload
- `DataCache<T>` с `inflightPromise` — дедупликация запросов
- `requestQueue` Promise-chain mutex (Phase 6)
- `curlJsonStream` (Phase 7) — обходит requestQueue

### Integration Points
- `PersistentTokenData` interface — нужно добавить `tokenIssuedAt` поле
- `savePersistentCache()` — нужно сохранять `tokenIssuedAt`
- `loadPersistentCache()` — нужно восстанавливать `tokenIssuedAt`
- `getStreamUrl()` — точка для stream URL кеша (перед curlJsonStream вызовом)
- Route Handler `/api/tv/stream/[id]` вызывает `getStreamUrl()`

</code_context>

<specifics>
## Specific Ideas

- `tokenIssuedAt` должен сохраняться в `.tv-token-cache.json` — видно в файле после перезапуска (success criteria Phase 8)
- Stream URL кеш 60s TTL — повторный hover на тот же канал не создаёт нового API-запроса

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-token-stream-hardening*
*Context gathered: 2026-03-12*
