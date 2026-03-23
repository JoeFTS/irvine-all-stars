# 01 — Public Pages & All Routes HTTP Testing

**Tester:** Claude Code (automated)
**Date:** 2026-03-22
**Method:** Node.js fetch() against live production (irvineallstars.com)

---

## All Routes HTTP Status Check — 43/43 PASS

| Result | Status | Route |
|--------|--------|-------|
| PASS | 200 | `/` (Homepage) |
| PASS | 200 | `/faq` |
| PASS | 200 | `/timeline` |
| PASS | 200 | `/tryouts` |
| PASS | 200 | `/coaches` |
| PASS | 200 | `/updates` |
| PASS | 200 | `/apply/player` |
| PASS | 200 | `/apply/coach` |
| PASS | 200 | `/auth/login` |
| PASS | 200 | `/auth/signup` |
| PASS | 200 | `/documents/parent-info` |
| PASS | 200 | `/documents/evaluation-rubric` |
| PASS | 200 | `/documents/code-of-conduct` |
| PASS | 200 | `/sitemap.xml` |
| PASS | 200 | `/robots.txt` |
| PASS | 200 | `/portal` |
| PASS | 200 | `/portal/confirm` |
| PASS | 200 | `/portal/contract` |
| PASS | 200 | `/portal/documents` |
| PASS | 200 | `/portal/medical-release` |
| PASS | 200 | `/coach` |
| PASS | 200 | `/coach/checklist` |
| PASS | 200 | `/coach/pitching-log` |
| PASS | 200 | `/coach/certifications` |
| PASS | 200 | `/coach/roster` |
| PASS | 200 | `/coach/contracts` |
| PASS | 200 | `/coach/tournament-rules` |
| PASS | 200 | `/coach/updates` |
| PASS | 200 | `/admin` |
| PASS | 200 | `/admin/applications` |
| PASS | 200 | `/admin/scores` |
| PASS | 200 | `/admin/announcements` |
| PASS | 200 | `/admin/teams` |
| PASS | 200 | `/admin/tryouts` |
| PASS | 200 | `/admin/invites` |
| PASS | 200 | `/admin/documents` |
| PASS | 200 | `/admin/compliance` |
| PASS | 200 | `/evaluate` |
| PASS | 200 | `/evaluate/score` |
| PASS | 200 | `/evaluate/summary` |
| PASS | 200 | `/contract-view` |
| PASS | 200 | `/medical-view` |
| PASS | 404 | `/nonexistent-page-xyz` (expected) |

## API Routes — 4/4 PASS (proper error handling)

| Result | Status | Route | Response |
|--------|--------|-------|----------|
| PASS | 400 | `GET /api/medical-release-sheet` | `{"error":"Missing division parameter"}` |
| PASS | 400 | `GET /api/score-sheet` | `{"error":"Missing parameters"}` |
| PASS | 400 | `POST /api/send-selection` | `{"error":"Missing required fields..."}` |
| PASS | 400 | `POST /api/send-confirmation` | `{"error":"Missing required fields"}` |

All API routes return descriptive 400 errors (not 500 crashes) when called without required parameters.
