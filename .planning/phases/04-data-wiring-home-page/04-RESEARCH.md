# Phase 04: Data Wiring + Home Page - Research

**Researched:** 2026-03-09
**Domain:** Next.js App Router data fetching, server components, fallback patterns, TV shelf placement on home page
**Confidence:** HIGH (Next.js patterns) / MEDIUM (24h.tv API specifics — reverse-engineered, no official docs)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIS-01 | Оба шлейфа ("Бесплатные каналы" и "Новинки") отображаются на главной странице | Встраивание `<section className="tv-section">` блока из `tv/page.tsx` в `page.tsx`, серверный компонент |
</phase_requirements>

---

## Summary

Фаза решает две задачи: (1) показать TV-шлейфы на главной странице `/`, (2) загружать данные для шлейфов из API 24h.tv вместо статического `tv-shelves.ts`.

**Важный контекст:** REQUIREMENTS.md классифицирует живые данные (`DATA-01`, `DATA-02`) как **v2** (deferred), а Roadmap и критерии успеха Phase 4 требуют динамических данных. Задача Phase 4 — сделать то, что описано в ROADMAP.md (живые данные + fallback), но без изменения формальных requirements. По сути DATA-01/DATA-02 реализуются в рамках VIS-01.

Архитектурно правильный подход для Next.js 16 с App Router: серверные компоненты fetch'ат данные напрямую при рендере страницы, передают их как props в клиентские компоненты шлейфа. `TvChannelShelf` и `ContentShelf` уже принимают данные через props — их не нужно переписывать. Нужно только создать серверный data layer, добавить TV-секцию на главную, и написать fallback логику.

**Ключевое ограничение:** API 24h.tv не имеет публичной документации. Endpoint `/v2/channels` (список каналов) и `/v2/rows/novinki` (новинки) — это гипотезы из Phase 2 CONTEXT.md. Статические данные из `tv-shelves.ts` должны служить надежным fallback при любой ошибке API.

**Primary recommendation:** Создать `src/lib/tv-data.ts` с двумя async-функциями (`fetchChannels`, `fetchNovinki`), каждая с try/catch + статический fallback. Добавить TV-секцию в `src/app/page.tsx` с `await fetchChannels()` и `await fetchNovinki()` прямо в серверном компоненте.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 (в проекте) | Серверные компоненты + fetch в page.tsx | Уже используется, server-side fetch — стандарт App Router |
| `getGuestToken()` | уже в `tv-token.ts` | Получение авторизованного токена | Уже реализован в Phase 2, никакой новой логики |
| TypeScript | ^5 (в проекте) | Типизация API-ответов | Уже используется |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/cache` (revalidate) | встроен в Next.js 16 | Кеширование fetch-запросов к 24h.tv | При `next: { revalidate: 300 }` — данные свежи 5 минут, нет лишних запросов |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server component fetch | `useEffect` + client fetch | Server fetch — нет hydration waterfall, нет layout shift, SEO-friendly |
| Server component fetch | React Query / SWR | Для одного endpoint с fallback — излишне, нет нужды в инвалидации в реальном времени |
| `revalidate: 300` | `cache: 'no-store'` | `no-store` — живые данные, но нагружает API на каждый рендер. Для демо-режима 5 минут — оптимально |

**Installation:** Новые зависимости не требуются.

---

## Architecture Patterns

### Recommended Project Structure
```
iflat-redesign/src/
├── lib/
│   ├── tv-token.ts          # Phase 2: TokenManager (уже есть)
│   └── tv-data.ts           # НОВЫЙ: fetchChannels() + fetchNovinki() с fallback
├── app/
│   ├── page.tsx             # ИЗМЕНИТЬ: добавить TV-секцию (await fetch + props)
│   └── tv/
│       └── page.tsx         # ИЗМЕНИТЬ: заменить импорт tv-shelves на tv-data
```

### Pattern 1: Серверный Server Component Data Fetching
**Что:** Серверный компонент (page.tsx) вызывает async функцию, передаёт результат в клиентский компонент как prop. Нет useEffect, нет клиентского запроса.

**Когда использовать:** Всегда для данных, которые нужны при SSR — SEO, нет layout shift, нет лишних round-trips.

**Example:**
```typescript
// src/app/page.tsx (серверный компонент — по умолчанию в App Router)
import { fetchChannels, fetchNovinki } from "@/lib/tv-data";

export default async function HomePage() {
  // Параллельный fetch — оба запроса одновременно
  const [channels, novinki] = await Promise.all([
    fetchChannels(),
    fetchNovinki(),
  ]);

  return (
    <>
      {/* ... другие секции ... */}

      <section className="tv-section" aria-label="Контент 24ТВ">
        <div className="tv-section__header">
          {/* ... 24TV header ... */}
        </div>
        <TvChannelShelf title="Бесплатные ТВ-каналы" channels={channels} showAllHref="/24tv" />
        <ContentShelf title="Новинки" items={novinki} showAllHref="/24tv" />
      </section>

      {/* ... остальные секции ... */}
    </>
  );
}
```

### Pattern 2: Try/Catch Fallback в Data Layer
**Что:** `fetchChannels()` и `fetchNovinki()` возвращают данные из API при успехе, или статический fallback при любой ошибке. Страница не ломается никогда.

**Когда использовать:** Обязательно для всех внешних API без гарантий uptime — особенно 24h.tv без официального SLA.

**Example:**
```typescript
// src/lib/tv-data.ts
import { getGuestToken } from "@/lib/tv-token";
import { freeChannels, newReleases } from "@/config/tv-shelves"; // fallback
import type { ChannelData } from "@/components/sections/ChannelCard";
import type { ContentItem } from "@/components/sections/ContentShelf";

const TV_API_BASE = process.env.TV_API_BASE_URL ?? "https://api.24h.tv";

export async function fetchChannels(): Promise<ChannelData[]> {
  try {
    const token = await getGuestToken();
    const resp = await fetch(`${TV_API_BASE}/v2/channels`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }, // кеш 5 минут
    });

    if (!resp.ok) return freeChannels; // fallback

    const data = await resp.json();
    // Маппинг API-формата → ChannelData[]
    // TODO: заполнить по реальному формату ответа
    return mapApiChannels(data) ?? freeChannels;
  } catch {
    return freeChannels; // fallback при сетевой ошибке
  }
}

export async function fetchNovinki(): Promise<ContentItem[]> {
  try {
    const token = await getGuestToken();
    const resp = await fetch(`${TV_API_BASE}/v2/rows/novinki`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    });

    if (!resp.ok) return newReleases; // fallback

    const data = await resp.json();
    return mapApiNovinki(data) ?? newReleases;
  } catch {
    return newReleases; // fallback при сетевой ошибке
  }
}
```

### Pattern 3: Параллельный fetch с Promise.all
**Что:** Оба запроса (каналы + новинки) идут параллельно — страница не ждёт последовательно.

**Когда использовать:** Всегда когда несколько независимых серверных запросов нужны для одной страницы.

**Example:**
```typescript
// Правильно — параллельно:
const [channels, novinki] = await Promise.all([fetchChannels(), fetchNovinki()]);

// Неправильно — последовательно:
const channels = await fetchChannels(); // ждёт N ms
const novinki = await fetchNovinki();   // только потом начинает
```

### Pattern 4: Revalidation для кеша SSR
**Что:** Next.js 16 кеширует fetch-ответы. `next: { revalidate: 300 }` — данные свежи 5 минут, потом ISR-обновление при следующем запросе.

**Когда использовать:** Для данных каналов/новинок которые меняются не чаще раза в несколько минут.

**Example:**
```typescript
// В fetch-запросе внутри Server Component или server-side функции:
const resp = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` },
  next: { revalidate: 300 }, // Next.js кеш 5 минут
});
```

### Pattern 5: TV-секция на главной (copy from tv/page.tsx)
**Что:** Секция `<section className="tv-section">` с header 24TV и двумя шлейфами уже полностью реализована в `tv/page.tsx`. На главной — просто вставить аналогичный блок.

**Когда использовать:** При добавлении TV-секции в `page.tsx` — скопировать структуру из `tv/page.tsx` строки 132-157, заменить `freeChannels`/`newReleases` на результаты `fetchChannels()`/`fetchNovinki()`.

```tsx
// Структура из tv/page.tsx (строки 132-157) — готова к копированию:
<section className="tv-section" aria-label="Контент 24ТВ">
  <div className="tv-section__header">
    <a href="/24tv" className="tv-section__logo-link">
      <Image src="/images/24tv_logo.svg" alt="24ТВ" width={100} height={30} className="tv-section__logo" />
    </a>
    <p className="tv-section__tagline">Интерактивное ТВ от iFlat — смотрите бесплатно</p>
  </div>
  <TvChannelShelf title="Бесплатные ТВ-каналы" channels={channels} showAllHref="/24tv" />
  <ContentShelf title="Новинки" items={novinki} showAllHref="/24tv" />
</section>
```

### Anti-Patterns to Avoid
- **Импортировать `freeChannels`/`newReleases` напрямую в page.tsx:** Убирает возможность живых данных. Всегда через `fetchChannels()`/`fetchNovinki()` — даже если они возвращают fallback.
- **`cache: 'no-store'` для канального фида:** На каждый SSR-рендер будет запрос к API. При высоком трафике — DoS 24h.tv. Использовать `revalidate: 300`.
- **`"use client"` на page.tsx:** Страницы в App Router — серверные по умолчанию. `"use client"` запрещает серверный fetch и сломает SSR/SEO.
- **Шлейфы через useState + useEffect:** Клиентский fetch создаёт layout shift (сначала пусто, потом данные). Серверный fetch — данные уже в HTML.
- **Один `fetch` вместо `Promise.all`:** Последовательные запросы удваивают задержку. Всегда параллельно.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Кеширование API-ответов | Свой TTL-кеш в `globalThis` для данных | `next: { revalidate: 300 }` в fetch | Next.js встроенный Data Cache — ISR, работает на Vercel автоматически |
| Маппинг API-формата | Сложный трансформер с валидацией | Простой map() с fallback | API 24h.tv нестабилен — сложная валидация создаст ложные ошибки |
| Обработка ошибок | Компонент ErrorBoundary для шлейфов | try/catch в data-функциях + fallback | Серверный try/catch проще, нет клиентской сложности |

**Key insight:** Next.js Data Cache (`next: { revalidate: N }`) решает кеширование на уровне fetch — не нужен отдельный in-memory TTL для данных страницы.

---

## Common Pitfalls

### Pitfall 1: Неизвестный формат ответа API 24h.tv
**Что идёт не так:** Код маппинга написан под предполагаемый формат, реальный API возвращает другую структуру — `mapApiChannels(data)` падает или возвращает пустой массив.

**Почему:** API 24h.tv не имеет официальной документации. Структура ответа `/v2/channels` и `/v2/rows/novinki` — это гипотезы.

**Как избежать:** Логировать полный ответ `console.log('[tv-data] channels response:', JSON.stringify(data).slice(0, 500))` при первом успешном запросе. Написать маппинг ПОСЛЕ просмотра реального ответа. До этого — использовать только fallback.

**Warning signs:** `channels.length === 0` при успешном статус-коде 200.

### Pitfall 2: getGuestToken() вызывается дважды параллельно
**Что идёт не так:** `fetchChannels()` и `fetchNovinki()` одновременно вызывают `getGuestToken()` — без deduplication это были бы два параллельных POST /v2/users.

**Почему:** Два независимых промиса стартуют одновременно через `Promise.all`.

**Как избежать:** `getGuestToken()` уже имеет promise deduplication (Phase 2, `inflightPromise`). Второй параллельный вызов вернёт тот же Promise автоматически. Никакой дополнительной логики не нужно.

**Warning signs:** Два POST /v2/users в логах при каждом рендере страницы.

### Pitfall 3: Не существующий endpoint /v2/rows/novinki
**Что идёт не так:** `fetchNovinki()` получает 404 или другой не-ok статус — маппинг не выполняется.

**Почему:** Endpoint `/v2/rows/novinki` — это гипотеза из Phase 2 CONTEXT.md, не подтверждённый факт. Возможны варианты: `/v2/rows/novinki`, `/v2/content/novinki`, `/v2/playlists/novinki` и т.д.

**Как избежать:** Fallback `return newReleases` при не-ok статусе. При первом запуске — логировать статус ответа, искать правильный endpoint в DevTools на 24h.tv.

**Warning signs:** `fetchNovinki()` всегда возвращает статические данные (проверить по логам на сервере).

### Pitfall 4: TV-секция в неправильной позиции на главной
**Что идёт не так:** Шлейфы вставлены в самый низ главной страницы после `<ConnectionSection>` — пользователи не видят их без прокрутки.

**Почему:** Нет explicit требования по позиции, разработчик вставит в конец как наименьшее сопротивление.

**Как избежать:** По паттерну сайта — TV-секция должна идти после `<ServiceCards>` и `<EquipmentSection>`, но до `<NewsSection>`. Это обеспечивает видимость без прокрутки на большинстве экранов.

**Warning signs:** При загрузке главной шлейфы не видны во viewport без скролла.

### Pitfall 5: `page.tsx` стал async без обновления типа
**Что идёт не так:** TypeScript ругается на `async function HomePage()` — хотя это полностью корректный серверный компонент.

**Почему:** В некоторых версиях React типы не включали async для компонентов (было ограничение).

**Как избежать:** В Next.js 16 + React 19 async server components полностью поддерживаются. Если TypeScript жалуется — обновить `@types/react`. В данном проекте это уже работает (строка 23 tv/page.tsx — `export default function TvPage()` — не async, но её можно сделать async без проблем).

---

## Code Examples

### Полная tv-data.ts с fallback

```typescript
// Source: next.js App Router server fetch pattern (official docs)
// iflat-redesign/src/lib/tv-data.ts

import { getGuestToken } from "@/lib/tv-token";
import { freeChannels, newReleases } from "@/config/tv-shelves";
import type { ChannelData } from "@/components/sections/ChannelCard";
import type { ContentItem } from "@/components/sections/ContentShelf";

const TV_API_BASE = process.env.TV_API_BASE_URL ?? "https://api.24h.tv";

/**
 * Fetch список каналов из API 24h.tv.
 * Fallback: статический freeChannels из tv-shelves.ts.
 */
export async function fetchChannels(): Promise<ChannelData[]> {
  try {
    const token = await getGuestToken();
    const resp = await fetch(`${TV_API_BASE}/v2/channels`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }, // 5 минут
    });

    if (!resp.ok) {
      console.warn(`[tv-data] /v2/channels returned ${resp.status}, using fallback`);
      return freeChannels;
    }

    const data = await resp.json();
    console.log("[tv-data] channels raw sample:", JSON.stringify(data).slice(0, 300));

    const mapped = mapApiChannels(data);
    return mapped.length > 0 ? mapped : freeChannels;
  } catch (err) {
    console.error("[tv-data] fetchChannels error:", err);
    return freeChannels;
  }
}

/**
 * Fetch список "Новинки" из API 24h.tv.
 * Fallback: статический newReleases из tv-shelves.ts.
 */
export async function fetchNovinki(): Promise<ContentItem[]> {
  try {
    const token = await getGuestToken();
    const resp = await fetch(`${TV_API_BASE}/v2/rows/novinki`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    });

    if (!resp.ok) {
      console.warn(`[tv-data] /v2/rows/novinki returned ${resp.status}, using fallback`);
      return newReleases;
    }

    const data = await resp.json();
    console.log("[tv-data] novinki raw sample:", JSON.stringify(data).slice(0, 300));

    const mapped = mapApiNovinki(data);
    return mapped.length > 0 ? mapped : newReleases;
  } catch (err) {
    console.error("[tv-data] fetchNovinki error:", err);
    return newReleases;
  }
}

// --- Mapper функции (заполнить после просмотра реального ответа API) ---

// Предположительный формат ответа /v2/channels:
// { channels: [{ id, name, logo_url, current_program, thumbnail_url, ... }] }
// Точный формат — определить из логов при первом запуске
function mapApiChannels(data: unknown): ChannelData[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = (data as any)?.channels ?? (data as any)?.data ?? (Array.isArray(data) ? data : []);
    return items.map((item) => ({
      id: String(item.id ?? item.slug ?? ""),
      name: String(item.name ?? item.title ?? ""),
      logo: String(item.logo_url ?? item.logo ?? item.icon ?? ""),
      currentProgram: String(item.current_program?.title ?? item.current_program ?? ""),
      thumbnail: String(item.thumbnail_url ?? item.preview_url ?? item.thumbnail ?? ""),
      progress: Number(item.progress ?? item.current_program?.progress ?? 0),
    })).filter((ch) => ch.id && ch.name);
  } catch {
    return [];
  }
}

// Предположительный формат ответа /v2/rows/novinki:
// { items: [{ id, title, year, genre, poster_url, rating, ... }] }
function mapApiNovinki(data: unknown): ContentItem[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = (data as any)?.items ?? (data as any)?.content ?? (Array.isArray(data) ? data : []);
    return items.map((item) => ({
      id: String(item.id ?? ""),
      title: String(item.title ?? item.name ?? ""),
      subtitle: item.year ? `${item.year}, ${item.genre ?? ""}` : undefined,
      poster: String(item.poster_url ?? item.poster ?? item.thumbnail ?? ""),
      rating: Number(item.rating ?? item.imdb_rating ?? 0) || undefined,
      href: item.url ?? item.href ?? undefined,
    })).filter((it) => it.id && it.title && it.poster);
  } catch {
    return [];
  }
}
```

### Интеграция в page.tsx

```typescript
// Source: Next.js App Router server components (official docs)
// iflat-redesign/src/app/page.tsx — добавить TV-секцию

// 1. Добавить импорты в начало файла:
import { TvChannelShelf } from "@/components/sections/TvChannelShelf";
import { ContentShelf } from "@/components/sections/ContentShelf";
import { fetchChannels, fetchNovinki } from "@/lib/tv-data";
import Image from "next/image";

// 2. Сделать функцию async:
export default async function HomePage() {
  const [channels, novinki] = await Promise.all([
    fetchChannels(),
    fetchNovinki(),
  ]);

  return (
    <>
      <HeroCarousel slides={heroSlides} />
      <TariffSwitcher ... />
      <AdvantagesSection ... />
      <ServiceCards ... />

      {/* TV-секция — вставить здесь, между ServiceCards и EquipmentSection */}
      <section className="tv-section" aria-label="Контент 24ТВ">
        <div className="tv-section__header">
          <a href="/24tv" className="tv-section__logo-link">
            <Image
              src="/images/24tv_logo.svg"
              alt="24ТВ"
              width={100}
              height={30}
              className="tv-section__logo"
            />
          </a>
          <p className="tv-section__tagline">Интерактивное ТВ от iFlat — смотрите бесплатно</p>
        </div>
        <TvChannelShelf title="Бесплатные ТВ-каналы" channels={channels} showAllHref="/24tv" />
        <ContentShelf title="Новинки" items={novinki} showAllHref="/24tv" />
      </section>

      <EquipmentSection ... />
      {/* ... остальные секции ... */}
    </>
  );
}
```

### Обновление tv/page.tsx для использования tv-data

```typescript
// iflat-redesign/src/app/tv/page.tsx — заменить статический импорт
// БЫЛО:
// import { freeChannels, newReleases } from "@/config/tv-shelves";
// export default function TvPage() { ... }

// СТАЛО:
import { fetchChannels, fetchNovinki } from "@/lib/tv-data";
export default async function TvPage() {
  const [channels, novinki] = await Promise.all([
    fetchChannels(),
    fetchNovinki(),
  ]);
  // ... передать channels и novinki в шлейфы
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getServerSideProps` / `getStaticProps` | async Server Components | Next.js 13 (App Router) | fetch прямо в компоненте, нет отдельных функций |
| `pages/` router | `app/` router | Next.js 13 | Серверные компоненты по умолчанию, нет `"use client"` нужды для SSR fetch |
| Manual cache с `globalThis` | `next: { revalidate: N }` в fetch | Next.js 13+ Data Cache | Встроенный ISR кеш, работает на Vercel без Redis |

**Deprecated/outdated:**
- `getServerSideProps` / `getStaticProps`: устарели с App Router — не применимы в `app/` директории
- `unstable_cache`: для сложных случаев кеширования non-fetch данных — не нужен для простого fetch

---

## 24h.tv API — Data Endpoints (LOW confidence)

Официальной документации нет. Данные основаны на CONTEXT.md и Phase 2 RESEARCH.md:

| Endpoint | Method | Auth | Предположительный ответ | Confidence |
|----------|--------|------|-------------------------|------------|
| `GET /v2/channels` | GET | `Authorization: Bearer {token}` | `{ channels: [{id, name, logo_url, thumbnail_url, current_program, ...}] }` | LOW |
| `GET /v2/rows/novinki` | GET | `Authorization: Bearer {token}` | `{ items: [{id, title, year, genre, poster_url, rating, ...}] }` | LOW |

**Стратегия:** Написать mapper с защитными проверками (`?? []`, `?? ""`), логировать реальный ответ при первом запуске, уточнить mapper. Fallback всегда существует — страница не сломается при любом ответе API.

---

## Open Questions

1. **Реальный формат ответа `/v2/channels`**
   - Что знаем: endpoint существует предположительно
   - Что неизвестно: точные имена полей (id, name, logo_url vs logo, thumbnail_url vs preview_url)
   - Рекомендация: В задаче Phase 4 добавить `console.log` первых 300 символов ответа, в dev-режиме проверить логи сервера

2. **Реальный URL endpoint для "Новинок"**
   - Что знаем: на 24h.tv есть страница/раздел "Новинки"
   - Что неизвестно: `/v2/rows/novinki` это правильный endpoint? (может быть `/v2/playlists/novinki`, `/v2/content?type=new` и т.п.)
   - Рекомендация: Проверить в DevTools на 24h.tv (Network tab) при посещении раздела Новинки — перехватить реальный API-запрос

3. **Позиция TV-секции на главной странице**
   - Что знаем: есть 8 секций в `page.tsx`, TV-секция нужна между ними
   - Что неизвестно: конкретная позиция не специфицирована в требованиях
   - Рекомендация: После `<ServiceCards title="Полезные сервисы">` и перед `<EquipmentSection>` — TV органично вписывается в контекст услуг

4. **Нужно ли обновлять tv/page.tsx тоже?**
   - Что знаем: tv/page.tsx сейчас использует статический импорт из tv-shelves.ts
   - Что неизвестно: явно не сказано обновлять tv/page.tsx в фазе 4
   - Рекомендация: Да — если создаём `tv-data.ts`, логично использовать его везде. Это предотвращает дублирование и расхождение данных между главной и TV-страницей.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Нет тестового фреймворка в проекте |
| Config file | Нет |
| Quick run command | `npm run build` (TypeScript + Next.js build check) |
| Full suite command | `npm run lint && npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-01 | Главная страница рендерит TV-секцию с двумя шлейфами | manual-smoke | `curl -s http://localhost:3000 \| grep 'tv-section'` | ❌ Wave 0 |
| VIS-01 | При недоступном API шлейфы показывают статические данные | manual-smoke | Отключить сеть / указать неверный TV_API_BASE_URL, проверить страницу | ❌ Wave 0 |
| VIS-01 | fetchChannels() и fetchNovinki() возвращают не-пустые массивы | manual-smoke | Логи сервера при `npm run dev` | ❌ Wave 0 |

**Обоснование manual-only:** Нет тестового фреймворка. Server component fetch требует integration тест с мокированием fetch — это Wave 0 работа. Для данной фазы smoke тест через curl и dev-логи достаточен.

### Sampling Rate
- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run lint && npm run build`
- **Phase gate:** Build зелёный + визуальная проверка главной страницы в браузере — два шлейфа видны

### Wave 0 Gaps
- [ ] `iflat-redesign/src/lib/tv-data.ts` — создаётся в этой фазе
- [ ] Логирование API-ответов для определения правильных field names

*(Тестовый фреймворк не требуется для Phase 4 — smoke testing достаточно)*

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs — [Server Components data fetching](https://nextjs.org/docs/app/getting-started/fetching-data) — async server component pattern, `next: { revalidate }`
- Next.js official docs — [Data Fetching, Caching, and Revalidating](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching) — `fetch` options, ISR revalidation
- `iflat-redesign/src/app/tv/page.tsx` — существующий код: TV-секция уже реализована, структура понятна
- `iflat-redesign/src/lib/tv-token.ts` — Phase 2 реализация: `getGuestToken()` готова к использованию

### Secondary (MEDIUM confidence)
- `iflat-redesign/src/components/sections/TvChannelShelf.tsx` — принимает `channels: ChannelData[]` через props, совместим с серверным fetch
- `iflat-redesign/src/components/sections/ContentShelf.tsx` — принимает `items: ContentItem[]`, совместим
- `.planning/phases/02-api-layer/02-RESEARCH.md` — документация о предполагаемых endpoints 24h.tv

### Tertiary (LOW confidence)
- `.planning/phases/02-api-layer/02-CONTEXT.md` — `<specifics>`: `/v2/channels`, `/v2/rows/novinki` — reverse-engineered endpoints
- `iflat-redesign/src/config/tv-shelves.ts` — структура `ChannelData` и `ContentItem` ясна из существующих данных

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Next.js официальная документация, существующий код проекта
- Architecture patterns (server fetch + fallback): HIGH — стандартный App Router паттерн
- TV-секция на главной: HIGH — структура уже есть в tv/page.tsx, копируется напрямую
- 24h.tv API endpoints: LOW — reverse-engineered, нет официальных docs
- API response format / mapper: LOW — неизвестен без реального запроса

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (Next.js stable; 24h.tv API может измениться)
