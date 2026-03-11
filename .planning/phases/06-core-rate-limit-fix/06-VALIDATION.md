---
phase: 6
slug: core-rate-limit-fix
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 6 — Validation Strategy

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
| 06-01-01 | 01 | 1 | RATE-02 | static | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 06-01-02 | 01 | 1 | PERF-01 | grep | `grep -c "execSync.*sleep" iflat-redesign/src/lib/tv-token.ts` (expect 0) | ✅ | ⬜ pending |
| 06-01-03 | 01 | 1 | RATE-01 | manual | Dev server logs: pause ≥350ms between curl requests | ❌ manual | ⬜ pending |
| 06-01-04 | 01 | 1 | RATE-03 | manual | Dev server logs: auth flow steps with ≥500ms gaps | ❌ manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework installation needed — TypeScript compiler and grep provide automated verification for structural changes. Runtime behavior (rate-limit pauses) verified manually via dev server logs.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pause ≥350ms between API requests | RATE-01 | Requires real curl calls to 24h.tv API | 1. Start dev server 2. Hover multiple channel cards rapidly 3. Check console logs for timestamps between requests |
| Auth flow pauses ≥500ms | RATE-03 | Requires real auth flow execution | 1. Delete .tv-token-cache.json 2. Start dev server 3. Navigate to /tv page 4. Check console for auth step timestamps |
| Event loop responsiveness | PERF-01 | Requires concurrent requests during curl | 1. Start dev server 2. Hover channel cards 3. Simultaneously navigate pages — pages should load without delay |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
