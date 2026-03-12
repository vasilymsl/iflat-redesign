# Phase 8: Token & Stream Hardening - Research

**Researched:** 2026-03-12
**Domain:** Next.js server-side token lifecycle management, in-memory caching, persistent file cache
**Confidence:** HIGH

## Summary

Фаза 8 — финальная в milestone v1.1. Все три требования (TOKEN-01, TOKEN-02, PERF-02) реализуются исключительно в `src/lib/tv-token.ts` без новых зависимостей. Это узкая хирургическая задача: три независимых улучшения к уже рабочему коду.

По данным CONTEXT.md, значительная часть инфраструктуры уже существует: `tokenIssuedAt` поле есть в `TvTokenCache` интерфейсе, `PROACTIVE_REFRESH_RATIO = 0.25` определена, `savePersistentCache()`/`loadPersistentCache()` работают. Задача — "замкнуть" эти части: сохранять `tokenIssuedAt` в JSON-файл и восстанавливать при рестарте, плюс добавить Map-кеш для stream URL.

**Primary recommendation:** Три изолированных изменения в одном файле — implement sequentially, verify each success criterion independently.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Все изменения только в `src/lib/tv-token.ts`
- Нулевые новые зависимости

### Claude's Discretion
- Структура stream URL кеша (Map vs globalThis singleton)
- TTL stream кеша (60s указано в REQUIREMENTS.md)
- Формат `tokenIssuedAt` в persistent cache (timestamp vs ISO string)
- Логирование cache hit/miss для stream URL
- Поведение при истёкшем stream URL кеше (silent refetch vs force clear)

### Deferred Ideas (OUT OF SCOPE)
- None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOKEN-01 | Проактивное обновление токена при <25% оставшегося TTL | `PROACTIVE_REFRESH_RATIO` уже есть, проактивный refresh уже реализован в `getGuestToken()` — нужно убедиться что TTL корректно вычисляется после рестарта (зависит от TOKEN-02) |
| TOKEN-02 | `tokenIssuedAt` сохраняется в persistent cache для корректного расчёта TTL после рестарта | `PersistentTokenData` интерфейс нужно расширить, `savePersistentCache()` и `loadPersistentCache()` нужно обновить |
| PERF-02 | Stream URL кешируется на 60s — повторный hover не бьёт API | Новый Map-кеш в `getStreamUrl()` перед вызовом `curlJsonStream` |
</phase_requirements>

## Standard Stack

### Core
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| `globalThis.__tvTokenCache` | существующий | In-process singleton, переживает hot-reload | Уже используется в проекте для token cache |
| `Map<string, {url, expiresAt}>` | built-in | Stream URL кеш с TTL | Нет зависимостей, O(1) lookup |
| `fs.writeFileSync` / `JSON.parse` | built-in Node.js | Persistent cache I/O | Уже используется в `savePersistentCache()` |

### Supporting
| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| `Date.now()` | built-in | Timestamp для TTL расчётов | Числовой timestamp — меньше парсинга |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Map` для stream кеша | `globalThis.__tvStreamCache` | globalThis переживает hot-reload, Map — нет. Для 60s TTL разница несущественна, но globalThis — правильнее |
| `Date.now()` (число) | ISO string | ISO string требует `Date.parse()` при чтении, число проще. Оба работают |

## Architecture Patterns

### Pattern 1: Stream URL кеш с TTL

**What:** Map внутри globalThis singleton хранит `{url: string, expiresAt: number}` per channel ID

**When to use:** Любой API-вызов в hover-пути где TTL < времени следующего hover

**Example:**
```typescript
// Рекомендуемая структура — внутри globalThis.__tvTokenCache или отдельный singleton
interface StreamUrlEntry {
  url: string;
  expiresAt: number; // Date.now() + 60_000
}

// Как часть существующего globalThis singleton (предпочтительно):
interface TvTokenCacheGlobal {
  // ...existing fields...
  streamUrlCache?: Map<string, StreamUrlEntry>;
}

// В getStreamUrl():
const cache = getGlobalCache(); // существующий helper
if (!cache.streamUrlCache) {
  cache.streamUrlCache = new Map();
}
const cached = cache.streamUrlCache.get(channelId);
if (cached && cached.expiresAt > Date.now()) {
  console.log('[tv-token] Stream URL cache hit:', channelId);
  return cached.url;
}
// ... вызов curlJsonStream ...
cache.streamUrlCache.set(channelId, { url, expiresAt: Date.now() + 60_000 });
return url;
```

**Confidence:** HIGH — паттерн идентичен DataCache<T> уже в коде

### Pattern 2: tokenIssuedAt в PersistentTokenData

**What:** Добавить `tokenIssuedAt: number` в интерфейс `PersistentTokenData`, сохранять в `savePersistentCache()`, восстанавливать в `loadPersistentCache()`

**When to use:** При каждом получении нового токена

**Example:**
```typescript
// PersistentTokenData расширение:
interface PersistentTokenData {
  token: string;
  expiresAt: number;
  serial: string;
  username: string;
  password: string;
  tokenIssuedAt: number; // НОВОЕ — Date.now() при получении токена
}

// В savePersistentCache():
const data: PersistentTokenData = {
  token: cache.token,
  expiresAt: cache.expiresAt,
  serial: cache.serial,
  username: cache.username,
  password: cache.password,
  tokenIssuedAt: cache.tokenIssuedAt, // НОВОЕ
};

// В loadPersistentCache():
cache.tokenIssuedAt = data.tokenIssuedAt ?? Date.now(); // fallback для старых файлов
```

**Confidence:** HIGH — паттерн прямолинейный, риска нет

### Pattern 3: Proactive Refresh — зависимость от TOKEN-02

**What:** Проактивный refresh при <25% TTL уже реализован в `getGuestToken()`. После TOKEN-02, `tokenIssuedAt` восстанавливается из файла — TTL расчёт становится корректным после рестарта.

**Критичный момент:** После рестарта без `tokenIssuedAt` в файле код не знает когда токен был выдан — не может определить прогресс TTL. С `tokenIssuedAt` в файле: `elapsed = Date.now() - tokenIssuedAt`, `remaining = expiresAt - Date.now()`, `ratio = remaining / (expiresAt - tokenIssuedAt)`.

**Success criterion проверка:** После рестарта через ~67 мин (75% от ~90 мин TTL) должен появиться лог `[tv-token] Proactive token refresh`. Это будет работать автоматически если `tokenIssuedAt` восстановлен из файла и TTL ratio вычисляется правильно.

### Anti-Patterns to Avoid

- **Не хранить stream URL кеш в локальной переменной модуля**: Next.js hot-reload пересоздаёт модуль. Кеш должен быть в `globalThis`.
- **Не добавлять `tokenIssuedAt` только в memory-cache**: При рестарте сервера memory-cache сбрасывается — смысл теряется. Обязательно в JSON-файл.
- **Не делать stream URL кеш per-request**: Кеш должен быть server-level singleton, иначе 60s TTL не работает между запросами от разных clients.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TTL кеш | Кастомный LRU/expiry | `Map` + `expiresAt: Date.now() + TTL` | 15 каналов — LRU избыточен |
| Persistent store | SQLite/Redis | `fs.writeFileSync` + JSON | Уже используется, нет смысла усложнять |
| Scheduled refresh | `setInterval` | On-demand check в `getGuestToken()` | `setInterval` не переживает serverless restarts |

**Key insight:** Проактивный refresh on-demand (check при каждом вызове `getGuestToken()`) надёжнее `setInterval` в Next.js окружении — не нужно управлять lifecycle interval.

## Common Pitfalls

### Pitfall 1: Map не переживает Next.js hot-reload
**What goes wrong:** Stream URL кеш сбрасывается при каждом изменении файла в dev режиме
**Why it happens:** Next.js пересоздаёт модули при hot-reload, все module-level переменные сбрасываются
**How to avoid:** Хранить `streamUrlCache` как поле внутри `globalThis.__tvTokenCache` — паттерн уже используется в проекте
**Warning signs:** В dev режиме кеш никогда не даёт hit

### Pitfall 2: Обратная совместимость `.tv-token-cache.json`
**What goes wrong:** Старый файл без `tokenIssuedAt` → `undefined` → NaN в TTL расчётах
**Why it happens:** `PersistentTokenData` расширяется, но файл старый
**How to avoid:** Fallback в `loadPersistentCache()`: `cache.tokenIssuedAt = data.tokenIssuedAt ?? Date.now()`
**Warning signs:** `isNaN` в TTL вычислениях сразу после деплоя

### Pitfall 3: Race condition на stream URL кеш
**What goes wrong:** Два одновременных hover на один канал → оба промахиваются мимо кеша → два API запроса
**Why it happens:** Кеш проверяется до первого ответа API
**How to avoid:** Добавить `inflightPromise` в `StreamUrlEntry` — паттерн `DataCache<T>` уже в коде. Либо принять: два запроса в секунду некритично для hover.
**Warning signs:** Двойные логи stream fetch для одного channelId в одну секунду

### Pitfall 4: `tokenIssuedAt` vs `expiresAt` путаница
**What goes wrong:** Proactive refresh ratio вычисляется неверно
**Why it happens:** TTL токена не фиксирован (может быть 90 мин, может 120) — нельзя хардкодить
**How to avoid:** `totalTTL = expiresAt - tokenIssuedAt`, `remaining = expiresAt - Date.now()`, `ratio = remaining / totalTTL`. Refresh при `ratio < PROACTIVE_REFRESH_RATIO (0.25)`.

## Code Examples

### Stream URL кеш — полный паттерн
```typescript
// Source: паттерн из DataCache<T> в tv-token.ts

const STREAM_URL_CACHE_TTL_MS = 60_000; // 60 секунд

async function getStreamUrl(channelId: string): Promise<string> {
  const cache = getGlobalCache(); // существующий helper

  // Инициализация кеша (переживает hot-reload через globalThis)
  if (!cache.streamUrlCache) {
    cache.streamUrlCache = new Map<string, { url: string; expiresAt: number }>();
  }

  const cached = cache.streamUrlCache.get(channelId);
  if (cached && cached.expiresAt > Date.now()) {
    console.log('[tv-token] Stream URL cache hit:', channelId);
    return cached.url;
  }

  console.log('[tv-token] Stream URL cache miss, fetching:', channelId);
  const token = await getGuestToken();
  const url = await curlJsonStream(channelId, token);

  cache.streamUrlCache.set(channelId, {
    url,
    expiresAt: Date.now() + STREAM_URL_CACHE_TTL_MS,
  });

  return url;
}
```

### Proactive refresh TTL ratio
```typescript
// Вычисление ratio для проактивного refresh
function getTokenTTLRatio(cache: TvTokenCache): number {
  if (!cache.tokenIssuedAt || !cache.expiresAt) return 0;
  const totalTTL = cache.expiresAt - cache.tokenIssuedAt;
  if (totalTTL <= 0) return 0;
  const remaining = cache.expiresAt - Date.now();
  return remaining / totalTTL;
}

// В getGuestToken():
const ratio = getTokenTTLRatio(cache);
if (ratio < PROACTIVE_REFRESH_RATIO) {
  console.log('[tv-token] Proactive token refresh, ratio:', ratio.toFixed(2));
  // фоновое обновление...
}
```

### PersistentTokenData обновление
```typescript
interface PersistentTokenData {
  token: string;
  expiresAt: number;
  serial: string;
  username: string;
  password: string;
  tokenIssuedAt: number; // ДОБАВИТЬ
}

// loadPersistentCache — backward compat:
cache.tokenIssuedAt = data.tokenIssuedAt ?? Date.now();
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| TTL ratio без `tokenIssuedAt` | TTL ratio с `tokenIssuedAt` из файла | Proactive refresh работает после рестарта |
| Каждый hover = API запрос | Stream URL кешируется 60s | Меньше нагрузки на QRATOR |

## Open Questions

1. **Inflight deduplication для stream URL кеша**
   - What we know: `DataCache<T>` с `inflightPromise` уже в коде, stream URL кеш его не использует
   - What's unclear: Насколько реален сценарий двух одновременных hover на один канал
   - Recommendation: Не реализовывать для Phase 8 — добавить `inflightPromise` при необходимости в будущем. SUCCESS CRITERIA не требует deduplication.

2. **Размер `streamUrlCache` Map**
   - What we know: 15 каналов максимум
   - What's unclear: Нужна ли очистка истёкших записей
   - Recommendation: Не очищать — 15 записей * ~100 байт = ~1.5KB. Ничтожно.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Не определён — нет тестов в проекте |
| Config file | Нет |
| Quick run command | `npm run build` (smoke test) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOKEN-01 | После рестарта через ~67 мин появляется лог `[tv-token] Proactive token refresh` | manual | N/A — требует ожидания 67 мин | N/A |
| TOKEN-02 | `.tv-token-cache.json` содержит поле `tokenIssuedAt` после перезапуска | manual smoke | `node -e "const f=require('.tv-token-cache.json'); console.log('tokenIssuedAt' in f)"` | ❌ Wave 0 |
| PERF-02 | Повторный hover не создаёт запроса к `/api/tv/stream/[id]` в течение 60s | manual + log | Проверить логи сервера на отсутствие двойных fetch | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` — убедиться что TypeScript компилируется
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** `npm run build` зелёный + ручная проверка success criteria

### Wave 0 Gaps
- [ ] Ручная проверка TOKEN-02: `node -e "const f=JSON.parse(require('fs').readFileSync('.tv-token-cache.json','utf8')); console.log('tokenIssuedAt:', f.tokenIssuedAt)"` — выполнить после первого запуска сервера
- [ ] Ручная проверка PERF-02: дважды навести на канал в течение 60s — второй hover не должен давать лог `Stream URL cache miss`

*(Unit-тестирование не применимо — проект без test framework, manual verification является primary gate)*

## Sources

### Primary (HIGH confidence)
- CONTEXT.md Phase 8 — детали существующей реализации, integration points, reusable assets
- REQUIREMENTS.md — точные формулировки TOKEN-01, TOKEN-02, PERF-02 и success criteria
- STATE.md — accumulated decisions, architectural constraints

### Secondary (MEDIUM confidence)
- MEMORY.md — описание существующих паттернов (`globalThis.__tvTokenCache`, `DataCache<T>`, `curlJsonStream`)

### Tertiary (LOW confidence)
- Нет — все данные из первичных проектных источников

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — всё уже в проекте, новых библиотек нет
- Architecture: HIGH — паттерны идентичны существующим в tv-token.ts
- Pitfalls: HIGH — вытекают из Next.js hot-reload поведения и обратной совместимости JSON

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (стабильная область, Next.js server-side patterns не меняются часто)
