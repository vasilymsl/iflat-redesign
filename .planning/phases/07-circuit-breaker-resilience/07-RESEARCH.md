# Phase 7: Circuit Breaker + Resilience - Research

**Researched:** 2026-03-12
**Domain:** Circuit breaker pattern, fast-fail для stream API, static fallback для каналов
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Все изменения только в `src/lib/tv-token.ts` (и/или связанных файлах — route handler `/api/tv/stream/[id]`)
- Нулевые новые зависимости
- MAX_RETRIES_STREAM=1 — stream-запросы фейлятся быстро, не 14s backoff

### Claude's Discretion
- Пороги circuit breaker (consecutiveFailCount=3, totalFailCount — значения на усмотрение Claude)
- Стратегия recovery circuit breaker (half-open, timeout, cooldown)
- Формат логирования срабатывания circuit breaker
- Интеграция static fallback — где именно вставлять fallback из tv-shelves.ts (в getChannels или выше)
- MAX_RETRIES_STREAM=1 vs отдельная переменная retry для stream
- Таймаут stream-запроса (текущий curl `-m 15` → уменьшить для hover UX)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RESIL-01 | Circuit breaker останавливает batch расписаний при 3+ последовательных ошибках | `fetchCurrentPrograms` уже имеет `failCount >= 3` break — нужно усилить до полноценного CB с состоянием `OPEN/CLOSED/HALF_OPEN` и totalFailCount; singleton через `globalThis.__tvScheduleCB` |
| RESIL-02 | Stream-запросы фейлятся быстро (max 1 retry) — не 14 секунд на hover | Отдельная константа `MAX_RETRIES_STREAM = 1` + уменьшить `-m` флаг curl до 5s для stream endpoint; `getStreamUrl` не должен использовать общий `MAX_RETRIES = 3` |
| RESIL-03 | При недоступности API каналов используется статический fallback из `tv-shelves.ts` | `getChannels()` → `fetchChannelsFromApi()` возвращает `[]` при ошибке → fallback на `freeChannels` из `tv-shelves.ts`; нужен import и условие `if (channels.length === 0)` |
</phase_requirements>

## Summary

Фаза 7 добавляет три механизма resilience в `src/lib/tv-token.ts`. Все три изменения хирургические — затрагивают конкретные функции без перестройки архитектуры.

**RESIL-01 (Circuit Breaker):** существующий `failCount` в `fetchCurrentPrograms` — локальная переменная, сбрасываемая при каждом вызове. Нужен persistent state в `globalThis.__tvScheduleCB` с двумя счётчиками: `consecutiveFailCount` (сбрасывается при успехе) и `totalFailCount` (только растёт). Circuit breaker переходит в `OPEN` при `consecutiveFailCount >= 3` и закрывается через cooldown (например, 5 минут). Логирование срабатывания в консоль.

**RESIL-02 (Fast-fail stream):** `getStreamUrl` использует `curlJson` с глобальным `MAX_RETRIES = 3` и `curl -m 15`. Hover-запрос висит 15s * 4 попытки = 60s в худшем случае, реально ~14s до первого timeout. Решение: отдельная функция `curlJsonStream` (или параметр) с `MAX_RETRIES_STREAM = 1` и `curl -m 5`. Итог: максимум 5s + 1 retry = ~10s, реально < 5s при недоступности.

**RESIL-03 (Static fallback):** `fetchChannelsFromApi` возвращает пустой массив при ошибке через `.catch(() => dc.data ?? [])`. Если `dc.data` тоже `null` (первый запуск), `getChannels` возвращает пустой массив → шлейф пустой. Решение: в `getChannels` добавить проверку `if (channels.length === 0)` → возвращать `transformStaticChannels(freeChannels)` из `tv-shelves.ts`.

**Primary recommendation:** Три независимых изменения, реализуемых последовательно. Начать с RESIL-03 (самое простое — одна проверка), затем RESIL-02 (параметр для curl timeout), затем RESIL-01 (circuit breaker state).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins | — | globalThis, Promise, setTimeout | Нулевые зависимости, уже в проекте |
| `src/config/tv-shelves.ts` | — | Static fallback данные | Уже существует, 15 каналов с CDN URLs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `globalThis.__tvScheduleCB` state | Отдельный класс CircuitBreaker | Класс чище, но нет new dep; globalThis паттерн уже используется в проекте |
| `curlJsonStream` с разными параметрами | `AbortController` + fetch | fetch запрещён (QRATOR TLS); curlJsonStream — минимальная дупликация |
| Timeout cooldown (5min) | `HALF_OPEN` probe request | Probe запрос сложнее и рискует добавить запрос при ещё заблокированном API |

## Architecture Patterns

### Паттерн 1: Circuit Breaker через globalThis singleton

**What:** Состояние circuit breaker хранится в `globalThis.__tvScheduleCB` — тот же паттерн, что и `__tvTokenCache`, `__tvScheduleCache`. Объект содержит `consecutiveFailCount`, `totalFailCount`, `openedAt` (timestamp когда CB открылся). Функция `isScheduleCBOpen()` возвращает `true` если `consecutiveFailCount >= SCHEDULE_CB_CONSECUTIVE_FAIL_THRESHOLD`.

**When to use:** Для любого batch-процесса с повторяемыми ошибками, где нужно "остановить кровотечение" и не дать retry storm накопиться в очереди.

**Example:**
```typescript
// Source: классический circuit breaker pattern адаптированный под проект
const SCHEDULE_CB_CONSECUTIVE_THRESHOLD = 3;  // открыть CB
const SCHEDULE_CB_COOLDOWN_MS = 5 * 60 * 1000; // 5 минут cooldown

interface ScheduleCBState {
  consecutiveFailCount: number;
  totalFailCount: number;
  openedAt: number | null;  // null = CB закрыт
}

declare global {
  var __tvScheduleCB: ScheduleCBState | undefined;
}

function getScheduleCB(): ScheduleCBState {
  if (!globalThis.__tvScheduleCB) {
    globalThis.__tvScheduleCB = {
      consecutiveFailCount: 0,
      totalFailCount: 0,
      openedAt: null,
    };
  }
  return globalThis.__tvScheduleCB;
}

function isScheduleCBOpen(): boolean {
  const cb = getScheduleCB();
  if (cb.openedAt === null) return false;
  // Cooldown истёк — переходим в half-open (пробуем снова)
  if (Date.now() - cb.openedAt > SCHEDULE_CB_COOLDOWN_MS) {
    cb.openedAt = null;
    cb.consecutiveFailCount = 0;
    console.log("[tv-token] Schedule circuit breaker: cooldown expired, retrying batch");
    return false;
  }
  return true;
}

function recordScheduleSuccess() {
  const cb = getScheduleCB();
  cb.consecutiveFailCount = 0;
  // totalFailCount не сбрасывается — только растёт
}

function recordScheduleFailure() {
  const cb = getScheduleCB();
  cb.consecutiveFailCount++;
  cb.totalFailCount++;
  if (cb.consecutiveFailCount >= SCHEDULE_CB_CONSECUTIVE_THRESHOLD && cb.openedAt === null) {
    cb.openedAt = Date.now();
    console.warn(
      `[tv-token] Schedule circuit breaker OPEN: ${cb.consecutiveFailCount} consecutive failures, ` +
      `total=${cb.totalFailCount}. Stopping batch for ${SCHEDULE_CB_COOLDOWN_MS / 60000}min.`
    );
  }
}
```

### Паттерн 2: fetchCurrentPrograms с полноценным CB

**What:** Замена локального `failCount` на вызовы `isScheduleCBOpen()`, `recordScheduleSuccess()`, `recordScheduleFailure()`.

**Example:**
```typescript
async function fetchCurrentPrograms(channelIds: number[]): Promise<Map<number, CurrentProgramInfo>> {
  const sc = initScheduleCache();
  if (sc.data.size > 0 && Date.now() < sc.expiresAt) {
    return sc.data;
  }

  // Проверяем CB ДО получения токена — экономим запрос
  if (isScheduleCBOpen()) {
    console.warn("[tv-token] Schedule circuit breaker is OPEN, skipping batch");
    return sc.data.size > 0 ? sc.data : new Map();
  }

  const token = await getGuestToken();
  const nowSec = Math.floor(Date.now() / 1000);
  const result = new Map<number, CurrentProgramInfo>();

  for (const chId of channelIds) {
    // Проверяем CB внутри цикла тоже — ошибки могут накопиться в ходе batch
    if (isScheduleCBOpen()) {
      console.warn(`[tv-token] Schedule CB opened mid-batch, stopping at channel ${chId}`);
      break;
    }

    try {
      const schedule = await curlJson(
        "GET",
        `${TV_API_BASE}/v2/channels/${chId}/schedule?access_token=${token}`
      ) as ScheduleEntry[];

      if (Array.isArray(schedule)) {
        const current = schedule.find(
          s => s.timestamp <= nowSec && (s.timestamp + s.duration) > nowSec
        );
        if (current?.img?.src) {
          result.set(chId, {
            title: current.program?.title ?? "",
            img: ensureHttps(current.img.src),
          });
        }
        recordScheduleSuccess();
      }
    } catch {
      recordScheduleFailure();
    }
  }

  if (result.size > 0) {
    sc.data = result;
    sc.expiresAt = Date.now() + SCHEDULE_CACHE_TTL;
  }
  return result;
}
```

### Паттерн 3: Fast-fail stream через curlJsonStream

**What:** Отдельная функция для stream-запросов с уменьшенным timeout и MAX_RETRIES_STREAM=1. Не меняет глобальный `curlJson` — stream-запросы интерактивные, require быстрый fail.

**Example:**
```typescript
const MAX_RETRIES_STREAM = 1;           // 1 retry вместо 3
const STREAM_CURL_TIMEOUT_SEC = 5;      // 5s вместо 15s

/**
 * curlJson для интерактивных stream-запросов: быстрый fail.
 * Не идёт через общий requestQueue — stream-запрос не должен
 * блокировать schedule batch и наоборот.
 * MAX_RETRIES_STREAM=1, timeout=5s.
 */
async function curlJsonStream(url: string): Promise<unknown> {
  const args = [
    "curl", "-s", "-m", String(STREAM_CURL_TIMEOUT_SEC),
    "-X", "GET",
    "-H", "Accept: application/json",
    "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    url,
  ];

  const cmd = args.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(" ");

  for (let attempt = 0; attempt <= MAX_RETRIES_STREAM; attempt++) {
    try {
      const stdout = execSync(cmd, {
        encoding: "utf-8",
        timeout: (STREAM_CURL_TIMEOUT_SEC + 2) * 1000,  // чуть больше curl timeout
        stdio: ["pipe", "pipe", "pipe"],
      });
      return JSON.parse(stdout);
    } catch (err) {
      if (attempt === MAX_RETRIES_STREAM) throw err;
      // Короткая пауза перед retry — не exponential backoff
      await sleep(500);
    }
  }
  throw new Error("Unreachable");
}
```

**Важный вопрос: нужен ли requestQueue для stream?**

Stream-запрос — интерактивный (triggered hover). Schedule batch — фоновый. Если stream идёт через общий `requestQueue`, он встаёт за 15 уже ожидающими schedule-запросами и ждёт 15 * 350ms = 5.25s только в очереди. Это неприемлемо для hover UX.

**Решение:** `curlJsonStream` обходит `requestQueue`. Stream-запросы параллельны с batch и друг с другом. Это безопасно — stream-endpoint является отдельным ресурсом API, не rate-limited так же строго как schedule.

### Паттерн 4: Static fallback в getChannels

**What:** Если API вернул пустой массив (ошибка или первый запуск при недоступности), вернуть `freeChannels` из `tv-shelves.ts` в формате, совместимом с возвращаемым типом `getChannels()`.

**Example:**
```typescript
import { freeChannels } from "@/config/tv-shelves";

export async function getChannels(): Promise<{...}[]> {
  const dc = initChannelsCache();
  let channels: ChannelApiItem[];

  if (dc.data && Date.now() < dc.expiresAt) {
    channels = dc.data;
  } else if (dc.inflightPromise) {
    channels = await dc.inflightPromise;
  } else {
    dc.inflightPromise = fetchChannelsFromApi()
      .then(items => {
        dc.data = items;
        dc.expiresAt = Date.now() + DATA_CACHE_TTL;
        return items;
      })
      .catch(err => {
        console.error("[tv-token] Failed to fetch channels:", err);
        return dc.data ?? [];
      })
      .finally(() => { dc.inflightPromise = null; });
    channels = await dc.inflightPromise;
  }

  // RESIL-03: fallback на статические данные если API вернул пустой массив
  if (channels.length === 0) {
    console.warn("[tv-token] API channels empty, using static fallback from tv-shelves.ts");
    return freeChannels.map(ch => ({
      id: ch.id,
      name: ch.name,
      logo: ch.logo,
      currentProgram: ch.currentProgram,
      thumbnail: ch.thumbnail,
    }));
  }

  // ... остальная логика (фильтрация, расписание, transform)
}
```

**Важно:** `freeChannels` из `tv-shelves.ts` уже имеет поле `progress` которого нет в возвращаемом типе `getChannels`. Маппинг должен явно выбрать только нужные поля.

### Anti-Patterns to Avoid

- **Один большой circuit breaker для всего:** schedule CB и stream должны быть независимы. Проблемы с расписанием не должны блокировать stream и наоборот.
- **totalFailCount как порог открытия CB:** totalFailCount не сбрасывается при успехе, поэтому не подходит для открытия CB. Используем только `consecutiveFailCount` для открытия. `totalFailCount` — для диагностики в логах.
- **curlJsonStream через requestQueue:** stream-запрос в общей очереди может ждать 5+ секунд за schedule batch — хуже чем без CB.
- **Fallback без логирования:** молчаливый fallback скрывает проблемы. Всегда логировать `[tv-token] Using static fallback`.
- **import tv-shelves.ts без проверки цикличного импорта:** `tv-shelves.ts` импортирует типы из компонентов (`ChannelData`, `ContentItem`) — нужно убедиться что `tv-token.ts` → `tv-shelves.ts` не создаёт циклический импорт.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Circuit breaker с retry accounting | Свой класс CircuitBreaker с event emitter | `globalThis` object + 4 функции | Overkill; для 1 процесса достаточно plain object в globalThis |
| Stream timeout | Promise.race + setTimeout | `curl -m 5` флаг (уже есть шаблон) | curl handle timeout нативно; Promise.race не поможет если execSync блокирует |
| Канал-список для fallback | Хардкод в tv-token.ts | `freeChannels` из tv-shelves.ts | Данные уже есть с реальными CDN URL; дублирование нарушит DRY |

**Key insight:** Circuit breaker для одного API endpoint в одном процессе — это буквально 4 функции и 1 объект состояния. Не нужна библиотека.

## Common Pitfalls

### Pitfall 1: curlJsonStream блокирует event loop дольше заявленного

**What goes wrong:** `execSync` с timeout=7000ms (5s curl + 2s buffer) блокирует event loop на ВСЁ время выполнения. Если curl завис (не timeout), блокировка длится до `execSync.timeout`. При 2 параллельных hover-запросах — 2 одновременных блокировки.

**Why it happens:** `execSync` синхронный по природе. Нет способа сделать его неблокирующим без spawn/Promise. (spawn — Future Requirement, не Phase 7)

**How to avoid:** Установить `-m 5` для curl И `timeout: 7000` для execSync — оба должны быть. Принять факт блокировки как known limitation (задокументировать в комментарии).

**Warning signs:** Dev-сервер "зависает" на hover при медленном API — это норм behaviour при execSync, не баг в логике.

### Pitfall 2: CB state сбрасывается при hot-reload

**What goes wrong:** В dev режиме Next.js делает hot-reload. `globalThis.__tvScheduleCB` может сброситься, если модуль перезагружается. CB открылся → hot-reload → CB закрылся → retry storm снова.

**Why it happens:** Hot-reload пересоздаёт модули. `globalThis` персистирует между hot-reload только если инициализация через `if (!globalThis.__tvScheduleCB)`.

**How to avoid:** Используем уже установленный паттерн `if (!globalThis.__tvScheduleCache)` → CB state инициализируется так же — если `globalThis.__tvScheduleCB` уже существует, не перезаписываем.

**Warning signs:** В dev CB открывается и тут же закрывается при hot-reload.

### Pitfall 3: Цикличный импорт tv-shelves.ts

**What goes wrong:** `tv-shelves.ts` импортирует `ChannelData` из `@/components/sections/ChannelCard` и `ContentItem` из `@/components/sections/ContentShelf`. Если `tv-token.ts` импортирует из `tv-shelves.ts`, а компоненты импортируют `getChannels` из `tv-token.ts` (через API routes) — потенциально цикл.

**Why it happens:** `app/page.tsx` → `getChannels()` → `tv-token.ts` → `tv-shelves.ts` → `ChannelCard` → нет импорта tv-token. Цикла нет. Но нужно проверить.

**How to avoid:** Перед реализацией проверить что `ChannelCard.tsx` и `ContentShelf.tsx` НЕ импортируют из `tv-token.ts` напрямую. Альтернатива: в `tv-token.ts` использовать тип `ChannelData` без импорта (inline return type).

**Warning signs:** `Error: Cannot access before initialization` или circular dependency warning при build.

### Pitfall 4: `freeChannels` содержит `progress` поля

**What goes wrong:** `freeChannels` в `tv-shelves.ts` имеет поле `progress: number`. Возвращаемый тип `getChannels()` не включает `progress`. TypeScript выдаст ошибку если маппинг не явный.

**Why it happens:** `tv-shelves.ts` использует `ChannelData` тип который включает `progress` для визуального индикатора.

**How to avoid:** В маппинге fallback явно деструктурировать только `id, name, logo, currentProgram, thumbnail`.

### Pitfall 5: Schedule CB сбрасывает consecutiveFailCount при кешированном ответе

**What goes wrong:** Если `fetchCurrentPrograms` вернула кешированные данные (schedule cache hit), функция не вызывает `recordScheduleSuccess()`. При следующем вызове (после истечения кеша) CB уже не OPEN (cooldown прошёл), но `consecutiveFailCount` мог быть = 2. Один успех при real request должен сбросить до 0.

**Why it happens:** `recordScheduleSuccess()` вызывается только при реальном успешном API-запросе внутри цикла, не при cache hit.

**How to avoid:** Это корректное поведение — cache hit не подтверждает что API доступен. `consecutiveFailCount` сбрасывается только при успешном реальном запросе. Задокументировать в комментарии.

## Code Examples

### Структура изменений в tv-token.ts

```typescript
// Source: анализ существующего кода + классический circuit breaker pattern

// ── ДОБАВИТЬ: Circuit breaker constants ───────────────────────
const SCHEDULE_CB_CONSECUTIVE_THRESHOLD = 3;
const SCHEDULE_CB_COOLDOWN_MS = 5 * 60 * 1000; // 5 минут

// ── ДОБАВИТЬ: Stream constants ────────────────────────────────
const MAX_RETRIES_STREAM = 1;
const STREAM_CURL_TIMEOUT_SEC = 5;

// ── ДОБАВИТЬ: globalThis CB state ─────────────────────────────
interface ScheduleCBState {
  consecutiveFailCount: number;
  totalFailCount: number;
  openedAt: number | null;
}

declare global {
  var __tvScheduleCB: ScheduleCBState | undefined;
}
```

### getStreamUrl с fast-fail

```typescript
export async function getStreamUrl(internalId: string): Promise<string | null> {
  const apiId = CHANNEL_ID_MAP[internalId];
  if (!apiId) {
    console.warn(`[tv-token] No API id mapping for channel: ${internalId}`);
    return null;
  }

  try {
    const token = await getGuestToken();
    // Используем curlJsonStream (MAX_RETRIES_STREAM=1, curl -m 5) вместо curlJson
    const data = await curlJsonStream(
      `${TV_API_BASE}/v2/channels/${apiId}/stream?access_token=${token}&force_https=true`
    ) as { hls?: string; hls_mbr?: string; status_code?: number; error_code?: string };

    if (data.status_code === 401) {
      console.warn(`[tv-token] 401 for stream ${internalId}, refreshing token...`);
      invalidateToken();
      await sleep(DELAY_AUTH_STEP_MS);
      const freshToken = await getGuestToken();
      // Один retry (MAX_RETRIES_STREAM уже использован в curlJsonStream)
      const retryData = await curlJsonStream(
        `${TV_API_BASE}/v2/channels/${apiId}/stream?access_token=${freshToken}&force_https=true`
      ) as { hls?: string; hls_mbr?: string };
      return retryData.hls_mbr || retryData.hls || null;
    }

    if (data.error_code) {
      console.error(`[tv-token] Stream error for ${internalId}: ${data.error_code}`);
      return null;
    }

    return data.hls_mbr || data.hls || null;
  } catch (error) {
    console.error(`[tv-token] Stream request failed for ${internalId}:`, error);
    return null;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Локальный `failCount` в fetchCurrentPrograms | Persistent `globalThis.__tvScheduleCB` с OPEN/CLOSED | Phase 7 | CB выживает между вызовами fetchCurrentPrograms |
| `getStreamUrl` использует `MAX_RETRIES=3`, `curl -m 15` | `curlJsonStream` с `MAX_RETRIES_STREAM=1`, `curl -m 5` | Phase 7 | Hover-ответ за ≤5s при недоступности (было ≤14s+) |
| `getChannels` возвращает `[]` при ошибке API | Fallback на `freeChannels` из `tv-shelves.ts` | Phase 7 | Шлейф всегда показывает данные |

**Deprecated/outdated после Phase 7:**
- Локальная переменная `failCount` в `fetchCurrentPrograms` — заменяется CB state
- `curlJson` для stream endpoint — заменяется `curlJsonStream`

## Open Questions

1. **Нужно ли отделять stream-запросы от requestQueue полностью?**
   - What we know: Stream через requestQueue ждёт schedule batch (до 15 * 350ms = 5.25s в очереди)
   - What's unclear: Насколько часто schedule batch запускается одновременно с hover
   - Recommendation: `curlJsonStream` обходит `requestQueue` — stream и schedule независимы. Это правильно, так как у них разные rate-limit profiles.

2. **Cooldown vs Half-Open probe для CB recovery**
   - What we know: Half-open позволяет быстрее восстановиться; cooldown проще реализовать
   - What's unclear: Насколько быстро 24h.tv API восстанавливается после QRATOR блокировки
   - Recommendation: Cooldown 5 минут достаточен. Half-open probe добавляет лишний запрос при ещё заблокированном API. При cooldown — автоматически "half-open" при первом запросе после 5 минут.

3. **totalFailCount threshold**
   - What we know: CONTEXT.md: "totalFailCount — значения на усмотрение Claude"
   - Recommendation: Не использовать totalFailCount для открытия CB — только для диагностики в логах. Только `consecutiveFailCount >= 3` открывает CB.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Нет тест-фреймворка (из Phase 6 research) |
| Config file | Нет |
| Quick run command | `npx tsc --noEmit` |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RESIL-01 | CB открывается при 3+ consecutive fails, виден в логах | manual | Dev-сервер: блокировать API → наблюдать лог `circuit breaker OPEN` | ❌ manual |
| RESIL-01 | CB закрывается через cooldown, batch возобновляется | manual | Подождать 5min после открытия CB → наблюдать `cooldown expired` | ❌ manual |
| RESIL-02 | Stream endpoint отвечает за ≤5s при недоступности | manual | Hover канала при заблокированном API → таймер в DevTools | ❌ manual |
| RESIL-02 | MAX_RETRIES_STREAM=1 в коде | grep | `grep -n "MAX_RETRIES_STREAM" src/lib/tv-token.ts` | ❌ Wave 0 |
| RESIL-03 | При пустом ответе API шлейф показывает static data | manual | Сломать fetchChannelsFromApi → проверить что каналы отображаются | ❌ manual |
| RESIL-03 | `freeChannels` импортирован в tv-token.ts | grep | `grep -n "freeChannels" src/lib/tv-token.ts` | ❌ Wave 0 |
| All | TypeScript без ошибок | automated | `npx tsc --noEmit` | ✅ |
| All | Build проходит | automated | `npm run build` | ✅ |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` — проверка типов
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** build зелёный + ручная проверка каждого RESIL через логи dev-сервера

### Wave 0 Gaps
- [ ] Нет grep-тестов — могут быть добавлены как npm scripts, но не обязательны для Phase 7
- [ ] Нет jest/vitest — runtime circuit breaker state не тестируется автоматически (приемлемо для 1-файлового изменения)

*(Если проект добавит тест-фреймворк в будущем: unit-тест для `isScheduleCBOpen()` и `recordScheduleFailure()` тривиален — чистые функции с globalThis state)*

## Sources

### Primary (HIGH confidence)
- `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/lib/tv-token.ts` — полный анализ кода, строки 567-614 (`fetchCurrentPrograms` с `failCount`)
- `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/config/tv-shelves.ts` — структура `freeChannels` и типы
- `.planning/phases/07-circuit-breaker-resilience/07-CONTEXT.md` — locked decisions и code context
- `.planning/REQUIREMENTS.md` — RESIL-01, RESIL-02, RESIL-03 определения

### Secondary (MEDIUM confidence)
- `.planning/phases/06-core-rate-limit-fix/06-RESEARCH.md` — паттерн `globalThis` singleton, Promise mutex архитектура
- `.planning/STATE.md` — decision: MAX_RETRIES_STREAM=1

### Tertiary (LOW confidence)
- Значение cooldown 5 минут — эмпирическая оценка (нет данных о том, как долго QRATOR держит блокировку)
- Значение `STREAM_CURL_TIMEOUT_SEC=5` — оценка для hover UX (3-4s success criteria из Phase 7 description → 5s timeout с запасом)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — нулевые зависимости, анализ реального кода
- Architecture (CB state): HIGH — globalThis паттерн уже используется в проекте, применяем тот же
- Architecture (curlJsonStream): HIGH — минимальный вариант существующего curlJson
- Architecture (static fallback): HIGH — прямой импорт существующего файла
- Pitfalls: HIGH — выявлены из анализа реального кода (circular import риск, progress field)
- Threshold values (cooldown, STREAM_CURL_TIMEOUT_SEC): MEDIUM — разумные оценки без официальных данных

**Research date:** 2026-03-12
**Valid until:** 2026-06-12 (стабильный домен — паттерны не изменятся)
