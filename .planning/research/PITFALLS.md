# Domain Pitfalls: TV Content Shelves with HLS

**Domain:** TV content shelf with hover-triggered HLS video preview
**Project:** iFlat — горизонтальные шлейфы каналов и контента в стиле 24h.tv
**Researched:** 2026-03-09
**Confidence:** HIGH (based on direct code inspection + well-established domain knowledge)

---

## Critical Pitfalls

Mistakes that cause rewrites or major regressions.

---

### Pitfall 1: `overflow: hidden` на scroll-контейнере обрезает расширяющиеся карточки

**What goes wrong:**
Карточка при hover должна расшириться до ~140% и перекрыть соседние. Но `.tv-shelf__scroll` и `.channel-card__preview` оба имеют `overflow: hidden`. Это обрезает трансформированную карточку — эффект не работает вообще, даже если `z-index` и `transform` выставлены правильно. Это ловушка, в которую попадают в 100% случаев при первой реализации.

**Why it happens:**
`overflow: hidden` создаёт новый stacking context и clipping boundary. Дочерний элемент с `transform: scale(1.4)` или `width: 140%` не может визуально вылезти за пределы родителя с overflow hidden, даже при `z-index: 9999`.

**Consequences:**
Карточка при hover либо обрезается по исходным границам, либо расширение полностью не видно. Фича выглядит сломанной. Переделка CSS-структуры.

**Prevention:**
Scroll-контейнер должен иметь `overflow-x: auto; overflow-y: visible`. Это работает в большинстве браузеров, но требует тестирования — некоторые браузеры игнорируют `overflow-y: visible` если `overflow-x` не `visible`.

Правильная структура для 140%-расширения:
1. `.tv-shelf__scroll` — убрать `overflow: hidden` (только `overflow-x: auto`), добавить `padding-top` и `padding-bottom` для пространства расширения
2. `.channel-card` — `position: relative; z-index: auto` в покое, `z-index: 10` при hover
3. `.channel-card-inner` — трансформировать через `transform: scaleX(1.4) scaleY(...)` или `width/height` изменение, а НЕ через изменение `.channel-card` wrapper — иначе flex-layout сдвигает соседей
4. Для Netflix-стиля (карточка расширяется поверх соседей без сдвига layout) — использовать `position: absolute` на hover-состоянии inner элемента

**Detection:**
Поставить временно `outline: 1px solid red` на `.tv-shelf__scroll`. Если при hover карточка обрезается по этой границе — это эта ловушка.

**Phase:** Milestone — реализация hover-эффекта 140%

---

### Pitfall 2: hls.js — утечка памяти при быстром наведении/уводе курсора

**What goes wrong:**
При быстром движении курсора между карточками запускаются несколько `import("hls.js")` параллельно. Dynamic import — асинхронный. Если пользователь убрал курсор до того, как промис разрешился, `stopStream()` уже вызван (hlsRef.current = null), но в замыкании промиса создаётся новый `Hls()`, который никогда не будет уничтожен.

**Why it happens:**
В текущем коде `ChannelCard.tsx:67` проверяется `ac.signal.aborted` ПОСЛЕ `await import("hls.js")`, но между созданием `Hls()` и `hlsRef.current = hls` (строки 69-86) есть несколько sync операций. Если `stopStream` вызван до `hlsRef.current = hls`, созданный instance останется без ссылки и не будет destroyed.

**Consequences:**
Каждая брошенная сессия — активный MediaSource, network connection, и event listeners. После 10-15 быстрых hover — заметное замедление, накопление open connections к HLS endpoint.

**Prevention:**
Паттерн защиты: хранить pending hls instance в local variable ДО записи в ref, проверять aborted состояние после каждого await:

```typescript
const hls = new Hls({ ... });
if (ac.signal.aborted) {
  hls.destroy(); // уничтожить немедленно, не записывать в ref
  return;
}
hlsRef.current = hls;
hls.loadSource(url);
hls.attachMedia(video);
```

Дополнительно: `AbortController.signal` должен использоваться и для отмены pending `play()` промиса. `video.play().catch(() => {})` не достаточно — добавить проверку aborted в then.

**Detection:**
Chrome DevTools → Performance Monitor → JS Heap. Многократное наведение/увод без паузы — heap должен возвращаться к baseline. Если растёт — утечка.

**Phase:** Milestone — рабочие HLS-стримы

---

### Pitfall 3: CORS блокировка HLS-манифестов и TS-сегментов

**What goes wrong:**
HLS-стрим состоит из двух видов запросов: (1) `.m3u8` манифест, (2) `.ts` сегменты, ссылки на которые внутри манифеста. Даже если манифест доступен без CORS (например, через прокси), сегменты `.ts` могут быть на другом домене без нужных заголовков. В браузере оба запроса блокируются. Ошибка `Hls.Events.ERROR` с `data.type === 'networkError'`.

**Why it happens:**
24h.tv API требует `access_token` в URL стримов. Стримы идут с отдельных CDN-серверов, которые могут не выставлять `Access-Control-Allow-Origin: *`. Гостевой токен может выдавать URL вида `https://stream.cdn.24h.tv/...?token=XXX` — CDN сервер должен принимать этот токен И иметь CORS.

**Consequences:**
Ни один HLS-стрим не воспроизводится в браузере. Весь функционал hover-видео недоступен. Нужен серверный прокси.

**Prevention:**
1. Проверить CORS до написания любого кода плеера: открыть Network tab, попробовать загрузить `.m3u8` URL напрямую в fetch() из браузера
2. Если CORS заблокирован — нужен Next.js API Route как прокси: `/api/stream?url=...` добавляет нужные заголовки и проксирует
3. Для гостевого токена: токен должен передаваться серверной стороной, не храниться в клиентском коде (иначе в DevTools виден)

**Detection:**
Console: `Access to fetch at 'https://...' from origin 'http://localhost:3333' has been blocked by CORS policy`

**Phase:** Milestone — рабочие HLS-стримы (ПЕРВЫМ делом, до остального)

---

### Pitfall 4: `scroll-snap-type: x mandatory` конфликтует с hover-расширением карточек

**What goes wrong:**
`.tv-shelf__scroll` имеет `scroll-snap-type: x mandatory`. Scroll-snap принудительно snap-ает контейнер в ближайшую позицию при любом scroll событии. Когда карточка расширяется при hover (если реализовано через изменение размера, а не абсолютное позиционирование) — scroll-контейнер получает scroll событие и snap-ает, смещая видимые карточки. Эффект "дёргания" при каждом hover.

**Why it happens:**
Scroll-snap срабатывает не только при ручном скролле, но и при программном изменении scroll position и иногда при изменении layout (зависит от браузера).

**Consequences:**
При hover карточка расширяется → scroll-snap срабатывает → полоса прыгает → UX сломан. Особенно заметно в Firefox.

**Prevention:**
Два варианта:
1. Временно отключать scroll-snap во время hover: JS добавляет `data-snapping="off"` атрибут, CSS `[data-snapping="off"] { scroll-snap-type: none; }`
2. Реализовывать расширение карточки ТОЛЬКО через `position: absolute` на отдельном hover-слое поверх карточки, не изменяя layout (как это делает Netflix/24h.tv) — тогда layout не меняется и snap не срабатывает

Вариант 2 правильный для 24h.tv UX. Карточка НЕ сдвигает соседей — она расширяется поверх них.

**Detection:**
Реализовать расширение → навести курсор → наблюдать в DevTools ScrollTimeline или просто визуально — прыгает ли полоса.

**Phase:** Milestone — hover-эффект 140%

---

## Moderate Pitfalls

---

### Pitfall 5: Гостевой токен 24h.tv — срок жизни и race condition при обновлении

**What goes wrong:**
Гостевой токен `POST /v2/users { is_guest: true }` имеет ограниченный срок жизни. Если несколько карточек одновременно запрашивают стрим (пользователь быстро навёл на разные карточки), каждая может попробовать обновить токен параллельно. В результате — несколько параллельных запросов `/v2/users`, каждый возвращает новый токен, старые токены инвалидируются, запросы стримов с "устаревшим" токеном возвращают 401.

**Why it happens:**
Клиентское состояние токена в module-level переменной без mutex/lock механизма. Первый запрос начинает обновление, второй проверяет "токен устарел?" — да, тоже начинает обновление.

**Prevention:**
Singleton token manager с promise deduplication:

```typescript
let tokenPromise: Promise<string> | null = null;

async function getToken(): Promise<string> {
  const cached = localStorage.getItem('24tv_token');
  if (cached && !isExpired(cached)) return cached;

  if (!tokenPromise) {
    tokenPromise = fetchGuestToken().finally(() => { tokenPromise = null; });
  }
  return tokenPromise;
}
```

**Detection:**
Network tab: несколько параллельных POST /v2/users запросов при hover на разные карточки.

**Phase:** Milestone — рабочие HLS-стримы

---

### Pitfall 6: Слишком много одновременных HLS-соединений — перегрузка сети

**What goes wrong:**
Если пользователь медленно прокручивает шлейф и задерживается на каждой карточке по 200ms+ (debounce время), на каждой карточке стартует HLS загрузка. Каждый hls.js instance открывает несколько параллельных HTTP запросов (манифест + несколько сегментов). При 15 каналах в шлейфе — потенциально 50+ одновременных запросов.

**Prevention:**
1. Увеличить debounce с 200ms до 350-500ms (в текущем коде — `setTimeout(startStream, 200)`)
2. Добавить глобальный limit: не более 1-2 активных HLS плееров одновременно. Новый hover отменяет предыдущий активный стрим
3. `maxBufferLength: 3` и `maxMaxBufferLength: 5` (уже в коде) — правильно, не увеличивать

**Detection:**
Network tab: фильтр по `.ts` — наблюдать сколько одновременных pending requests при скролле.

**Phase:** Milestone — рабочие HLS-стримы

---

### Pitfall 7: `hls.js` не поддерживает Server-Side Rendering — `document is not defined`

**What goes wrong:**
`import("hls.js")` выполняется на сервере при SSR (Next.js App Router рендерит серверные компоненты на сервере). hls.js обращается к `window`, `document`, `MediaSource` при инициализации. Next.js билд падает или runtime error: `ReferenceError: document is not defined`.

**Why it happens:**
ChannelCard — клиентский компонент (`"use client"`), поэтому dynamic import `import("hls.js")` в коде присутствует. НО если ChannelCard рендерится без Suspense boundary в Server Component — проблема. Также если `Hls.isSupported()` вызывается вне useEffect.

**Consequences:**
Build failure или hydration error. Блокирует деплой.

**Prevention:**
Текущий код защищён: `import("hls.js")` внутри `startStream` (callback, вызываемый только при hover, только в браузере). Это безопасно. НО не добавлять статический `import Hls from 'hls.js'` наверху файла — только dynamic import.

Дополнительная защита: `typeof window !== 'undefined'` check перед любым обращением к browser API.

**Detection:**
`npm run build` → ошибка `document is not defined`. Или Vercel build log.

**Phase:** Milestone — рабочие HLS-стримы (проверить сразу при добавлении)

---

### Pitfall 8: API 24h.tv rate limiting — 429 при динамической загрузке данных каналов

**What goes wrong:**
При переходе на динамические данные (`GET /v2/channels` вместо статического tv-shelves.ts) — запрос выполняется при каждом рендере страницы /tv И главной страницы. Если у сайта есть трафик или при разработке перезагружать страницу часто — API 24h.tv может вернуть 429 Too Many Requests.

**Prevention:**
1. Next.js `fetch` кеширование: использовать `fetch(url, { next: { revalidate: 3600 } })` — данные каналов обновляются раз в час
2. Для токена: `revalidate: 86400` — гостевой токен на 24 часа достаточно
3. Стримы (`/v2/channels/{id}/stream`) НЕ кешировать — URL стрима содержит time-sensitive token

**Detection:**
HTTP 429 в Server Component fetch error log. Или пустой список каналов без ошибки (если не обрабатывается).

**Phase:** Milestone — данные каналов динамически из API

---

### Pitfall 9: `z-index` стекинг — расширенная карточка уходит ЗА header страницы

**What goes wrong:**
`.tv-section` (dark background wrapper) не имеет явного `z-index`. Когда карточка расширяется с `z-index: 10`, она может уходить ЗА sticky header (MainNav), который имеет более высокий z-index. Особенно критично когда TV-секция добавляется на главную страницу и размещается высоко.

**Prevention:**
Задать явный `z-index` на `.tv-shelf__slider { isolation: isolate; }` (создаёт stacking context без числового z-index). Тогда дочерние `z-index` карточек работают только внутри полосы, не конкурируя с header. Для расширения карточек добавить `.tv-section { position: relative; z-index: 1; }`.

**Detection:**
При hover на первые карточки шлейфа (когда шлейф в верхней части страницы) — расширенная карточка обрезается или уходит за header.

**Phase:** Milestone — hover-эффект 140%; шлейфы на главной странице

---

## Minor Pitfalls

---

### Pitfall 10: Safari — нативный HLS требует `crossOrigin="anonymous"` на `<video>`

**What goes wrong:**
Safari использует нативный HLS (HTMLMediaElement). Если CDN требует аутентификацию через cookies или если стрим с другого домена — без `crossOrigin` атрибута Safari не отправит CORS preflight и стрим не загрузится.

**Prevention:**
Добавить `crossOrigin="anonymous"` на `<video>` element в ChannelCard (сейчас отсутствует). Также нужен `playsInline` (уже есть) и `muted` (уже есть).

**Phase:** Milestone — рабочие HLS-стримы (тестирование Safari)

---

### Pitfall 11: Быстрый hover + `videoRef.current.load()` вызывает ошибку прерванного запроса

**What goes wrong:**
`stopStream()` вызывает `video.pause()` → `video.removeAttribute("src")` → `video.load()`. Если в этот момент video ещё загружает данные (pending network request) — `video.load()` прерывает загрузку и браузер бросает `AbortError` в Promise returned by `video.play()`. Это нормальное поведение, но `.catch(() => {})` в текущем коде его подавляет. ОДНАКО если `.catch()` не добавлен везде, Unhandled Promise Rejection падает в консоль.

**Prevention:**
Текущий код правильно обрабатывает через `.catch(() => {})`. Убедиться что все вызовы `video.play()` имеют catch. Не убирать пустой catch.

**Phase:** Milestone — рабочие HLS-стримы (код-ревью при изменениях)

---

### Pitfall 12: `scroll-snap-align: start` на последних карточках — невозможно долистать до конца

**What goes wrong:**
Последние карточки в шлейфе могут не иметь snap-point, если их суммарная ширина меньше viewport. `scroll-snap-align: start` на последней карточке заставляет её прижиматься к левому краю — но это невозможно физически (нет контента справа). Пользователь видит что шлейф не прокручивается до последней карточки.

**Prevention:**
Добавить `padding-right` на `.tv-shelf__scroll` равный ширине одной карточки. Или использовать `scroll-snap-align: end` на последней карточке. Самый простой вариант — `scroll-padding-right` на контейнере.

**Phase:** Milestone — адаптивность и полировка

---

### Pitfall 13: Next.js `<Image>` с `unoptimized` и внешними CDN — нет lazy loading для невидимых карточек

**What goes wrong:**
Все карточки в шлейфе рендерятся в DOM сразу (нет виртуализации). С `unoptimized` на `next/image` не применяется оптимизация Vercel. При 15 каналах + 10 постеров = 25+ изображений загружаются сразу, включая те что за правым краем экрана.

**Prevention:**
1. Добавить `loading="lazy"` на `<Image>` в карточках (Next.js Image поддерживает через prop). По умолчанию Next.js Image уже lazy, но с `fill` может не работать корректно — проверить
2. Первые 6 карточек (видимые) — `priority` prop, остальные — lazy
3. `sizes` уже корректно выставлен в текущем коде — не менять

**Phase:** Milestone — адаптивность и полировка (Lighthouse)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Hover-эффект 140% | overflow: hidden обрезает расширение | Переделать CSS-структуру: overflow-y: visible на scroll-контейнере, absolute positioning для hover-слоя |
| Hover-эффект 140% | scroll-snap дёргает при расширении | Реализовать через absolute overlay, не через layout-изменения |
| Hover-эффект 140% | z-index конфликт с header | `isolation: isolate` на `.tv-shelf__slider` |
| Рабочие HLS-стримы | CORS блокировка стримов | Проверить CORS первым делом, подготовить Next.js прокси route |
| Рабочие HLS-стримы | hls.js утечка памяти при быстром hover | Добавить aborted check сразу после await import |
| Рабочие HLS-стримы | document is not defined при SSR | Только dynamic import, никогда статический |
| Данные из API | Rate limiting 24h.tv | `fetch` с `next: { revalidate: 3600 }` |
| Данные из API | Token race condition | Singleton token manager с promise deduplication |
| Главная страница | z-index выше header | `position: relative; z-index: 1` на `.tv-section` |
| Адаптивность | Последние карточки не scroll-snap | padding-right на scroll-контейнере |

---

## Known Issues in Current Code (Code Inspection)

Эти проблемы уже существуют в базовом коде (`v0`) и требуют исправления:

1. **Hover-эффект только scale(1.05)** — `ChannelCard.tsx:241-248` и `ContentCard CSS:354-361`. Задача требует 140% расширение с перекрытием соседних. Scale(1.05) — это placeholder, не финальная реализация.

2. **`.channel-card-inner` имеет `overflow: hidden`** — `globals.css:238`. При реализации 140% расширения это первое, что нужно убрать.

3. **Только один реальный стрим** — `tv-shelves.ts:16` — только `perviy` канал имеет `streamUrl`. Остальные каналы — без стримов. Когда подключится API 24h.tv, все каналы получат streamUrl — нужно убедиться что cleanup корректно работает для всех.

4. **`hoverTimerRef` не очищается при unmount если stream уже запущен** — `ChannelCard.tsx:134-140` — cleanup в `useEffect` чистит `hoverTimerRef`, но не вызывает `stopStream()`. Если компонент unmount-ится во время воспроизведения — `hlsRef.current` уничтожается, но `videoRef.current` может не получить `pause()` и `src = ""`. Добавить `stopStream()` в cleanup useEffect.

5. **`window.addEventListener("resize", checkScroll)` без debounce** — `TvChannelShelf.tsx:32` — при ресайзе окна вызывается setState на каждое событие resize. Нужен debounce хотя бы 100ms.

---

## Sources

- Прямая инспекция кода: `/iflat-redesign/src/components/sections/ChannelCard.tsx`
- Прямая инспекция кода: `/iflat-redesign/src/app/globals.css` (секции TV Shelves, Channel Card, Content Card)
- Прямая инспекция кода: `/iflat-redesign/src/config/tv-shelves.ts`
- Прямая инспекция кода: `/iflat-redesign/src/components/sections/TvChannelShelf.tsx`
- Domain knowledge: hls.js API lifecycle (destroy, loadSource, attachMedia ordering)
- Domain knowledge: CSS overflow/transform/stacking context constraints
- Domain knowledge: Next.js App Router SSR/hydration constraints
- Domain knowledge: Browser CORS policy for media elements
- Confidence: HIGH (code inspection), HIGH (established browser/CSS behaviour)
