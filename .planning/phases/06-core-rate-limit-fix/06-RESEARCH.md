# Phase 6: Core Rate-Limit Fix - Research

**Researched:** 2026-03-12
**Domain:** Node.js concurrency, Promise mutex, async rate-limiting, execSync elimination
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Все изменения только в `src/lib/tv-token.ts`
- Нулевые новые зависимости (только стандартная Node.js runtime + TypeScript)

### Claude's Discretion
- Тайминги: 350ms/500ms хардкод vs env/конфиг
- Поведение очереди при множественных concurrent запросах
- Уровень логирования rate-limit поведения
- Стратегия миграции execSync sleep → async sleep (полное удаление curlJsonSync или сохранение для fallback)
- Детали реализации Promise mutex (простая цепочка vs Semaphore-паттерн)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RATE-01 | Запросы расписаний каналов идут последовательно с гарантированной паузой ≥350ms | Promise mutex гарантирует serialization — каждый вызов curlJson встаёт в очередь и ждёт предыдущего + delay |
| RATE-02 | Race condition на `lastRequestAt` устранён — параллельные вызовы не обходят задержку | Promise-chain mutex устраняет race: `lastRequestPromise = lastRequestPromise.then(() => doRequest())` |
| RATE-03 | Auth-flow (4 шага) выполняется с паузами ≥500ms между шагами | Уже реализовано через `await sleep(DELAY_AUTH_STEP_MS)` — при async curlJson сохраняется |
| PERF-01 | `execSync('sleep')` заменён на async sleep — event loop не блокируется | curlJsonSync вызывает execSync для sleep; замена на async в curlJson + удаление sleep из curlJsonSync |
</phase_requirements>

## Summary

В `tv-token.ts` есть два взаимосвязанных дефекта. Первый — race condition на переменной `lastRequestAt`: функция `curlJson` читает её, вычисляет оставшееся время, затем вызывает `curlJsonSync`, который читает её снова. При двух параллельных вызовах оба потока видят "достаточно времени прошло" на этапе проверки в `curlJson`, оба передают управление в `curlJsonSync`, оба записывают `lastRequestAt = Date.now()` — и оба выполняют запрос без паузы. Второй дефект — `curlJsonSync` использует `execSync('sleep N')` для ожидания задержки, что блокирует весь Node.js event loop.

Решение — Promise mutex через цепочку: `requestQueue = requestQueue.then(() => actualRequest())`. Это гарантирует строгую очерёдность: следующий запрос начинается только после завершения предыдущего. `sleep()` уже существует в коде (строка 28-30), константы задержек уже определены (строки 23-24). Вся работа — добавить одну переменную `requestQueue` и переписать `curlJson` так, чтобы он цеплял задержку + curl в эту цепочку, вместо чтения `lastRequestAt`.

`curlJsonSync` должен потерять логику sleep, но сам curl через `execSync` остаётся (его нельзя заменить — QRATOR блокирует Node.js fetch по TLS fingerprint JA3). В итоге `curlJson` = async оркестратор очереди + await sleep + вызов `curlJsonSync` только для самого curl-запроса.

**Primary recommendation:** Реализовать Promise-chain mutex через одну переменную `requestQueue: Promise<void>` на уровне модуля. Добавить sleep перед каждым curl-запросом внутри цепочки. Убрать execSync sleep из curlJsonSync. Никаких новых зависимостей.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins | — | Promise, setTimeout | Нулевые зависимости, уже в проекте |
| TypeScript | — | Типизация mutex | Уже в проекте |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Promise-chain mutex | `async-mutex` npm package | Npm пакет запрещён по условию задачи; Promise-chain достаточен для 1 процесса |
| Promise-chain mutex | `p-limit` npm package | Аналогично — внешняя зависимость, не нужна |
| Promise-chain mutex | Semaphore с счётчиком | Overkill для одновременности 1 (sequential queue), сложнее отлаживать |
| execSync curl | child_process.spawn Promise | Валидное улучшение, но явно в Future Requirements (REQUIREMENTS.md); не в Phase 6 |

## Architecture Patterns

### Паттерн 1: Promise-Chain Mutex (Sequential Queue)

**What:** Единственная переменная `requestQueue: Promise<void>` хранит "конец очереди". Каждый новый запрос цепляется через `.then()` и добавляет задержку перед своим выполнением. После завершения очередь обновляется.

**When to use:** Когда нужна строгая сериализация с паузами между операциями. Идеально для rate-limiting к одному API endpoint без backpressure.

**Ключевые свойства:**
- Без внешних зависимостей
- Без счётчиков и флагов — просто цепочка Promise
- FIFO порядок гарантирован самой природой Promise.then
- Очередь растёт только пока есть активные запросы, после — Promise<void> resolved немедленно

**Example:**
```typescript
// Source: Node.js core — стандартный паттерн Promise serialization
let requestQueue: Promise<void> = Promise.resolve();

async function curlJson(method: string, url: string, body?: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    requestQueue = requestQueue
      .then(async () => {
        await sleep(DELAY_BETWEEN_REQUESTS_MS);
        try {
          resolve(curlJsonSync(method, url, body));
        } catch (err) {
          reject(err);
        }
      })
      .catch(() => {
        // Предыдущая задача упала — не ломаем цепочку
        // reject уже вызван выше
      });
  });
}
```

**Важный нюанс:** `requestQueue` нужно цеплять ПЕРЕД `await` — иначе Promise.then создаётся в текущем микротаске, но следующий вызов может "встрять" до момента присваивания. Правильный паттерн: присвоение `requestQueue = requestQueue.then(...)` должно быть синхронным, до любого await.

### Паттерн 2: Упрощённый вариант (рекомендованный)

Более читаемый и надёжный вариант без вложенных Promise-конструкторов:

```typescript
// Source: стандартный Node.js паттерн sequential queue
let requestQueue: Promise<void> = Promise.resolve();

async function curlJson(method: string, url: string, body?: unknown): Promise<unknown> {
  // Синхронно захватываем текущий конец очереди
  const waitForPrev = requestQueue;

  // Создаём слот в очереди СИНХРОННО (до любого await)
  let releaseSlot!: () => void;
  requestQueue = new Promise<void>(resolve => { releaseSlot = resolve; });

  // Ждём предыдущего, потом выполняем
  await waitForPrev;
  await sleep(DELAY_BETWEEN_REQUESTS_MS);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = curlJsonSync(method, url, body);
      releaseSlot();
      return result;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        releaseSlot();
        throw err;
      }
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(`[tv-token] Retry ${attempt + 1}/${MAX_RETRIES}...`);
      await sleep(delay);
    }
  }
  throw new Error("Unreachable");
}
```

Этот вариант: (1) синхронно "бронирует" место в очереди, (2) ждёт предыдущего, (3) делает pause, (4) выполняет curl, (5) освобождает слот.

### Изменения в curlJsonSync

После переноса логики sleep в `curlJson`, функция `curlJsonSync` становится чистым исполнителем curl без sleep:

```typescript
function curlJsonSync(method: string, url: string, body?: unknown): unknown {
  // УБИРАЕМ: проверку lastRequestAt и execSync sleep
  // УБИРАЕМ: lastRequestAt = Date.now()
  // Оставляем только curl + JSON.parse

  const args = [
    "curl", "-s", "-m", "15",
    "-X", method,
    // ... заголовки ...
  ];
  if (body) args.push("-d", JSON.stringify(body));
  args.push(url);

  const cmd = args.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(" ");

  const stdout = execSync(cmd, {
    encoding: "utf-8",
    timeout: 20_000,
    stdio: ["pipe", "pipe", "pipe"],
  });

  return JSON.parse(stdout);
}
```

Переменная `lastRequestAt` удаляется полностью — она больше не нужна при mutex-подходе.

### Логирование очереди (Claude's Discretion)

Минимальный уровень логирования — полезен для диагностики:

```typescript
// Только при задержке > 0 (есть ожидание)
console.debug(`[tv-token] Rate-limit: waiting ${waitMs}ms before ${method} ${url.slice(0, 50)}`);
```

Recommendation: НЕ логировать каждый запрос — при 15 каналах расписания это 15 строк. Логировать только если `queueDepth > 1` или задержка > DELAY_BETWEEN_REQUESTS_MS * 2.

### Anti-Patterns to Avoid

- **Проверять `lastRequestAt` без mutex:** исходная проблема — чтение-вычисление-запись не атомарно. Mutex устраняет необходимость в этой переменной.
- **`requestQueue = requestQueue.then(fn)` после await:** к этому моменту другой вызов уже мог захватить старый `requestQueue`. Присвоение должно быть синхронным.
- **Игнорировать ошибки в цепочке:** если `prev.then(fn)` и `fn` бросает, `requestQueue` становится rejected Promise — следующий `.then()` пропустится. Нужно `releaseSlot()` в блоке catch или finally.
- **Оставлять execSync sleep:** даже один `execSync('sleep 0.35')` блокирует event loop на 350ms — все входящие HTTP-запросы к Next.js зависают.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Счётчик очереди | `queueDepth++/--` + condition variable | Promise-chain mutex | Счётчики требуют атомарности; Promise-chain естественно сериализует |
| Таймаут на весь запрос | `Promise.race([curl, timeout])` | curl `-m 15` флаг (уже есть) | curl timeout уже установлен; дублировать не нужно |
| Метрики rate-limit | Отдельный класс RateLimiter | Простая переменная `requestQueue` | 1 файл, 1 процесс, 15 каналов — YAGNI |

**Key insight:** Для одного Node.js процесса с последовательными curl-запросами к одному API, Promise-chain mutex из 3 строк надёжнее и понятнее любой библиотеки rate-limiter.

## Common Pitfalls

### Pitfall 1: Синхронность присвоения requestQueue

**What goes wrong:** Если написать `await something; requestQueue = requestQueue.then(fn)`, то между `await` и присвоением другой параллельный вызов может выполнить своё присвоение, используя тот же "старый" `requestQueue`. Два вызова встают не в одну очередь.

**Why it happens:** `await` возвращает управление event loop. За это время может выполниться другой микротаск.

**How to avoid:** Присваивание `requestQueue = ...` должно быть первой синхронной операцией в функции, до любого `await`.

**Warning signs:** В логах видны два параллельных запроса с интервалом < DELAY_BETWEEN_REQUESTS_MS.

### Pitfall 2: releaseSlot не вызывается при ошибке

**What goes wrong:** Если `curlJsonSync` бросает исключение, а `releaseSlot()` не вызван в `finally`, `requestQueue` навсегда "завис" — следующие запросы никогда не выполнятся (deadlock).

**Why it happens:** Исключение пропускает код после throw.

**How to avoid:** `releaseSlot()` в блоке `finally` или явно в каждом catch.

**Warning signs:** Сервер перестаёт отвечать на hover-запросы после первой ошибки curl.

### Pitfall 3: execSync("sleep") остался в curlJsonSync

**What goes wrong:** После добавления `await sleep()` в `curlJson`, в `curlJsonSync` остаётся `execSync('sleep ...')`. Теперь каждый запрос ждёт дважды, и event loop всё ещё блокируется.

**Why it happens:** Забыли удалить старую логику при рефакторинге.

**How to avoid:** Удалить весь блок `if (elapsed < DELAY_BETWEEN_REQUESTS_MS)` из `curlJsonSync` и переменную `lastRequestAt`.

### Pitfall 4: Retry внутри или снаружи mutex

**What goes wrong:** Если retry-логика находится снаружи mutex-захвата, каждый retry снова встаёт в конец очереди — при 3 retry и 15 каналах это 45 слотов вместо 15. Если retry внутри — задержка backoff (2s, 4s, 8s) держит mutex заблокированным, блокируя ВСЕ другие запросы.

**How to avoid:** Retry с exponential backoff должен быть ВНУТРИ захваченного слота mutex (как в текущем коде). Delay между retry — через `await sleep()`, не через новый mutex-захват. Это правильное поведение — при ошибке лучше задержать очередь, чем дать параллельным запросам пройти к упавшему API.

### Pitfall 5: Auth flow (fetchCurrentPrograms) и mutex

**What goes wrong:** `fetchCurrentPrograms` итерирует 15 каналов в `for...of` и вызывает `curlJson` для каждого. При mutex это будет работать корректно — каждый вызов встанет в очередь. Но нужно убедиться, что `getGuestToken()` внутри тоже идёт через тот же mutex (сейчас `getStreamUrl` вызывает `curlJson` для token — если getGuestToken делает curlJson, всё корректно).

**How to avoid:** Убедиться что ВСЕ вызовы curlJson (включая из auth flow) идут через одну общую `requestQueue`.

## Code Examples

### Итоговая структура изменений

```typescript
// Source: паттерн Promise-chain mutex для Node.js rate-limiting

// УДАЛИТЬ:
let lastRequestAt = 0;

// ДОБАВИТЬ:
let requestQueue: Promise<void> = Promise.resolve();

// curlJsonSync — убрать sleep, оставить только curl:
function curlJsonSync(method: string, url: string, body?: unknown): unknown {
  // Вся логика rate-limit УДАЛЕНА (была строки 223-228)
  // lastRequestAt УДАЛЕНА (была строка 246)

  const args = ["curl", "-s", "-m", "15", "-X", method,
    "-H", "Content-Type: application/json",
    "-H", "Accept: application/json",
    "-H", "User-Agent: Mozilla/5.0 ...",
  ];
  if (body) args.push("-d", JSON.stringify(body));
  args.push(url);
  const cmd = args.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(" ");
  const stdout = execSync(cmd, { encoding: "utf-8", timeout: 20_000, stdio: ["pipe", "pipe", "pipe"] });
  return JSON.parse(stdout);
}

// curlJson — добавить mutex:
async function curlJson(method: string, url: string, body?: unknown): Promise<unknown> {
  // 1. Синхронно захватить место в очереди
  const waitForPrev = requestQueue;
  let releaseSlot!: () => void;
  requestQueue = new Promise<void>(resolve => { releaseSlot = resolve; });

  // 2. Дождаться предыдущего
  await waitForPrev;

  // 3. Задержка rate-limit (DELAY_BETWEEN_REQUESTS_MS уже определён)
  await sleep(DELAY_BETWEEN_REQUESTS_MS);

  // 4. Выполнить с retry
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = curlJsonSync(method, url, body);
      releaseSlot();
      return result;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        releaseSlot();
        throw err;
      }
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(`[tv-token] Retry ${attempt + 1}/${MAX_RETRIES + 1} in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw new Error("Unreachable");
}
```

### Константы (именованные, Claude's Discretion — рекомендация хардкод)

Рекомендация: оставить хардкодом (уже существуют в строках 23-24). ENV-переменные добавляют сложность без практической пользы — значения задержек подобраны эмпирически для конкретного QRATOR, менять их при деплое не нужно.

```typescript
const DELAY_BETWEEN_REQUESTS_MS = 350;  // пауза между запросами к API (QRATOR empirical)
const DELAY_AUTH_STEP_MS = 500;          // пауза между шагами auth-flow
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 2000;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| elapsed-time check (`lastRequestAt`) | Promise-chain mutex | Phase 6 | Eliminates race condition completely |
| `execSync('sleep N')` | `await sleep(N)` | Phase 6 | Event loop остаётся отзывчивым |
| Двойная проверка (curlJson + curlJsonSync) | Единая точка в curlJson | Phase 6 | Нет дублирования логики |

**Deprecated/outdated:**
- `lastRequestAt` переменная: устарела после внедрения mutex — удалить полностью
- `execSync('sleep ...')` в curlJsonSync: устарел — заменить на пустую функцию или удалить блок целиком

## Open Questions

1. **Поведение при N > MAX_RETRIES провалах подряд**
   - What we know: queue `releaseSlot()` вызывается при финальном throw — очередь не зависает
   - What's unclear: нужен ли circuit breaker (RESIL-01) в этой же функции или отдельно (Phase 7)
   - Recommendation: Phase 6 только mutex + async sleep. Circuit breaker — в Phase 7 как запланировано.

2. **Логирование глубины очереди**
   - What we know: нет счётчика depth без дополнительного кода
   - What's unclear: нужно ли для диагностики
   - Recommendation: не добавлять в Phase 6. Диагностика через паузы в логах достаточна.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest / Vitest (определить по конфигу проекта) |
| Config file | Не обнаружен — Wave 0 gap |
| Quick run command | `npx tsc --noEmit` (TypeScript check без runtime) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RATE-01 | Пауза ≥350ms между запросами schedule | manual | Проверить в логах dev-сервера при hover нескольких карточек | ❌ manual |
| RATE-02 | Параллельные вызовы не обходят задержку | unit | TypeScript проверяет структуру; race condition — ручное тестирование | ❌ manual |
| RATE-03 | Auth-flow с паузами ≥500ms | manual | Логи dev-сервера при первом запуске (проверить timestamp) | ❌ manual |
| PERF-01 | Нет execSync sleep | lint/grep | `grep -n "execSync.*sleep" src/lib/tv-token.ts` — должно возвращать 0 строк | ✅ grep |

Примечание: Runtime-тестирование rate-limit race condition требует реальных параллельных HTTP-запросов. Юнит-тест невозможен без мокирования execSync + таймингов. Валидация — ручная (dev-сервер + логи).

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` — проверка типов
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** `npm run build` зелёный + ручная проверка паузы в логах

### Wave 0 Gaps
- [ ] Нет тест-инфраструктуры для tv-token.ts — runtime race condition тестируется вручную
- [ ] Нет Jest/Vitest конфига — тесты не обязательны для этой Phase (изменение в 1 файле)

## Sources

### Primary (HIGH confidence)
- `src/lib/tv-token.ts` строки 1-286 — прямой анализ исходного кода, race condition задокументирован
- Node.js docs: Promise chaining (MDN) — Promise-chain mutex — стандартный паттерн
- Node.js docs: `child_process.execSync` blocking — event loop блокировка подтверждена

### Secondary (MEDIUM confidence)
- Паттерн "sequential promise queue" — широко используется в community без внешних зависимостей
- QRATOR rate-limit behaviour — задокументировано в STATE.md и MEMORY.md проекта

### Tertiary (LOW confidence)
- Значения задержек 350ms/500ms — эмпирически подобраны (нет официальной документации 24h.tv API)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — нулевые зависимости, стандартные Node.js примитивы
- Architecture: HIGH — код прочитан напрямую, race condition идентифицирован точно
- Pitfalls: HIGH — все из анализа реального кода, не теоретические
- Timing values: LOW — эмпирические, без официального SLA от 24h.tv

**Research date:** 2026-03-12
**Valid until:** 2026-06-12 (стабильный домен — Node.js Promise API не меняется)
