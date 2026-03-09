---
phase: 1
slug: css-expand-architecture
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual visual verification (CSS-only phase) |
| **Config file** | none — visual CSS changes |
| **Quick run command** | `open http://localhost:3333/tv` |
| **Full suite command** | `npx next build` (TypeScript + ESLint check) |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Visual check at localhost:3333/tv
- **After every plan wave:** `npx next build` must pass
- **Before `/gsd:verify-work`:** Full visual check + build
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | HOVER-04 | manual | Visual: card not clipped by scroll container | N/A | ⬜ pending |
| 1-01-02 | 01 | 1 | HOVER-01 | manual | Visual: card expands to ~140% on hover | N/A | ⬜ pending |
| 1-01-03 | 01 | 1 | HOVER-02 | manual | Visual: 200ms delay before expand | N/A | ⬜ pending |
| 1-01-04 | 01 | 1 | HOVER-03 | manual | Visual: smooth 0.25s ease-out animation | N/A | ⬜ pending |
| 1-01-05 | 01 | 1 | HOVER-06 | manual | Visual: smooth return on mouse leave | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test setup needed — this is a pure CSS phase with visual verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Card expands to 140% width | HOVER-01 | Visual CSS effect, not testable with unit tests | Hover over channel card, verify it grows and overlaps neighbors |
| No scroll container clipping | HOVER-04 | Visual overflow behavior | Hover on edge cards, verify they're not cut off |
| 200ms hover delay | HOVER-02 | Timing perception | Quickly pass mouse over cards, verify no accidental triggers |
| Smooth animation | HOVER-03 | Visual smoothness perception | Hover/unhover repeatedly, verify no jank |
| Smooth return | HOVER-06 | Visual animation | Move mouse away, verify card shrinks smoothly |
| Z-index no header conflict | SC-5 | Visual stacking | Hover on card near header, verify card doesn't overlap nav |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
