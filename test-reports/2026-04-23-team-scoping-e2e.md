# Team-Scoped Coach Roster — E2E Sweep

**Date:** 2026-04-23
**Feature branch merged:** commits `fd36686..562d420` on `main` (PR #1, merged 2026-04-23)
**Plan:** `docs/plans/2026-04-22-team-scoped-coach-roster.md`
**Target env:** https://irvineallstars.com (prod) + Supabase `ProjectHub` / schema `irvine_allstars`

## Pre-test baseline snapshot

| Metric | Expected | Observed |
|---|---|---|
| `tryout_registrations` with `team_id IS NOT NULL` | 0 | 0 |
| `team_coaches` rows | 6 | 6 |
| `teams` with `season=2026` | 23 | 23 |
| `12U-Bronco` players with `status='registered'` | 51 | 51 |

## Post-test baseline (after cleanup)

Identical to pre-test. All mutations reverted — see tail of `test-reports/evidence/*` and final revert SQL block below.

## Results

| # | Scenario | Result | Evidence |
|---|---|---|---|
| S1 | Team isolation across coaches (same division) | PASS | `evidence/s1-s2-coach-views.json` |
| S2 | Undrafted pool sharing | PASS | `evidence/s1-s2-coach-views.json` |
| S3 | Multi-team coach (cross-division) | PASS | `evidence/s3-multi-team-coach.json` |
| S4 | Admin team assignment flow | PASS | `evidence/s4-admin-flow.json` |
| S5 | Coach invite team pre-assign + auth gate | PASS | `evidence/s5-coach-invite.json` |
| S6 | Parent portal team pill | PASS | `evidence/s6-portal-pill.json` + `evidence/s6-portal-*.png` |
| S7 | RLS at REST layer | PASS | `evidence/s7-s8-rest-trigger.json` |
| S8 | Trigger blocks team_id mutation | PASS | `evidence/s7-s8-rest-trigger.json` |

**All 8 scenarios PASS. No regressions found.**

## Scenario detail

### S1 — team isolation across coaches (PASS)
Mustang 10U has 4 teams, 2 with coaches via `team_coaches` (Gray → `rrstites@yahoo.com`, White → `tynerkincade@yahoo.com`). Staged 3 drafts on Gray (Brinnon/Chen/Dennis), 3 on White (Kincade/Liu/Ludwig), 7 left undrafted.

Impersonated each coach via `BEGIN; SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claims" = '{"sub":"<coach>","role":"authenticated"}'`. Both read `tryout_registrations` for `division='10U-Mustang'`:

- **rrstites** saw 10 rows: 3 Gray drafted + 7 undrafted. Zero White rows.
- **tynerkincade** saw 10 rows: 3 White drafted + 7 undrafted. Zero Gray rows.

RLS policy `Parents and staff can view registrations (scoped)` correctly scopes via `coach_has_team_access(team_id) OR (team_id IS NULL AND division IN coach_divisions())`.

### S2 — undrafted pool sharing (PASS)
Same setup as S1. Both coaches' undrafted lists match exactly: `Ly, Mejia, Scholl, Stites, Strelzow, Tsang, Xiang`.

### S3 — multi-team coach (PASS)
Added `thesupplycomp@gmail.com` (already head of Bronco 12U Red) as `assistant` on Mustang 9U White via `INSERT INTO team_coaches`. With his JWT:

- `irvine_allstars.coach_divisions()` returned `['12U-Bronco', '9U-Mustang']`.
- `team_coaches` join returned both his assignments (matches `useCoachTeams` shape at `src/hooks/use-coach-teams.ts:36-39`).
- Undrafted pool visible: 51 in `12U-Bronco` + 2 in `9U-Mustang`.

Reverted the extra `team_coaches` row — count back to 6.

### S4 — admin team assignment flow (PASS)
Using an admin JWT (`allstars@irvinepony.com`, uid `1faf31f9`) via `SET LOCAL`:

- `+` button: `UPDATE tryout_registrations SET team_id='<White>' WHERE id='<Ly>'` succeeded through the `guard_team_id_mutation` trigger (admin bypass).
- `-` button: `UPDATE ... SET team_id=NULL` succeeded.
- Coach picker: `INSERT INTO team_coaches (...)` + `DELETE FROM team_coaches` succeeded under admin policy `Admins can manage team_coaches`.
- Create-team: inserted a `TEST-DELETE-ME` team + auto-mirrored `team_coaches` row for coach `rrstites` with `role='head'` (matches `src/app/admin/teams/page.tsx:217-232`). Delete of the team cascaded the join row (FK `ON DELETE CASCADE` on `team_coaches.team_id`).

Search filter is a pure client-side `.includes(q)` on `"first last parent"` (`src/app/admin/teams/[teamId]/roster/page.tsx:283-305`) — mechanically correct given the data.

### S5 — coach invite team pre-assign (PASS)
UI: `src/app/admin/invites/page.tsx:548-576` renders the team picker as a `<select>` dropdown (not radio), gated on `role === "coach" && division`. Options filtered by `t.division === division`.

Auth gate on `POST /api/send-invite`:
- No `Authorization` header → `401 {"error":"Unauthorized"}`.
- `Authorization: Bearer <coach JWT>` (via `thesupplycomp` password grant) → `403 {"error":"Forbidden"}`.
Source: `src/app/api/send-invite/route.ts:123-140`.

DB: `invites.team_id` column exists with FK `invites_team_id_fkey` → `teams(id)`. Inserted test invite with `team_id='<Gray>'` and cleaned up. `src/app/api/complete-signup/route.ts:61-70` upserts `team_coaches` when `invite.role === 'coach' && invite.team_id`.

### S6 — parent portal team pill (PASS)
Logged in as `thesupplycomp@gmail.com` via Playwright on `/auth/login`. Player = Max Hernandez, `parent_email` = thesupplycomp.

**Drafted state** (`team_id` set to Bronco 12U Red):
- Green pill rendered: `Drafted to: Bronco 12U Red` (`src/app/portal/page.tsx:632-641`).
- Division line: `Division: Bronco 12U Red (12U-Bronco)`.
- Screenshot: `evidence/s6-portal-drafted.png`.

**Undrafted state** (`team_id` reverted to NULL):
- Pill absent.
- Division line: `Division: 12U-Bronco`.
- Screenshot: `evidence/s6-portal-undrafted.png`.

### S7 — RLS at REST layer (PASS)
Coach JWT issued via `/auth/v1/token` password grant for `thesupplycomp@gmail.com` (coach of Bronco 12U Red). Queried `/rest/v1/tryout_registrations?select=count` with `Accept-Profile: irvine_allstars`. `Content-Range: 0-0/51`.

Grouped by division: `[{division:"12U-Bronco", total:51, drafted:0, undrafted:51}]` — only 12U-Bronco rows visible. UI of `/coach/roster` would display the same set (his 0 drafted plus 51 undrafted division pool). No cross-division leakage.

### S8 — trigger blocks team_id mutation (PASS)
Same coach JWT. `PATCH /rest/v1/tryout_registrations?id=eq.<Max>` with body `{"team_id":"<BroncoRed>"}` → HTTP 4xx + `{"code":"42501","message":"Only admins may change team_id on tryout_registrations"}`. Post-update DB state: `team_id IS NULL`. Admin path via Management API UPDATE succeeded (service role bypass in `guard_team_id_mutation` at `src/migrations/...` / in-DB function def).

## Cleanup audit

All mutations reverted. Diff vs baseline:
- `tryout_registrations.team_id IS NOT NULL` count: 0 (= baseline 0)
- `team_coaches` rows: 6 (= baseline 6)
- `teams` with `season=2026`: 23 (= baseline 23)
- `12U-Bronco` registered: 51 (= baseline 51)
- Orphan test teams or invites (`%test%` / `e2e-test`): 0

## Notes
- Did not mutate any real user's `auth.users` password. Only documented test account `thesupplycomp@gmail.com` used for password-grant JWT.
- Admin-path checks used JWT impersonation for the real admin uid via `SET LOCAL "request.jwt.claims"` + Management API — no password change.
- All SQL via Supabase Management API; UI via Playwright with test account.
