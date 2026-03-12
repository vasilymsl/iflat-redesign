# Анализ референсных сайтов — Полный отчёт

> Дата анализа: 2026-03-05
> Проанализировано: 14 из 16 сайтов/шаблонов (WetFrix не найден на ThemeForest)

---

## 1. Google Fiber (fiber.google.com)

**Стек:** Next.js + Material UI + Contentful CMS

**Цвета:** Google Blue `#1a73e8`, Green `#34a853`, Red `#ea4335`, текст `#202124`, фон белый. Пастельные акценты для карточек.

**Типографика:** Google Sans / Google Sans Text, font-weight 400-500, заголовки до 4.5rem (72px).

**Hero:** Карусель с 4 баннерами (Slick-подобный слайдер). Текст: "Fast is just the beginning", "Resilient internet". Акцент не на скорости, а на надёжности.

**Тарифы — 3 простых плана:**
| План | Скорость | Цена |
|------|----------|------|
| Core | 1 Gig | $70/мес |
| Home | 3 Gig | $100/мес |
| Edge | 8 Gig | $150/мес |

- Средний план (Home) визуально выделен как рекомендованный
- Каждый план: SVG-иконка, скорость, цена, описание аудитории, список features с зелёными чекмарками
- "Show details" — раскрывающаяся секция
- Кнопка "Compare plans" под карточками
- Квиз "How do you internet?" для помощи в выборе

**CTA:** "Check availability" — доминирующий, появляется 30 раз на странице! Pill-shaped кнопки (border-radius 24-50px).

**Уникальное:**
- Упор на надёжность: "99.9%+ uptime or your money back"
- Internet Battery Backup
- Priority Room Optimization
- Секция наград: Forbes, J.D. Power (3 года), PCMag, CNET
- Интерактивная карта городов покрытия
- Animated counters для статистики

**Для iFlat:** простота тарифной сетки, pill-кнопки, квиз, "Check availability" как главный CTA.

---

## 2. Cox (cox.com)

**Стек:** React SPA + Adobe Experience Manager, дизайн-система `@cox/core-ui8`

**Цвета:** Градиент `#00AAF4` → `#00D258` (голубой→зелёный), фон белый, текст чёрный.

**Типографика:** CeraPro (Regular, Medium, Bold) — геометрический гротеск.

**Hero:** "Address-First" подход — форма проверки адреса прямо в hero (Street Address, Apt/Unit, Zip Code). Это центральный элемент UX.

**Тарифы — 5 планов с маркетинговыми названиями:**
| План | Скорость | Промо-цена | Обычная цена | Скидка |
|------|----------|------------|--------------|--------|
| 2 GIG "Go Beyond Fast" | 2000/35 Mbps | $115 | $169 | -$54 |
| 1 GIG "Go Super Fast" | 1000/35 | $100 | $139 | -$39 |
| 500 Mbps "Go Even Faster" **MOST POPULAR** | 500/10 | $85 | $109 | -$24 |
| 300 Mbps "Fast" | 300/10 | $55 | $74 | -$19 |
| ConnectAssist | 100 | $30 | — | Соц. программа |

**Ключевые паттерны:**
- **Зачёркнутая цена + промо** — классическое якорение
- **"MOST POPULAR"** бейдж на среднем плане
- **Человеко-понятные описания:** "Perfect for tech-savvy home", "1-3 simultaneous devices"
- **Bundle cross-sell:** "Only $45/mo when bundled with Cox Mobile"
- **Price Lock Guarantee** до 5 лет при бандле
- Плавающий чат-виджет (meta: `chat:float=sales`)

**Социальная ответственность:** ConnectAssist $30/мес для получателей гос. помощи, блок "Trusted for Over 60 Years" (7M+ клиентов).

**Для iFlat:** якорение цены, маркетинговые названия скоростей, описания "для кого", address check в hero, бейдж "Популярный".

---

## 3. Sky (sky.com)

**Стек:** Next.js + styled-components, header/footer на Svelte (микрофронтенды)

**Цвета:** электрический синий `#000ff5`, тёмный navy `#0c1b87`, текст `#333333`, радужный градиент для промо-полосы.

**Типографика:** кастомные Sky Text / Sky Headline (self-hosted .woff2). Заголовки до 3.75rem (60px) на десктопе.

**Hero:**
- Полноэкранный с фоновым изображением, responsive srcSet (600-3840w), WebP
- **Clip-path: ellipse()** для органичной кривой внизу:
  - Mobile: `ellipse(200% 58% at 50% 40%)`
  - Tablet: `ellipse(140% 60% at 50% 40%)`
  - Desktop: `ellipse(100% 60% at 50% 40%)`
- Декоративные "flare" элементы (абсолютно позиционированные, анимированные CSS-transform)
- Тематические цвета flares: Blue-Green, Pink-Red, Orange-Yellow, Purple-Pink

**Навигация (8 пунктов):** Watch, TV, Glass, Broadband, Mobile, Protect, Business, Deals. Горизонтальный скролл, двойной элемент (ссылка + отдельный chevron для подменю). "New" бейджи на элементах.

**Промо-полоса:** Радужный градиент (`orange→red→pink→purple→blue→lightblue`), горизонтально скроллируемая карусель промо-сообщений. h-8.

**CTA:** Двухкнопочный паттерн — primary "Buy now" (синий заливка) + secondary "See all deals" (белый с синим контуром). border-radius: 4px.

**Уникальное:**
- Content-first: ведут с контентом (F1, кино), а не с техническими характеристиками
- Skeleton loading (shimmer gradient animation)
- Accordion с `grid-template-rows` transition + `content-visibility: hidden`
- `prefers-reduced-motion` respects
- Max content width `55ch` для читабельности

**Для iFlat:** clip-path кривая на hero, промо-полоса, animated flares, skeleton loading, premium spacing (48-72px).

---

## 4. Virgin Media (virginmedia.com)

**Стек:** Next.js + Storyblok CMS, дизайн-система "Momentum" (50+ токенов)

**Цвета:** Primary teal `#0073a8`, purple `#5f2878`, error `#ed0000`, success `#348432`. Серые: `#333` (80), `#979797` (50), `#d8d8d8` (10).

**Типографика:** VM Circular (4 веса с креативными названиями: Whisper/Light, Chat/Book, Shout/Bold, Yell/Black). Fallback: Arial.

**Hero:**
- Split layout: текст справа, изображение слева
- **Clip-path: ellipse()** для кривой внизу (как Sky)
- Анимированные декоративные "flare" элементы (Blue-Green, Pink-Red, Orange-Yellow, Purple-Pink, Blue-Purple)
- Responsive image с mask-image gradient для плавного fade

**Навигация:**
- **Мега-меню** с иконкой + заголовком + описанием для каждого пункта
- Промо-баннеры прямо внутри dropdown'ов навигации
- FontAwesome SVG иконки (FarWifi, FarTv, FarPhoneFlip)
- Мобильное меню — drawer справа (transform: translate(100%))

**Broadband Deals подменю (10 пунктов):** Broadband Deals, Broadband Only, Broadband & Phone, Broadband + Phone + TV, Fibre, Student, Netflix Deals, Cheap, Gaming, Landline.

**Тарифы:** Progressive disclosure — expandable "info pills", раскрываемые детали по клику. Check-mark bullets для features.

**Дизайн-токены (из CSS переменных):**
- Sizing: 2-4-8-12-16-20-24-32-60px
- Border-radius: 2-4-8-16-24px, CTA: 8px
- Elevation: 4 уровня теней (2px-12px blur)
- Animation: 50ms (super fast) → 2100ms (super slow)

**Для iFlat:** мега-меню с описаниями, промо в навигации, animated flares, progressive disclosure для тарифов, дизайн-токены.

---

## 5. МегаФон (moscow.megafon.ru)

**Стек:** React SPA, собственная дизайн-система MFUI (1000+ CSS-классов, 100+ компонентов)

**Цвета:** Brand Green `#00b956`, Brand Purple (для альтернативных CTA и баннеров). Серые: система `spbSky` (0-3). Акценты: flamingo, fury, berry, night, sky.

**Типографика:** font-weight 500 (medium) как доминирующий (154 упоминания). Размеры: 12-15-18-20-22-26-28-32-36-44-52px. Крупные скругления: 12px (карточки), 24px (баннеры), 16px (средние), 8px (мелкие).

**Hero:** Компонент `MainPageBannerV2` — Swiper карусель. Высота 500px (мобайл) → 400px (десктоп). Навигационные стрелки (40-64px), пагинация с таймером автопрокрутки. Паттерн "peek" — видна часть следующего слайда.

**Тарифы — линейка "МегаФон 3.0":**
- Минимум → Минимум Плюс → МегаТариф → Максимум → VIP → Семья
- **Модульная система "МегаСилы"** — пользователь сам выбирает модули (безлимит на мессенджеры, соцсети, видео, музыку)
- Конвергентные пакеты: интернет (100/200/300/500 Мбит/с) + 250 ТВ-каналов + мобильная связь
- Абонементы: 3 мес, 12 мес (-30%), "Навсегда"

**CTA тексты:** "За тарифами!", "Попробовать", "Оформить", "К активации", "Подробнее"

**Система кнопок:**
- Типы: primary (заливка), outline, text
- Темы: green, green-soft, purple, purple-soft, black, white, danger
- Размеры: extra-small → large (адаптивные по брейкпоинтам)

**Уникальное:**
- Двуцветная CTA-система (green + purple)
- Peek-карусель на мобильном
- Серые фоны карточек (spbSky0) вместо белых
- Мягкие тени: `0 4px 12px rgba(0,0,0,.08)`
- Маркетплейс-подход (устройства + связь)
- Соцсети в footer: VK, Telegram, YouTube, OK, Habr

**Для iFlat:** peek-карусель, серые карточки, font-weight 500, двуцветная CTA, крупные скругления.

---

## 6. Дом.ру (dom.ru) — частичный анализ

**Бренд:** Фиолетовый/пурпурный (~`#7B2D8E`), вторичные — оранжевый для CTA, белый фон.

**Особенности:**
- Региональная персонализация через поддомены (perm.dom.ru, spb.dom.ru)
- Hero с каруселью промо-акций
- Карточки тарифов 3-4 в ряд, рекомендуемый выделен
- Переключатель "только интернет" / "интернет + ТВ"
- Проверка адреса — заметный блок
- Экосистема: интернет + ТВ + видеонаблюдение + умный дом

**Для iFlat:** региональная персонализация (уже есть в табах), переключатель бандлов, check availability.

---

## 7. ThemeForest ISP-шаблоны (8 из 10 проанализированы)

### Общие паттерны всех шаблонов:

**Hero:**
- Full-width слайдер с крупным заголовком
- Address/availability checker прямо в hero — самый конверсионный элемент
- Dual CTA: "View Plans" + "Learn More"
- Speed callouts крупными цифрами

**Тарифы:**
- 3-колоночная карточная сетка — универсальный стандарт (7 из 8)
- Средний план выделен (цвет/размер/бейдж "Recommended")
- Toggle месяц/год всё чаще встречается
- Bundle pricing (Internet + TV)
- Чеклисты features с checkmarks

**Навигация:**
- Двухуровневый header: utility bar + основная навигация
- Sticky на скролле (transparent → solid)
- Телефон всегда виден
- Мега-меню для мультистраничных шаблонов

**Trust-элементы:**
- Animated counters (клиенты, uptime%, города, годы)
- Testimonials с фото и звёздами
- Partner/brand logos carousel
- "Why Choose Us" с иконками

**Обязательные секции:**
- "How It Works" — 3 шага (Choose Plan → Installation → Enjoy)
- Speed-to-activity mapping (помогает не-техническим пользователям)
- Coverage/service area карта
- FAQ accordion

**Тренды 2023-2026 (новые шаблоны):**
- Glassmorphism, soft gradients, micro-animations
- Illustration-heavy или 3D элементы
- Dark mode как вариант
- Quizzes, calculators, configurators
- Stronger mobile-first design

### По каждому шаблону:

**Netfix:** Синие градиенты, availability checker в hero, speed comparison slider, animated counters, WooCommerce.

**Zeinet:** Электрический синий + неоновый зелёный на тёмном фоне. Space/satellite тематика. Toggle месяц/год, bundle internet+TV. Сервисная карта.

**NetBand:** Корпоративный синий + оранж. Isometric иллюстрации. Горизонтальная таблица сравнения планов. Multi-step signup wizard.

**NextBit:** Dark mode, неон (cyan/magenta). Видео-фон hero. Speed gauge визуал. "What You Can Do" — скорость→активность маппинг. Installation booking calendar.

**Noanet:** Классический flat design (2017-18). Простая 3-4 карточная тарифная сетка. Minimal, всё служит цели.

**Satnet:** Navy + lime green. Satellite theme. Parallax hero. Coverage map. Technology comparison (fiber vs satellite vs DSL).

**Ienet:** Teal + coral. Мягкий friendly стиль с иллюстрациями. "Perfect Plan Finder" quiz. Family usage calculator. Loyalty program.

**Serviney:** Multipurpose (ISP + hosting + domains). Flexible pricing (card + table). Domain checker. Multi-language ready.

**JellyNet:** 100+ HTML страниц, Bootstrap 4, mega-menu, left/right side menus. Для ISP/hosting/telecom/VOIP.

---

## Сводная таблица: что откуда брать

| Паттерн | Источник | Приоритет |
|---------|----------|-----------|
| Hero-карусель с Embla | МегаФон, Sky | Высокий |
| Clip-path кривая на hero | Sky, Virgin Media | Высокий |
| Animated flares/glow на hero | Virgin Media, Sky | Высокий |
| Промо-полоса над header | Sky | Высокий |
| Pill-shaped кнопки | Google Fiber | Высокий |
| Якорение цены (зачёркнутая) | Cox | Высокий |
| Описания скорости "для кого" | Cox, NextBit | Высокий |
| Бейдж "САМЫЙ ПОПУЛЯРНЫЙ" | Cox, ThemeForest | Высокий |
| "How It Works" 3 шага | ThemeForest (все) | Средний |
| Animated counters | ThemeForest, МегаФон | Средний |
| Peek-карусель тарифов (мобайл) | МегаФон | Средний |
| Серые карточки на белом фоне | МегаФон | Средний |
| Scroll-reveal анимации | Все | Средний |
| Font-weight 450-500 | МегаФон | Средний |
| Бейдж-заголовок секций | ThemeForest, Virgin Media | Низкий |
| Skeleton loading | Sky | Низкий |
| Мега-меню с описаниями | Virgin Media | Низкий (будущее) |
| Квиз выбора тарифа | Google Fiber | Низкий (будущее) |
| Address check в hero | Cox, Google Fiber | Низкий (нет бэкенда) |
