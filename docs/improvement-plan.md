# План улучшений iFlat — от референсов к цельному дизайну

> Статус: утверждён, готов к реализации
> Дата: 2026-03-05
> Режим: мультиагентная разработка

## Дизайн-принцип

Не копируем чужое — берём проверенные UX-паттерны и адаптируем под наш визуальный язык:
- Оранжевый `#F59500` (CTAs, акценты, бейджи)
- Тёмный `#0F1A2E` (TopBar, footer, hero overlay)
- Поверхность `#F7F8FA` (чередование секций)
- Шрифт Inter (Latin + Cyrillic)
- Мягкие скругления, лёгкие анимации
- White-label архитектура (все данные в /config/)

---

## ВОЛНА 1: Первое впечатление (Hero + Navigation)

### 1.1 Карусель hero-баннеров (Embla)
**Файлы:**
- НОВЫЙ: `src/components/sections/HeroCarousel.tsx`
- НОВЫЙ: `src/config/hero.ts`
- ПРАВКА: `src/app/page.tsx`

**Что делать:**
- Создать `HeroCarousel` — обёртка на `embla-carousel-react` + `embla-carousel-autoplay` (оба уже в package.json)
- 4-5 слайдов из имеющихся 17 .webp баннеров, каждый со своим заголовком и CTA
- Точечная пагинация: `w-3 h-3 rounded-full bg-white/50`, активная `bg-brand-primary`
- Crossfade-переход (opacity, не slide), автоплей 7 сек, пауза на hover
- Конфиг в `src/config/hero.ts`:
  ```ts
  export const heroSlides = [
    { title: "...", subtitle: "...", ctaText: "...", ctaHref: "...", backgroundImage: "/images/hero/..." },
    ...
  ]
  ```
- На главной заменить `<HeroBanner .../>` на `<HeroCarousel />`
- HeroBanner остаётся как компонент для внутренних страниц (compact mode)

**Откуда:** МегаФон (карусель), Sky (crossfade)

### 1.2 Органичная кривая внизу Hero
**Файл:** `src/components/sections/HeroBanner.tsx`

**Что делать:**
- Перед закрывающим `</section>` добавить:
  ```tsx
  <div className="absolute bottom-0 left-0 right-0 h-16 bg-white"
       style={{ borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
  ```
- Или использовать SVG wave
- Добавить `pb-16` к секции, чтобы контент не обрезался

**Откуда:** Sky (clip-path: ellipse())

### 1.3 Живые декоративные блики на Hero
**Файлы:** `src/components/sections/HeroBanner.tsx`, `src/app/globals.css`

**Что делать:**
- В globals.css добавить keyframes:
  ```css
  @keyframes float-slow {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(20px, -15px) rotate(2deg); }
    66% { transform: translate(-10px, 10px) rotate(-1deg); }
  }
  @keyframes float-slow-reverse {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(-15px, 20px) rotate(-2deg); }
    66% { transform: translate(10px, -10px) rotate(1deg); }
  }
  ```
- На оранжевые glow-блобы (уже есть в HeroBanner) добавить:
  - Верхний правый: `animate-[float-slow_20s_ease-in-out_infinite]`
  - Нижний левый: `animate-[float-slow-reverse_25s_ease-in-out_infinite]`

**Откуда:** Virgin Media, Sky (animated flares)

### 1.4 Промо-полоса над TopBar
**Файлы:**
- НОВЫЙ: `src/components/layout/Header/PromoBanner.tsx`
- ПРАВКА: `src/components/layout/Header/Header.tsx`

**Что делать:**
- Тонкая полоса `h-9` с градиентом `bg-gradient-to-r from-brand-primary via-amber-500 to-brand-primary`
- Текст промо + стрелка-ссылка, кнопка закрытия (×)
- Скрытие через `sessionStorage.setItem('promo-dismissed', 'true')`
- Текст из конфига (promotions.ts или site.ts)
- Вставить `<PromoBanner />` перед `<TopBar />` в Header.tsx
- `"use client"` компонент (нужен useState + sessionStorage)

**Откуда:** Sky (rainbow gradient banner)

### 1.5 Pill-shaped кнопки
**Файлы:** `src/components/ui/Button.tsx`, `src/components/sections/HeroBanner.tsx`, `src/components/layout/Header/MainNav.tsx`

**Что делать:**
- Button.tsx base: `rounded-lg` → `rounded-xl`
- Hero CTA (HeroBanner.tsx): `rounded-xl` → `rounded-full`
- MainNav CTA: `rounded-lg` → `rounded-xl`
- Проверить все 15 страниц — кнопки обновятся автоматически через Button компонент

**Откуда:** Google Fiber (pill buttons)

---

## ВОЛНА 2: Конверсия (Тарифы + Доверие)

### 2.1 Якорение цены (зачёркнутая старая цена)
**Файлы:** `src/types/tariff.ts`, `src/components/sections/TariffCard.tsx`, `src/config/tariffs/flat.ts`, `src/config/tariffs/home.ts`

**Что делать:**
- В `TariffPlan` интерфейс добавить:
  ```ts
  oldPrice?: number;
  promoLabel?: string;  // напр. "Акция"
  ```
- В TariffCard, в блоке цены (после line 88), если `plan.oldPrice`:
  ```tsx
  <div className="flex items-baseline gap-2">
    <span className="text-lg text-text-secondary line-through">{formatPrice(plan.oldPrice)} ₽</span>
    {plan.promoLabel && <Badge variant="promo">{plan.promoLabel}</Badge>}
  </div>
  ```
- Обновить 2-3 тарифа в flat.ts для демонстрации

**Откуда:** Cox (price anchoring)

### 2.2 Описания скорости "для кого"
**Файлы:** `src/types/tariff.ts`, `src/components/sections/TariffCard.tsx`, `src/config/tariffs/flat.ts`

**Что делать:**
- Добавить `speedDescription?: string` в TariffPlan
- В TariffCard после блока скорости:
  ```tsx
  {plan.speedDescription && (
    <p className="text-xs text-white/60 mt-1">{plan.speedDescription}</p>
  )}
  ```
- Примеры:
  - 100 Мбит/с: "Для 1-2 устройств, веб и HD видео"
  - 200 Мбит/с: "Семья 2-3 человека, стриминг на 3+ устройствах"
  - 300 Мбит/с: "Для геймеров и работы из дома"

**Откуда:** Cox, NextBit (speed-to-activity mapping)

### 2.3 Улучшенный бейдж "САМЫЙ ПОПУЛЯРНЫЙ"
**Файл:** `src/components/sections/TariffCard.tsx`

**Что делать:**
- Текст: "Хит продаж" → "САМЫЙ ПОПУЛЯРНЫЙ"
- Добавить иконку Star из Lucide (уже импортирован)
- На isHit карточку: `scale-[1.02] z-10 ring-2 ring-brand-primary/30`
- Бейдж: добавить `flex items-center gap-1.5` + иконка 14px

**Откуда:** Cox ("MOST POPULAR"), ThemeForest

### 2.4 Анимированные счётчики в StatsStrip
**Файл:** `src/components/sections/StatsStrip.tsx`

**Что делать:**
- Создать хук `useCountUp(target, duration)` или inline-логику:
  - Парсить числовое значение из строки (напр. "40 000+" → 40000)
  - При `whileInView` → инкрементировать от 0 до target за 2сек
  - Сохранить суффиксы (+, %)
- Использовать `useRef` + `requestAnimationFrame` или Framer Motion `useMotionValue`

**Откуда:** ThemeForest (все шаблоны), МегаФон

### 2.5 Секция "Как подключиться" (3 шага)
**Файлы:**
- НОВЫЙ: `src/components/sections/HowItWorks.tsx`
- ПРАВКА: `src/app/page.tsx`

**Что делать:**
- 3 шага горизонтально (мобайл: вертикально):
  1. ClipboardList → "Оставьте заявку" → "Заполните форму или позвоните нам"
  2. Wrench → "Подключение за 2-3 дня" → "Мастер приедет в удобное время"
  3. Wifi → "Пользуйтесь!" → "Наслаждайтесь быстрым интернетом"
- Нумерованные круги `w-14 h-14 bg-brand-primary text-white rounded-full flex items-center justify-center text-xl font-bold`
- Пунктирная линия между кругами (CSS `border-dashed`)
- Scroll-reveal анимация
- Расположение: между TariffGrid и ConnectionSection

**Откуда:** ThemeForest (все 8 шаблонов)

---

## ВОЛНА 3: Премиальный полиш

### 3.1 Увеличение отступов
**Файлы:** все компоненты секций

- FeatureCards, TariffGrid, ConnectionSection: `py-16 lg:py-24` → `py-20 lg:py-28`
- SectionTitle: `mb-10` → `mb-12 lg:mb-16`

**Откуда:** Sky (generous spacing)

### 3.2 Font-weight 450
**Файл:** `src/app/globals.css`

- Добавить: `body { font-weight: 450; }` (Inter Variable поддерживает)
- Карточные заголовки: `font-bold` → `font-semibold`
- Сохранить `font-black` для цен и скоростей

**Откуда:** МегаФон (font-weight 500)

### 3.3 Серые карточки на белом фоне
**Файлы:** `src/components/sections/FeatureCards.tsx`, `src/components/ui/Card.tsx`

- FeatureCards: `bg-white border border-gray-100 shadow-sm` → `bg-brand-surface border-0 shadow-none`
- Card: добавить `variant?: "default" | "flat"`, flat = `bg-brand-surface border-0 shadow-none`

**Откуда:** МегаФон

### 3.4 ScrollReveal обёртка
**Файл:** НОВЫЙ `src/components/ui/ScrollReveal.tsx`

```tsx
"use client";
import { motion } from "framer-motion";

export function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

- Обернуть: SectionTitle, TariffGrid, ConnectionSection, CTABanner, FaqSection, HowItWorks

**Откуда:** все референсные сайты

### 3.5 Бейдж-заголовок секций
**Файл:** `src/components/ui/SectionTitle.tsx`

- Добавить проп `badge?: string`
- Рендер над `<h2>`:
  ```tsx
  {badge && (
    <span className="inline-block mb-3 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-primary bg-brand-primary-light rounded-full">
      {badge}
    </span>
  )}
  ```

**Откуда:** ThemeForest, Virgin Media

---

## ВОЛНА 4: Доработка существующих секций

### 4.1 Мобильная peek-карусель тарифов
**Файл:** `src/components/sections/TariffGrid.tsx`

- На мобильном (< md): Embla карусель, 1.15 карточки видно
- На md+: `grid-cols-2 lg:grid-cols-3`
- CSS: `hidden md:grid` для грида, `md:hidden` для карусели

**Откуда:** МегаФон

### 4.2 ConnectionSection — двухколоночный layout
**Файл:** `src/components/sections/ConnectionSection.tsx`

- Десктоп: `grid grid-cols-1 lg:grid-cols-2 gap-12`
- Слева: заголовок + 3 trust-буллита:
  - Phone: "Перезвоним за 5 минут"
  - Shield: "Бесплатный выезд мастера"
  - Lock: "Без скрытых платежей"
- Справа: форма
- Под формой: телефон горячей линии

**Откуда:** Cox, ThemeForest

### 4.3 CTABanner — визуальное улучшение
**Файл:** `src/components/sections/CTABanner.tsx`

- Добавить dot-grid overlay (как в hero, opacity 0.05)
- Двухколоночный: слева текст + кнопка CTA, справа телефон в `bg-white/20 rounded-full px-6 py-3`
- Пульсирующая иконка телефона (animate-pulse)

**Откуда:** ThemeForest

### 4.4 Footer — кнопки приложений
**Файл:** `src/components/layout/Footer/Footer.tsx`

- В колонку контактов добавить:
  ```tsx
  <div className="mt-4">
    <p className="text-sm text-gray-400 mb-2">Скачайте приложение</p>
    <div className="flex gap-2">
      <a href={siteConfig.apps.googlePlay}><Image src="/images/app/google-play.png" .../></a>
      <a href={siteConfig.apps.appStore}><Image src="/images/app/app-store.png" .../></a>
    </div>
  </div>
  ```

**Откуда:** МегаФон, все шаблоны

---

## Порядок реализации для мультиагентной разработки

Каждая фаза независима — можно параллелить задачи внутри фазы:

### Фаза 1 (CSS-only, минимальный риск)
- [ ] 1.2 Кривая внизу hero
- [ ] 1.3 Анимированные блики
- [ ] 1.5 Pill-shaped кнопки
- [ ] 3.1 Увеличение отступов
- [ ] 3.2 Font-weight 450

### Фаза 2 (новые компоненты, низкий риск)
- [ ] 1.1 Hero-карусель (Embla)
- [ ] 1.4 Промо-полоса
- [ ] 3.4 ScrollReveal
- [ ] 3.5 Badge-заголовки

### Фаза 3 (расширение существующих компонентов)
- [ ] 2.1 Якорение цены
- [ ] 2.2 Описания скорости
- [ ] 2.3 Бейдж "ПОПУЛЯРНЫЙ"
- [ ] 2.4 Animated counters
- [ ] 3.3 Серые карточки

### Фаза 4 (новые секции и доработки)
- [ ] 2.5 HowItWorks
- [ ] 4.1 Peek-карусель тарифов
- [ ] 4.2 ConnectionSection двухколоночный
- [ ] 4.3 CTABanner улучшение
- [ ] 4.4 Footer приложения

### Проверка после каждой фазы
1. `npm run build` — без ошибок
2. `npm run dev` — визуальная проверка localhost:3000
3. Пройти все 15 страниц
4. Проверить мобильный вид (DevTools responsive)

---

## Дизайн-правила для целостности

1. **Два цвета CTA:** оранжевый primary, тёмный secondary. Никаких третьих цветов для кнопок.
2. **Border-radius:** Cards = 16px, Buttons = 12-16px или pill (full), Badges = full.
3. **Чередование секций:** White / Surface (#F7F8FA) / White / Surface. Тёмные — только StatsStrip и CTABanner.
4. **Бюджет анимаций:** одна входная анимация на секцию, `viewport.once: true`, без конкурирующих движений.
5. **Шкала отступов:** кратно 4px. Секции: 80-128px. Внутренние: 24-32px. Текст: 8-16px.
6. **Brand color:** оранжевый только для CTA, badges, иконок, акцентных линий. Никогда как фон секции, кроме CTABanner.
