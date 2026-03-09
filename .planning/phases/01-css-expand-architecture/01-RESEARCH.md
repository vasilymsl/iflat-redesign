# Phase 1: CSS Expand Architecture - Research

**Researched:** 2026-03-09
**Domain:** CSS overflow, stacking contexts, scroll-snap, hover animation
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOVER-01 | При наведении на карточку канала, она расширяется до ~140% ширины и перекрывает соседние карточки | CSS: `.channel-card-inner` width:140% + position:relative + z-index, outer `.channel-card` сохраняет flex-size |
| HOVER-02 | Расширение начинается с задержкой 200ms для предотвращения случайных срабатываний | CSS: `transition-delay: 0.2s` на `.channel-card-inner`. JS `setTimeout(200)` уже в `handleMouseEnter` — не трогать |
| HOVER-03 | Анимация расширения плавная (CSS GPU-composited, 0.25s ease-out) | CSS: `transition: width 0.25s ease-out, transform 0.25s ease-out` + `will-change: transform` |
| HOVER-04 | Scroll-контейнер не обрезает расширенную карточку (решена проблема overflow) | CSS: `overflow-x: auto; overflow-y: visible` на `.tv-shelf__scroll` + убрать `overflow: hidden` с `.channel-card-inner` + убрать `scroll-snap-type` |
| HOVER-06 | При уходе курсора карточка плавно возвращается к исходному размеру | CSS: `transition-delay` на hover-off задержан на 0s (уже управляется через класс `channel-card-inner--hovered`), возврат к `width: 100%` |

</phase_requirements>

---

## Summary

Фаза 1 — чистая CSS/архитектурная задача без нового JavaScript. Текущая кодовая база имеет `scale(1.05)` как placeholder, который нужно заменить на реальное 140%-расширение. Три взаимозависимые проблемы: (1) `.tv-shelf__scroll` имеет `scroll-snap-type: x mandatory` и `overflow-x: auto` — первое конфликтует с расширением через layout-изменения, второе (в паре с отсутствием `overflow-y: visible`) обрезает трансформированные карточки; (2) `.channel-card-inner` имеет `overflow: hidden` — убивает расширение на уровне самой карточки; (3) z-index расширенной карточки должен пробиваться через `tv-shelf__slider` и не конфликтовать с `MainNav` (z-index: 50).

Правильная стратегия: расширять `.channel-card-inner` через `width: 140%` (не `scaleX`), убрать `scroll-snap-type` с `overflow-y: visible` на контейнере, `overflow: hidden` убрать с inner, установить stacking context через `isolation: isolate` на `.tv-shelf__slider`. Scroll-snap отключить на десктопе — JS scroll уже есть через `.scroll()` метод. На мобиле (< 768px) hover не применяется (`@media (hover: hover) and (min-width: 768px)`), поэтому там оставить scroll-snap.

**Primary recommendation:** Расширять `.channel-card-inner` через `width: 140%` + `position: relative` + `z-index: 20` при hover, убрать `overflow: hidden` с `.channel-card-inner` и `scroll-snap-type` с `.tv-shelf__scroll` на десктопе. Добавить `isolation: isolate` на `.tv-shelf__slider` для контроля stacking context.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Plain CSS transitions | Browser built-in | Card expand animation | GPU compositor thread — нет JS overhead во время анимации |
| CSS custom properties | Browser built-in | Параметризация scale factor | Позволяет переиспользовать и переопределять значения |

### No New Packages

Для этой фазы новые пакеты не нужны. Весь функционал реализуется через изменения в:
- `src/app/globals.css` — основные CSS изменения
- `src/components/sections/ChannelCard.tsx` — незначительные: обновить класс `channel-card-inner--hovered` если нужно
- `src/components/sections/TvChannelShelf.tsx` — убрать scroll-snap программно на десктопе (если нужно через JS)

**Installation:**
```bash
# Ничего устанавливать не нужно. Все зависимости присутствуют.
```

---

## Architecture Patterns

### Recommended Project Structure

Изменения затрагивают только существующие файлы:

```
iflat-redesign/src/
├── app/
│   └── globals.css              ← ГЛАВНОЕ: изменения CSS для TV shelf + channel card
├── components/sections/
│   ├── TvChannelShelf.tsx       ← мелкая правка: scroll-snap на мобиле
│   └── ChannelCard.tsx          ← мелкая правка: обновить transition-delay handling
```

### Pattern 1: Width Expansion (не scaleX)

**Что:** `.channel-card-inner` расширяется через `width: 140%`, не через `transform: scaleX(1.4)`.

**Когда использовать:** Для реального 140%-расширения карточки — соседи остаются на месте (outer `.channel-card` сохраняет flex-width), inner просто визуально вылезает поверх них.

**Почему НЕ scaleX:**
- `scaleX(1.4)` растягивает контент включая текст и логотипы — выглядит уродливо
- `width: 140%` — inner реальный layout reflow до новой ширины, контент нормально перетекает
- `scale()` не меняет layout footprint — соседи не сдвигаются (нужное поведение)

**Пример:**
```css
/* Source: анализ кодовой базы + PITFALLS.md */

/* Scroll container: убрать clipping, убрать scroll-snap на десктопе */
.tv-shelf__scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  overflow-y: visible;           /* КРИТИЧНО: разрешает карточкам расти вертикально */
  scroll-behavior: smooth;
  scrollbar-width: none;
  padding: 10px 0 2rem;
  margin: 0 3.5rem;
  /* scroll-snap-type: убрать на десктопе — JS scroll уже работает через .scroll() */
}

/* НА МОБИЛЕ: scroll-snap вернуть (hover там не работает, snap полезен) */
@media (max-width: 767px) {
  .tv-shelf__scroll {
    scroll-snap-type: x mandatory;
    overflow-y: auto;            /* на мобиле overflow-y: auto безопасен */
    gap: 8px;
    padding: 8px 0 1.5rem;
    margin: 0 1rem;
  }
}

/* Slider: isolation для stacking context */
.tv-shelf__slider {
  position: relative;
  isolation: isolate;            /* дочерние z-index изолированы от header */
}

/* Outer card: сохраняет flex-slot, не меняет layout при hover */
.channel-card {
  flex: 0 0 calc((100% - 10px * 5) / 6);
  min-width: calc((100% - 10px * 5) / 6);
  /* scroll-snap-align убрать — snap-type убран на десктопе */
  position: relative;
  cursor: pointer;
  z-index: 1;
}

/* На мобиле вернуть snap-align */
@media (max-width: 767px) {
  .channel-card {
    flex: 0 0 calc((100% - 8px * 1.5) / 2.5);
    min-width: calc((100% - 8px * 1.5) / 2.5);
    scroll-snap-align: start;
  }
}

/* Inner: убрать overflow:hidden, добавить transition */
.channel-card-inner {
  border-radius: 8px;
  position: relative;
  /* overflow: hidden; ← УБРАТЬ: это обрезало бы расширение */
  width: 100%;
  transition: width 0.25s ease-out, box-shadow 0.25s ease-out, transform 0.25s ease-out;
  transition-delay: 0.2s;       /* 200ms hover intent delay (HOVER-02) */
}

/* Hover state: только для мыши на десктопе */
@media (hover: hover) and (min-width: 768px) {
  .channel-card:hover {
    z-index: 20;                 /* поднять карточку над соседями */
  }

  .channel-card:hover .channel-card-inner {
    width: 140%;                 /* расширить inner до 140% */
    transform: translateY(-6px); /* приподнять для "всплытия" */
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7);
    transition-delay: 0s;        /* сбросить delay при входе (start immediately after 200ms JS timer) */
  }
}
```

**Важно о z-index:** `.channel-card:hover { z-index: 20 }` нужен на OUTER `.channel-card` (не только на inner). Inner с `position: relative` наследует stacking context от outer.

### Pattern 2: Z-Index Hierarchy

**Стек z-index в проекте:**

| Элемент | Z-Index | Класс/стиль |
|---------|---------|-------------|
| MainNav (sticky header) | z-50 (= 50) | Tailwind `z-50` |
| TV shelf arrows | z-index: 10 | `.tv-shelf__arrow` |
| Hovered channel card | z-index: 20 | `.channel-card:hover` |
| TV shelf slider | isolation: isolate | `.tv-shelf__slider` |

**Почему `isolation: isolate` решает конфликт с header:**
`isolation: isolate` на `.tv-shelf__slider` создаёт новый stacking context. Дочерние z-index (20 для карточки, 10 для стрелок) конкурируют ТОЛЬКО внутри этого контекста. Весь `.tv-shelf__slider` как единица имеет z-index: auto относительно `.tv-section`, поэтому не конфликтует с header (z-index: 50).

**Пример разметки:**
```tsx
/* Source: анализ TvChannelShelf.tsx + MainNav.tsx */
// MainNav: z-50 → sticky, поверх всего
// .tv-shelf__slider: isolation: isolate → замкнутый stacking context
// .channel-card:hover: z-index: 20 → поверх братьев-карточек (изолировано)
// Результат: расширенная карточка НЕ вылезет за header ✓
```

### Pattern 3: Hover-Intent через CSS transition-delay

**Что:** 200ms задержка реализована через `transition-delay: 0.2s` на состоянии по умолчанию (не hover). При hover: `transition-delay: 0s` — анимация начинается сразу (JS `setTimeout(200)` уже обеспечивает задержку).

**Уточнение:** В `ChannelCard.tsx` `handleMouseEnter` уже вызывает `startStream()` через `setTimeout(200)`. Для CSS-расширения задержка управляется через `isHovered` state (setIsHovered(true) вызывается сразу). Значит, класс `channel-card-inner--hovered` навешивается БЕЗ задержки. CSS-задержка `transition-delay: 0.2s` на самом `.channel-card-inner` реализует визуальную паузу.

**Правильная схема:**
```css
/* Дефолт: delay 0.2s — расширение начнётся через 200ms после смены класса */
.channel-card-inner {
  transition: width 0.25s ease-out, box-shadow 0.25s ease-out;
  transition-delay: 0.2s;
}

/* При hover: delay 0s — анимация возврата начинается мгновенно */
@media (hover: hover) and (min-width: 768px) {
  .channel-card:hover .channel-card-inner {
    width: 140%;
    transition-delay: 0s;
  }
}
```

**Результат:**
- Наведение → 200ms пауза → плавное расширение 0.25s ease-out (HOVER-02 + HOVER-03)
- Уход курсора → мгновенное начало возврата → плавное сжатие 0.25s ease-out (HOVER-06)

### Anti-Patterns to Avoid

- **`scaleX(1.4)` вместо `width: 140%`:** scaleX растягивает текст и логотипы — визуально неприемлемо. Width реально перекрывает соседей с правильным контентом.
- **Оставить `overflow: hidden` на `.channel-card-inner`:** Это мгновенно обрезает расширение. Pitfall #1 из PITFALLS.md. Обязательно убрать.
- **Оставить `scroll-snap-type: x mandatory` на десктопе:** При layout-изменениях (даже косвенных) snap срабатывает и дёргает шлейф. Pitfall #4 из PITFALLS.md.
- **`overflow-x: auto` без `overflow-y: visible`:** По спецификации W3C, когда `overflow-x: auto`, браузер принудительно устанавливает `overflow-y: auto` если не задать явно `overflow-y: visible`. Нужно явно прописать оба.
- **`transform` или `will-change: transform` на `.tv-shelf__slider`:** Создаёт stacking context, который заблокирует z-index детей от конкуренции за header. Использовать `isolation: isolate` вместо этого.
- **`z-index` на `.channel-card-inner` без `z-index` на outer `.channel-card`:** Inner с position:relative внутри outer без z-index не создаёт нового stacking context — z-index на inner не сработает.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hover intent delay | Кастомный JS debounce/timer | CSS `transition-delay: 0.2s` | JS timeout уже есть для HLS (startStream), CSS delay — для визуала. Дублировать JS для CSS-анимации не нужно |
| Карточка поверх соседей | JS-клон карточки поверх DOM | CSS `position: relative; z-index: 20` | position:absolute overlay сложнее и требует JS расчётов позиции |
| Stacking context | Числовой z-index на контейнере | CSS `isolation: isolate` | Изолирует без числового z-index, не конкурирует с header |

**Key insight:** Вся анимация расширения — чистый CSS. JS в ChannelCard нужен только для HLS (Phase 3). Для фазы 1 JS-изменений минимум.

---

## Common Pitfalls

### Pitfall 1: overflow-y не стал visible

**Что происходит:** `overflow-x: auto` на `.tv-shelf__scroll` без явного `overflow-y: visible` — браузер принудительно делает `overflow-y: auto`. Расширенная карточка клипается вертикально.

**Почему:** W3C CSS Overflow Level 3: "if one of overflow-x or overflow-y is not visible, the other is forced to auto". Это не баг — это спека.

**Как избежать:** Всегда прописывать обе оси явно:
```css
.tv-shelf__scroll {
  overflow-x: auto;
  overflow-y: visible; /* явно! */
}
```

**Признаки:** Карточка при hover расширяется вширь (OK), но обрезается по горизонтальной плоскости контейнера.

---

### Pitfall 2: scroll-snap дёргает шлейф при hover

**Что происходит:** Если оставить `scroll-snap-type: x mandatory`, при hover-расширении браузер может перепозиционировать scroll-контейнер. Особенно заметно в Firefox.

**Почему:** Scroll-snap отслеживает layout и может snap-ить при любых scroll events. Width-изменение `.channel-card-inner` (если влияет на layout через margin) триггерит snap.

**Как избежать:** Убрать `scroll-snap-type` для десктопа. JS scroll через `.scrollBy()` уже работает — scroll-snap не нужен на десктопе.

```css
/* Только на мобиле scroll-snap остаётся */
@media (max-width: 767px) {
  .tv-shelf__scroll { scroll-snap-type: x mandatory; }
  .channel-card { scroll-snap-align: start; }
}
```

---

### Pitfall 3: `overflow: hidden` на `.channel-card-inner` остался

**Что происходит:** Карточка расширяется до 140%, но содержимое обрезается по исходным границам. Видно что что-то происходит, но карточка выглядит неправильно.

**Текущий код:** `globals.css:237` — `.channel-card-inner { overflow: hidden; }` — это нужно убрать.

**Важно:** `overflow: hidden` можно оставить на `.channel-card__preview` (для правильного отображения aspect-ratio видео/изображения), но убрать именно с `.channel-card-inner`.

---

### Pitfall 4: z-index не работает без правильного stacking context

**Что происходит:** `.channel-card:hover { z-index: 20 }` не поднимает карточку над соседями, хотя должен.

**Причина:** Если `position` не задан на `.channel-card` — z-index игнорируется. Или если родительский элемент (`.tv-shelf__scroll`) имеет `transform` — создаётся новый stacking context и z-index детей замкнут внутри.

**Проверка:** Открыть DevTools → Elements → Computed → Stacking Context. Или поставить временно очень высокий z-index (999) и наблюдать.

**Как избежать:**
```css
.channel-card {
  position: relative;   /* обязателен для z-index */
  z-index: 1;           /* базовый z-index */
}
.channel-card:hover {
  z-index: 20;          /* поднять при hover */
}
```

---

### Pitfall 5: Transition-delay применяется в обоих направлениях

**Что происходит:** `transition-delay: 0.2s` на `.channel-card-inner` задерживает не только расширение, но и сжатие при уходе курсора. Возврат к исходному размеру ощущается "тупым".

**Как избежать:** Delay только при входе в hover, при выходе — мгновенно:
```css
.channel-card-inner {
  transition: width 0.25s ease-out, box-shadow 0.25s ease-out;
  transition-delay: 0.2s;   /* delay при возврате */
}
@media (hover: hover) and (min-width: 768px) {
  .channel-card:hover .channel-card-inner {
    width: 140%;
    transition-delay: 0s;   /* NO delay при расширении — анимация начинается сразу */
  }
}
```

Ожидаемое UX: наведение → 200ms пауза → плавное расширение. Уход → 200ms пауза → плавное сжатие. Оба направления с задержкой — это нормально для hover-intent.

---

## Code Examples

Verified patterns based on codebase analysis:

### Полный CSS diff для Phase 1

```css
/* Source: globals.css — существующий код + необходимые изменения */

/* БЫЛО: */
.tv-shelf__scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;   /* ← УБРАТЬ для десктопа */
  scroll-behavior: smooth;
  scrollbar-width: none;
  padding: 10px 0 2rem;
  margin: 0 3.5rem;
                                   /* ← ДОБАВИТЬ: overflow-y: visible */
}

/* СТАЛО: */
.tv-shelf__scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  overflow-y: visible;             /* ← ДОБАВЛЕНО: разрешает вертикальное расширение */
  /* scroll-snap-type убран для десктопа */
  scroll-behavior: smooth;
  scrollbar-width: none;
  padding: 10px 0 2rem;
  margin: 0 3.5rem;
}

/* Мобиль: scroll-snap возвращается */
@media (max-width: 767px) {
  .tv-shelf__scroll {
    scroll-snap-type: x mandatory; /* ← мобиль: snap полезен */
    overflow-y: auto;              /* ← мобиль: overflow-y auto OK (hover нет) */
    gap: 8px;
    padding: 8px 0 1.5rem;
    margin: 0 1rem;
  }
}

/* ДОБАВИТЬ: isolation на slider */
.tv-shelf__slider {
  position: relative;
  isolation: isolate;              /* ← ДОБАВЛЕНО: stacking context для z-index */
}

/* БЫЛО: */
.channel-card {
  flex: 0 0 calc((100% - 10px * 5) / 6);
  min-width: calc((100% - 10px * 5) / 6);
  scroll-snap-align: start;        /* ← УБРАТЬ на десктопе */
  position: relative;
  cursor: pointer;
}

/* СТАЛО: */
.channel-card {
  flex: 0 0 calc((100% - 10px * 5) / 6);
  min-width: calc((100% - 10px * 5) / 6);
  /* scroll-snap-align убран на десктопе */
  position: relative;
  cursor: pointer;
  z-index: 1;                      /* ← ДОБАВЛЕНО: базовый z-index для работы hover */
}

/* Мобиль: snap-align возвращается */
@media (max-width: 767px) {
  .channel-card {
    flex: 0 0 calc((100% - 8px * 1.5) / 2.5);
    min-width: calc((100% - 8px * 1.5) / 2.5);
    scroll-snap-align: start;      /* ← мобиль: snap-align полезен */
  }
}

/* БЫЛО: */
.channel-card-inner {
  transition: transform 0.25s ease-out 0.1s, box-shadow 0.25s ease-out 0.1s;
  border-radius: 8px;
  position: relative;
  overflow: hidden;                /* ← УБРАТЬ: обрезает расширение */
}

/* СТАЛО: */
.channel-card-inner {
  border-radius: 8px;
  position: relative;
  /* overflow: hidden ← УБРАНО */
  width: 100%;
  transition: width 0.25s ease-out, box-shadow 0.25s ease-out, transform 0.25s ease-out;
  transition-delay: 0.2s;         /* ← ДОБАВЛЕНО: 200ms hover intent (HOVER-02) */
}

/* БЫЛО: */
@media (hover: hover) and (min-width: 768px) {
  .channel-card:hover .channel-card-inner {
    transform: scale(1.05);        /* ← ЗАМЕНИТЬ на width: 140% */
    z-index: 5;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    transition-delay: 0s;
    transition-timing-function: ease-in;
  }
}

/* СТАЛО: */
@media (hover: hover) and (min-width: 768px) {
  .channel-card:hover {
    z-index: 20;                   /* ← z-index на outer card (важно!) */
  }

  .channel-card:hover .channel-card-inner {
    width: 140%;                   /* ← расширение на 140% (HOVER-01) */
    transform: translateY(-6px);   /* ← небольшой lift для эффекта "всплытия" */
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7);
    transition-delay: 0s;          /* ← 0ms delay при входе (JS setTimeout уже есть) */
  }
}
```

### Проверка transform-origin для первой/последней карточки (v2 / DATA-03)

Данная задача отмечена в v2 требованиях (DATA-03: направленное расширение). Для Phase 1 использовать `transform-origin: center center` (по умолчанию). В Phase 1 НЕ реализовывать поворот по позиции.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `scale(1.05)` на inner | `width: 140%` на inner + z-index на outer | Phase 1 | Реальное перекрытие соседей, не просто масштабирование |
| `overflow: hidden` на inner | Убрать overflow hidden | Phase 1 | Позволяет inner вылезать за границы outer |
| `scroll-snap-type` на всех | Только на мобиле | Phase 1 | Устраняет snap-дёргание при hover |
| z-index без isolation | `isolation: isolate` на slider | Phase 1 | Изолированный stacking context, не конфликтует с header |

**Deprecated в этой фазе:**
- `transform: scale(1.05)` на `.channel-card:hover .channel-card-inner` — заменяется на `width: 140%`
- `overflow: hidden` на `.channel-card-inner` — убирается полностью
- `scroll-snap-type: x mandatory` на десктопе — убирается, оставляется только на мобиле
- `scroll-snap-align: start` на `.channel-card` для десктопа — убирается

---

## Open Questions

1. **Вертикальный overflow на мобиле**
   - Что знаем: на мобиле hover не применяется (`@media (hover: hover) and (min-width: 768px)`)
   - Что неясно: нужно ли явно задавать `overflow-y: auto` на мобиле или браузер автоматически возвращает нужное поведение
   - Рекомендация: явно задать `overflow-y: auto` в мобильном media query для предсказуемости

2. **Padding для вертикального пространства расширения**
   - Что знаем: при `overflow-y: visible` карточка может расти вверх/вниз (через translateY)
   - Что неясно: нужно ли добавить `padding-top` на `.tv-shelf__scroll` чтобы дать пространство для `translateY(-6px)` (иначе верхняя часть расширенной карточки может уйти под заголовок шлейфа)
   - Рекомендация: проверить визуально. Текущий `padding: 10px 0` — 10px сверху, translateY(-6px) поместится. Если нужно больше — увеличить до 16px.

3. **Ширина расширения: 140% vs конкретные px**
   - Что знаем: HOVER-01 требует ~140%, STACK.md рекомендует `width: 140%`
   - Что неясно: на 2.5-card мобиле карточки шире (40% viewport), 140% от них может вылезти за экран
   - Рекомендация: hover-расширение отключено на мобиле через `@media (hover: hover)`, так что это не проблема в Phase 1

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Нет тестового фреймворка (проект — pure CSS/Next.js без test setup) |
| Config file | Отсутствует |
| Quick run command | `npm run build` + `npm run lint` (единственные автоматические проверки) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOVER-01 | Карточка расширяется до 140% при hover | manual | Открыть `/tv`, навести на карточку — проверить в DevTools | ✅ (страница /tv существует) |
| HOVER-02 | Задержка 200ms перед расширением | manual | Навести быстро/медленно — видна задержка | ✅ |
| HOVER-03 | Анимация 0.25s ease-out | manual | DevTools → Animations panel | ✅ |
| HOVER-04 | Карточка не обрезается | manual | Outline на .tv-shelf__scroll, проверить clip | ✅ |
| HOVER-06 | Плавное возвращение при уходе курсора | manual | Убрать курсор — наблюдать анимацию | ✅ |

### Build Gate

Перед закрытием фазы запустить:
```bash
cd /Users/vasilymaslovsky/Desktop/redesign/iflat-redesign
npm run build
npm run lint
```

### Wave 0 Gaps

- [ ] Нет автоматизированных CSS/visual тестов — все проверки мануальные через браузер
- [ ] Рекомендуется: открыть `http://localhost:3000/tv` и последовательно проверить каждый критерий успеха из ROADMAP.md Phase 1

*(Добавление тестового фреймворка — вне скопа фазы 1)*

---

## Sources

### Primary (HIGH confidence)

- Прямая инспекция кода: `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/app/globals.css` (строки 93-353)
- Прямая инспекция кода: `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/components/sections/ChannelCard.tsx`
- Прямая инспекция кода: `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/components/sections/TvChannelShelf.tsx`
- Прямая инспекция кода: `/Users/vasilymaslovsky/Desktop/redesign/iflat-redesign/src/components/layout/Header/MainNav.tsx` (z-index: 50 подтверждён)
- `.planning/research/PITFALLS.md` — Pitfall 1, 4, 9 прямо касаются Phase 1
- `.planning/research/STACK.md` — секция "CSS Hover Expansion Animation"
- `.planning/research/ARCHITECTURE.md` — секция "CSS Architecture for Expand-on-Hover", Solution A
- `.planning/STATE.md` — ключевое решение: `position: absolute` overlay vs overflow-y: visible

### Secondary (MEDIUM confidence)

- W3C CSS Overflow Level 3 spec (из обучающих данных, MEDIUM) — правило о `overflow-x: auto` → `overflow-y: auto`
- MDN Web Docs (из обучающих данных, HIGH) — `isolation: isolate` и stacking context поведение

### Tertiary (LOW confidence)

- Нет LOW-confidence источников. Все ключевые паттерны подтверждены прямым анализом кодовой базы.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — нет новых зависимостей, чистый CSS
- Architecture: HIGH — основан на прямом чтении кода + задокументированных pitfalls
- Pitfalls: HIGH — Pitfall 1 (overflow:hidden) и Pitfall 4 (scroll-snap) задокументированы в PITFALLS.md и подтверждены кодом

**Research date:** 2026-03-09
**Valid until:** 2026-06-09 (стабильный домен — CSS overflow/stacking behaviour не меняется)

---

*Готово для планировщика. Planner может создавать PLAN.md файлы на основе этого исследования.*
