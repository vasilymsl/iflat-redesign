# Technology Stack

**Project:** iFlat TV — Rate-Limit Fix (Milestone v1.1)
**Researched:** 2026-03-12
**Confidence:** HIGH (based on existing codebase audit + API behaviour analysis)

---

## Context: Brownfield Fix, Not New Feature

The existing `src/lib/tv-token.ts` already has the correct foundation:
- `curlJsonSync` — синхронный curl с блокирующей паузой через `execSync('sleep ...')`
- `curlJson` — async обёртка с retry + exponential backoff (3 попытки, база 2000ms)
- `fetchCurrentPrograms` — последовательный for-loop по 15 каналам с circuit breaker (failCount >= 3)
- `DELAY_BETWEEN_REQUESTS_MS = 350` — задержка между запросами

**Диагноз проблемы:** Задержки и retry-логика реализованы, но есть конкретные дыры:

1. `curlJsonSync` делает паузу через `execSync('sleep 0.35')` — это блокирует Node.js event loop на 350ms каждый вызов. При 15 каналах расписания: 15 × 350ms = 5.25 секунды блокировки.
2. Несколько входящих HTTP-запросов (hover разных карточек одновременно) могут инициировать параллельные вызовы `curlJson` из разных route handlers — `lastRequestAt` — единственный глобальный semaphore, но он не атомарный.
3. Первый cold start (нет токена в кеше) делает 4 auth-запроса + до 15 schedule-запросов без серьёзного ограничения total concurrency.

**Ключевой вывод коллеги подтверждается кодом:** schedule-запросы идут последовательно, но `execSync('sleep')` — это блокирующий sleep, и если два параллельных HTTP-запроса попадают в `curlJsonSync` одновременно, `lastRequestAt` race condition пропускает паузу.

---

## Recommended Approach: No New Libraries

### Decision: Использовать только Node.js built-ins

**Обоснование:** Никаких дополнительных пакетов не требуется. Правильные паттерны rate-limiting для curl+execSync реализуются через:
- `Promise` queue (mutex) — встроенный JavaScript
- `sleep` функция — `new Promise(resolve => setTimeout(resolve, ms))` — уже есть в коде
- Заменить `execSync('sleep')` на `await sleep()` — убрать блокировку event loop

Альтернативы типа `bottleneck`, `p-limit`, `p-queue` — не нужны. Они решают проблему параллельных промисов, но в данном случае нужен simple mutex + async sleep. Добавление npm-зависимости ради 10 строк кода — over-engineering.

---

## Stack Decisions by Problem Area

### 1. Замена блокирующего sleep на async sleep

| Компонент | Текущее состояние | Нужное состояние | Confidence |
|-----------|------------------|-----------------|------------|
| `curlJsonSync` rate-limit пауза | `execSync('sleep 0.35')` | `await sleep(ms)` перед curl | HIGH |
| `curlJson` rate-limit пауза | `await sleep()` — ПРАВИЛЬНО | Без изменений | HIGH |

**Почему это критично:**
`execSync('sleep 0.35')` блокирует Node.js event loop полностью на 350ms. Во время этой паузы не обрабатываются ни входящие HTTP-запросы, ни таймеры, ни промисы. При 15 schedule-запросах серьёзных паузах суммарное время SSR страницы увеличивается на 5+ секунд.

`curlJsonSync` используется только внутри `curlJson` — то есть уже в async контексте. Блокирующий execSync sleep здесь не нужен. Правильный паттерн: убрать sleep из `curlJsonSync`, добавить `await sleep()` перед вызовом `curlJsonSync` в `curlJson`.

**Текущий код (проблемный):**
```typescript
function curlJsonSync(method: string, url: string, body?: unknown): unknown {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < DELAY_BETWEEN_REQUESTS_MS) {
    execSync(`sleep ${((DELAY_BETWEEN_REQUESTS_MS - elapsed) / 1000).toFixed(2)}`); // БЛОКИРУЕТ EVENT LOOP
  }
  // ... curl
}
```

**Правильный код:**
```typescript
function curlJsonSync(method: string, url: string, body?: unknown): unknown {
  // sleep убран — вызывается только из async curlJson
  const args = [ "curl", ... ];
  const cmd = args.map(...).join(" ");
  lastRequestAt = Date.now();
  const stdout = execSync(cmd, { encoding: "utf-8", timeout: 20_000 });
  return JSON.parse(stdout);
}

async function curlJson(method: string, url: string, body?: unknown): Promise<unknown> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Пауза здесь — правильно, в async контексте
      const elapsed = Date.now() - lastRequestAt;
      if (elapsed < DELAY_BETWEEN_REQUESTS_MS) {
        await sleep(DELAY_BETWEEN_REQUESTS_MS - elapsed);
      }
      return curlJsonSync(method, url, body); // execSync — ок, curl сам по себе блокирующий
    } catch (err) {
      // ... retry
    }
  }
}
```

---

### 2. Promise Mutex для сериализации запросов

| Компонент | Назначение | Confidence |
|-----------|-----------|------------|
| Promise chain (module variable) | Гарантировать что curl-запросы идут строго по одному | HIGH |
| Нет npm пакета | Реализуется в ~8 строк | HIGH |

**Проблема:** Если два HTTP-запроса (hover карточки A и карточки B) попадают в `curlJson` одновременно, оба читают `lastRequestAt` до того, как кто-то из них обновил его. Оба думают что пауза не нужна и оба отправляют curl почти одновременно. Это нарушает rate-limit.

**Решение — глобальный request queue через Promise chain:**

```typescript
/** Mutex для сериализации всех curl-запросов к 24h.tv API */
let requestQueue: Promise<void> = Promise.resolve();

async function curlJson(method: string, url: string, body?: unknown): Promise<unknown> {
  // Добавляем в очередь — ждём завершения предыдущего запроса
  const result = requestQueue.then(async () => {
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < DELAY_BETWEEN_REQUESTS_MS) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS - elapsed);
    }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return curlJsonSync(method, url, body);
      } catch (err) {
        if (attempt === MAX_RETRIES) throw err;
        await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
      }
    }
  });

  // requestQueue обновляется — следующий вызов ждёт нас
  requestQueue = result.then(() => {}, () => {});

  return result;
}
```

Этот паттерн (Promise chain mutex) — стандартная техника JavaScript для сериализации async операций без внешних библиотек. Каждый вызов добавляется в очередь, следующий начинается только после завершения предыдущего + задержка.

---

### 3. Задержка между запросами: правильные значения

| Параметр | Текущее | Рекомендуемое | Обоснование | Confidence |
|----------|---------|--------------|------------|------------|
| `DELAY_BETWEEN_REQUESTS_MS` | 350ms | 400–600ms | Запас выше минимума rate-limit | MEDIUM |
| `DELAY_AUTH_STEP_MS` | 500ms | 600ms | Auth шаги более строго rate-limited | MEDIUM |
| `MAX_RETRIES` | 3 | 3 | Достаточно | HIGH |
| `RETRY_BASE_DELAY_MS` | 2000ms | 2000ms | Правильный базис для exponential backoff | HIGH |

**Почему MEDIUM confidence на конкретных значениях:** Нет официальной документации rate-limit лимитов 24h.tv API. Значения — educated guess на основе наблюдений. Рекомендуется начать с 500ms и снизить если работает стабильно.

**Exponential backoff formula — оставить как есть:**
```
attempt 0: 2000ms
attempt 1: 4000ms
attempt 2: 8000ms
```
Это стандартная формула. Для rate-limited API — правильный паттерн.

---

### 4. Schedule batch — ограничение через delay, НЕ параллельность

| Подход | Решение | Confidence |
|--------|---------|-----------|
| Параллельные Promise.all для schedule | НЕ ИСПОЛЬЗОВАТЬ | HIGH |
| Последовательный for-loop с задержкой | Использовать (уже реализовано) | HIGH |
| Chunk-based batching (по 3–5 каналов) | Не нужно — последовательность лучше | HIGH |

**Почему Promise.all — антипаттерн для rate-limited API:**
`Promise.all([fetch(ch1), fetch(ch2), ..., fetch(ch15)])` запустит 15 запросов практически одновременно. Даже с Promise mutex они попадут в очередь, но это не уменьшит нагрузку — просто растянет её. При этом общее время ожидания не изменится (15 × 400ms), но burst в самом начале может всё равно триггернуть rate-limiter.

Текущий подход (`for...of` loop) — правильный. Каждый запрос начинается только после завершения предыдущего.

**Circuit breaker (failCount >= 3) — оставить, но улучшить:**
```typescript
// Текущий код — правильный паттерн, но можно добавить логирование
if (failCount >= 3) {
  console.warn(`[tv-token] Circuit breaker triggered after ${failCount} failures`);
  break;
}
```

---

### 5. Проактивное обновление токена — оставить как есть

Логика проактивного refresh (когда осталось < 25% TTL) — правильная. Единственное улучшение: убедиться что relogin тоже проходит через request queue, чтобы не конкурировать с schedule-запросами.

---

## What NOT to Use

| Библиотека | Почему не нужна |
|-----------|----------------|
| **`bottleneck`** | npm-пакет для rate-limiting. Решает ту же задачу что Promise mutex, но требует зависимости. Для одного API-клиента — избыточно |
| **`p-limit`** | Ограничивает concurrent promises. Полезно для параллельных запросов, но здесь нужна строгая последовательность — p-limit не даёт это гарантированно |
| **`p-queue`** | Priority queue для промисов. Более сложный аналог того же Promise mutex. Не нужен |
| **`axios-rate-limit`** | Не применимо — используется curl, не axios/fetch |
| **`node-rate-limiter-flexible`** | Для server-side защиты от клиентов, не для consumer-side rate limiting |

---

## Implementation Summary

Три изменения в `src/lib/tv-token.ts`, нулевых новых зависимостей:

1. **Убрать `execSync('sleep ...')` из `curlJsonSync`** — переместить паузу в `curlJson` (async контекст)
2. **Добавить Promise mutex `requestQueue`** — гарантировать что curl-запросы строго последовательны
3. **Увеличить `DELAY_BETWEEN_REQUESTS_MS` с 350 до 500ms** — увеличить запас над предполагаемым rate-limit

Всё остальное (retry logic, circuit breaker, persistent cache, proactive refresh) — уже реализовано правильно.

---

## Installation Delta

```bash
# Ничего устанавливать не нужно
# Все изменения — в существующем src/lib/tv-token.ts
```

---

## Sources

- `src/lib/tv-token.ts` — текущая реализация (HIGH confidence, прямой анализ кода)
- `.planning/PROJECT.md` — описание проблемы и context от коллеги (HIGH confidence)
- MDN Web Docs — Promise chaining patterns, setTimeout async (HIGH confidence, training data)
- Node.js docs — execSync блокирует event loop (HIGH confidence, training data)
- W3C/WHATWG — event loop model, macrotask queue (HIGH confidence, training data)
