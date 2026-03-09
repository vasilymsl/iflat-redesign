# Phase 02: API Layer - Research

**Researched:** 2026-03-09
**Domain:** Next.js Route Handlers, server-side in-memory caching, token lifecycle management, 24h.tv API proxy
**Confidence:** HIGH (Next.js patterns) / MEDIUM (24h.tv API specifics — reverse-engineered, no official docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Proxy-стратегия
- Начать с URL-only: Route Handler возвращает HLS-manifest URL, клиент (hls.js) сам fetch'ит
- Если CORS заблокирует стримы — добавить full proxy endpoint (`/api/tv/proxy?url=...`) как fallback
- Исследовать CORS-поведение 24h.tv CDN в ресерче перед финальным решением

#### Fallback при ошибке API
- Silent fail: карточки показывают thumbnail без видео, пользователь не видит ошибку
- API endpoint возвращает JSON с ошибкой (для Phase 3 — клиент просто не запускает плеер)
- Логирование ошибок server-side для мониторинга

#### Кеш-стратегия
- Агрессивный кеш токена (refreshить только когда TTL истечёт или API вернёт 401)
- Singleton promise deduplication — concurrent hover не создаёт дублей
- TTL гостевого токена определить в research (~1h предположительно)

### Claude's Discretion
- Структура эндпоинтов (один route vs несколько)
- Формат JSON-ответов
- Rate limiting стратегия
- Конкретная реализация singleton deduplication
- Retry logic при временных ошибках API

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HLS-01 | Next.js Route Handler получает гостевой токен 24h.tv (POST /v2/users с is_guest:true) | globalThis singleton pattern + fetch to 24h.tv API |
| HLS-02 | Токен кешируется на сервере с автообновлением по TTL | Module-level cache object with `expiresAt` timestamp + promise deduplication |
</phase_requirements>

---

## Summary

Фаза реализует серверный слой для безопасной работы с API 24h.tv: получение гостевого токена, его кеширование в памяти сервера с автообновлением, и проксирование stream-запросов. Токен никогда не покидает сервер — клиент получает только URL или данные.

Ключевая техническая проблема — singleton в Next.js. В hot-reload режиме модульные переменные переинициализируются при каждом изменении файла. Официально рекомендованное решение — хранить состояние в `globalThis`, что гарантирует единственный экземпляр кеша в рамках одного процесса Node.js. Для Vercel/serverless это означает per-instance кеш (каждый cold start начинает с пустого кеша) — для guest token это приемлемо, т.к. токен дешевле получить заново, чем усложнять архитектуру Redis.

CORS для 24h.tv CDN (`cdn.media.24h.tv`) неизвестен заранее. CDN изображений уже работает без авторизации (иначе картинки на сайте не отображались бы). HLS-стримы — отдельный вопрос: большинство CDN для HLS требуют явно настроенных CORS-заголовков. Принятая стратегия — сначала URL-only, fallback proxy если CORS заблокирует.

**Primary recommendation:** Реализовать `src/lib/tv-token.ts` как singleton TokenManager с `globalThis` guard, promise deduplication, TTL ~1h (90 мин с запасом). Route Handler `/api/tv/stream/[id]/route.ts` использует TokenManager и маппит id из `tv-shelves.ts` на channel endpoint.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/server` (NextResponse) | 16.1.6 (встроен) | Route Handler HTTP responses | Уже используется в /api/connect, /api/director, /api/support |
| Node.js `fetch` | встроен в Node 18+ | HTTP-запросы к 24h.tv API | Next.js 16 работает на Node 18+, native fetch без доп. зависимостей |
| TypeScript | ^5 (в проекте) | Типизация TokenManager, ответов | Уже используется |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `globalThis` pattern | нет пакета | Singleton guard при hot-reload | ВСЕГДА для server-side state в Next.js App Router |
| `.env.local` | нет пакета | Хранение `TV_API_BASE_URL` | Если URL 24h.tv API нужно менять без деплоя |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| globalThis singleton | Redis/Upstash | Redis нужен для multi-instance/serverless; для dev + single instance излишне |
| globalThis singleton | `unstable_cache` (Next.js) | `unstable_cache` для fetch; для нашего случая (POST + auth) не подходит |
| In-memory TTL | `node-cache` npm | Доп. зависимость не нужна — TTL легко реализовать на `Date.now()` |

**Installation:** Новые зависимости не требуются — всё доступно из существующего стека.

---

## Architecture Patterns

### Recommended Project Structure
```
iflat-redesign/src/
├── lib/
│   ├── tv-token.ts          # TokenManager singleton (globalThis)
│   └── email.ts             # (уже существует)
└── app/
    └── api/
        └── tv/
            └── stream/
                └── [id]/
                    └── route.ts  # GET /api/tv/stream/:id
```

### Pattern 1: globalThis Singleton для Token Cache

**Что:** Хранение состояния токена в `globalThis` гарантирует единственный экземпляр данных при hot-reload в dev режиме, когда webpack пересоздаёт модули.

**Когда использовать:** ВСЕГДА для server-side state в Next.js App Router (confirmed by official Next.js discussions #68572).

**Example:**
```typescript
// Source: https://github.com/vercel/next.js/discussions/68572 (community consensus)
// iflat-redesign/src/lib/tv-token.ts

interface TokenCache {
  token: string | null;
  expiresAt: number;      // Unix timestamp ms
  inflightPromise: Promise<string> | null;
}

// globalThis guard — выживает при hot-reload
declare global {
  // eslint-disable-next-line no-var
  var __tvTokenCache: TokenCache | undefined;
}

if (!globalThis.__tvTokenCache) {
  globalThis.__tvTokenCache = {
    token: null,
    expiresAt: 0,
    inflightPromise: null,
  };
}

const cache = globalThis.__tvTokenCache;
```

### Pattern 2: Promise Deduplication (Singleton Inflight)

**Что:** При конкурентных запросах (несколько hover одновременно) только один POST /v2/users вызывается — остальные ждут тот же Promise.

**Когда использовать:** Обязательно при кешировании с async refresh — предотвращает thundering herd.

**Example:**
```typescript
// Source: community pattern, verified against Node.js Promise semantics
async function getToken(): Promise<string> {
  const now = Date.now();

  // 1. Есть валидный кеш — сразу отдаём
  if (cache.token && now < cache.expiresAt) {
    return cache.token;
  }

  // 2. Уже есть inflight запрос — ждём его (deduplication)
  if (cache.inflightPromise) {
    return cache.inflightPromise;
  }

  // 3. Создаём новый запрос и сохраняем Promise
  cache.inflightPromise = fetchGuestToken().finally(() => {
    cache.inflightPromise = null;
  });

  return cache.inflightPromise;
}
```

### Pattern 3: Route Handler с Dynamic Params (Next.js 15+)

**Что:** В Next.js 15+ (и 16) `params` — это Promise, его нужно await'ить.

**Когда использовать:** Все Route Handlers с `[id]` или любым dynamic segment.

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route (official docs, v16.1.6)
// iflat-redesign/src/app/api/tv/stream/[id]/route.ts

import { NextResponse } from "next/server";
import { getStreamUrl } from "@/lib/tv-token";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const streamUrl = await getStreamUrl(id);

    if (!streamUrl) {
      return NextResponse.json(
        { error: "Channel not found or stream unavailable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ streamUrl });
  } catch (error) {
    console.error("[API /tv/stream]", error);
    return NextResponse.json(
      { error: "Failed to fetch stream URL" },
      { status: 500 }
    );
  }
}
```

### Pattern 4: TTL + 401 Refresh

**Что:** Токен инвалидируется проактивно по TTL и реактивно при получении 401 от API.

**Example:**
```typescript
// TTL ~90 минут (с 30-минутным запасом на случай clock skew)
const TOKEN_TTL_MS = 90 * 60 * 1000;

async function fetchGuestToken(): Promise<string> {
  const response = await fetch("https://api.24h.tv/v2/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_guest: true }),
  });

  if (!response.ok) {
    throw new Error(`24h.tv auth failed: ${response.status}`);
  }

  const data = await response.json();
  const token = data.access_token as string;

  cache.token = token;
  cache.expiresAt = Date.now() + TOKEN_TTL_MS;

  return token;
}

// При 401 от stream endpoint — сбрасываем кеш и повторяем
async function getStreamUrl(channelId: string): Promise<string | null> {
  const token = await getToken();
  const resp = await fetch(`https://api.24h.tv/v2/channels/${channelId}/stream`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (resp.status === 401) {
    // Инвалидируем кеш и делаем один retry
    cache.token = null;
    cache.expiresAt = 0;
    const freshToken = await getToken();
    const retryResp = await fetch(`https://api.24h.tv/v2/channels/${channelId}/stream`, {
      headers: { Authorization: `Bearer ${freshToken}` },
    });
    if (!retryResp.ok) return null;
    const retryData = await retryResp.json();
    return retryData.url ?? null;
  }

  if (!resp.ok) return null;
  const data = await resp.json();
  return data.url ?? null;
}
```

### Pattern 5: Channel ID Mapping

**Что:** `tv-shelves.ts` содержит наши internal id (например `"perviy"`), API 24h.tv, возможно, использует числовые id. Нужна таблица маппинга.

**Example:**
```typescript
// В src/lib/tv-token.ts или отдельном src/lib/tv-channels.ts
const CHANNEL_ID_MAP: Record<string, string> = {
  perviy: "1",       // Первый канал
  russia1: "2",      // Россия 1
  match: "3",        // МАТЧ!
  ntv: "4",          // НТВ
  // ... etc
};

function resolveApiChannelId(internalId: string): string | null {
  return CHANNEL_ID_MAP[internalId] ?? null;
}
```

**ВАЖНО:** Числовые id каналов 24h.tv неизвестны заранее — их нужно получить из `/v2/channels` с токеном при первом запуске или заполнить маппинг вручную по результату. Это должно быть первой задачей при имплементации.

### Anti-Patterns to Avoid

- **Хранить токен в module-level без globalThis:** Переинициализируется при hot-reload в dev, создаёт множество токен-запросов. Использовать ТОЛЬКО `globalThis.__tvTokenCache`.
- **Хранить токен в куках или localStorage:** Токен должен оставаться на сервере. Route Handler — единственная точка доступа.
- **`export const dynamic = 'force-static'`:** Route Handler с авторизацией не может быть статическим — не использовать.
- **`NextResponse.redirect()` вместо JSON:** Phase 3 ожидает JSON с `streamUrl`, не редирект.
- **TTL = Infinity:** Guest token имеет конечное время жизни. Всегда устанавливать expiresAt.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP клиент с retry | Custom fetch wrapper с backoff | Native `fetch` + one retry on 401 | Для 2 endpoint'ов своя реализация избыточна |
| Persistence кеша | File-based cache, DB | globalThis in-memory | Guest token дешевый — пересоздать при cold start дешевле, чем персистировать |
| Защита от race conditions | Mutex библиотека | Promise deduplication через `inflightPromise` | Один Promise в Node.js — встроенный механизм deduplication |
| URL validation | zod/regex | Просто проверить `typeof url === 'string' && url.startsWith('https://')` | Overkill для этой задачи |

**Key insight:** Guest token — эфемерный артефакт. Не нужно его персистировать между процессами — это усложнение без пользы для данного usecase.

---

## Common Pitfalls

### Pitfall 1: params не await'нут (Next.js 15+)

**Что идёт не так:** `params.id` вместо `(await params).id` — TypeScript не всегда поймает, runtime выдаст Promise object вместо строки.

**Почему:** В Next.js 15 (changelog v15.0.0-RC) `context.params` стал Promise. Проект на Next.js 16.1.6 — это правило применимо.

**Как избежать:** ВСЕГДА `const { id } = await params` в Route Handlers.

**Warning signs:** `id` имеет значение `[object Promise]` в логах.

### Pitfall 2: Module-level singleton без globalThis в Next.js

**Что идёт не так:** Сохранение токена в `let cachedToken = null` на уровне модуля — при каждом hot-reload переменная сбрасывается, генерируются сотни токен-запросов в dev.

**Почему:** Webpack пересобирает модули при изменении файлов, создавая новые экземпляры. `globalThis` переживает пересборку.

**Как избежать:** `globalThis.__tvTokenCache = globalThis.__tvTokenCache || { token: null, ... }`

**Warning signs:** Console показывает повторные `POST /v2/users` при каждом изменении файла.

### Pitfall 3: TTL гостевого токена

**Что идёт не так:** TTL неизвестен точно (нет официальной документации). Если установить слишком маленький — избыточные запросы. Слишком большой — 401 при устаревшем токене.

**Почему:** API 24h.tv не имеет публичной документации; TTL нужно определить эмпирически.

**Как избежать:** Установить 90 минут как начальное значение. Реализовать 401-triggered refresh как fallback. После первого запуска в prod — проверить реальный TTL из JWT-токена (если он JWT-формата) или логов.

**Warning signs:** Регулярные 401 ошибки в логах через ~60 минут.

### Pitfall 4: CORS при URL-only стратегии

**Что идёт не так:** hls.js в браузере запрашивает m3u8 с CDN 24h.tv — браузер блокирует запрос из-за отсутствия CORS-заголовков.

**Почему:** Большинство CDN не разрешают кросс-доменные запросы из браузера для HLS-манифестов, если CDN не настроен для embeddable использования.

**Как избежать:** Phase 2 реализует только URL-возврат. Тестирование CORS — первый шаг Phase 3 (до написания hls.js кода). Если `cdn.media.24h.tv` блокирует — добавить `/api/tv/proxy?url=...` endpoint.

**Warning signs:** Браузер выдаёт `Access to fetch at 'https://...' has been blocked by CORS policy`.

### Pitfall 5: Channel ID маппинг неизвестен

**Что идёт не так:** Internal id в `tv-shelves.ts` (`"perviy"`, `"russia1"`) не совпадают с 24h.tv API id.

**Почему:** Нет официальной документации по маппингу.

**Как избежать:** Первая задача в Phase 2 — вызвать `GET /v2/channels` с токеном, получить список каналов с id и именами, составить маппинг. Без этого маппинга Stream endpoint работать не будет.

**Warning signs:** 404 от `/v2/channels/{id}/stream`.

---

## Code Examples

Verified patterns from official sources:

### Dynamic Route Handler (Next.js 16.1.6 — официальная документация)

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
// app/items/[slug]/route.ts

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params // 'a', 'b', or 'c'
}
```

### globalThis Singleton Guard

```typescript
// Source: https://github.com/vercel/next.js/discussions/68572
// Canonical approach recommended by Next.js community

declare global {
  var __myCache: SomeType | undefined;
}

globalThis.__myCache = globalThis.__myCache || initializeCache();
export const cache = globalThis.__myCache;
```

### NextResponse.json() Pattern (из существующих Route Handlers проекта)

```typescript
// Source: /api/connect/route.ts (существующий код проекта)
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // ... logic
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /endpoint]", error);
    return NextResponse.json(
      { error: "Ошибка." },
      { status: 500 }
    );
  }
}
```

### Полная реализация Token Manager

```typescript
// Source: паттерны из Next.js docs + community best practices
// iflat-redesign/src/lib/tv-token.ts

const TV_API_BASE = "https://api.24h.tv";
const TOKEN_TTL_MS = 90 * 60 * 1000; // 90 минут

interface TvTokenCache {
  token: string | null;
  expiresAt: number;
  inflightPromise: Promise<string> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __tvTokenCache: TvTokenCache | undefined;
}

if (!globalThis.__tvTokenCache) {
  globalThis.__tvTokenCache = { token: null, expiresAt: 0, inflightPromise: null };
}
const tokenCache = globalThis.__tvTokenCache;

async function fetchNewGuestToken(): Promise<string> {
  const response = await fetch(`${TV_API_BASE}/v2/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_guest: true }),
  });
  if (!response.ok) {
    throw new Error(`[tv-token] Guest auth failed: ${response.status}`);
  }
  const data = await response.json();
  const token: string = data.access_token;
  tokenCache.token = token;
  tokenCache.expiresAt = Date.now() + TOKEN_TTL_MS;
  return token;
}

export async function getGuestToken(): Promise<string> {
  // Fast path — кеш валиден
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }
  // Deduplication — кто-то уже запрашивает
  if (tokenCache.inflightPromise) {
    return tokenCache.inflightPromise;
  }
  // Новый запрос
  tokenCache.inflightPromise = fetchNewGuestToken().finally(() => {
    tokenCache.inflightPromise = null;
  });
  return tokenCache.inflightPromise;
}

// Channel ID маппинг (заполнить после GET /v2/channels)
const CHANNEL_ID_MAP: Record<string, string> = {
  perviy: "??",   // Первый канал — определить из API
  russia1: "??",  // Россия 1
  match: "??",    // МАТЧ!
  // ...
};

export async function getStreamUrl(internalId: string): Promise<string | null> {
  const apiId = CHANNEL_ID_MAP[internalId];
  if (!apiId || apiId === "??") {
    console.warn(`[tv-token] No API id mapping for channel: ${internalId}`);
    return null;
  }

  const token = await getGuestToken();
  const url = `${TV_API_BASE}/v2/channels/${apiId}/stream`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (resp.status === 401) {
    // Инвалидировать кеш и сделать один retry
    tokenCache.token = null;
    tokenCache.expiresAt = 0;
    const freshToken = await getGuestToken();
    const retryResp = await fetch(url, {
      headers: { Authorization: `Bearer ${freshToken}` },
    });
    if (!retryResp.ok) return null;
    const retryData = await retryResp.json();
    return (retryData.url as string) ?? null;
  }

  if (!resp.ok) {
    console.error(`[tv-token] Stream fetch failed for ${internalId}: ${resp.status}`);
    return null;
  }

  const data = await resp.json();
  return (data.url as string) ?? null;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params.id` (sync) | `(await params).id` (async) | Next.js 15.0.0-RC | Ломает существующие Route Handlers при upgrade |
| GET Route Handlers кешируются по умолчанию | НЕ кешируются по умолчанию | Next.js 15 | Наш /api/tv/stream динамический — это правильно |
| Module-level singleton | globalThis singleton | Next.js 13+ (webpack bundling) | Нужно явно использовать globalThis |

**Deprecated/outdated:**
- `export const dynamic = 'force-static'` для Route Handlers с авторизацией: не применимо для нашего случая
- `params` без await: устаревший паттерн с Next.js 14, обязательный breaking change в 15

---

## 24h.tv API — Known Unknowns (LOW confidence)

Официальной документации нет. Данные основаны на информации из CONTEXT.md (reverse-engineered/inferred):

| Endpoint | Method | Body/Params | Response | Confidence |
|----------|--------|-------------|----------|------------|
| `/v2/users` | POST | `{ is_guest: true }` | `{ access_token: string, ... }` | MEDIUM (из CONTEXT.md) |
| `/v2/channels` | GET | Header: `Authorization: Bearer {token}` | `[{ id, name, ... }]` | LOW (предположение) |
| `/v2/channels/{id}/stream` | GET | Header: `Authorization: Bearer {token}` | `{ url: string }` | LOW (предположение) |

**Base URL:** Вероятно `https://api.24h.tv` или `https://service.24h.tv`. Требует проверки при первом запуске.

**TTL токена:** Предположительно 1-2 часа. Если токен JWT-формата — можно декодировать `exp` claim без верификации. Рекомендация: 90 минут с 401-triggered refresh.

**CORS CDN:** `cdn.media.24h.tv` уже используется для изображений — значит CDN публично доступен из браузера для images. Для HLS streams — неизвестно; HLS-стримы часто требуют `Access-Control-Allow-Origin: *` на CDN для embeddable использования.

---

## Open Questions

1. **Base URL API 24h.tv**
   - Что знаем: домен 24h.tv, предположительно `/v2/` prefix
   - Что неизвестно: точный hostname (`api.24h.tv`? `service.24h.tv`? `backend.24h.tv`?)
   - Рекомендация: При первой задаче Phase 2 — проверить в DevTools при посещении 24h.tv и перехватить запрос авторизации

2. **Числовые ID каналов в 24h.tv API**
   - Что знаем: есть endpoint `/v2/channels` возвращающий список каналов
   - Что неизвестно: числовые id для наших 15 каналов
   - Рекомендация: Первая задача — вызвать `/v2/channels`, получить список, заполнить `CHANNEL_ID_MAP`

3. **CORS для HLS стримов с 24h.tv CDN**
   - Что знаем: изображения работают (значит CORS для images настроен)
   - Что неизвестно: разрешает ли CDN fetch m3u8 из браузера с другого origin
   - Рекомендация: Тест в Phase 3 перед написанием hls.js кода — открыть DevTools на http://localhost:3000 и попробовать `fetch('https://cdn.media.24h.tv/...')`. Если CORS error — реализовать proxy endpoint.

4. **Формат ответа `/v2/channels/{id}/stream`**
   - Что знаем: должен содержать HLS manifest URL
   - Что неизвестно: ключ (`url`? `stream_url`? `hls`?), вложенность
   - Рекомендация: Логировать полный ответ при первом успешном вызове

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Нет тестового фреймворка в проекте |
| Config file | Нет (Wave 0 должен создать) |
| Quick run command | `npm run build` (проверка TypeScript + Next.js) |
| Full suite command | `npm run lint && npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HLS-01 | Route Handler возвращает streamUrl для валидного id | manual-smoke | `curl http://localhost:3000/api/tv/stream/perviy` | ❌ Wave 0 |
| HLS-01 | Route Handler возвращает 404 для невалидного id | manual-smoke | `curl http://localhost:3000/api/tv/stream/unknown` | ❌ Wave 0 |
| HLS-02 | Повторный запрос использует кешированный токен (не дублирует POST /v2/users) | manual-smoke | Логи сервера — проверить повторный вызов не делает новый POST | ❌ Wave 0 |
| HLS-02 | Concurrent requests не дублируют токен | manual-smoke | `curl` в параллели + логи сервера | ❌ Wave 0 |

**Обоснование manual-only:** Нет тестового фреймворка, Phase 2 — сервисный слой без UI. Проверки возможны через `curl` + server logs. Unit-тесты для TokenManager — ценны, но требуют настройки Jest/Vitest (Wave 0).

### Sampling Rate
- **Per task commit:** `npm run build` (TypeScript check)
- **Per wave merge:** `npm run lint && npm run build`
- **Phase gate:** Build зелёный + ручная проверка `curl /api/tv/stream/{id}` возвращает `{ streamUrl: "https://..." }` до `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `iflat-redesign/src/lib/tv-token.ts` — TokenManager singleton (создаётся в фазе)
- [ ] `iflat-redesign/src/app/api/tv/stream/[id]/route.ts` — Route Handler (создаётся в фазе)
- [ ] Channel ID mapping — требует ручного заполнения после `GET /v2/channels`

*(Тестовый фреймворк не требуется для Phase 2 — smoke testing через curl достаточно)*

---

## Sources

### Primary (HIGH confidence)
- [Next.js official docs — Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) — Caching behavior, HTTP methods
- [Next.js official docs — route.js API reference](https://nextjs.org/docs/app/api-reference/file-conventions/route) — Dynamic params pattern, `params` as Promise
- [Next.js official docs — Instrumentation](https://nextjs.org/docs/app/guides/instrumentation) — `register()` called once per server instance

### Secondary (MEDIUM confidence)
- [Next.js Discussion #68572 — Canonical singleton approach](https://github.com/vercel/next.js/discussions/68572) — globalThis pattern (community consensus + Vercel team confirmation)
- [Next.js Issue #65350 — Inconsistent Singleton](https://github.com/vercel/next.js/issues/65350) — Hot-reload problem confirmation
- `iflat-redesign/src/app/api/connect/route.ts` — Существующий Route Handler паттерн в проекте

### Tertiary (LOW confidence)
- CONTEXT.md → `<specifics>` — 24h.tv API endpoints (reverse-engineered, не официальная документация)
- MEMORY.md — HLS стримы 24h.tv требуют авторизации

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Next.js официальная документация, существующий код проекта
- Architecture patterns: HIGH — официальные Next.js docs + community consensus
- 24h.tv API specifics: LOW — нет публичной документации, данные из CONTEXT.md
- CORS behavior: LOW — неизвестно без тестирования в браузере
- Channel ID mapping: LOW — требует empirical discovery

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (Next.js stable, паттерны не изменятся; API 24h.tv может измениться)
