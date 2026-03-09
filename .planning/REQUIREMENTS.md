# Requirements: iFlat TV-шлейфы

**Defined:** 2026-03-09
**Core Value:** При наведении на карточку канала пользователь мгновенно видит живой эфир

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Hover-анимация

- [ ] **HOVER-01**: При наведении на карточку канала, она расширяется до ~140% ширины и перекрывает соседние карточки
- [ ] **HOVER-02**: Расширение начинается с задержкой 200ms для предотвращения случайных срабатываний
- [ ] **HOVER-03**: Анимация расширения плавная (CSS GPU-composited, 0.25s ease-out)
- [ ] **HOVER-04**: Scroll-контейнер не обрезает расширенную карточку (решена проблема overflow)
- [ ] **HOVER-05**: При появлении HLS-видео происходит плавный кроссфейд от thumbnail к видео (0.4s)
- [ ] **HOVER-06**: При уходе курсора карточка плавно возвращается к исходному размеру

### HLS-стриминг

- [ ] **HLS-01**: Next.js Route Handler получает гостевой токен 24h.tv (POST /v2/users с is_guest:true)
- [ ] **HLS-02**: Токен кешируется на сервере с автообновлением по TTL
- [ ] **HLS-03**: При наведении на карточку канала запрашивается и проигрывается реальный HLS-стрим
- [ ] **HLS-04**: Стрим корректно останавливается и ресурсы освобождаются при уходе курсора
- [ ] **HLS-05**: Только один стрим играет одновременно (предыдущий останавливается при наведении на новую карточку)
- [ ] **HLS-06**: LIVE-бейдж отображается во время воспроизведения стрима

### Визуал и размещение

- [ ] **VIS-01**: Оба шлейфа ("Бесплатные каналы" и "Новинки") отображаются на главной странице
- [ ] **VIS-02**: Бейдж рейтинга на постерах "Новинки" виден всегда, не только при hover
- [ ] **VIS-03**: Шрифты, цвета, отступы и бейджи визуально максимально близки к 24h.tv
- [ ] **VIS-04**: Темный фон секции с шлейфами гармонично вписывается в светлый дизайн iFlat (градиентный переход)
- [ ] **VIS-05**: Адаптивность сохраняется: 6→5→4→2.5 карточек в зависимости от ширины экрана

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Динамические данные

- **DATA-01**: Данные каналов динамически из API 24h.tv (вместо захардкоженных)
- **DATA-02**: Данные "Новинки" динамически из API 24h.tv (/row/novinki)
- **DATA-03**: Направленное расширение (левые карточки растут вправо, правые влево)

### Оптимизация

- **OPT-01**: Предзагрузка стрима соседней карточки при intent-to-hover
- **OPT-02**: ResizeObserver вместо window.resize для шлейфов

## Out of Scope

| Feature | Reason |
|---------|--------|
| Полноценный видеоплеер (play/pause/seek/fullscreen) | Только превью при hover — пользователь идёт на 24h.tv за полным просмотром |
| Авторизация пользователей 24h.tv | Используем гостевой токен |
| Видео на мобильных | Hover нет на тачскринах |
| Автоплей при загрузке страницы | Убивает производительность |
| Несколько одновременных стримов | Перегрузка CPU и сети |
| Keyboard-навигация по карточкам | Низкая ценность для embed-контекста |
| Swipe-жесты | Нативный scroll достаточен |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOVER-01 | Phase 1 | Pending |
| HOVER-02 | Phase 1 | Pending |
| HOVER-03 | Phase 1 | Pending |
| HOVER-04 | Phase 1 | Pending |
| HOVER-05 | Phase 3 | Pending |
| HOVER-06 | Phase 1 | Pending |
| HLS-01 | Phase 2 | Pending |
| HLS-02 | Phase 2 | Pending |
| HLS-03 | Phase 3 | Pending |
| HLS-04 | Phase 3 | Pending |
| HLS-05 | Phase 3 | Pending |
| HLS-06 | Phase 3 | Pending |
| VIS-01 | Phase 4 | Pending |
| VIS-02 | Phase 5 | Pending |
| VIS-03 | Phase 5 | Pending |
| VIS-04 | Phase 5 | Pending |
| VIS-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after roadmap creation*
