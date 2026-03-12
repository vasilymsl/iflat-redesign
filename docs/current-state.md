# Текущее состояние проекта — снимок для мультиагентной разработки

> Дата: 2026-03-05
> Build: проходит без ошибок
> Dev server: npm run dev → localhost:3000

## Стек

- Next.js 16.1.6 (App Router, Turbopack)
- React 19.2.3
- TypeScript 5
- Tailwind CSS v4 (CSS-first через `@theme inline` в globals.css)
- Framer Motion v12.34.5
- Embla Carousel v8.6.0 + embla-carousel-autoplay (установлены, НЕ подключены)
- react-hook-form v7.71.2 + zod v4.3.6
- Lucide React v0.577.0
- clsx + tailwind-merge (утилита cn())

## Цветовая палитра (CSS переменные в globals.css)

```css
--color-brand-primary: #F59500;        /* Оранжевый — CTA, акценты, бейджи */
--color-brand-primary-hover: #E08800;  /* Hover */
--color-brand-primary-light: #FFF3DC;  /* Фон иконок, лёгкий акцент */
--color-brand-secondary: #0F1A2E;      /* Тёмный — TopBar, Footer, Hero overlay */
--color-brand-dark: #080E1A;           /* Самый тёмный */
--color-brand-accent: #F59500;         /* = primary */
--color-brand-surface: #F7F8FA;        /* Чередующийся фон секций */
--color-text-primary: #111827;         /* Основной текст */
--color-text-secondary: #6B7280;       /* Вторичный текст */
--color-text-inverted: #FFFFFF;        /* На тёмном фоне */
--color-success: #16A34A;              /* Зелёный */
```

## Container

```css
.container { max-width: 1280px; margin: 0 auto; }
/* px-4 (мобайл), px-6 (sm), px-8 (lg) */
```

## Структура страниц

### Главная (src/app/page.tsx)
1. HeroBanner (статический, min-h-[85vh])
2. StatsStrip (bg-brand-secondary, 4 статистики)
3. FeatureCards (3 карточки, bg-white)
4. TariffGrid (bg-brand-surface, табы регионов + grid 3 col)
5. ConnectionSection (форма в карточке)
6. CTABanner (bg-brand-primary, телефон)
7. FaqSection (bg-brand-surface, accordion)

### Продуктовые страницы (/internet/flat, /internet/home, /tv, /phone, /videonablyudenie)
HeroBanner(compact) → FeatureCards → TariffGrid/Контент → Доп.услуги → ConnectionSection → CTABanner → FaqSection

### Информационные (/company, /contact, /help, /news, /vacancy, /action, /payment, /business/internet)
HeroBanner(compact) → Контент страницы → ConnectionSection/CTABanner → FaqSection

## Компоненты — API и стили

### HeroBanner (`src/components/sections/HeroBanner.tsx`)
```
Props: title, subtitle, ctaText?, ctaHref?, backgroundImage?, stats?: HeroStat[], compact?, className?
Client component ("use client")

Визуал:
- min-h-[85vh] (full) или py-16 lg:py-24 (compact)
- Background: Image fill + gradient overlay (from-brand-dark/95 via-brand-secondary/90 to-brand-dark/85)
- Декор: dot grid (opacity 0.03), два оранжевых glow blob (blur-[120px], blur-[100px])
- Trust badge: пульсирующая зелёная точка + "X абонентов доверяют iFlat"
- Title: text-4xl lg:text-5xl xl:text-6xl font-bold text-white
- Subtitle: text-lg text-white/70
- Dual CTA: Primary button (bg-brand-primary rounded-xl) + Phone button (border-2 border-white/30 rounded-xl)
- Stats row: value (text-3xl font-bold) + label (text-sm text-white/50)
```

### TariffCard (`src/components/sections/TariffCard.tsx`)
```
Props: plan: TariffPlan, onConnect?: (plan) => void
Client component

Визуал:
- Card (rounded-2xl) с hover y:-4 (Framer Motion)
- isHit=true: gradient header (from-brand-secondary to-brand-dark), badge "Хит продаж"
- isHit=false: bg-white header
- Speed: text-6xl font-black + "Мбит/с" text-lg
- tvChannels: text-sm
- Features: Check icon (bg-brand-primary-light) + text-sm text-text-secondary
- Price: text-4xl font-black + "₽/мес"
- Button: w-full, primary или outline (зависит от isHit)
```

### TariffGrid (`src/components/sections/TariffGrid.tsx`)
```
Props: title, subtitle?, regions: Region[], tariffsByRegion: RegionalTariffs[]
Client component

Визуал:
- Section: py-16 lg:py-24 bg-brand-surface
- SectionTitle + Tabs (pill-shaped, region tabs)
- AnimatePresence mode="wait" для transition табов
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

### Header (4 файла в `src/components/layout/Header/`)
```
Header.tsx — управляет isMenuOpen state, рендерит TopBar+MainNav+MobileMenu
TopBar.tsx — bg-brand-dark text-white text-sm h-10, hidden lg:block, phone+email+ЛК
MainNav.tsx — sticky top-0 z-50, scroll-aware (transparent→white при scrollY>60)
  Logo: 32×32, brightness-0 invert на прозрачном фоне
  Nav: hidden lg:flex gap-8
  CTA: "Подключить" bg-brand-primary (scrolled) или bg-white (transparent)
MobileMenu.tsx — fixed right-0 w-80, drawer Framer Motion, bg-white, p-6 pt-20
```

### Footer (`src/components/layout/Footer/Footer.tsx`)
```
bg-brand-secondary text-white, py-12 lg:py-16
Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8
3 link columns (из footerColumns config) + contacts column (phone, email, socials)
Social icons: w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full
Bottom bar: border-t border-white/10, copyright + privacy link
```

### UI компоненты (`src/components/ui/`)
```
Button.tsx:
  Variants: primary (bg-brand-primary), secondary (bg-brand-secondary), outline, ghost
  Sizes: sm (px-4 py-2), md (px-6 py-3), lg (px-8 py-4)
  Base: rounded-lg, font-semibold, transition-colors

Card.tsx:
  bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
  hover prop: transition-shadow hover:shadow-lg

Badge.tsx:
  Variants: hit (bg-brand-accent), promo (bg-brand-primary), default (bg-gray-100)
  Base: rounded-full text-xs font-bold uppercase tracking-wide

Input.tsx:
  px-4 py-3 rounded-lg border border-gray-300
  focus: ring-2 ring-brand-primary border-transparent
  error: border-red-500

Tabs.tsx:
  Pill tabs: rounded-full, active=bg-brand-primary text-white, inactive=border-gray-200
  Horizontal scroll с fade gradient на мобильном

Accordion.tsx:
  border border-gray-200 rounded-xl, ChevronDown с rotate-180
  AnimatePresence для height animation

SectionTitle.tsx:
  h2 text-3xl lg:text-4xl font-bold + optional subtitle text-lg text-text-secondary
  centered prop, mb-10
```

### Другие секции
```
StatsStrip: bg-brand-secondary py-12, grid 2col/4col, numbers text-4xl lg:text-5xl font-black text-brand-primary, whileInView animation
FeatureCards: grid 3col, bg-white rounded-2xl p-8, icon in bg-brand-primary-light rounded-2xl, whileInView
CTABanner: bg-brand-primary py-12 lg:py-16, text-center, phone text-4xl lg:text-5xl font-black
ConnectionSection: py-16 lg:py-24, max-w-2xl mx-auto, form in bg-white rounded-2xl shadow-lg p-8
FaqSection: py-16 lg:py-24 bg-brand-surface, max-w-3xl mx-auto, Accordion
MobileStickyCTA: fixed bottom-0 z-40 lg:hidden, bg-white border-t shadow-lg
CookieConsent: fixed bottom-4 left-4 z-50, bg-white rounded-xl shadow-2xl
```

## Config файлы

### site.ts
```ts
{ name: "iFlat", legalName: "ООО «Юнионтел»", domain: "iflat.ru",
  phone: "8 (495) 792-59-88", phoneFree: "8 (800) 100-59-88",
  email: "info@iflat.ru", foundedYear: 2009,
  stats: { subscribers: "40 000+", settlements: "40+", yearsOperation: "12+" },
  social: { vk, ok, telegram, max }, apps: { googlePlay, appStore },
  lk: "https://lk.iflat.ru/login" }
```

### regions.ts (6 регионов)
```ts
["naro-fominsk", "odintsovo", "kievskiy", "kalininets", "yakovlevskoe", "borisoglebskoe"]
```

### TariffPlan interface (types/tariff.ts)
```ts
{ id: string, name: string, speed?: number, price: number, priceUnit?: string,
  isHit?: boolean, tvChannels?: number, features: string[], technology?: "ethernet"|"gpon" }
```

### navigation.ts
```
primaryNav: 5 items (Интернет в квартиру, Интернет в дом, ТВ, Акции, Оплата)
secondaryNav: 5 items (Бизнес, О компании, Контакты, Помощь, Блог)
footerColumns: 3 columns (Продукты, Услуги, iFlat)
```

## Изображения (public/images/)
```
hero/ — 17 webp баннеров
services/ — ~35 картинок сервисов
equipment/ — pristavka.png, cabel.png
app/ — google-play.png, app-store.png
company/ — value_1-6.svg, doc.svg
promo/ — 1.png, 2.png, 3.png
partners/ — tbank.png
social/ — vk-footer.svg, ok-footer.svg, tg-footer.svg, max-footer.svg
icons/ — user1.png, chat.png, phone_icon.png
logo.png, favicon.svg
```

## Известные ограничения
- Embla Carousel установлен, но НЕ подключен ни в одном компоненте
- Payment page — клиентский компонент (табы), формы оплаты — заглушки
- Карта контактов — div-заглушка (не Яндекс.Карты)
- ~11 ссылок ведут на несуществующие страницы (/smotreshka, /24tv и др.)
- Иконки передаются как строки ("Zap") из-за Next.js server→client serialization
- Бэкенд отсутствует — все формы UI-only
