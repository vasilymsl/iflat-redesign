---
phase: 7
slug: circuit-breaker-resilience
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler + grep (no runtime test framework) |
| **Config file** | tsconfig.json (existing) |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | RESIL-01 | grep | `grep -c "consecutiveFailCount" iflat-redesign/src/lib/tv-token.ts` (expect ≥1) | ✅ | ⬜ pending |
| 07-01-02 | 01 | 1 | RESIL-02 | grep | `grep -c "MAX_RETRIES_STREAM" iflat-redesign/src/lib/tv-token.ts` (expect ≥1) | ✅ | ⬜ pending |
| 07-01-03 | 01 | 1 | RESIL-03 | grep | `grep -c "tv-shelves" iflat-redesign/src/lib/tv-token.ts` (expect ≥1) | ✅ | ⬜ pending |
| 07-01-04 | 01 | 1 | ALL | static | `npx tsc --noEmit && npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Circuit breaker stops batch after 3 failures | RESIL-01 | Requires real API failures or mock | 1. Block API access 2. Navigate to /tv 3. Check logs for CB message |
| Stream responds in ≤4s when API down | RESIL-02 | Requires real timeout measurement | 1. Block stream API 2. Hover channel card 3. Measure response time |
| Static fallback shows channels | RESIL-03 | Requires empty API response | 1. Block channels API 2. Load page 3. Verify channels display |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
