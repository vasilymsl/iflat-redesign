# Phase 2: API Layer - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Серверный слой для взаимодействия с API 24h.tv: получение гостевого токена, кеширование с автообновлением, проксирование stream-запросов. Токен никогда не попадает в браузер. Фаза не включает клиентскую интеграцию (Phase 3) и динамические данные каналов (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Proxy-стратегия
- Начать с URL-only: Route Handler возвращает HLS-manifest URL, клиент (hls.js) сам fetch'ит
- Если CORS заблокирует стримы — добавить full proxy endpoint (`/api/tv/proxy?url=...`) как fallback
- Исследовать CORS-поведение 24h.tv CDN в ресерче перед финальным решением

### Fallback при ошибке API
- Silent fail: карточки показывают thumbnail без видео, пользователь не видит ошибку
- API endpoint возвращает JSON с ошибкой (для Phase 3 — клиент просто не запускает плеер)
- Логирование ошибок server-side для мониторинга

### Кеш-стратегия
- Агрессивный кеш токена (refreshить только когда TTL истечёт или API вернёт 401)
- Singleton promise deduplication — concurrent hover не создаёт дублей
- TTL гостевого токена определить в research (~1h предположительно)

### Claude's Discretion
- Структура эндпоинтов (один route vs несколько)
- Формат JSON-ответов
- Rate limiting стратегия
- Конкретная реализация singleton deduplication
- Retry logic при временных ошибках API

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- NextResponse pattern: 3 Route Handler'а уже существуют (/api/connect, /api/support, /api/director) — используют `NextResponse.json()` с try/catch
- Static channel data: `src/config/tv-shelves.ts` — 15 каналов с id, name, logo, thumbnail, streamUrl — может использоваться как fallback mapping (id → данные)

### Established Patterns
- Route Handlers: `export async function POST(request: Request)` + `NextResponse.json()` + error catch
- Нет существующего паттерна для server-side кеширования или API-клиентов
- Нет hooks или lib утилит для data fetching

### Integration Points
- `ChannelCard.tsx` ожидает `streamUrl` в `ChannelData` — Phase 3 будет вызывать Route Handler и передавать URL
- `tv-shelves.ts` содержит ID каналов — Route Handler будет маппить id на 24h.tv channel id
- `iflat-redesign/src/app/api/tv/` — новая директория для TV-эндпоинтов

</code_context>

<specifics>
## Specific Ideas

- API 24h.tv: `POST /v2/users { is_guest: true }` → получить access_token
- Каналы: `GET /v2/channels` с токеном
- Стримы: `GET /v2/channels/{id}/stream` с токеном
- CDN: `cdn.media.24h.tv` — изображения работают без авторизации
- Один streamUrl в tv-shelves.ts уже есть (Первый канал) — `edge1.1internet.tv` — возможно публичный

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-api-layer*
*Context gathered: 2026-03-09*
