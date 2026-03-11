# Domain Pitfalls: API Rate-Limit Fix (v1.1)

**Domain:** Server-side API client с rate-limiting поверх execSync/curl в Next.js SSR контексте
**Project:** iFlat — стабилизация работы 24h.tv API под QRATOR rate-limit
**Researched:** 2026-03-12
**Confidence:** HIGH (прямая инспекция кода `src/lib/tv-token.ts`, domain knowledge Node.js async/sync)

---

## Critical Pitfalls

Ошибки, которые приводят к зависанию Node.js процесса, retry storm или regression.

---

### Pitfall 1: curlJsonSync блокирует Event Loop — async sleep перед ним ничего не даёт

**What goes wrong:**
`curlJson` (async) делает `await sleep(...)` для rate-limiting, а затем вызывает `curlJsonSync` (sync). Внутри `curlJsonSync` — `execSync(`sleep ...`)` для выравнивания по `lastRequestAt`. Это значит: если `curlJson` вызывается параллельно из двух мест (например, `getChannels` и `getNovinki` одновременно при SSR главной страницы), оба входят в `curlJsonSync` одновременно, потому что `await sleep` в `curlJson` не создаёт взаимоисключение — они оба проходят проверку `elapsed < DELAY_BETWEEN_REQUESTS_MS` в одном тике.

**Why it happens:**
`lastRequestAt` — module-level переменная. Два параллельных вызова `curlJson` оба читают `lastRequestAt` до того, как первый обновит его. Race condition на чтение/запись `lastRequestAt` без lock.

**Consequences:**
- Два запроса уходят практически одновременно → QRATOR видит burst → rate-limit срабатывает
- `execSync` блокирует единственный Node.js thread на время curl-запроса (обычно 1-5 секунд). Два параллельных `curlJsonSync` не выполняются параллельно — второй ждёт в OS thread pool — но `lastRequestAt` уже записан первым, поэтому `sleep` внутри второго не срабатывает

**Prevention:**
Ввести глобальную очередь запросов — serial queue через chained Promise:

```typescript
// module level
let requestQueue: Promise<unknown> = Promise.resolve();

function enqueueRequest<T>(fn: () => T): Promise<T> {
  const next = requestQueue.then(() => {
    const now = Date.now();
    const elapsed = now - lastRequestAt;
    if (elapsed < DELAY_BETWEEN_REQUESTS_MS) {
      return sleep(DELAY_BETWEEN_REQUESTS_MS - elapsed).then(fn);
    }
    return fn();
  }).then(result => {
    lastRequestAt = Date.now();
    return result;
  }) as Promise<T>;
  requestQueue = next.catch(() => {});
  return next;
}
```

Все вызовы `curlJsonSync` через эту очередь — гарантирует ровно 350ms между запросами независимо от параллелизма.

**Detection:**
Лог: несколько `[tv-token]` строк с разницей < 100ms при первой загрузке главной страницы — значит запросы уходят batch'ем.

**Phase:** v1.1 реализация — исправить до первого теста

---

### Pitfall 2: Retry storm при page load — 15 каналов × 3 retry × 2s backoff = зависание на 90+ секунд

**What goes wrong:**
`fetchCurrentPrograms` запрашивает расписание для всех 15 каналов последовательно. Каждый вызов идёт через `curlJson` с retry (3 попытки, базовая задержка 2s с ×2 backoff). Если QRATOR блокирует — первый канал делает 3 попытки: 2s + 4s + 8s = 14s. Потом `failCount` достигает 3 и цикл останавливается — НО только если ошибки идут подряд. Если ошибки чередуются с успехами (QRATOR блокирует каждый второй запрос), то `failCount` сбрасывается при каждом успехе и все 15 каналов получают по 3 retry каждый.

**Why it happens:**
Circuit breaker (`failCount >= 3`) сбрасывается при каждом успешном запросе: `failCount = 0`. Это правильно для отдельных intermittent ошибок, но не для intermittent QRATOR rate-limit который пропускает каждый второй запрос.

**Consequences:**
SSR страницы висит неприемлемо долго. Next.js не имеет timeout на Server Components по умолчанию. Пользователь видит Loading indefinitely. В production — Vercel timeout 60s → 504 Gateway Timeout.

**Prevention:**
Два отдельных счётчика: `consecutiveFailCount` (сбрасывается при успехе) И `totalFailCount` (не сбрасывается). Стопорить по `totalFailCount >= 5 || consecutiveFailCount >= 3`:

```typescript
let consecutiveFail = 0;
let totalFail = 0;

for (const chId of channelIds) {
  if (consecutiveFail >= 3 || totalFail >= 5) {
    console.warn(`[schedule] Stopping: consecutive=${consecutiveFail}, total=${totalFail}`);
    break;
  }
  // ...
  // при успехе:
  consecutiveFail = 0; // только consecutive сбрасывается
  // при ошибке:
  consecutiveFail++;
  totalFail++;
}
```

Дополнительно: добавить абсолютный timeout на весь `fetchCurrentPrograms` вызов (например, 8 секунд), после которого возвращать частичные результаты.

**Detection:**
Время загрузки страницы > 10 секунд при проблемах с 24h.tv API. Лог: много `[tv-token] Request failed (attempt X/4)` подряд.

**Phase:** v1.1 реализация — критично для production

---

### Pitfall 3: Проактивный refresh в фоне не защищён от concurrency при server restart

**What goes wrong:**
Проактивный refresh запускается когда `remaining < totalTtl * 0.25 && !cache.inflightPromise`. Это корректно для одного Node.js процесса. НО: при dev-режиме с Hot Module Replacement (HMR) или при Vercel Serverless Functions — `globalThis.__tvTokenCache` может быть reset между запросами (разные instances). Тогда `cache.tokenIssuedAt === 0`, `totalTtl` считается как 90 минут fallback, и `remaining < totalTtl * 0.25` срабатывает неправильно.

**Why it happens:**
`tokenIssuedAt` не сохраняется в persistent file cache (только `token`, `expiresAt`, `serial`, `username`, `password` — см. `PersistentTokenData`). После загрузки из файла `tokenIssuedAt = 0`, поэтому `totalTtl = expiresAt - 0 = огромное число` и условие `remaining < totalTtl * 0.25` никогда не выполняется до самого истечения токена.

**Consequences:**
Проактивное обновление не работает после server restart — всё ок с логикой, но фича нефункциональна. Токен будет обновляться только по истечению, а не проактивно.

**Prevention:**
Добавить `tokenIssuedAt` в `PersistentTokenData` и сохранять/восстанавливать вместе с остальными полями:

```typescript
// в PersistentTokenData добавить:
tokenIssuedAt: number;

// в loadPersistentCache восстанавливать:
tokenIssuedAt: persisted.tokenIssuedAt ?? 0,
```

**Detection:**
После рестарта сервера проверить логи — нет `[tv-token] Proactive token refresh` даже когда токен получен давно.

**Phase:** v1.1 — minor fix, не блокирует основной функционал

---

## Moderate Pitfalls

---

### Pitfall 4: DELAY_BETWEEN_REQUESTS_MS = 350ms × 15 каналов = 5+ секунд page load

**What goes wrong:**
`fetchCurrentPrograms` вызывается последовательно для каждого канала. С очередью запросов (Pitfall 1 fix) это гарантированно: каждый запрос ждёт 350ms после предыдущего. 15 каналов × 350ms = 5250ms только на расписание, плюс время выполнения каждого curl (обычно 200-500ms) = **8-12 секунд** только на загрузку расписания.

**Why it happens:**
Расписание — не главные данные, но загружается в одном потоке с токеном и каналами. Пользователь ждёт загрузки страницы всё это время.

**Consequences:**
Lighthouse Performance плохой из-за TTFB. SEO страдает (Google учитывает TTFB). При медленном соединении к 24h.tv — ещё хуже.

**Prevention:**
Несколько стратегий (выбрать одну):

1. **Streaming + Suspense**: данные каналов (без расписания) отдавать сразу, расписание грузить отдельно через `<Suspense>` boundary. Пользователь видит карточки с лого немедленно, картинки передач подгружаются позже.

2. **Уменьшить batch расписания**: запрашивать расписание не для всех 15 каналов, а только для 6-8 первых видимых (viewport). Остальные — lazy при scroll.

3. **Независимый TTL для расписания**: если расписание закешировано (TTL 10 мин) — `fetchCurrentPrograms` возвращает мгновенно. Убедиться что cache не инвалидируется вместе с токеном.

4. **Параллельные запросы с ограниченным concurrency**: вместо строго последовательных — группы по 3 с паузой между группами (concurrency limit pattern).

**Detection:**
Chrome DevTools → Network → `document` resource TTFB > 3 секунд при холодном кеше.

**Phase:** v1.1 или v1.2 — может потребовать рефакторинг архитектуры страниц

---

### Pitfall 5: execSync блокирует весь Node.js при одновременных /api/tv/stream запросах

**What goes wrong:**
`/api/tv/stream/[id]` — Next.js API route. При hover на карточки пользователь может быстро навести на 3-5 карточек → 3-5 параллельных fetch к `/api/tv/stream/[id]`. Каждый вызов заканчивается в `getStreamUrl` → `curlJson` → `curlJsonSync` → `execSync`. Node.js — однопоточный. `execSync` блокирует event loop на всё время выполнения curl (200-2000ms). Пять параллельных `execSync` выполняются последовательно, блокируя весь сервер на 1-10 секунд.

**Why it happens:**
`execSync` — синхронный вызов. Он не использует libuv thread pool (в отличие от `fs.readFile`). Весь Node.js process заморожен пока curl выполняется.

**Consequences:**
Другие HTTP запросы (статика, другие API routes) не обрабатываются пока curl работает. При 5 параллельных hover запросах — видимый lag на весь сайт.

**Prevention:**
Заменить `execSync` на `spawn` с Promise wrapper — это позволяет Node.js обрабатывать другие запросы пока curl работает в дочернем процессе:

```typescript
import { spawn } from "child_process";

function curlJsonAsync(args: string[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const proc = spawn("curl", args);
    let stdout = "";
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`curl exit ${code}`));
      try { resolve(JSON.parse(stdout)); }
      catch (e) { reject(e); }
    });
    proc.on("error", reject);
    setTimeout(() => { proc.kill(); reject(new Error("curl timeout")); }, 20_000);
  });
}
```

**Detection:**
При быстром наведении на 5+ карточек — проверить server logs задержку между запросами. Если запросы идут строго друг за другом (не параллельно) — это execSync блокировка.

**Phase:** v1.1 — желательно, но не блокирует функциональность при малом трафике

---

### Pitfall 6: Retry backoff слишком агрессивен для stream requests, слишком мягок для auth

**What goes wrong:**
`MAX_RETRIES = 3` и `RETRY_BASE_DELAY_MS = 2000` применяется одинаково ко всем запросам через `curlJson`. Для `/api/tv/stream/[id]` (triggered by user hover) — 3 retry с 2s+4s+8s = 14 секунд ожидания — неприемлемо. Пользователь давно убрал курсор. Для auth flow (`/v2/users`) — 3 retry нормально, но нужно знать тип ошибки: curl timeout (сеть недоступна) vs HTTP 429 (rate limit) vs HTTP 500 (сервер лежит).

**Why it happens:**
Единый retry механизм без учёта контекста запроса и типа ошибки.

**Consequences:**
Stream requests висят 14+ секунд при ошибках — пользователь уже ушёл. Auth retries на HTTP 500 бессмысленны (сервер не ответит). Retry на curl timeout (сеть) блокирует event loop дольше.

**Prevention:**
Разделить retry политики:

```typescript
// Для stream requests — быстрый fail, не более 1 retry
const streamUrl = await getStreamUrlFast(internalId); // MAX_RETRIES = 1, BASE = 500ms

// Для auth flow — более терпеливый, но с типом ошибки
// curl exit code 28 = timeout, не ретраить дольше
// HTTP 429 = rate limit, ретраить с backoff
// HTTP 5xx = server error, не ретраить
```

Для stream API route: если `getStreamUrl` занял > 3 секунд, вернуть 503 немедленно (AbortSignal timeout).

**Detection:**
Network tab в браузере: `/api/tv/stream/[id]` pending > 5 секунд при ошибках 24h.tv API.

**Phase:** v1.1 — исправить конфигурацию retry для stream requests

---

## Minor Pitfalls

---

### Pitfall 7: `sleep(DELAY_AUTH_STEP_MS)` после ошибки в `reloginWithCachedCredentials` дублирует задержку

**What goes wrong:**
В `reloginWithCachedCredentials` при ошибке login делается `await sleep(DELAY_AUTH_STEP_MS)` перед вызовом `fetchNewGuestToken()`. Но `fetchNewGuestToken` сам начинается с `curlJson` который имеет свою очередь (если применить Pitfall 1 fix). Итого задержка двойная: 500ms явный sleep + 350ms из очереди.

**Prevention:**
Убрать явные `await sleep(DELAY_AUTH_STEP_MS)` перед вызовами других функций которые уже используют rate-limit очередь. Оставить sleep только между шагами одного auth flow где нет вызовов через curlJson.

**Phase:** v1.1 — minor cleanup, не влияет на корректность

---

### Pitfall 8: `cache.inflightPromise` для проактивного refresh не propagate ошибки правильно

**What goes wrong:**
Проактивный refresh (строки 449-455 tv-token.ts) делает `.catch(err => { return cache.token! })`. Если токен уже истёк к моменту выполнения catch (маловероятно, но возможно при долгом refresh) — `cache.token!` будет пустым или устаревшим. Возвращённый токен из catch будет использован последующими вызовами `getGuestToken`.

**Prevention:**
В catch проактивного refresh — не возвращать `cache.token!`, а бросать ошибку или возвращать пустую строку, чтобы следующий вызов `getGuestToken` увидел что токен недействителен:

```typescript
cache.inflightPromise = authFn()
  .catch(err => {
    console.warn("[tv-token] Proactive refresh failed:", err);
    // Не возвращать cache.token — пусть следующий getGuestToken запросит новый
    throw err;
  })
  .finally(() => { cache.inflightPromise = null; });
```

И в вызывающем `getGuestToken` — проактивный refresh запускается fire-and-forget (не awaited), поэтому бросить ошибку в промисе безопасно.

**Phase:** v1.1 — defensive fix

---

### Pitfall 9: `writeFileSync` в `savePersistentCache` блокирует event loop при каждом auth

**What goes wrong:**
`savePersistentCache()` вызывается после каждого успешного получения токена. `writeFileSync` — синхронный. Для маленького JSON файла (< 1KB) это обычно < 1ms — не проблема. НО если вызывается во время SSR при первом запросе страницы + несколько параллельных stream requests — может добавить unpredictable задержку.

**Prevention:**
Заменить `writeFileSync` на `writeFile` (async) с fire-and-forget паттерном. Ошибка записи уже логируется через `console.warn`, так что потеря данных не критична:

```typescript
import { writeFile } from "fs/promises";

function savePersistentCache() {
  const data = { /* ... */ };
  writeFile(TOKEN_CACHE_FILE, JSON.stringify(data, null, 2), "utf-8")
    .catch(err => console.warn("[tv-token] Failed to write persistent cache:", err));
}
```

**Phase:** v1.1 — minor improvement

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Параллельные запросы при page load | Race condition на `lastRequestAt` (Pitfall 1) | Serial request queue через chained Promise |
| fetchCurrentPrograms batch | Retry storm: 15×3×14s (Pitfall 2) | `totalFailCount` counter + абсолютный timeout |
| hover-triggered stream requests | execSync блокирует event loop (Pitfall 5) | spawn() с Promise wrapper |
| Stream API timeout | Retry слишком агрессивный (Pitfall 6) | Отдельная retry политика для stream vs auth |
| Server restart / HMR | Proactive refresh не работает (Pitfall 3) | Сохранять `tokenIssuedAt` в persistent cache |
| Page load time | 5+ секунд на расписание (Pitfall 4) | Streaming/Suspense или concurrency limit |

---

## Checklist для code review

Перед мержем v1.1 проверить:

- [ ] `lastRequestAt` обновляется атомарно (serial queue, не параллельные reads)
- [ ] `fetchCurrentPrograms` имеет абсолютный timeout (не только per-request)
- [ ] `totalFailCount` отслеживается отдельно от `consecutiveFailCount`
- [ ] Stream API route возвращает ответ за < 3 секунд при ошибках
- [ ] Retry delays для `/api/tv/stream` отличаются от auth flow delays
- [ ] `tokenIssuedAt` сохраняется в `.tv-token-cache.json`
- [ ] Проверка: запуск dev-сервера + немедленная загрузка главной — TTFB < 5s

---

## Sources

- Прямая инспекция: `/iflat-redesign/src/lib/tv-token.ts`
- Прямая инспекция: `/iflat-redesign/src/app/api/tv/stream/[id]/route.ts`
- Domain knowledge: Node.js event loop, `execSync` vs `spawn` blocking behaviour
- Domain knowledge: Promise concurrency patterns, serial queue via chained Promise
- Domain knowledge: Exponential backoff — circuit breaker patterns (Netflix Hystrix, resilience4j)
- Domain knowledge: Next.js SSR / Vercel timeout constraints (60s function timeout)
- Confidence: HIGH (прямая инспекция конкретного кода + well-established Node.js behaviour)
