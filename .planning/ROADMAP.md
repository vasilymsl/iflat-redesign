# Roadmap: iFlat TV-шлейфы

## Overview

Превращаем существующие заглушки TV-шлейфов в production-качество: 140%-расширение карточки при hover, живой HLS-эфир по наведению, динамические данные из API 24h.tv. Работа разбита на 5 фаз — сначала CSS-архитектура (основа всего), параллельно API-слой, затем интеграция HLS в ChannelCard, подключение живых данных и главной страницы, финальная полировка.

v1.1 добавляет стабильность HLS-стримов: устраняет race condition и блокировку event loop, укрепляет circuit breaker, фиксирует UX при интерактивных запросах.

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-03-12)
- 🚧 **v1.1 QRATOR Stability Fix** — Phases 6–8 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–5) — SHIPPED 2026-03-12</summary>

- [x] **Phase 1: CSS Expand Architecture** - Правильная overflow/stacking архитектура для 140%-расширения карточек (completed 2026-03-09)
- [x] **Phase 2: API Layer** - Гостевой токен, список каналов и стрим-проксирование через Route Handler (completed 2026-03-09)
- [x] **Phase 3: ChannelCard HLS Integration** - Hover-triggered HLS preview с кроссфейдом, LIVE-бейджем и корректной очисткой
- [x] **Phase 4: Data Wiring + Home Page** - Живые данные API вместо статики, шлейфы на главной странице
- [x] **Phase 5: Visual Polish** - Финальная визуальная полировка и адаптивность

### Phase 1: CSS Expand Architecture
**Goal**: Карточки каналов корректно расширяются до 140% при hover — без обрезки, без конфликтов со scroll-snap
**Depends on**: Nothing (first phase)
**Requirements**: HOVER-01, HOVER-02, HOVER-03, HOVER-04, HOVER-06
**Success Criteria** (what must be TRUE):
  1. При наведении на карточку канала она расширяется до ~140% ширины и перекрывает соседние карточки
  2. Расширенная карточка не обрезается scroll-контейнером — видна полностью поверх соседних
  3. Расширение начинается с задержкой 200ms и анимируется плавно (0.25s ease-out)
  4. При уходе курсора карточка плавно возвращается к исходному размеру
  5. Z-index расширенной карточки не конфликтует с шапкой сайта
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md — CSS-архитектура для 140%-расширения: overflow, stacking, width expansion, transitions

### Phase 2: API Layer
**Goal**: Сервер получает гостевой токен 24h.tv, кеширует его, и проксирует stream-запросы — токен никогда не попадает в браузер
**Depends on**: Nothing (can be built in parallel with Phase 1)
**Requirements**: HLS-01, HLS-02
**Success Criteria** (what must be TRUE):
  1. Route Handler `/api/tv/stream/[id]` возвращает HLS-manifest URL для любого канала с валидным id
  2. Повторные запросы к API используют кешированный токен — POST /v2/users не вызывается при каждом hover
  3. Конкурентные hover-события не создают дублирующихся токен-запросов (singleton deduplication)
**Plans**: 1 plan

Plans:
- [x] 02-01-PLAN.md — TokenManager singleton + Route Handler /api/tv/stream/[id]

### Phase 3: ChannelCard HLS Integration
**Goal**: Пользователь видит живой эфир при наведении на карточку канала, видео плавно исчезает при уходе курсора
**Depends on**: Phase 1, Phase 2
**Requirements**: HLS-03, HLS-04, HLS-05, HLS-06, HOVER-05
**Success Criteria** (what must be TRUE):
  1. При наведении на карточку канала в течение 200ms начинает воспроизводиться реальный HLS-стрим
  2. Thumbnail плавно переходит в видео (crossfade 0.4s) — нет резкого переключения
  3. LIVE-бейдж отображается поверх видео во время воспроизведения стрима
  4. При наведении на другую карточку предыдущий стрим мгновенно останавливается
  5. При уходе курсора стрим останавливается и ресурсы освобождаются (нет memory leak)
**Plans**: 1 plan

Plans:
- [x] 03-01-PLAN.md — HLS-интеграция: dynamic fetch, crossfade, LIVE badge, single-active-player координация

### Phase 4: Data Wiring + Home Page
**Goal**: Шлейфы показывают актуальные данные из API 24h.tv и доступны на главной странице
**Depends on**: Phase 3
**Requirements**: VIS-01
**Success Criteria** (what must be TRUE):
  1. Оба шлейфа ("Бесплатные каналы" и "Новинки") видны на главной странице `/`
  2. Данные каналов и список "Новинки" загружаются из API 24h.tv (не из статического tv-shelves.ts)
  3. При недоступности API шлейфы используют статические данные как fallback — страница не ломается
**Plans**: 1 plan

Plans:
- [x] 04-01-PLAN.md — Data layer tv-data.ts + TV-секция на главной + обновление tv/page.tsx

### Phase 5: Visual Polish
**Goal**: Шлейфы визуально соответствуют стилю 24h.tv и корректно адаптируются к ширине экрана
**Depends on**: Phase 4
**Requirements**: VIS-02, VIS-03, VIS-04, VIS-05
**Success Criteria** (what must be TRUE):
  1. Рейтинг на постерах "Новинки" виден всегда — не только при hover
  2. Шрифты, цвета, отступы и бейджи визуально максимально близки к 24h.tv
  3. Тёмный фон секции TV гармонично переходит в светлый дизайн iFlat (градиентный переход)
  4. На разных ширинах экрана видно 6/5/4/2.5 карточек соответственно
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — Visual polish: ratings, badges, typography, dark section
- [x] 05-02-PLAN.md — Responsive карточки и адаптивные шлейфы

</details>

---

### v1.1 QRATOR Stability Fix (In Progress)

**Milestone Goal:** HLS-стримы и расписания каналов стабильно работают, не падая из-за QRATOR rate-limiting

- [ ] **Phase 6: Core Rate-Limit Fix** - Promise mutex + async sleep устраняют race condition и блокировку event loop
- [ ] **Phase 7: Circuit Breaker + Resilience** - Двойной circuit breaker защищает от retry storm, fallback при недоступности API
- [ ] **Phase 8: Token & Stream Hardening** - Проактивный refresh токена и кеш stream URL устраняют повторные запросы

## Phase Details

### Phase 6: Core Rate-Limit Fix
**Goal**: Запросы к 24h.tv API сериализованы через Promise mutex — race condition устранён, event loop не блокируется
**Depends on**: Phase 5 (v1.0 complete)
**Requirements**: RATE-01, RATE-02, RATE-03, PERF-01
**Success Criteria** (what must be TRUE):
  1. При одновременном наведении на несколько карточек запросы к API идут последовательно, не параллельно — QRATOR не получает burst
  2. В логах сервера пауза между curl-запросами >=350ms (или >=500ms для schedule) — видна в консоли dev-сервера
  3. Авторизация (4 шага) проходит без 429 ошибок — токен получается с первой попытки при запуске сервера
  4. Node.js event loop не зависает при hover-запросах — страница остаётся отзывчивой
**Plans**: 1 plan

Plans:
- [ ] 06-01-PLAN.md — Promise-chain mutex в curlJson + убрать execSync sleep из curlJsonSync

### Phase 7: Circuit Breaker + Resilience
**Goal**: Пакетные запросы расписаний защищены от retry storm, при недоступности API сайт работает со статическими данными
**Depends on**: Phase 6
**Requirements**: RESIL-01, RESIL-02, RESIL-03
**Success Criteria** (what must be TRUE):
  1. После 3 последовательных ошибок расписаний circuit breaker срабатывает — в логах видно сообщение об остановке batch
  2. При наведении на карточку канала и недоступности stream API ответ приходит не позднее чем через 3-4 секунды (не 14)
  3. Если API каналов вернул пустой массив, шлейфы показывают статические каналы из tv-shelves.ts — страница не пустая
**Plans**: TBD

Plans:
- [ ] 07-01: Двойной circuit breaker (consecutiveFailCount + totalFailCount), MAX_RETRIES_STREAM=1, static fallback каналов

### Phase 8: Token & Stream Hardening
**Goal**: Токен проактивно обновляется до истечения даже после рестарта сервера, повторный hover не бьёт API
**Depends on**: Phase 7
**Requirements**: TOKEN-01, TOKEN-02, PERF-02
**Success Criteria** (what must be TRUE):
  1. После рестарта сервера через ~67 минут в логах появляется `[tv-token] Proactive token refresh` — не ждёт истечения токена
  2. Повторное наведение на ту же карточку в течение 60 секунд не создаёт нового запроса к `/api/tv/stream/[id]`
  3. `.tv-token-cache.json` содержит поле `tokenIssuedAt` — видно в файле после перезапуска
**Plans**: TBD

Plans:
- [ ] 08-01: tokenIssuedAt в persistent cache, stream URL cache 60s TTL

## Progress

**Execution Order:**
v1.0: 1 -> 2 -> 3 -> 4 -> 5 (complete)
v1.1: 6 -> 7 -> 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. CSS Expand Architecture | v1.0 | 1/1 | Complete | 2026-03-09 |
| 2. API Layer | v1.0 | 1/1 | Complete | 2026-03-09 |
| 3. ChannelCard HLS Integration | v1.0 | 1/1 | Complete | 2026-03-12 |
| 4. Data Wiring + Home Page | v1.0 | 1/1 | Complete | 2026-03-12 |
| 5. Visual Polish | v1.0 | 2/2 | Complete | 2026-03-12 |
| 6. Core Rate-Limit Fix | v1.1 | 0/1 | Not started | - |
| 7. Circuit Breaker + Resilience | v1.1 | 0/1 | Not started | - |
| 8. Token & Stream Hardening | v1.1 | 0/1 | Not started | - |
