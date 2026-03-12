---
phase: 8
slug: token-stream-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 8 — Validation Strategy

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
| 08-01-01 | 01 | 1 | TOKEN-02 | grep | `grep -c "tokenIssuedAt" iflat-redesign/src/lib/tv-token.ts` (expect ≥3) | ✅ | ⬜ pending |
| 08-01-02 | 01 | 1 | TOKEN-01 | grep | `grep -c "Proactive token refresh" iflat-redesign/src/lib/tv-token.ts` (expect ≥1) | ✅ | ⬜ pending |
| 08-01-03 | 01 | 1 | PERF-02 | grep | `grep -c "streamUrlCache" iflat-redesign/src/lib/tv-token.ts` (expect ≥1) | ✅ | ⬜ pending |
| 08-01-04 | 01 | 1 | ALL | static | `npx tsc --noEmit && npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Proactive refresh after ~67min | TOKEN-01 | Requires waiting for TTL threshold | 1. Start server 2. Wait ~67min 3. Check logs for refresh message |
| Stream URL cache prevents re-fetch | PERF-02 | Requires real hover interaction | 1. Hover channel card 2. Hover same card again within 60s 3. Check no new /api/tv/stream request |
| tokenIssuedAt in cache file | TOKEN-02 | Requires file inspection | 1. Start server 2. Trigger auth 3. Check .tv-token-cache.json for tokenIssuedAt |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
