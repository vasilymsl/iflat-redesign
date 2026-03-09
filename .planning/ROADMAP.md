# Roadmap: iFlat TV-шлейфы

## Overview

Превращаем существующие заглушки TV-шлейфов в production-качество: 140%-расширение карточки при hover, живой HLS-эфир по наведению, динамические данные из API 24h.tv. Работа разбита на 5 фаз — сначала CSS-архитектура (основа всего), параллельно API-слой, затем интеграция HLS в ChannelCard, подключение живых данных и главной страницы, финальная полировка.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: CSS Expand Architecture** - Правильная overflow/stacking архитектура для 140%-расширения карточек (completed 2026-03-09)
- [ ] **Phase 2: API Layer** - Гостевой токен, список каналов и стрим-проксирование через Route Handler
- [ ] **Phase 3: ChannelCard HLS Integration** - Hover-triggered HLS preview с кроссфейдом, LIVE-бейджем и корректной очисткой
- [ ] **Phase 4: Data Wiring + Home Page** - Живые данные API вместо статики, шлейфы на главной странице
- [ ] **Phase 5: Visual Polish** - Финальная визуальная полировка и адаптивность

## Phase Details

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
- [ ] 02-01-PLAN.md — TokenManager singleton + Route Handler /api/tv/stream/[id]

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
**Plans**: TBD

### Phase 4: Data Wiring + Home Page
**Goal**: Шлейфы показывают актуальные данные из API 24h.tv и доступны на главной странице
**Depends on**: Phase 3
**Requirements**: VIS-01
**Success Criteria** (what must be TRUE):
  1. Оба шлейфа ("Бесплатные каналы" и "Новинки") видны на главной странице `/`
  2. Данные каналов и список "Новинки" загружаются из API 24h.tv (не из статического tv-shelves.ts)
  3. При недоступности API шлейфы используют статические данные как fallback — страница не ломается
**Plans**: TBD

### Phase 5: Visual Polish
**Goal**: Шлейфы визуально соответствуют стилю 24h.tv и корректно адаптируются к ширине экрана
**Depends on**: Phase 4
**Requirements**: VIS-02, VIS-03, VIS-04, VIS-05
**Success Criteria** (what must be TRUE):
  1. Рейтинг на постерах "Новинки" виден всегда — не только при hover
  2. Шрифты, цвета, отступы и бейджи визуально максимально близки к 24h.tv
  3. Тёмный фон секции TV гармонично переходит в светлый дизайн iFlat (градиентный переход)
  4. На разных ширинах экрана видно 6/5/4/2.5 карточек соответственно
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5
Note: Phase 1 and Phase 2 have no dependency between them and can be built concurrently.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. CSS Expand Architecture | 1/1 | Complete   | 2026-03-09 |
| 2. API Layer | 0/1 | In Progress | - |
| 3. ChannelCard HLS Integration | 0/? | Not started | - |
| 4. Data Wiring + Home Page | 0/? | Not started | - |
| 5. Visual Polish | 0/? | Not started | - |
