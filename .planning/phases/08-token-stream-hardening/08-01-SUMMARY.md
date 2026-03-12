---
phase: 08-token-stream-hardening
plan: 01
subsystem: tv-token
tags: [token, cache, stream, performance, persistence]
dependency_graph:
  requires: []
  provides: [tokenIssuedAt-persistence, stream-url-cache-60s]
  affects: [src/lib/tv-token.ts, .tv-token-cache.json]
tech_stack:
  added: []
  patterns: [globalThis-singleton, Map-cache-with-ttl]
key_files:
  modified:
    - iflat-redesign/src/lib/tv-token.ts
decisions:
  - "tokenIssuedAt сохраняется в PersistentTokenData — корректный proactive refresh ratio после рестарта сервера"
  - "streamUrlCache хранится в globalThis.__tvTokenCache.streamUrlCache (Map) — переживает Next.js hot-reload"
  - "fallback tokenIssuedAt = Date.now() при отсутствии поля в старом cache-файле — обратная совместимость"
metrics:
  duration: "~10 min"
  completed: "2026-03-12"
  tasks_completed: 2
  files_modified: 1
requirements: [TOKEN-01, TOKEN-02, PERF-02]
---

# Phase 8 Plan 01: Token & Stream Hardening Summary

**One-liner:** tokenIssuedAt persistence в .tv-token-cache.json + stream URL кеш 60s TTL в globalThis singleton

## What Was Built

### Task 1: tokenIssuedAt в PersistentTokenData + восстановление при загрузке

Три изменения в `src/lib/tv-token.ts`:

1. `PersistentTokenData` interface — добавлено поле `tokenIssuedAt: number`
2. `savePersistentCache()` — записывает `tokenIssuedAt: cache.tokenIssuedAt` в JSON-файл
3. Инициализация singleton — `tokenIssuedAt: persisted.tokenIssuedAt ?? Date.now()` (fallback для старых cache-файлов без поля)

Proactive refresh ratio уже корректно вычислялся через `tokenIssuedAt` (Phase 6), но после рестарта `tokenIssuedAt` сбрасывался в `0`, что делало знаменатель огромным. Теперь восстанавливается из файла.

### Task 2: Stream URL кеш 60s TTL в getStreamUrl()

Изменения:

1. Константа `STREAM_URL_CACHE_TTL_MS = 60_000`
2. Interface `StreamUrlEntry { url: string; expiresAt: number }`
3. Поле `streamUrlCache: Map<string, StreamUrlEntry>` добавлено в `TvTokenCache` interface
4. Singleton инициализируется с `streamUrlCache: new Map()`
5. В `getStreamUrl()` — cache lookup перед `curlJsonStream`:
   - hit: возвращает `cached.url` с логом `[tv-token] Stream URL cache hit: {channelId}`
   - miss: логирует `[tv-token] Stream URL cache miss, fetching: {channelId}`, выполняет запрос, сохраняет в Map с TTL
6. Результат сохраняется также при 401-retry успешном получении

## Deviations from Plan

None — план выполнен точно как написано. Оба task реализованы в одном коммите, т.к. затрагивают один файл.

## Success Criteria Verification

1. `.tv-token-cache.json` будет содержать поле `tokenIssuedAt` после первого получения токена — DONE (`savePersistentCache()` записывает)
2. Повторный hover на канал в течение 60s → лог `[tv-token] Stream URL cache hit` — DONE (Map-кеш реализован)
3. `npm run build` — зелёный — DONE (build прошёл без ошибок)
4. Proactive refresh ratio через `(expiresAt - Date.now()) / (expiresAt - tokenIssuedAt)` — DONE (уже корректно, теперь `tokenIssuedAt` восстанавливается)

## Commits

| Hash | Message |
|------|---------|
| 79f4dd3 | feat(08-01): add tokenIssuedAt to PersistentTokenData + restore on load |

## Self-Check: PASSED

- iflat-redesign/src/lib/tv-token.ts: modified and committed (79f4dd3)
- npm run build: passed (all routes compiled)
