# Irvine All-Stars — Master Test Plan

**URL:** https://irvineallstars.com
**Date Created:** 2026-03-22
**Tester:** Claude Code (agent-browser + manual)

---

## How to Use These Files

Each file covers a specific area of the site organized by user role. Every test includes step-by-step instructions for navigating, clicking, filling forms, and verifying expected behavior.

### Test Files

| # | File | Area | Role | Est. Time |
|---|------|------|------|-----------|
| 01 | `01-public-pages.md` | Homepage, FAQ, timeline, documents, coaches | Public | 15 min |
| 02 | `02-authentication.md` | Login, signup, role-based redirects | All | 10 min |
| 03 | `03-parent-portal.md` | Selection acceptance, contract, medical release, documents | Parent | 25 min |
| 04 | `04-coach-portal.md` | Dashboard, tryouts, roster, binder, pitching, certs, contracts | Coach | 35 min |
| 05 | `05-admin-dashboard.md` | Dashboard, coach apps, scores, announcements | Admin | 20 min |
| 06 | `06-admin-teams-tryouts.md` | Teams, tryouts, player selection, email sending | Admin | 30 min |
| 07 | `07-admin-compliance-docs.md` | Compliance, documents, invites | Admin | 20 min |
| 08 | `08-evaluator.md` | Evaluator scoring interface | Evaluator | 15 min |
| 09 | `09-mobile-responsive.md` | Mobile/tablet testing across key pages | All | 20 min |
| 10 | `10-known-issues.md` | Issues found during testing | — | — |

**Total estimated time: ~3 hours**

---

## Test Accounts

| Role | Email | Notes |
|------|-------|-------|
| Admin | allstars@irvinepony.com | Full admin access |
| Coach | thesupplycomp@gmail.com | 12U-Bronco head coach |
| Parent | (parent accounts from registrations) | Has selected players |
| Evaluator | (evaluator accounts) | Scoring access |

---

## Key Routes (30+ live)

### Public
- `/` — Homepage
- `/faq` — FAQ
- `/timeline` — Timeline
- `/tryouts` — Tryout info
- `/coaches` — Coaches page
- `/updates` — Public updates
- `/documents/[slug]` — 5 document pages
- `/apply/coach` — Coach application
- `/apply/player` — Player registration
- `/sitemap.xml` — SEO sitemap
- `/robots.txt` — SEO robots

### Auth
- `/auth/login` — Login
- `/auth/signup` — Signup
- `/auth/callback` — OAuth callback
- `/auth/invite/[token]` — Invite link

### Parent Portal
- `/portal` — Parent dashboard
- `/portal/confirm` — Accept selection
- `/portal/contract` — Sign contract
- `/portal/documents` — Upload documents
- `/portal/medical-release` — Medical release form

### Coach Portal
- `/coach` — Coach dashboard
- `/coach/tryouts` — View tryouts
- `/coach/scores` — View scores
- `/coach/roster` — Team roster
- `/coach/checklist` — Binder checklist
- `/coach/pitching-log` — Pitching log
- `/coach/contracts` — View contracts
- `/coach/certifications` — Upload certs
- `/coach/tournament-rules` — Tournament rules
- `/coach/updates` — Coach updates

### Admin
- `/admin` — Admin dashboard
- `/admin/applications` — Coach applications
- `/admin/scores` — Scoring management
- `/admin/announcements` — Announcements
- `/admin/teams` — Team management
- `/admin/tryouts` — Tryout management
- `/admin/invites` — Invite management
- `/admin/documents` — Document management
- `/admin/compliance` — Tournament compliance

### Other
- `/evaluate` — Evaluator landing
- `/evaluate/score` — Score entry
- `/evaluate/summary` — Score summary
- `/contract-view` — Contract viewer
- `/medical-view` — Medical release viewer
