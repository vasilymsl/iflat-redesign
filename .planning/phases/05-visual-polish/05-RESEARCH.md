# Phase 5: Visual Polish - Research

**Researched:** 2026-03-09
**Domain:** CSS visual polish, responsive design, dark/light gradient transitions, badge visibility
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIS-02 | Бейдж рейтинга на постерах "Новинки" виден всегда, не только при hover | Убрать `opacity: 0` с `.content-card__rating` — сделать `opacity: 1` без hover. Hover-triggered opacity в globals.css строки 400-404. |
| VIS-03 | Шрифты, цвета, отступы и бейджи визуально максимально близки к 24h.tv | 24h.tv использует тёмный интерфейс (#161616 фон), тонкие шрифты, маленькие белые/цветные бейджи, плотные отступы. Изменения: выравнивание цветов карточек, типографики, размеров бейджей. |
| VIS-04 | Тёмный фон секции TV гармонично переходит в светлый дизайн iFlat (градиентный переход) | `.tv-section` имеет `background: linear-gradient(180deg, #0a0a0a 0%, #161616 8%, #161616 92%, #0a0a0a 100%)` — нужно добавить внешний переход между страницей (белой) и секцией (тёмной). |
| VIS-05 | Адаптивность: 6→5→4→2.5 карточек в зависимости от ширины экрана | Логика уже реализована в `.channel-card` и `.content-card` media queries. Нужна проверка корректности точек останова и возможная корректировка. |

</phase_requirements>

---

## Summary

Фаза 5 — финальная визуальная полировка. Четыре независимые проблемы, каждая решается изменениями в `globals.css` и/или компонентах.

**VIS-02 (рейтинг всегда виден):** В `globals.css` класс `.content-card__rating` имеет `opacity: 0`, видимость управляется только через `.content-card:hover .content-card__rating { opacity: 1 }`. Нужно убрать hover-зависимость: сделать `opacity: 1` по умолчанию. Рейтинг уже рендерится в JSX безусловно при `item.rating != null && item.rating > 0`, проблема чисто CSS.

**VIS-03 (соответствие стилю 24h.tv):** 24h.tv использует тёмный интерфейс с фоном `#161616`, тёмно-серые карточки, белый/светло-серый текст, цветные бейджи жанров/рейтинга на постерах. Текущие цвета карточек (`#2d2d2d` для `.channel-card__info`, `#252525` для `.content-card__poster`) близки к исходнику. Основные улучшения: типографика (размеры, веса), бейджи, отступы в info-панели, glow overlay карточек. Параметр "максимально близко" — субъективный, нужны конкретные решения.

**VIS-04 (градиентный переход):** Текущая `.tv-section` полностью тёмная (`#0a0a0a` → `#161616` → `#0a0a0a`), снаружи — белый фон `body`. Резкий переход без подготовки. Решение: добавить CSS-градиенты сверху и снизу `.tv-section` как переходную зону (темнеет от белого к тёмному вверху, светлеет обратно внизу). Можно через псевдоэлементы `::before`/`::after` или изменением самого background-gradient.

**VIS-05 (адаптивность):** Логика 6→5→4→2.5 уже реализована через breakpoints в `.channel-card` и `.content-card`. Нужна проверка соответствия точек: `1280px+` (6 карточек), `1024px-1279px` (5), `768px-1023px` (4), `<768px` (2.5). Текущие breakpoints в коде: `max-width: 1279px` (5), `max-width: 1023px` (4), `max-width: 767px` (2.5) — соответствует требованию.

**Primary recommendation:** Все 4 изменения локализованы в `globals.css` + возможно `ContentShelf.tsx`. Никаких новых зависимостей не нужно. Фаза выполняется за 1 план.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Plain CSS / Tailwind v4 | Tailwind v4 (CSS-first) | Визуальные изменения | Весь стек уже использует `globals.css` + `@theme inline` |
| CSS gradient / pseudo-elements | Browser built-in | Градиентный переход dark/light | Нет зависимостей, GPU-accelerated |

### No New Packages

Все изменения — чистый CSS в `globals.css`. Новые пакеты не нужны.

**Installation:**
```bash
# Ничего устанавливать не нужно
```

---

## Architecture Patterns

### Recommended Project Structure

Изменения затрагивают минимум файлов:

```
iflat-redesign/src/
├── app/
│   └── globals.css              ← ВСЕ CSS-изменения Phase 5 (VIS-02, VIS-03, VIS-04, VIS-05 проверка)
├── components/sections/
│   └── ContentShelf.tsx         ← Возможно: убрать hover-класс с рейтингового бейджа если нужно
```

### Pattern 1: Рейтинг всегда виден (VIS-02)

**Что:** Убрать `opacity: 0` и hover-триггер с `.content-card__rating`.

**Текущий CSS (globals.css строки 390-405):**
```css
/* БЫЛО: */
.content-card__rating {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
  opacity: 0;                        /* ← ПРОБЛЕМА: всегда скрыт */
  transition: opacity 0.2s 0.15s;
}
.content-card:hover .content-card__rating {
  opacity: 1;                        /* ← только при hover */
}

/* СТАЛО: */
.content-card__rating {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
  opacity: 1;                        /* ← всегда виден */
  /* transition убрать или оставить для hover-эффекта яркости */
}
/* Hover: можно добавить небольшое усиление яркости */
.content-card:hover .content-card__rating {
  opacity: 1;                        /* без изменений при hover */
}
```

**Проверка JSX:** В `ContentShelf.tsx` строка 107-113 рейтинг рендерится при `item.rating != null && item.rating > 0` — работает корректно, изменений в TSX не нужно.

### Pattern 2: Градиентный переход Dark/Light (VIS-04)

**Что:** Плавный переход от белого фона страницы к тёмному фону `.tv-section`.

**Три подхода:**

**Подход A: Расширить background-gradient самой `.tv-section` (РЕКОМЕНДУЕТСЯ)**

Добавить прозрачные зоны начала и конца:
```css
.tv-section {
  /* Начинается с полностью прозрачного (белый снаружи виден) → переход к тёмному */
  background: linear-gradient(
    180deg,
    transparent 0%,           /* ← белый сайт виден сквозь */
    rgba(10, 10, 10, 0.6) 3%,
    #0a0a0a 6%,
    #161616 12%,
    #161616 88%,
    #0a0a0a 94%,
    rgba(10, 10, 10, 0.6) 97%,
    transparent 100%           /* ← белый сайт виден сквозь */
  );
  padding: 4rem 0;             /* ← чуть больше padding для пространства перехода */
}
```

**Подход B: Псевдоэлементы `::before`/`::after` на `.tv-section`**
```css
.tv-section {
  position: relative;
  background: linear-gradient(180deg, #0a0a0a 0%, #161616 8%, #161616 92%, #0a0a0a 100%);
  padding: 3rem 0;
}
.tv-section::before,
.tv-section::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 80px;              /* высота зоны перехода */
  z-index: 0;
  pointer-events: none;
}
.tv-section::before {
  top: 0;
  background: linear-gradient(to bottom, #ffffff, transparent);
}
.tv-section::after {
  bottom: 0;
  background: linear-gradient(to top, #ffffff, transparent);
}
```

**Подход C: Обёрточная секция с градиентом вокруг tv-section**

Не рекомендуется — требует изменения JSX.

**Выбор:** Подход A проще (один CSS-блок), Подход B мощнее (независимо от `overflow`). Рекомендуется Подход B — псевдоэлементы не конфликтуют с содержимым секции, высоту перехода можно легко менять.

**Важно:** При использовании `::before`/`::after` на `.tv-section` нужно убедиться, что `position: relative` установлен. Дочерние элементы с `z-index` должны быть `> 0` чтобы не прятаться за псевдоэлементами.

### Pattern 3: Визуальное соответствие 24h.tv (VIS-03)

24h.tv (background `#161616`) — тёмный сервис. Ключевые визуальные характеристики на основе анализа их CDN и стиля:

**Цвета (текущие vs целевые):**

| Элемент | Текущий цвет | Целевой | Изменение |
|---------|-------------|---------|-----------|
| `.channel-card__info` bg | `#2d2d2d` | `#1e1e1e` или `#212121` | Чуть темнее |
| `.channel-card__logo` bg | `#333333` | `#252525` | Чуть темнее, контраст с info |
| `.channel-card__program` color | `#e0e0e0` | `#f0f0f0` / `#ffffff` | Чуть ярче |
| `.channel-card__name` color | `#828282` | `#9e9e9e` | Чуть светлее |
| `.content-card__poster` bg | `#252525` | `#1a1a1a` | Чуть темнее |
| `.content-card__title` color | `#bdbdbd` | `#e0e0e0` | Ярче |
| `.content-card__subtitle` color | `#828282` | `#9e9e9e` | Ярче |

**Рейтинговый бейдж (приближение к стилю 24h.tv):**

На 24h.tv рейтинги показаны цветными бейджами. Текущая реализация уже близка:
- Зелёный: `bg-green-600` (rating >= 7) — хорошо
- Жёлтый: `bg-yellow-600` (rating >= 5) — хорошо
- Красный: `bg-red-600` (rating < 5) — хорошо

Возможное улучшение: полукруглые края `border-radius: 3px` → `4px` (уже стоит 4px — OK), увеличить шрифт рейтинга немного.

**Типографика:**

24h.tv использует Inter или аналогичный sans-serif — проект уже использует Inter. Нужны небольшие корректировки весов:
- `.tv-shelf__title`: `font-weight: 700` → можно оставить
- `.channel-card__program`: `font-size: 0.8125rem` — OK
- Заголовки шлейфов: размер `1.5rem` — можно уменьшить до `1.25rem` для более плотного вида

**Отступы:**

| Элемент | Текущий padding | Вариант |
|---------|----------------|---------|
| `.tv-shelf__scroll` gap | `10px` | `12px` (чуть больше воздуха) |
| `.channel-card__text` padding | `6px 8px` | `8px 10px` (чуть просторнее) |
| `.tv-section` padding | `3rem 0` | `2.5rem 0` (компактнее) |

### Pattern 4: Адаптивность 6/5/4/2.5 (VIS-05)

**Текущие breakpoints (globals.css):**

```css
/* 6 карточек — десктоп (>= 1280px) */
.channel-card {
  flex: 0 0 calc((100% - 10px * 5) / 6);   /* 1280px+ */
}
.content-card {
  flex: 0 0 calc((100% - 10px * 5) / 6);   /* 1280px+ */
}

/* 5 карточек — широкий планшет */
@media (max-width: 1279px) {
  .channel-card { flex: 0 0 calc((100% - 10px * 4) / 5); }
  .content-card { flex: 0 0 calc((100% - 10px * 4) / 5); }
}

/* 4 карточки — планшет */
@media (max-width: 1023px) {
  .channel-card { flex: 0 0 calc((100% - 10px * 3) / 4); }
  .content-card { flex: 0 0 calc((100% - 10px * 3) / 4); }
}

/* 2.5 карточки — мобиль */
@media (max-width: 767px) {
  .channel-card { flex: 0 0 calc((100% - 8px * 1.5) / 2.5); }
  .content-card { flex: 0 0 calc((100% - 8px * 1.5) / 2.5); }
}
```

**Вывод:** VIS-05 уже реализован корректно. Нужна только визуальная проверка в браузере на реальных размерах. Возможные мелкие корректировки формулы для gap при 2.5 картах (gap = 8px * 1.5 = 12px, делитель должен быть `2.5 - 1 = 1.5` → gap factor `1.5` верный).

### Anti-Patterns to Avoid

- **Убирать hover-класс полностью с `.content-card:hover`:** Hover-glow overlay (`.content-card__glow`) и scale-трансформация полезны — трогать только opacity у рейтинга.
- **Использовать `position: absolute` для gradient overlay на `.tv-section`:** Если `overflow: hidden` на `.tv-section`, псевдоэлементы могут обрезаться. Убедиться что `overflow: visible` (или убрать overflow).
- **Жёсткие цвета вместо CSS variables:** Новые цвета ввести как CSS-переменные в `@theme inline` или как inline hex — без создания новых классов Tailwind.
- **Изменять breakpoints без проверки на реальных вьюпортах:** Формула `calc((100% - gap * (n-1)) / n)` — точная математика, изменение без пересчёта сломает сетку.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gradient fade dark-to-light | JS-скрипт IntersectionObserver для динамического gradient | CSS `::before`/`::after` pseudo-elements | Чистый CSS, нет JS overhead |
| Рейтинг "всегда виден" | JS-контроль opacity через React state | Убрать `opacity: 0` из CSS | Рейтинг уже в DOM, только CSS управляет видимостью |
| Адаптивная сетка | JS ResizeObserver + inline-styles для ширины карточек | CSS `flex: 0 0 calc(...)` с media queries | Уже работает, CSS-only решение |
| Соответствие стилю 24h.tv | Snapshot-testing / visual regression | Прямое сравнение в браузере + корректировка CSS-значений | Нет инструментов visual regression, ручная проверка достаточна |

**Key insight:** Весь Phase 5 — корректировка существующего CSS. Новый JS не нужен нигде.

---

## Common Pitfalls

### Pitfall 1: Псевдоэлементы обрезаются overflow

**Что происходит:** При добавлении `::before`/`::after` на `.tv-section` для градиентного перехода — псевдоэлементы обрезаются если у секции стоит `overflow: hidden`.

**Как избежать:** Проверить что `.tv-section` не имеет `overflow: hidden`. Текущий код (globals.css строки 449-452) не имеет overflow — OK. Добавить `overflow: visible` явно.

### Pitfall 2: Z-index конфликт псевдоэлементов с карточками

**Что происходит:** `::before` (z-index: 0) на `.tv-section` с `position: relative` может создать новый stacking context. Карточки шлейфов с `z-index: 1` должны быть выше псевдоэлементов.

**Как избежать:**
```css
.tv-section::before { z-index: 0; pointer-events: none; }
.tv-shelf { position: relative; z-index: 1; }  /* поверх ::before */
```

### Pitfall 3: Цвет перехода не совпадает с фоном соседних секций

**Что происходит:** Переход `transparent → #161616` будет работать только если соседние секции действительно белые (`#ffffff`). Если секция выше `.tv-section` имеет `bg-brand-surface` (#F7F8FA) — переход будет к белому, не к бренд-серому.

**Как проверить:** В `/tv/page.tsx` проверить: `.tv-section` идёт сразу после `HeroBanner`. HeroBanner имеет тёмный hero-image overlay. После `.tv-section` идёт `<section className="py-16 lg:py-24">` без background — белая. Переходы: hero→tv-section (тёмный→тёмный, OK) и tv-section→white-section (тёмный→белый, нужен нижний переход).

На главной странице (если шлейфы туда добавят в Phase 4) — контекст другой.

### Pitfall 4: Hover-glow конфликтует с рейтингом

**Что происходит:** `.content-card__glow` (`.inset-0 box-shadow: inset`) при hover может визуально "перекрыть" рейтинговый бейдж, хотя технически z-index бейджа (z-index: 5) выше.

**Как избежать:** `pointer-events: none` уже стоит на `.content-card__glow` — проблемы с кликами нет. Визуально проверить что бейдж всегда читабелен поверх glow-overlay.

### Pitfall 5: min-width дублируется с flex в content-card

**Что происходит:** В CSS есть дублирование `flex: 0 0 calc(...)` и `min-width: calc(...)` с одинаковыми формулами. При изменении одного нужно менять оба.

**Как избежать:** При любых изменениях VIS-05 менять обе строки одновременно. Или рефакторить через CSS custom property:
```css
.channel-card {
  --card-width: calc((100% - 10px * 5) / 6);
  flex: 0 0 var(--card-width);
  min-width: var(--card-width);
}
```

---

## Code Examples

Verified patterns from codebase analysis:

### VIS-02: Рейтинг всегда виден

```css
/* Source: globals.css строки 390-405 — текущее состояние */

/* БЫЛО: */
.content-card__rating {
  /* ... */
  opacity: 0;
  transition: opacity 0.2s 0.15s;
}
.content-card:hover .content-card__rating {
  opacity: 1;
}

/* СТАЛО: */
.content-card__rating {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
  opacity: 1;          /* ← ИЗМЕНЕНО: всегда виден */
  /* transition: убрать или сохранить для brightness hover эффекта */
}

/* Опциональный hover-эффект без скрытия: */
.content-card:hover .content-card__rating {
  filter: brightness(1.15);  /* ← чуть ярче при hover */
}
```

### VIS-04: Градиентный переход (Подход B — псевдоэлементы)

```css
/* Source: анализ globals.css строки 448-503 */

.tv-section {
  position: relative;
  background: linear-gradient(180deg, #0a0a0a 0%, #161616 8%, #161616 92%, #0a0a0a 100%);
  padding: 3rem 0;
}

/* Верхний переход: белый страницы → тёмный tv-section */
.tv-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(to bottom, #ffffff 0%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

/* Нижний переход: тёмный tv-section → белый страницы */
.tv-section::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(to top, #ffffff 0%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

/* Содержимое секции выше псевдоэлементов */
.tv-section > * {
  position: relative;
  z-index: 1;
}
```

### VIS-03: Улучшение цветов channel-card

```css
/* Source: globals.css строки 206-331 — минимальные улучшения */

/* Info панель — чуть темнее для большего контраста */
.channel-card__info {
  background: #1e1e1e;   /* было: #2d2d2d */
}

.channel-card__logo {
  background: #252525;   /* было: #333333 */
}

/* Текст программы — чуть ярче */
.channel-card__program {
  color: #f0f0f0;        /* было: #e0e0e0 */
}

/* Название канала — чуть светлее */
.channel-card__name {
  color: #9e9e9e;        /* было: #828282 */
}

/* Постер poster bg */
.content-card__poster {
  background-color: #1a1a1a;  /* было: #252525 */
}

/* Заголовок карточки контента */
.content-card__title {
  color: #e0e0e0;        /* было: #bdbdbd */
}
```

### VIS-05: Проверочный CSS — сетка адаптивности

```css
/* Source: globals.css строки 210-363 — ПРОВЕРКА (изменения минимальны) */

/* 6 карточек: >= 1280px */
.channel-card, .content-card {
  flex: 0 0 calc((100% - 10px * 5) / 6);
  min-width: calc((100% - 10px * 5) / 6);
}

/* 5 карточек: 1024px - 1279px */
@media (max-width: 1279px) {
  .channel-card, .content-card {
    flex: 0 0 calc((100% - 10px * 4) / 5);
    min-width: calc((100% - 10px * 4) / 5);
  }
}

/* 4 карточки: 768px - 1023px */
@media (max-width: 1023px) {
  .channel-card, .content-card {
    flex: 0 0 calc((100% - 10px * 3) / 4);
    min-width: calc((100% - 10px * 3) / 4);
  }
}

/* 2.5 карточки: < 768px */
@media (max-width: 767px) {
  .channel-card, .content-card {
    flex: 0 0 calc((100% - 8px * 1.5) / 2.5);
    min-width: calc((100% - 8px * 1.5) / 2.5);
  }
}

/* Математическая проверка:
   2.5 карточки: gap = 8px, кол-во промежутков = 1.5 (между 2.5 cards ~ 1.5 gaps)
   ширина 1 карточки = (container - 8*1.5) / 2.5 = (container - 12) / 2.5 ✓
   6 карточек: gap = 10px, кол-во промежутков = 5
   ширина 1 карточки = (container - 10*5) / 6 = (container - 50) / 6 ✓ */
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Рейтинг только при hover | Рейтинг всегда виден | Phase 5 | Пользователь видит рейтинг без наведения — UX улучшение |
| Резкий переход белый/тёмный | Градиентный fade | Phase 5 | Визуально приятный переход между секциями |
| Светло-серые цвета карточек | Тёмные (#1e1e1e/#252525) цвета ближе к 24h.tv | Phase 5 | Единообразие с референсным сервисом |

**Deprecated/не трогать:**
- Адаптивная сетка (`VIS-05`): уже реализована корректно — только визуальная проверка.
- hover-расширение каналов (`HOVER-*`): завершено в Phase 1 — не трогать.
- HLS-логика (`HLS-*`): не в скопе Phase 5.

---

## Open Questions

1. **Цвет перехода зависит от контекста страницы**
   - Что знаем: `/tv/page.tsx` — HeroBanner перед tv-section (тёмный hero), white-section после
   - Что неясно: В Phase 4 шлейфы появятся на главной — там контекст другой (белая страница сверху и снизу)
   - Рекомендация: Реализовать переход для `/tv` page — на главной странице подход может отличаться. Phase 4 и 5 тесно связаны.

2. **Насколько точно соответствовать 24h.tv (VIS-03)**
   - Что знаем: 24h.tv — SPA, их CSS не доступен через WebFetch, конкретные hex-значения неизвестны точно
   - Что неясно: Требование "максимально близко" — субъективно. Нет pixel-perfect макета.
   - Рекомендация: Опираться на визуальный анализ через браузер при наличии доступа к 24h.tv. Ключевые изменения: темнее карточки, ярче текст, бейджи рейтинга всегда видны.

3. **Padding для зоны перехода при псевдоэлементах**
   - Что знаем: Высота 80px для `::before`/`::after` — приблизительная
   - Что неясно: Оптимальная высота без наблюдения в браузере неизвестна
   - Рекомендация: Начать с 80px, скорректировать по результату визуальной проверки.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Нет тестового фреймворка (только build/lint) |
| Config file | Отсутствует |
| Quick run command | `npm run build && npm run lint` |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-02 | Рейтинг виден без hover | manual | Открыть `/tv`, проверить постеры "Новинки" без наведения | ✅ `/tv` существует |
| VIS-03 | Визуальное соответствие 24h.tv | manual | Открыть `/tv` и сравнить с 24h.tv в браузере | ✅ `/tv` существует |
| VIS-04 | Градиентный переход dark→light | manual | Открыть `/tv`, проверить верхнюю/нижнюю границу tv-section | ✅ `/tv` существует |
| VIS-05 | 6/5/4/2.5 карточек на разных вьюпортах | manual | DevTools → resize до 1400/1200/900/600px, считать карточки | ✅ `/tv` существует |

### Build Gate

Перед закрытием фазы:
```bash
cd /Users/vasilymaslovsky/Desktop/redesign/iflat-redesign
npm run build
npm run lint
```

### Wave 0 Gaps

- Нет автоматизированных visual тестов — все проверки мануальные
- Рекомендуется: dev-сервер `npm run dev`, открыть `http://localhost:3000/tv`, проверить каждый критерий успеха из ROADMAP.md Phase 5

*(Добавление visual regression testing — вне скопа)*

---

## Sources

### Primary (HIGH confidence)

- Прямая инспекция: `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/app/globals.css` — строки 335-504 (content-card, tv-section)
- Прямая инспекция: `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/components/sections/ContentShelf.tsx` — строки 107-113 (рейтинговый рендер)
- Прямая инспекция: `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/app/tv/page.tsx` — структура страницы, порядок секций
- Прямая инспекция: `/Users/vasilymaslovsky/Desktop/redesign/.planning/REQUIREMENTS.md` — VIS-02, VIS-03, VIS-04, VIS-05 формулировки
- MDN Web Docs (training data, HIGH) — CSS pseudo-elements `::before`/`::after`, градиенты, stacking contexts

### Secondary (MEDIUM confidence)

- Анализ 24h.tv CDN URL-паттернов в `tv-shelves.ts` — цвета фона `#161616` подтверждены через WebFetch
- Визуальный анализ паттернов dark-themed streaming services (Netflix, Kinopoisk) — стандартные значения цветов и отступов

### Tertiary (LOW confidence)

- Конкретные hex-коды 24h.tv UI (кроме `#161616`) — их CSS не доступен через WebFetch (SPA), точные значения неизвестны. Рекомендованные цвета — приближение на основе best-practice dark UI.

---

## Metadata

**Confidence breakdown:**
- VIS-02 (рейтинг видимость): HIGH — причина и fix идентифицированы точно по коду
- VIS-03 (визуальное соответствие): MEDIUM — общий подход ясен, конкретные цвета 24h.tv точно неизвестны
- VIS-04 (gradient transition): HIGH — CSS техника хорошо известна, подход выбран
- VIS-05 (адаптивность): HIGH — логика уже реализована и верна, нужна только проверка

**Research date:** 2026-03-09
**Valid until:** 2026-06-09 (стабильный домен — CSS visual polish)

---

*Готово для планировщика. Planner может создавать PLAN.md на основе этого исследования.*
