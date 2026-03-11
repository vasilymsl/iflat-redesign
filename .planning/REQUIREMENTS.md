# Requirements: iFlat TV v1.1 — Rate-Limit Stability Fix

**Defined:** 2026-03-12
**Core Value:** HLS-стримы и расписания каналов стабильно работают, не падая из-за rate-limiting

## v1 Requirements

### Rate-Limiting

- [ ] **RATE-01**: Запросы расписаний каналов идут последовательно с гарантированной паузой ≥350ms между ними
- [ ] **RATE-02**: Race condition на `lastRequestAt` устранён — параллельные вызовы не обходят задержку (Promise-chain mutex)
- [ ] **RATE-03**: Auth-flow (4 шага) выполняется с паузами ≥500ms между шагами

### Resilience

- [ ] **RESIL-01**: Circuit breaker останавливает batch расписаний при 3+ последовательных ошибках
- [ ] **RESIL-02**: Stream-запросы (`/api/tv/stream/[id]`) фейлятся быстро (max 1 retry) — не 14 секунд на hover
- [ ] **RESIL-03**: При недоступности API каналов используется статический fallback из `tv-shelves.ts`

### Token

- [ ] **TOKEN-01**: Проактивное обновление токена при <25% оставшегося TTL
- [ ] **TOKEN-02**: `tokenIssuedAt` сохраняется в persistent cache для корректного расчёта TTL после рестарта

### Performance

- [ ] **PERF-01**: `execSync('sleep')` заменён на async sleep — event loop не блокируется
- [ ] **PERF-02**: Stream URL кешируется на 60s — повторный hover не бьёт API

## Future Requirements

- Миграция с `execSync` curl на `spawn()` с Promise wrapper
- Adaptive delay backoff для schedule batch
- Health-check endpoint `/api/tv/health`

## Out of Scope

| Feature | Reason |
|---------|--------|
| Полноценная очередь с backpressure | Overkill для 15 каналов и 1 сервера |
| Парсинг 429 Retry-After заголовков | curl возвращает JSON, не HTTP-заголовки |
| Redis/distributed rate-limit state | Один Next.js процесс |
| Замена curl на fetch | curl нужен для обхода TLS fingerprinting |
| Client-side schedule fetching | Экспонирует токены |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RATE-01 | — | Pending |
| RATE-02 | — | Pending |
| RATE-03 | — | Pending |
| RESIL-01 | — | Pending |
| RESIL-02 | — | Pending |
| RESIL-03 | — | Pending |
| TOKEN-01 | — | Pending |
| TOKEN-02 | — | Pending |
| PERF-01 | — | Pending |
| PERF-02 | — | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 0
- Unmapped: 10 ⚠️

---
*Requirements defined: 2026-03-12*
