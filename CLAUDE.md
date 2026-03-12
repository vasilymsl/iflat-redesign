# iFlat Redesign — Контекст проекта

## Что это
Редизайн сайта интернет-провайдера **iflat.ru** (ООО «Юнионтел»). Контент взят с текущего сайта, дизайн и архитектура — новые. Проект — шаблон, который будет адаптироваться для других провайдеров (white-label).

## Стек
- **Next.js 16** (App Router, Turbopack, Static Export)
- **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first config через `@theme inline` в `globals.css`, НЕ tailwind.config.ts)
- **Framer Motion** — анимации (accordion, hover, scroll-reveal, tab transitions)
- **Embla Carousel** — установлен, пока не используется
- **react-hook-form + zod** — формы с валидацией
- **Lucide React** — иконки
- **Хостинг**: Vercel (пока локально)
- **Бэкенд**: нет, формы — только UI

## Структура
```
src/
├── app/                    # Страницы (15 маршрутов)
│   ├── page.tsx            # Главная
│   ├── internet/flat/      # Интернет в квартиру (тарифы по 6 регионам)
│   ├── internet/home/      # Интернет в дом (homeTariffs + glParkTariffs)
│   ├── tv/                 # ТВ (3 типа + кинотеатры + оборудование)
│   ├── action/             # Акции (3 промо + доп.услуги + сервисы)
│   ├── payment/            # Оплата ("use client", табы договор/телефон)
│   ├── company/            # О компании (ценности + лицензии)
│   ├── contact/            # Контакты (3 офиса + карта-заглушка)
│   ├── business/internet/  # Для бизнеса
│   ├── help/               # Помощь (контакты + FAQ)
│   ├── news/               # Новости
│   ├── vacancy/            # Вакансии
│   ├── phone/              # Телефония
│   ├── videonablyudenie/   # Видеонаблюдение
│   ├── sitemap.ts          # Автогенерация
│   └── robots.ts
│
├── components/
│   ├── ui/                 # Button, Badge, Card, Input, Tabs, Accordion, SectionTitle
│   ├── sections/           # HeroBanner, TariffCard, TariffGrid, FeatureCards, StatsStrip,
│   │                       # CTABanner, MobileStickyCTA, ConnectionSection, FaqSection, CookieConsent
│   ├── forms/              # ConnectionForm (react-hook-form + zod)
│   └── layout/
│       ├── Header/         # Header, TopBar, MainNav (scroll-aware), MobileMenu
│       └── Footer/         # Footer
│
├── config/                 # ВСЯ брендовая информация (white-label ключ)
│   ├── site.ts             # Имя, телефоны, email, соцсети, приложения, ЛК
│   ├── navigation.ts       # primaryNav (5), secondaryNav (5), footerColumns (3)
│   ├── regions.ts          # 6 регионов для табов тарифов
│   ├── tariffs/flat.ts     # Тарифы квартир по регионам
│   ├── tariffs/home.ts     # Тарифы домов (homeTariffs + glParkTariffs)
│   ├── faq/flat.ts         # FAQ (flatFaq, homeFaq, tvFaq)
│   └── promotions.ts       # 3 акции
│
├── types/tariff.ts         # TariffPlan, RegionalTariffs
├── hooks/                  # (пусто, зарезервировано)
└── lib/utils.ts            # cn(), formatPrice()
```

## Дизайн-система
- **Основной цвет**: оранжевый `#F59500` (CTAs, акценты, бейджи)
- **Primary hover**: `#E08800`
- **Primary light**: `#FFF3DC` (фон иконок)
- **Secondary (тёмный)**: `#0F1A2E` (TopBar, футер, hero overlay)
- **Dark**: `#080E1A`
- **Surface**: `#F7F8FA` (чередующийся фон секций)
- **Шрифт**: Inter (latin + cyrillic, self-hosted через next/font)

## Ключевые паттерны и решения

### Серверные vs клиентские компоненты
- Страницы — серверные (для metadata export)
- `"use client"`: HeroBanner, TariffCard, TariffGrid, StatsStrip, FeatureCards, Accordion, MobileMenu, CookieConsent, MobileStickyCTA, ConnectionForm, payment/page
- **Иконки в FeatureCards**: передаются как строки (`"Zap"`, `"Shield"`), не как компоненты! Импорт `* as icons from "lucide-react"` внутри клиентского компонента. Это решает ошибку сериализации server→client.

### Навигация
- MainNav — scroll-aware: прозрачный поверх hero, белый при scrollY > 60
- TopBar — скрывается на мобильных (`hidden lg:block`)
- MobileMenu — drawer справа с AnimatePresence

### Тарифы
- TariffCard: скорость — доминантный элемент (`text-6xl font-black`), "Хит продаж" — тёмный градиентный хедер
- TariffGrid: табы регионов + AnimatePresence анимация смены

### Формы
- ConnectionForm: name (min 2), phone (min 10), address (min 5), согласие ПД
- UI only — `onSubmit` показывает CheckCircle success state, без реального API

### White-label
Для нового провайдера меняем: `src/config/*`, логотип, картинки в `public/images/`. Компоненты brand-agnostic.

## Что сделано
- [x] Все 15 страниц реализованы и работают
- [x] Все изображения скачаны с iflat.ru в `public/images/`
- [x] Цветовая гамма обновлена (оранжевый #F59500)
- [x] Дизайн улучшен по референсам (Google Fiber, Cox, rt.ru, domru.ru)
- [x] Build проходит без ошибок (Next.js 16.1.6 Turbopack)
- [x] SEO: уникальные title/description, sitemap.xml, robots.txt

## Что НЕ сделано / планы
- [ ] Бэкенд форм (API Routes, отправка email)
- [ ] Карусель на главной (Embla установлен, не подключен)
- [ ] Видеоплеер на главной странице (задел на будущее)
- [ ] Яндекс.Карта на странице контактов (сейчас заглушка)
- [ ] Страницы-заглушки: /smotreshka, /24tv, /cabel-tv, /avtoplatezh, /doveritelnyi_platezh, /abonement
- [ ] Страницы акций: /bonus_za_otziv, /perehod_ot_provaidera, /privedi_soseda
- [ ] IP-домофон: /ipdomofon
- [ ] JSON-LD structured data
- [ ] Lighthouse полировка (цель: 90+ Performance, 95+ Accessibility)
- [ ] Деплой на Vercel

## Документация для разработки (docs/)

Перед началом работы обязательно прочитай:

1. **`docs/improvement-plan.md`** — Полный план улучшений, разбитый на 4 волны с конкретными задачами, файлами и кодом. Это основной документ для реализации.
2. **`docs/reference-analysis.md`** — Детальный анализ 14 референсных сайтов (Google Fiber, Cox, Sky, Virgin Media, МегаФон, Дом.ру + 8 ThemeForest шаблонов). Содержит цвета, CSS, паттерны, конкретные примеры.
3. **`docs/current-state.md`** — Полный снимок текущего состояния: все компоненты, их props, Tailwind-классы, конфиги, цвета. Используй для понимания, что уже есть, прежде чем создавать новое.

### Порядок реализации (из improvement-plan.md)

**Фаза 1 (CSS-only):** кривая hero, animated flares, pill-кнопки, отступы, font-weight
**Фаза 2 (новые компоненты):** Hero-карусель, промо-полоса, ScrollReveal, badge-заголовки
**Фаза 3 (расширение пропсов):** якорение цены, описания скорости, бейдж "Популярный", counters, серые карточки
**Фаза 4 (секции и доработки):** HowItWorks, peek-карусель тарифов, ConnectionSection, CTABanner, Footer

### Дизайн-правила для целостности
1. Два цвета CTA: оранжевый primary + тёмный secondary
2. Border-radius: cards=16px, buttons=12-16px или pill, badges=full
3. Чередование: white / surface (#F7F8FA) / white / surface
4. Одна анимация на секцию, viewport.once: true
5. Отступы кратны 4px
6. Оранжевый — только CTA/badges/icons, не фон секций (кроме CTABanner)

## Команды
```bash
npm run dev      # Dev-сервер (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```
