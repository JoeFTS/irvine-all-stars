# Session Log: 2026-04-08 / 2026-04-09

## Objective
Clear all Supabase Security Advisor errors and warnings on the ProjectHub project (`owuempqaheupjyslkjlg`) for the `irvine_allstars` schema.

## What Was Done

### Phase 1: Enable RLS on 8 Tables (10 Errors Fixed)
**Migration file:** `supabase/migrations/20260408_enable_rls_all_tables.sql`

Enabled Row Level Security and created role-based policies on all tables that had RLS disabled:

| Table | Public Access | Auth Access | Admin Access |
|-------|--------------|-------------|--------------|
| `divisions` | SELECT (public data for forms) | — | Full CRUD |
| `announcements` | — | SELECT | Full CRUD |
| `tryout_sessions` | — | SELECT | Full CRUD |
| `evaluator_scores` | — | Evaluator INSERT/UPDATE, Coach/Evaluator/Admin SELECT | Full CRUD |
| `tryout_assignments` | — | SELECT | Full CRUD |
| `assistant_coaches` | — | Coach manages own (`head_coach_id = auth.uid()`) | Full CRUD |
| `tryout_registrations` | Anonymous INSERT (public form) | Parent SELECT/UPDATE own (email match) | Full CRUD |
| `coach_applications` | Anonymous INSERT (public form) | — | SELECT/UPDATE/DELETE |

### Phase 2: Fix 17 Warnings
**Migration file:** `supabase/migrations/20260409_fix_warnings.sql`

#### Function Search Path Mutable (6 functions fixed)
Added `SET search_path = ''` to prevent search path hijacking:
- `dojo_36.add_chi`
- `dojo_36.handle_new_user`
- `dojo_36.increment_lessons_completed`
- `dojo_36.update_streak`
- `coaching_buddy.handle_new_user`
- `coaching_buddy.update_updated_at_column`

#### RLS Policy Always True (11 policies fixed)
Replaced overly permissive `allow_all_*` policies with proper role-based ones:

| Table | Old Policy | New Policy |
|-------|-----------|------------|
| `binder_checklist` | `allow_all` (true) | Authenticated SELECT, Coach+Admin manage |
| `coach_certifications` | `allow_all` (true) | Coach manages own (`coach_id = auth.uid()`), Admin manages all |
| `invites` | `allow_all` (true) | Admin manages, Anon/Auth can SELECT (token lookup), Auth can UPDATE own (email match) |
| `player_contracts` | `allow_all` (true) | Authenticated SELECT/INSERT, Admin manages |
| `player_documents` | `allow_all` (true) | Authenticated SELECT/INSERT, Admin manages |
| `teams` | `allow_all` (true) | Authenticated SELECT, Admin manages |
| `tournament_agreements` | `allow_all` (true) | Coach manages own (`coach_id = auth.uid()`), Admin manages all |
| `profiles` | SELECT true, INSERT true | Authenticated SELECT, INSERT own (`auth.uid() = id`) |
| `team_documents` | SELECT true | Authenticated SELECT |
| `divisions` | SELECT true | SELECT for anon+authenticated |
| `coach_applications` | INSERT true | INSERT for anon+authenticated |
| `tryout_registrations` | INSERT true | INSERT for anon+authenticated |

### Phase 3: Post-Audit Fix (Invite Flow)
After applying RLS, audited all app code for compatibility. Found the invite signup flow (`/auth/invite/[token]`) reads and updates the `invites` table client-side as an unauthenticated user.

**Fixed by adding:**
- SELECT policy allowing anon/authenticated to look up invites (for signup page token validation)
- UPDATE policy allowing authenticated users to mark their own invite as used (email match against `auth.users`)

## Verification
- All `allow_all_*` policies removed (confirmed via `pg_policies` query)
- All 6 functions have `search_path=""` set (confirmed via `pg_proc` query)
- All `irvine_allstars` tables have `rowsecurity = true` (only `email_log` remains without RLS, not flagged by advisor)
- Invite signup flow, public forms, parent portal, coach portal, evaluator scoring, and admin dashboard all verified compatible with new policies

## Key Architecture Notes
- **No auth trigger** exists to auto-create `irvine_allstars.profiles` — profile creation is client-side in the signup flow
- **All API routes use the anon key** (not service role) — RLS applies to server-side routes too
- **Profile insert works** because Supabase auto-authenticates after `signUp()`, so `auth.uid() = id` passes
- `email_log` table exists but wasn't flagged by Security Advisor

## Files Changed
- `supabase/migrations/20260408_enable_rls_all_tables.sql` (new)
- `supabase/migrations/20260409_fix_warnings.sql` (new)

## Result
- **Before:** 10 errors, 17 warnings
- **After:** 0 errors, 0 warnings
