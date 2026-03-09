---
phase: 02
slug: api-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (no test framework in project) |
| **Config file** | none — Wave 0 installs if needed |
| **Quick run command** | `cd iflat-redesign && npx next build 2>&1 \| tail -5` |
| **Full suite command** | `cd iflat-redesign && npm run lint && npx next build 2>&1 \| tail -5` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd iflat-redesign && npx next build 2>&1 | tail -5`
- **After every plan wave:** Run `cd iflat-redesign && npm run lint && npx next build 2>&1 | tail -5`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | HLS-01 | build | `cd iflat-redesign && npx next build` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | HLS-01, HLS-02 | build | `cd iflat-redesign && npx next build` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | HLS-01 | build + smoke | `curl http://localhost:3000/api/tv/stream/perviy` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `iflat-redesign/src/lib/tv-token.ts` — TokenManager singleton (created during phase)
- [ ] `iflat-redesign/src/app/api/tv/stream/[id]/route.ts` — Route Handler (created during phase)

*Test framework not required for Phase 2 — TypeScript build + curl smoke testing sufficient.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Route Handler returns streamUrl for valid channel id | HLS-01 | No test framework, API depends on external 24h.tv | `curl http://localhost:3000/api/tv/stream/perviy` — should return `{ streamUrl: "https://..." }` |
| Route Handler returns 404 for unknown id | HLS-01 | Smoke test | `curl http://localhost:3000/api/tv/stream/unknown` — should return 404 |
| Repeated requests use cached token | HLS-02 | Requires observing server logs | Make 2 rapid curl requests, check server logs for single POST /v2/users |
| Concurrent requests don't duplicate token | HLS-02 | Requires parallel requests | `curl` in parallel + check server logs for singleton behavior |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
