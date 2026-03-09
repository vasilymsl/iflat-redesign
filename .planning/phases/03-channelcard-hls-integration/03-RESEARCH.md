# Phase 03: ChannelCard HLS Integration - Research

**Researched:** 2026-03-09
**Domain:** hls.js lifecycle management, React hover-triggered media, crossfade animation, single-instance player coordination
**Confidence:** HIGH (React/CSS patterns) / HIGH (hls.js API) / MEDIUM (CORS 24h.tv CDN — requires runtime test)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HLS-03 | При наведении на карточку канала запрашивается и проигрывается реальный HLS-стрим | Fetch `/api/tv/stream/[id]` → `streamUrl` → hls.js loadSource/attachMedia + play on MANIFEST_PARSED |
| HLS-04 | Стрим корректно останавливается и ресурсы освобождаются при уходе курсора | `hls.destroy()` + `video.pause()` + `removeAttribute('src')` + `video.load()` + AbortController.abort() |
| HLS-05 | Только один стрим играет одновременно (предыдущий останавливается при наведении на новую карточку) | Module-level `activeStopFn` ref в TvChannelShelf — при новом hover вызывает stopFn предыдущей карточки |
| HLS-06 | LIVE-бейдж отображается во время воспроизведения стрима | Условный рендер: `isHovered && videoReady` → показать бейдж. Бейдж уже есть в ChannelCard, нужно исправить условие |
| HOVER-05 | Thumbnail плавно переходит в видео (crossfade 0.4s) | CSS `opacity` transition на video overlay: `opacity-0 → opacity-100` с delay 0s когда videoReady=true, `transitionDelay: '0.4s'` |

</phase_requirements>

---

## Summary

Фаза 3 — финальная интеграция: взять готовый API-слой (Phase 2) и готовую CSS-архитектуру (Phase 1) и замкнуть их в рабочем hover-triggered HLS preview.

Хорошая новость: большая часть логики в `ChannelCard.tsx` уже написана как заготовка. `startStream`/`stopStream`, `hlsRef`, `AbortController`, LIVE-бейдж — всё присутствует. Проблема в том, что `channel.streamUrl` сейчас приходит как статический проп из `tv-shelves.ts` (только у `perviy` есть demo URL), а нужно динамически запрашивать через `/api/tv/stream/[id]` при hover и передавать реальный URL.

Три ключевые технические задачи:
1. **Динамический fetch streamUrl**: при hover (после 200ms debounce) ChannelCard делает `GET /api/tv/stream/{channel.id}`, получает `{ streamUrl }` и передаёт в `startStream`.
2. **Single-active-player**: при наведении на карточку B нужно немедленно остановить карточку A. Для этого нужен механизм координации между карточками — рекомендуется callback-паттерн через родительский TvChannelShelf.
3. **Crossfade**: уже реализован в коде — video overlay с opacity 0/100 и transition. Нужно убедиться что `videoReady` правильно триггерится: только когда `video` событие `playing` сработало (не раньше `loadedmetadata`).

CORS остаётся открытым вопросом — 24h.tv CDN (`cdn.media.24h.tv`) для изображений работает, но для HLS-манифестов нет гарантии. Первый шаг Phase 3 — ручной CORS-тест в браузере перед написанием плеерного кода.

**Primary recommendation:** Не переписывать ChannelCard с нуля. Добавить `onActivate(stopFn)` callback prop, заменить статический `channel.streamUrl` на динамический fetch в `handleMouseEnter`, и починить условие LIVE-бейджа.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `hls.js` | ^1.6.15 (уже установлен) | HLS-стриминг в браузерах без нативной поддержки | Де-факто стандарт, уже используется в ChannelCard.tsx |
| React hooks (`useRef`, `useState`, `useCallback`, `useEffect`) | React 19 (в проекте) | Управление lifecycle плеера, состоянием hover | Уже используются в ChannelCard.tsx |
| Native `fetch` | встроен в браузер | Запрос `/api/tv/stream/[id]` | Никаких дополнительных зависимостей |
| CSS `opacity` + `transition` | встроен в браузер | Crossfade thumbnail → video | GPU-composited, уже реализован в компоненте |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `AbortController` | встроен в браузер | Отмена pending requests при быстром hover/leave | ВСЕГДА — предотвращает race condition |
| `cn()` из `@/lib/utils` | в проекте | Условные CSS-классы | Уже используется |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Callback prop `onActivate` | React Context для активного плеера | Context — больше кода, нужен provider; для простого "один активный" callback достаточен |
| Dynamic fetch в ChannelCard | Передать streamUrl из родителя | Родитель не должен знать о hover-событиях карточки; fetch внутри карточки — правильная инкапсуляция |
| `video.pause() + removeAttribute('src') + load()` | `hls.detachMedia()` then `hls.destroy()` | Оба варианта корректны; в существующем коде уже реализован первый подход через `stopStream()` |

**Installation:**
```bash
# Новые зависимости не требуются. hls.js@1.6.15 уже в package.json
```

---

## Architecture Patterns

### Recommended Project Structure

Изменения затрагивают только существующие файлы:

```
iflat-redesign/src/
├── components/sections/
│   ├── ChannelCard.tsx        ← ГЛАВНОЕ: добавить fetch, onActivate prop, починить LIVE badge
│   └── TvChannelShelf.tsx     ← ГЛАВНОЕ: добавить activeStopRef, передать onActivate в ChannelCard
└── app/
    └── api/tv/stream/[id]/
        └── route.ts           ← УЖЕ ГОТОВО из Phase 2
```

### Pattern 1: Dynamic Stream URL Fetch при Hover

**Что:** ChannelCard больше не зависит от `channel.streamUrl` проп. При hover делает fetch к Route Handler и получает живой URL.

**Когда использовать:** Всегда для живых стримов — URL может истечь, токен обновляется на сервере.

**Пример:**
```typescript
// Source: паттерн из существующего ChannelCard.tsx + Next.js fetch best practices
// БЫЛО: startStream() берёт channel.streamUrl напрямую
// СТАЛО: fetchAndStartStream() — сначала fetch, потом play

const fetchAndStartStream = useCallback(async (signal: AbortSignal) => {
  if (!videoRef.current) return;

  // 1. Запросить streamUrl у Route Handler
  let streamUrl: string;
  try {
    const res = await fetch(`/api/tv/stream/${channel.id}`, { signal });
    if (!res.ok || signal.aborted) return;
    const data = await res.json() as { streamUrl?: string; error?: string };
    if (!data.streamUrl) return; // silent fail — thumbnail остаётся
    streamUrl = data.streamUrl;
  } catch {
    // Если сеть упала или abort — просто не показываем видео
    return;
  }

  // 2. Запустить стрим с полученным URL
  const video = videoRef.current;
  if (signal.aborted) return;

  const isHls = streamUrl.includes(".m3u8");

  if (isHls) {
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari — нативный HLS
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        if (!signal.aborted) video.play().catch(() => {});
      }, { once: true, signal });
    } else {
      // Остальные браузеры — hls.js
      const { default: Hls } = await import("hls.js");
      if (!Hls.isSupported() || signal.aborted) return;
      const hls = new Hls({ maxBufferLength: 3, maxMaxBufferLength: 5, startLevel: 0 });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!signal.aborted) video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) hls.destroy();
      });
      hlsRef.current = hls;
    }
  }

  video.addEventListener("playing", () => {
    if (!signal.aborted) setVideoReady(true);
  }, { once: true, signal });
}, [channel.id]);
```

**Ключевой момент:** `signal` из `AbortController` передаётся и в `fetch()`, и в `video.addEventListener()`. Одна команда `ac.abort()` отменяет всё.

### Pattern 2: Single-Active-Player через Callback

**Что:** TvChannelShelf хранит ref на функцию остановки текущей активной карточки. При активации новой карточки — старая останавливается.

**Когда использовать:** Всегда когда несколько карточек в одном шлейфе могут быть hover-активными.

**Пример:**
```typescript
// Source: паттерн координации компонентов через callback props
// TvChannelShelf.tsx — родитель
import { useRef } from "react";

export function TvChannelShelf({ channels }: { channels: ChannelData[] }) {
  const activeStopRef = useRef<(() => void) | null>(null);

  const handleActivate = useCallback((stopFn: () => void) => {
    // Остановить предыдущий активный стрим
    activeStopRef.current?.();
    // Сохранить функцию остановки новой карточки
    activeStopRef.current = stopFn;
  }, []);

  const handleDeactivate = useCallback(() => {
    // Карточка сама себя деактивировала — очищаем ref
    activeStopRef.current = null;
  }, []);

  return (
    // ...
    channels.map(ch => (
      <ChannelCard
        key={ch.id}
        channel={ch}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
      />
    ))
  );
}

// ChannelCard.tsx — дочерний
interface ChannelCardProps {
  channel: ChannelData;
  className?: string;
  onActivate?: (stopFn: () => void) => void;  // вызвать при начале стрима
  onDeactivate?: () => void;                   // вызвать при остановке
}

const handleMouseEnter = useCallback(() => {
  setIsHovered(true);
  hoverTimerRef.current = setTimeout(() => {
    const ac = new AbortController();
    abortRef.current = ac;
    // Сообщить родителю: эта карточка активируется
    // Передаём функцию остановки
    onActivate?.(() => stopStream());
    fetchAndStartStream(ac.signal);
  }, 200);
}, [fetchAndStartStream, stopStream, onActivate]);
```

**Почему НЕ Context:** Context создаёт re-render всех потребителей при изменении значения. Для координации одного active-player достаточно callback через props — меньше кода, нет re-renders.

### Pattern 3: Crossfade Thumbnail → Video

**Что:** Video overlay поверх thumbnail. Изначально `opacity: 0`. Когда `videoReady=true` и `isHovered=true` — плавно появляется за 0.4s.

**Текущий код в ChannelCard.tsx (строки 166-181) уже реализует это корректно:**
```typescript
// УЖЕ ПРАВИЛЬНО в ChannelCard.tsx
<div
  className={cn(
    "absolute inset-0 z-10 transition-opacity duration-300",
    videoReady && isHovered ? "opacity-100" : "opacity-0"
  )}
  style={{ transitionDelay: videoReady ? "0.4s" : "0s" }}
>
  <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
</div>
```

**Один нюанс:** `duration-300` = 0.3s, но требование HOVER-05 — 0.4s. Нужно изменить на `duration-400` или задать через inline style.

**Исправление:**
```typescript
// ИСПРАВИТЬ: duration-300 → duration-[400ms]
<div
  className={cn(
    "absolute inset-0 z-10 transition-opacity duration-[400ms]",
    videoReady && isHovered ? "opacity-100" : "opacity-0"
  )}
  style={{ transitionDelay: videoReady ? "0s" : "0s" }}
>
```

**Почему delay=0s при videoReady:** Видео стало готово — начинаем fade-in сразу. Delay 0.4s там был задержкой перед fade, но смысл требования — само transition длится 0.4s.

### Pattern 4: LIVE Badge — правильное условие

**Текущий код (строка 184):**
```typescript
{channel.streamUrl && isHovered && (
  <div className="absolute top-2 right-2 z-20 ...">
    LIVE
  </div>
)}
```

**Проблема:** `channel.streamUrl` — статический проп, который может быть `undefined` для большинства каналов. В новой архитектуре URL приходит динамически.

**Исправление:** Показывать LIVE только когда видео реально играет:
```typescript
{videoReady && isHovered && (
  <div className="absolute top-2 right-2 z-20 ...">
    LIVE
  </div>
)}
```

Это точно соответствует HLS-06: "LIVE-бейдж отображается во время воспроизведения стрима".

### Pattern 5: hls.js Cleanup — Правильная последовательность

**Что:** При остановке стрима нужно корректно освободить ресурсы в правильном порядке.

**Порядок cleanup (из официальной документации hls.js):**
```typescript
function stopStream() {
  setVideoReady(false);

  // 1. Отменить все pending async операции (fetch, event listeners)
  abortRef.current?.abort();
  abortRef.current = null;

  // 2. Уничтожить hls.js instance (освобождает MSE, Worker, сеть)
  if (hlsRef.current) {
    hlsRef.current.destroy();
    hlsRef.current = null;
  }

  // 3. Очистить видео-элемент
  if (videoRef.current) {
    videoRef.current.pause();
    videoRef.current.removeAttribute("src");
    videoRef.current.load(); // сбрасывает буфер и сетевые запросы
  }
}
```

**Порядок важен:** abort() → hls.destroy() → video cleanup. Если сделать video cleanup до hls.destroy(), hls.js может попытаться обратиться к уже очищенному video.

### Anti-Patterns to Avoid

- **Инициировать fetch streamUrl при монтировании компонента:** Вызывает N fetch-запросов при загрузке страницы. Только при hover.
- **Передавать streamUrl как проп из статического `tv-shelves.ts`:** URL от /api/tv/stream требует живого токена — нужен динамический fetch при каждом hover (или с разумным клиентским кешем).
- **Показывать LIVE бейдж при `isHovered` без проверки `videoReady`:** Бейдж может появиться до начала воспроизведения, пока идёт fetch/buffering.
- **Не передавать `signal` в `fetch()`:** При быстрых hover/leave — fetch висит в сети даже после ухода курсора. AbortController нужен.
- **Создавать новый `Hls` instance без destroy старого:** Memory leak. Каждый `new Hls()` без `destroy()` держит Worker и MSE ресурсы.
- **`startLevel: -1` для preview:** Автовыбор качества (-1) начинает с самого низкого и потом апгрейдит — для preview лучше `startLevel: 0` (самое низкое качество сразу, быстрый старт).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HLS-совместимость кросс-браузер | Кастомный парсер m3u8 | `hls.js` (уже установлен) | hls.js покрывает все браузеры, MSE API, chunk loading, error recovery |
| Debounce hover | Свой throttle/debounce utility | `setTimeout(200)` в `handleMouseEnter` | Уже реализован в ChannelCard.tsx, хватает для этого usecase |
| Race condition на concurrent hover | Mutex / semaphore library | `AbortController` + `abortRef.current?.abort()` | AbortController — встроенный механизм, достаточен для одного signal-per-card |
| Video crossfade | Framer Motion animation | CSS `opacity` transition (уже в компоненте) | GPU-composited, нет JS overhead, Framer Motion избыточен |
| Координация active player | Redux / Zustand / React Context | Callback prop `onActivate(stopFn)` через родителя | Для одного active player callback достаточен, минимальный оверхед |

**Key insight:** Вся инфраструктура уже есть. Phase 3 — это соединение готовых кусков, а не написание новой логики с нуля.

---

## Common Pitfalls

### Pitfall 1: CORS заблокирует HLS fetch в браузере

**Что идёт не так:** `hls.js` в браузере запрашивает m3u8 manifest с `cdn.media.24h.tv` или stream CDN — браузер выдаёт `Access to fetch at '...' has been blocked by CORS policy`.

**Почему:** Route Handler `/api/tv/stream/[id]` возвращает только URL (Phase 2 решение). Браузер → CDN запрос — cross-origin. HLS CDN должен отдавать `Access-Control-Allow-Origin: *` для embed использования.

**Как избежать:** ПЕРВЫЙ шаг Phase 3 — ручной CORS-тест до написания плеерного кода:
```javascript
// Открыть localhost:3000, вставить в DevTools Console:
const res = await fetch('/api/tv/stream/perviy');
const { streamUrl } = await res.json();
const test = await fetch(streamUrl, { method: 'HEAD' });
console.log('CORS OK?', test.ok, test.headers.get('access-control-allow-origin'));
```
Если CORS заблокирован — нужен proxy endpoint `/api/tv/proxy?url=...` в Next.js Route Handler (прокси убирает cross-origin).

**Warning signs:** `net::ERR_FAILED` или `CORS policy` в Console при попытке загрузить стрим.

### Pitfall 2: `videoReady=true` устанавливается до фактического воспроизведения

**Что идёт не так:** Fade-in из thumbnail в видео происходит раньше, чем видео реально начало играть — пользователь видит чёрный экран вместо видео.

**Почему:** `loadedmetadata` или `canplay` — это события готовности к воспроизведению, не сам факт воспроизведения. Только `playing` означает что frame реально выводится.

**Как избежать:** `setVideoReady(true)` ТОЛЬКО в обработчике события `playing`:
```typescript
video.addEventListener("playing", () => {
  if (!signal.aborted) setVideoReady(true);
}, { once: true, signal });
```

**Warning signs:** Мигание чёрного экрана при hover.

### Pitfall 3: Memory leak от накопленных Hls instances

**Что идёт не так:** Быстрые hover/leave по многим карточкам — несколько `hls.js` instances существуют одновременно, каждый держит Web Worker и MSE буферы.

**Почему:** `new Hls()` без `destroy()` не освобождает ресурсы. При 15 каналах в шлейфе и быстром наведении — 15 instances в памяти.

**Как избежать:** `stopStream()` ВСЕГДА вызывает `hls.destroy()` + `hlsRef.current = null`. Проверить через Chrome DevTools → Memory → Heap Snapshot.

**Warning signs:** Нарастающее потребление памяти при быстром hover по каналам, тормоза через 30 секунд использования.

### Pitfall 4: fetch делается при каждом hover без учёта pending request

**Что идёт не так:** Пользователь быстро наводит и убирает курсор — висят несколько pending fetch к `/api/tv/stream/[id]`, последний может прийти после ухода и запустить стрим "в фоне".

**Почему:** `fetch()` без abort продолжает висеть даже после `handleMouseLeave`.

**Как избежать:** Передавать `AbortController.signal` в `fetch()`:
```typescript
const res = await fetch(`/api/tv/stream/${channel.id}`, { signal });
// При handleMouseLeave → ac.abort() → fetch отменяется
```

**Warning signs:** Стрим запускается после ухода курсора (видно по LIVE badge appearing and immediately disappearing).

### Pitfall 5: hoverTimerRef не чистится при быстром hover → другая карточка

**Что идёт не так:** Пользователь наводит на карточку A, через 100ms (до отработки 200ms debounce) наводит на карточку B. Таймер A всё ещё висит и через 100ms запускает стрим карточки A.

**Почему:** `hoverTimerRef.current` очищается в `handleMouseLeave`, но если leaf event не пришёл перед enter следующей (быстро скользит), таймер не очищается.

**Как избежать:** В `handleMouseEnter` очищать предыдущий таймер перед созданием нового:
```typescript
const handleMouseEnter = useCallback(() => {
  setIsHovered(true);
  // Очистить предыдущий таймер (если курсор быстро вернулся)
  if (hoverTimerRef.current) {
    clearTimeout(hoverTimerRef.current);
  }
  hoverTimerRef.current = setTimeout(() => {
    // ...
  }, 200);
}, [...]);
```

**Warning signs:** Иногда запускается стрим карточки, на которую пользователь уже не наводит.

### Pitfall 6: startLevel -1 vs 0 для preview

**Что идёт не так:** При `startLevel: -1` (auto) hls.js сначала пытается угадать качество по bandwidth — иногда начинает с высокого качества, буферизация занимает дольше.

**Почему:** `-1` означает автовыбор. Для длительного просмотра это лучше, но для preview (5-10 секунд) нужна быстрая первая картинка.

**Как избежать:** Для hover preview использовать `startLevel: 0` (минимальное качество, быстрый старт):
```typescript
const hls = new Hls({
  maxBufferLength: 3,      // 3 сек буфер достаточно для preview
  maxMaxBufferLength: 5,   // не более 5 сек
  startLevel: 0,           // начать с минимального качества — быстрее первый кадр
});
```

---

## Code Examples

Verified patterns from code analysis and official sources:

### Полный flow fetchAndStartStream

```typescript
// Source: существующий ChannelCard.tsx + паттерны из hls.js API docs
const fetchAndStartStream = useCallback(async (signal: AbortSignal) => {
  const video = videoRef.current;
  if (!video) return;

  // Step 1: Запросить URL у Route Handler
  let streamUrl: string;
  try {
    const res = await fetch(`/api/tv/stream/${channel.id}`, { signal });
    if (!res.ok || signal.aborted) return;
    const data = await res.json() as { streamUrl?: string };
    if (!data.streamUrl) return;
    streamUrl = data.streamUrl;
  } catch {
    return; // AbortError или сетевая ошибка — silent fail
  }

  if (signal.aborted) return;

  // Step 2: Воспроизвести через нативный HLS или hls.js
  const isHls = streamUrl.includes(".m3u8");

  const onPlaying = () => {
    if (!signal.aborted) setVideoReady(true);
  };

  if (isHls) {
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari — нативный HLS
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        if (!signal.aborted) video.play().catch(() => {});
      }, { once: true, signal });
    } else {
      // Chrome/Firefox — hls.js
      try {
        const { default: Hls } = await import("hls.js");
        if (!Hls.isSupported() || signal.aborted) return;

        const hls = new Hls({
          maxBufferLength: 3,
          maxMaxBufferLength: 5,
          startLevel: 0,  // быстрый старт с низкого качества
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!signal.aborted) video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) hls.destroy();
        });
        hlsRef.current = hls;
      } catch {
        // hls.js динамический импорт не удался
        return;
      }
    }
  } else {
    // mp4 fallback
    video.src = streamUrl;
    video.play().catch(() => {});
  }

  video.addEventListener("playing", onPlaying, { once: true, signal });
}, [channel.id]);
```

### stopStream — правильная последовательность cleanup

```typescript
// Source: hls.js официальная документация — порядок: destroy → video cleanup
const stopStream = useCallback(() => {
  setVideoReady(false);
  abortRef.current?.abort();
  abortRef.current = null;

  if (hlsRef.current) {
    hlsRef.current.destroy();
    hlsRef.current = null;
  }
  if (videoRef.current) {
    videoRef.current.pause();
    videoRef.current.removeAttribute("src");
    videoRef.current.load();
  }
}, []);
```

### TvChannelShelf — single-active coordinator

```typescript
// Source: паттерн координации через callback prop
// src/components/sections/TvChannelShelf.tsx

const activeStopRef = useRef<(() => void) | null>(null);

const handleActivate = useCallback((stopFn: () => void) => {
  // Остановить предыдущий активный стрим немедленно
  activeStopRef.current?.();
  activeStopRef.current = stopFn;
}, []);

const handleDeactivate = useCallback(() => {
  activeStopRef.current = null;
}, []);
```

### ChannelCard — интеграция onActivate

```typescript
// handleMouseEnter с onActivate callback
const handleMouseEnter = useCallback(() => {
  setIsHovered(true);
  if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  hoverTimerRef.current = setTimeout(() => {
    // Создать новый AbortController для этого стрима
    abortRef.current?.abort(); // abort предыдущий если был
    const ac = new AbortController();
    abortRef.current = ac;
    // Сообщить родителю — передать функцию остановки
    onActivate?.(() => {
      ac.abort();
      stopStream();
    });
    fetchAndStartStream(ac.signal);
  }, 200);
}, [fetchAndStartStream, stopStream, onActivate]);

const handleMouseLeave = useCallback(() => {
  setIsHovered(false);
  if (hoverTimerRef.current) {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  }
  stopStream();
  onDeactivate?.();
}, [stopStream, onDeactivate]);
```

### Исправленный LIVE badge

```typescript
// Source: требование HLS-06 — только во время воспроизведения
// БЫЛО: channel.streamUrl && isHovered
// СТАЛО: videoReady && isHovered
{videoReady && isHovered && (
  <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
    <span className="text-[10px] text-white font-medium">LIVE</span>
  </div>
)}
```

### Исправленный crossfade (HOVER-05 — 0.4s)

```typescript
// БЫЛО: duration-300 (0.3s)
// СТАЛО: duration-[400ms] (0.4s как требует HOVER-05)
<div
  className={cn(
    "absolute inset-0 z-10 transition-opacity duration-[400ms]",
    videoReady && isHovered ? "opacity-100" : "opacity-0"
  )}
>
  <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `channel.streamUrl` как статический проп | Динамический fetch при hover к `/api/tv/stream/[id]` | Phase 3 | URL получается с живым токеном, не устаревает |
| LIVE бейдж при `isHovered` | LIVE бейдж при `videoReady && isHovered` | Phase 3 | Бейдж только когда видео реально играет |
| `duration-300` transition | `duration-[400ms]` | Phase 3 | Соответствие требованию HOVER-05 |
| `startLevel: -1` (auto) | `startLevel: 0` (min quality) | Phase 3 | Быстрый первый кадр для hover preview |

**Deprecated/изменяется в фазе:**
- Зависимость от `channel.streamUrl` в `handleMouseEnter` — заменяется на fetch
- Условие показа видео overlay: `channel.streamUrl` → убирается как условие рендера (всегда рендерить video element)

---

## Open Questions

1. **CORS для HLS-стримов 24h.tv CDN**
   - Что знаем: CDN для изображений (`cdn.media.24h.tv`) работает без CORS проблем
   - Что неизвестно: разрешает ли HLS streaming CDN cross-origin fetch из браузера
   - Рекомендация: **Первая задача Phase 3** — ручной тест в DevTools перед написанием плеерного кода. Если заблокировано — добавить `/api/tv/proxy?url=...` endpoint.

2. **Какой конкретно URL возвращает `/v2/channels/{id}/stream`**
   - Что знаем: Route Handler из Phase 2 возвращает `{ streamUrl }`, где URL приходит из `data.url` ответа 24h.tv API
   - Что неизвестно: формат URL (прямой m3u8? Подписанный? Мастер-манифест или конкретный поток?)
   - Рекомендация: Логировать первый успешный ответ, проверить что URL оканчивается на `.m3u8`

3. **CHANNEL_ID_MAP заполнен "??" заглушками**
   - Что знаем: В `tv-token.ts` все 15 каналов имеют `"??"` вместо реальных ID
   - Что неизвестно: Реальные числовые ID каналов в 24h.tv API
   - Рекомендация: Первая задача Phase 3 — вызвать `GET /v2/channels` с токеном, получить маппинг. Без этого все карточки вернут 404 от Route Handler (возвращает null → клиент видит thumbnail без видео — silent fail).

4. **Работает ли demo stream URL у `perviy`**
   - Что знаем: В `tv-shelves.ts` у канала `perviy` есть demo HLS URL: `https://edge1.1internet.tv/dash-live11/streams/1tv-dvr/1tvdash.m3u8`
   - Что неизвестно: Доступен ли этот URL сейчас, не истёк ли
   - Рекомендация: Использовать этот URL для первичного тестирования crossfade и player logic до получения реального маппинга

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Нет тестового фреймворка (как в Phase 1 и 2) |
| Config file | Отсутствует |
| Quick run command | `npm run build` |
| Full suite command | `npm run lint && npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HLS-03 | При hover карточки начинается реальный HLS стрим | manual-smoke | Открыть `/tv`, навести — видео появляется | ✅ страница /tv существует |
| HLS-04 | Стрим останавливается при уходе курсора | manual-smoke | Уйти курсором — видео исчезает, Network tab пуст | ✅ |
| HLS-05 | Только один стрим одновременно | manual-smoke | Навести на A → навести на B → A остановлен | ✅ |
| HLS-06 | LIVE бейдж только при воспроизведении | manual-smoke | Бейдж появляется после start видео, исчезает при stop | ✅ |
| HOVER-05 | Crossfade 0.4s thumbnail → video | manual-smoke | DevTools Animations panel, наблюдать opacity transition | ✅ |

**Обоснование manual-only:** Phase 3 — визуальная интеграция медиа. Юнит-тесты hls.js требуют mock MSE API (нетривиально). Все критерии успеха проверяются визуально за 5 минут.

### Sampling Rate

- **Per task commit:** `npm run build` (TypeScript check)
- **Per wave merge:** `npm run lint && npm run build`
- **Phase gate:** Build зелёный + ручная проверка всех 5 success criteria на `/tv` до `/gsd:verify-work`

### Wave 0 Gaps

- [ ] CORS тест — `fetch(streamUrl, { method: 'HEAD' })` в DevTools Console → проверить заголовки
- [ ] Channel ID mapping — заполнить `CHANNEL_ID_MAP` в `tv-token.ts` после `GET /v2/channels`
- [ ] Для dev/test использовать demo URL (`edge1.1internet.tv`) если маппинг ещё не заполнен

*(Тестовый фреймворк не требуется — все проверки визуальные)*

---

## Sources

### Primary (HIGH confidence)

- Прямая инспекция кода: `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/components/sections/ChannelCard.tsx` — текущая реализация
- Прямая инспекция кода: `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/lib/tv-token.ts` — TokenManager Phase 2
- Прямая инспекция кода: `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/app/api/tv/stream/[id]/route.ts` — Route Handler Phase 2
- Прямая инспекция кода: `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/config/tv-shelves.ts` — channel data с demo streamUrl
- `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/package.json` — `hls.js@^1.6.15` подтверждён
- hls.js API docs (nochev.github.io) — `destroy()`, MANIFEST_PARSED, ERROR event, maxBufferLength/startLevel
- hls.js latest version: 1.6.15 (подтверждено npm search)

### Secondary (MEDIUM confidence)

- Phase 2 RESEARCH.md — CORS риск задокументирован, silent fail стратегия
- Phase 1 RESEARCH.md — CSS architecture стека карточек, z-index иерархия
- MDN Web Docs (из обучающих данных) — AbortController API, `signal` в fetch + addEventListener

### Tertiary (LOW confidence)

- WebSearch результаты о CORS HLS — общие принципы, без специфики 24h.tv CDN
- Demo stream URL в tv-shelves.ts (`edge1.1internet.tv`) — может не работать на момент реализации

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — hls.js уже в проекте, версия подтверждена, API задокументирован
- Architecture patterns: HIGH — основан на прямом чтении существующего кода, паттерны React устоявшиеся
- Crossfade animation: HIGH — CSS opacity transition, браузерный стандарт
- CORS 24h.tv CDN: LOW — требует runtime проверки, без официальной документации
- Channel ID mapping: LOW — все `"??"`, требует discovery через `GET /v2/channels`

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (hls.js API стабилен; 24h.tv API может измениться)
