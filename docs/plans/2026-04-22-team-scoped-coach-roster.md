# Team-Scoped Coach Roster Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scope coach visibility to their drafted team only. Other coaches in the same division stop seeing each other's drafted players. Undrafted players in the division stay visible to all coaches in that division so they can be considered.

**Architecture:** Already have a `teams` table (`id, division, team_name, coach_id, season`). Add (a) `team_id FK` on `tryout_registrations`, (b) `team_coaches` join table for multi-coach teams, (c) RLS that scopes coach SELECT/UPDATE on registrations to their team OR (drafted IS NULL AND division match), (d) admin "Roster Manager" UI to assign drafted players to teams, (e) coach app updated to read `team_id` not `division`.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres + RLS), TypeScript, Tailwind. Schema lives in `irvine_allstars` schema. Migrations applied via Supabase Management API (see `supabase_admin.md` memory).

**Out of scope:** division-wide features (tournaments, announcements, evaluator scores) keep using `profiles.division`. Only roster + roster-derived pages (contracts, documents) become team-scoped.

---

## Phase 1: Schema

### Task 1: Add `team_id` to tryout_registrations + back-compat

**Files:**
- Create: `supabase/migrations/20260422_add_team_id_to_registrations.sql`

**Step 1: Write migration**

```sql
-- Adds optional team_id to registrations. Drafted = team_id IS NOT NULL.
-- Undrafted = team_id IS NULL (still visible to all coaches in division).
ALTER TABLE irvine_allstars.tryout_registrations
  ADD COLUMN team_id uuid
  REFERENCES irvine_allstars.teams(id) ON DELETE SET NULL;

CREATE INDEX idx_tryout_registrations_team_id
  ON irvine_allstars.tryout_registrations(team_id);

CREATE INDEX idx_tryout_registrations_division_status
  ON irvine_allstars.tryout_registrations(division, status)
  WHERE team_id IS NULL;

COMMENT ON COLUMN irvine_allstars.tryout_registrations.team_id IS
  'Team this player was drafted onto. NULL = undrafted (visible to all coaches in division).';
```

**Step 2: Apply migration via Management API**

Refer to memory `supabase_admin.md`. Run:

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(jq -Rs '{query: .}' supabase/migrations/20260422_add_team_id_to_registrations.sql)"
```

Expected: `{"result":[]}` or empty array (DDL).

**Step 3: Verify**

```sql
SELECT column_name, data_type FROM information_schema.columns
 WHERE table_schema='irvine_allstars'
   AND table_name='tryout_registrations' AND column_name='team_id';
```

Expected: 1 row, `team_id | uuid`.

**Step 4: Commit**

```bash
git add supabase/migrations/20260422_add_team_id_to_registrations.sql
git commit -m "feat(roster): add team_id FK to tryout_registrations"
```

---

### Task 2: Create `team_coaches` join table for multi-coach teams

**Why:** Spreadsheet shows head + asst coach per team, and coaches like "Mike or Jose" share two teams. Current `teams.coach_id` only holds one. Use join table; keep `teams.coach_id` populated as the primary head coach for back-compat.

**Files:**
- Create: `supabase/migrations/20260422_create_team_coaches.sql`

**Step 1: Write migration**

```sql
CREATE TABLE irvine_allstars.team_coaches (
  team_id  uuid NOT NULL REFERENCES irvine_allstars.teams(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES irvine_allstars.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'head' CHECK (role IN ('head','assistant')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, coach_id)
);

CREATE INDEX idx_team_coaches_coach ON irvine_allstars.team_coaches(coach_id);

ALTER TABLE irvine_allstars.team_coaches ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON irvine_allstars.team_coaches TO authenticated;
GRANT INSERT, UPDATE, DELETE ON irvine_allstars.team_coaches TO authenticated;

CREATE POLICY "Coaches can see their own assignments"
  ON irvine_allstars.team_coaches FOR SELECT
  USING (
    coach_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
       WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage team_coaches"
  ON irvine_allstars.team_coaches FOR ALL
  USING (
    EXISTS (SELECT 1 FROM irvine_allstars.profiles
             WHERE id = auth.uid() AND role = 'admin')
  );

-- Backfill from existing teams.coach_id
INSERT INTO irvine_allstars.team_coaches (team_id, coach_id, role)
SELECT id, coach_id, 'head'
  FROM irvine_allstars.teams
 WHERE coach_id IS NOT NULL
ON CONFLICT DO NOTHING;
```

**Step 2: Apply, verify**

Apply via Management API. Verify:

```sql
SELECT count(*) FROM irvine_allstars.team_coaches;
```

Expected: equal to `SELECT count(*) FROM teams WHERE coach_id IS NOT NULL`.

**Step 3: Commit**

```bash
git add supabase/migrations/20260422_create_team_coaches.sql
git commit -m "feat(roster): add team_coaches join table for multi-coach teams"
```

---

### Task 3: SQL helper function `coach_has_team_access(team_id)`

**Why:** RLS policies will reuse this in 4+ places (registrations, player_documents, player_contracts). DRY.

**Files:**
- Create: `supabase/migrations/20260422_coach_team_access_fn.sql`

**Step 1: Write migration**

```sql
CREATE OR REPLACE FUNCTION irvine_allstars.coach_has_team_access(p_team_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM irvine_allstars.team_coaches
     WHERE team_id = p_team_id AND coach_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION irvine_allstars.coach_division()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT division FROM irvine_allstars.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION irvine_allstars.coach_has_team_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION irvine_allstars.coach_division() TO authenticated;
```

**Step 2: Apply, verify**

```sql
SELECT irvine_allstars.coach_division();
```

Expected: NULL or division string for the current user.

**Step 3: Commit**

```bash
git add supabase/migrations/20260422_coach_team_access_fn.sql
git commit -m "feat(roster): add coach team access helper functions"
```

---

### Task 4: Update RLS policies on `tryout_registrations`

**Files:**
- Create: `supabase/migrations/20260422_rls_team_scoped_registrations.sql`

**Step 1: Write migration**

```sql
-- Drop old broad coach policy, replace with team-scoped one.
DROP POLICY IF EXISTS "Parents can view own registrations"
  ON irvine_allstars.tryout_registrations;

CREATE POLICY "Parents and staff can view registrations (scoped)"
  ON irvine_allstars.tryout_registrations FOR SELECT
  USING (
    -- Parent sees own kids
    parent_email = (SELECT email FROM irvine_allstars.profiles WHERE id = auth.uid())
    -- Admin / evaluator see everything
    OR EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
       WHERE id = auth.uid() AND role IN ('admin','evaluator')
    )
    -- Coach sees: drafted to my team OR undrafted in my division
    OR (
      EXISTS (SELECT 1 FROM irvine_allstars.profiles
               WHERE id = auth.uid() AND role = 'coach')
      AND (
        irvine_allstars.coach_has_team_access(team_id)
        OR (team_id IS NULL AND division = irvine_allstars.coach_division())
      )
    )
  );

-- Coach UPDATE same scope (for editing roster details). Admin update unchanged.
DROP POLICY IF EXISTS "Parents can update own registrations"
  ON irvine_allstars.tryout_registrations;

CREATE POLICY "Parents and staff can update registrations (scoped)"
  ON irvine_allstars.tryout_registrations FOR UPDATE
  USING (
    parent_email = (SELECT email FROM irvine_allstars.profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
       WHERE id = auth.uid() AND role = 'admin'
    )
    OR (
      EXISTS (SELECT 1 FROM irvine_allstars.profiles
               WHERE id = auth.uid() AND role = 'coach')
      AND irvine_allstars.coach_has_team_access(team_id)
    )
  );
```

**Step 2: Apply, verify with test user**

```sql
-- Should return only test coach's drafted + undrafted-in-division players
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<test-coach-uuid>","role":"authenticated"}';
SELECT id, player_first_name, division, team_id
  FROM irvine_allstars.tryout_registrations LIMIT 10;
RESET ROLE;
```

Expected: rows where team_id matches a team this coach is on, or team_id IS NULL and division matches profile.

**Step 3: Commit**

```bash
git add supabase/migrations/20260422_rls_team_scoped_registrations.sql
git commit -m "feat(rls): scope coach roster visibility to their team"
```

---

### Task 5: Update RLS on `player_documents` and `player_contracts`

**Why:** Roster page reads these. Same scoping rules: coach sees docs/contracts for their drafted players + undrafted-in-division.

**Files:**
- Create: `supabase/migrations/20260422_rls_team_scoped_docs_contracts.sql`

**Step 1: Find current policies first**

```bash
grep -n "player_documents\|player_contracts" supabase/migrations/*.sql
```

Read existing policies; the new policy must DROP the existing coach SELECT policy then re-create with team scope. Use the JOIN-via-subquery pattern (RLS doesn't allow JOIN directly, so use IN/EXISTS).

**Step 2: Write migration**

```sql
-- player_documents: coach sees docs for registrations they have access to.
DROP POLICY IF EXISTS "Coaches and admins can view documents"
  ON irvine_allstars.player_documents;

CREATE POLICY "Documents visible per registration scope"
  ON irvine_allstars.player_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.tryout_registrations r
       WHERE r.id = player_documents.registration_id
         -- piggyback on registrations RLS by re-checking the same conditions
         AND (
           r.parent_email = (SELECT email FROM irvine_allstars.profiles WHERE id = auth.uid())
           OR EXISTS (SELECT 1 FROM irvine_allstars.profiles
                       WHERE id = auth.uid() AND role IN ('admin','evaluator'))
           OR (
             EXISTS (SELECT 1 FROM irvine_allstars.profiles
                      WHERE id = auth.uid() AND role = 'coach')
             AND (
               irvine_allstars.coach_has_team_access(r.team_id)
               OR (r.team_id IS NULL AND r.division = irvine_allstars.coach_division())
             )
           )
         )
    )
  );

-- Same for player_contracts. Drop old, recreate.
DROP POLICY IF EXISTS "Coaches and admins can view contracts"
  ON irvine_allstars.player_contracts;

CREATE POLICY "Contracts visible per registration scope"
  ON irvine_allstars.player_contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.tryout_registrations r
       WHERE r.id = player_contracts.registration_id
         AND (
           r.parent_email = (SELECT email FROM irvine_allstars.profiles WHERE id = auth.uid())
           OR EXISTS (SELECT 1 FROM irvine_allstars.profiles
                       WHERE id = auth.uid() AND role IN ('admin','evaluator'))
           OR (
             EXISTS (SELECT 1 FROM irvine_allstars.profiles
                      WHERE id = auth.uid() AND role = 'coach')
             AND (
               irvine_allstars.coach_has_team_access(r.team_id)
               OR (r.team_id IS NULL AND r.division = irvine_allstars.coach_division())
             )
           )
         )
    )
  );
```

**Step 3: Apply + verify**

Same Management-API pattern. Verify by logging in as test coach (memory `test_accounts.md`) and confirming `/coach/roster` shows only own-team docs.

**Step 4: Commit**

```bash
git add supabase/migrations/20260422_rls_team_scoped_docs_contracts.sql
git commit -m "feat(rls): scope documents and contracts to team-accessible players"
```

---

## Phase 2: Admin UI — Roster Assignment

### Task 6: Add "Manage Roster" page for a single team

**Files:**
- Create: `src/app/admin/teams/[teamId]/roster/page.tsx`
- Modify: `src/app/admin/teams/page.tsx` (add "Manage Roster" link on each team card next to "View Contracts")

**Step 1: Build roster manager UI**

Page shows two columns:
- **Left: This Team's Roster** — registrations where `team_id = team.id`. Each row has [Remove from Team] button (sets team_id NULL).
- **Right: Available Pool** — registrations in the same division where `team_id IS NULL` AND `status IN ('selected','alternate')`. Each row has [Add to Team] button (sets team_id = team.id).

Use Tailwind cards, optimistic UI, `supabase.from("tryout_registrations").update({team_id}).eq("id", regId)`.

Include a search input + jersey # display + parent name. Show count of each side.

**Step 2: Manual test**

- As admin, open a team, drag a player over.
- Refresh — assignment persists.
- Login as that team's coach — `/coach/roster` shows the player. Login as the other coach in same division — they don't see the player.

**Step 3: Commit**

```bash
git add src/app/admin/teams/[teamId]/roster/page.tsx src/app/admin/teams/page.tsx
git commit -m "feat(admin): roster assignment UI per team"
```

---

### Task 7: Add coach assignment UI on team detail (head + asst)

**Files:**
- Modify: `src/app/admin/teams/[teamId]/roster/page.tsx` OR new tab on existing page
- Or extend `src/app/admin/teams/page.tsx` with inline coach picker

**Step 1: UI**

On each team card / detail page show "Coaches" section listing entries from `team_coaches` join. Each entry: name, email, role badge, [Remove]. Add form: pick coach from `coach_applications WHERE status='accepted'` dropdown + role select (head/assistant). On submit:

```ts
// Look up profile by email; create row in team_coaches
await supabase.from("team_coaches").insert({ team_id, coach_id, role });
```

If profile doesn't exist yet (coach hasn't signed up), show a warning and let admin send an invite via existing `/admin/invites`.

**Step 2: Verify**

Add 2 coaches to one team. Login as each — both see the same roster.

**Step 3: Commit**

```bash
git add src/app/admin/teams/...
git commit -m "feat(admin): assign multiple coaches per team"
```

---

## Phase 3: Coach App Refactor

### Task 8: Refactor `/coach/roster` to read by `team_id` not `division`

**Files:**
- Modify: `src/app/coach/roster/page.tsx:527-616`

**Step 1: Replace `coachDivision` lookup with team list**

```ts
// Fetch teams this coach is assigned to
const { data: teamRows } = await supabase
  .from("team_coaches")
  .select("team_id, teams ( id, division, team_name )")
  .eq("coach_id", user.id);

const myTeams = (teamRows ?? []).map(r => r.teams);
setMyTeams(myTeams);
const initialTeamId = myTeams[0]?.id ?? null;
setSelectedTeamId(initialTeamId);
```

**Step 2: Change registration query**

```ts
// drafted-on-my-teams + undrafted-in-my-division (one query each, then merge)
const teamIds = myTeams.map(t => t.id);
const myDivisions = [...new Set(myTeams.map(t => t.division))];

const [draftedRes, undraftedRes] = await Promise.all([
  supabase
    .from("tryout_registrations")
    .select(SELECT_COLS)
    .in("team_id", teamIds)
    .in("status", ["selected","alternate"]),
  supabase
    .from("tryout_registrations")
    .select(SELECT_COLS)
    .is("team_id", null)
    .in("division", myDivisions)
    .in("status", ["selected","alternate"]),
]);
```

(RLS will reject anything outside scope anyway, but app filter is cheaper + clearer.)

**Step 3: UI: replace division tabs with team tabs + "Available Pool" section**

Tabs across top: one per team, plus an "Undrafted Pool" tab. Roster section per tab. The Undrafted Pool section reads-only and shows a "Players in your division not yet drafted" subtitle.

**Step 4: Manual verification**

Login as test coach with one team — sees own team + division pool only. Login as second coach in same division — sees their own team + same pool, NOT first coach's drafted players.

**Step 5: Commit**

```bash
git add src/app/coach/roster/page.tsx
git commit -m "feat(coach): roster scoped to assigned team(s) plus undrafted division pool"
```

---

### Task 9: Refactor `/coach/contracts` and `/coach/checklist` similarly

**Files:**
- Modify: `src/app/coach/contracts/page.tsx:75-100`
- Modify: `src/app/coach/checklist/page.tsx` (find queries)

**Step 1: Mirror Task 8 pattern**

Replace `division` filter with team-based queries. Contract page filter UI changes from "Division" dropdown to "Team" dropdown.

**Step 2: Commit**

```bash
git add src/app/coach/contracts/page.tsx src/app/coach/checklist/page.tsx
git commit -m "feat(coach): contracts and checklist scoped by team"
```

---

### Task 10: Leave division-scoped pages as-is, add comment

**Files:**
- Modify: `src/app/coach/scores/page.tsx` (add comment)
- Modify: `src/app/coach/tournaments/page.tsx` (add comment)
- Modify: `src/app/coach/updates/page.tsx` (add comment)

**Step 1: Document scope intent**

Single-line comment near the division query, e.g.:

```ts
// Division-scoped (not team): announcements apply to whole division.
```

**Step 2: Commit**

```bash
git add src/app/coach/scores/page.tsx src/app/coach/tournaments/page.tsx src/app/coach/updates/page.tsx
git commit -m "docs(coach): clarify division vs team scoping intent"
```

---

## Phase 4: Coach Onboarding

### Task 11: Update coach invite flow to optionally include team_id

**Files:**
- Modify: `src/app/admin/invites/page.tsx`
- Modify: `src/app/api/send-invite/route.ts` (if exists)
- Modify: invite-acceptance handler (find via grep)

**Step 1: Add team_id column to invite form (optional)**

Admin sending a coach invite picks a team (filtered by selected division). On invite acceptance, after profile is created, insert `team_coaches` row.

**Step 2: Verify**

Send an invite with team selected → accept → confirm `team_coaches` row exists.

**Step 3: Commit**

```bash
git add src/app/admin/invites/page.tsx src/app/api/...
git commit -m "feat(invites): assign coach to team on invite acceptance"
```

---

## Phase 5: Seed Data for Spring 2026

### Task 12: Import teams + coaches from spreadsheet

**Files:**
- Create: `scripts/seed-spring-2026-teams.ts`
- Create: `sample-data/spring-2026-coaches.csv` (paste from user's Google Sheet)

**Step 1: Write CSV**

User exports the "Spring '26" tab to CSV with columns: division, team_name, rec_or_colts, coach_name, coach_email, second_coach_email.

**Step 2: Write seed script**

```ts
// For each row: upsert team, find/create profiles by email, insert team_coaches
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import { parse } from "csv-parse/sync";

const sb = createClient(URL, SERVICE_ROLE);
const rows = parse(fs.readFileSync("sample-data/spring-2026-coaches.csv"), {
  columns: true, skip_empty_lines: true,
});

for (const r of rows) {
  if (!r.team_name || !r.team_name.trim()) continue;
  const { data: team } = await sb.from("teams").upsert({
    division: r.division, team_name: r.team_name, season: 2026,
    coach_email: r.coach_email || null,
  }, { onConflict: "division,team_name,season" }).select().single();

  for (const email of [r.coach_email, r.second_coach_email].filter(Boolean)) {
    const { data: profile } = await sb.from("profiles")
      .select("id").ilike("email", email).maybeSingle();
    if (profile) {
      await sb.from("team_coaches")
        .upsert({ team_id: team.id, coach_id: profile.id, role: "head" });
    } else {
      console.log(`No profile yet for ${email} — invite them`);
    }
  }
}
```

**Step 3: Run script**

```bash
npx tsx scripts/seed-spring-2026-teams.ts
```

**Step 4: Verify in admin/teams page**

All 24 Spring '26 teams visible, coach assignments match spreadsheet.

**Step 5: Commit**

```bash
git add scripts/seed-spring-2026-teams.ts sample-data/spring-2026-coaches.csv
git commit -m "chore(seed): Spring 2026 teams and coach assignments"
```

---

## Phase 6: End-to-End Verification

### Task 13: Multi-coach isolation test

**Step 1: Set up test data**

Pick a division with 2+ teams (e.g. Mustang 9U has Red, Blue, White, Gray, Navy). Create test coaches A and B, each on different teams. Draft 3 players to A's team, 3 to B's team, leave 2 undrafted.

**Step 2: Verify**

- Login as Coach A — roster shows 3 own players + 2 undrafted pool. NO B's 3 players.
- Login as Coach B — roster shows 3 own + 2 undrafted. NO A's 3.
- Both coaches see same announcements/tournaments (division-scoped).
- Admin sees all 8.

**Step 3: Capture screenshots, commit doc**

```bash
mv coach-a-roster.png coach-b-roster.png test-screenshots/
git add test-screenshots/
git commit -m "test(roster): verify team isolation between coaches in same division"
```

---

## Phase 7: Cleanup / Deprecation

### Task 14: (Optional, post-launch) Mark `profiles.division` as primary-only

After all team-scoped paths work, leave `profiles.division` for division-wide pages but document that it's "primary division" only — coaches with multiple teams across divisions need team-based queries.

Add comment in `profiles` table; no migration needed.

---

## Risk + Rollback

- **Migrations are additive** (new column, new table, new policies replace old). Rollback = drop new column + table + recreate old policies. Save the OLD policies first by capturing `pg_policies` rows before applying.
- **RLS misconfig** would silently hide rows. Test as each role (admin, coach, parent, evaluator) before declaring done. Use memory `test_accounts.md`.
- **Existing rows** all start with `team_id = NULL` so undrafted-pool semantics apply: every coach sees every selected/alternate player in their division until admin assigns them. Same as today's behavior. Safe deploy.

---

## Done When

- [ ] Coach A in Mustang 9U cannot see Coach B's drafted players (same division, different team)
- [ ] Both coaches still see undrafted Mustang 9U players in a "pool" section
- [ ] Admin can drag/assign drafted players to teams in `/admin/teams/[id]/roster`
- [ ] Admin can add second coach to a team
- [ ] Spring '26 spreadsheet seeded into teams + team_coaches
- [ ] All migrations applied to prod via Management API and verified
