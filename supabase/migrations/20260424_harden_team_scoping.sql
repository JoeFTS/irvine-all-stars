-- Hardening migration for team-scoped roster RLS + team_id mutation trigger.
--
-- This is ADDITIVE on top of:
--   20260422d_rls_team_scoped_registrations.sql
--   20260423b_block_team_id_mutation.sql
--   20260423d_coach_divisions_multi.sql
--   20260423e_coach_has_registration_access_helper.sql
--
-- Three changes, all semantics-preserving:
--   1. Swap `division IN (SELECT coach_divisions())` for
--      `division = ANY(ARRAY(SELECT coach_divisions()))`. The ANY(ARRAY(...))
--      form lets Postgres materialize the set once per row evaluation instead
--      of treating it as a correlated subquery, which is friendlier to the
--      planner and avoids subtle re-execution of the SECURITY DEFINER helper.
--   2. Add a WHEN clause to trg_guard_team_id_mutation so the trigger function
--      only fires when team_id actually changes (cheap guard at the trigger
--      layer vs. always entering the plpgsql function body).
--   3. Document the guard function's bypass + threat model via COMMENT ON
--      FUNCTION.

BEGIN;

-- ---------------------------------------------------------------------------
-- Change 1: rewrite policies that use `IN (SELECT coach_divisions())` to use
-- `= ANY(ARRAY(SELECT coach_divisions()))`. Same truth table, planner-friendly.
--
-- Affected:
--   a) tryout_registrations  SELECT policy  (defined in 20260423d)
--   b) coach_has_registration_access(uuid)  body   (defined in 20260423e) —
--      the docs+contracts policies now delegate to this helper, so rewriting
--      the helper body covers all four policies in one place.
--
-- The UPDATE policy on tryout_registrations ("Parents and staff can update
-- registrations (scoped)") does NOT use the division-pool fallback — coaches
-- may only update rows already drafted to their team via coach_has_team_access.
-- No rewrite needed there.
-- ---------------------------------------------------------------------------

-- 1a. tryout_registrations SELECT
DROP POLICY IF EXISTS "Parents and staff can view registrations (scoped)"
  ON irvine_allstars.tryout_registrations;

CREATE POLICY "Parents and staff can view registrations (scoped)"
  ON irvine_allstars.tryout_registrations FOR SELECT
  USING (
    parent_email = (SELECT email FROM irvine_allstars.profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
       WHERE id = auth.uid() AND role IN ('admin','evaluator')
    )
    OR (
      EXISTS (SELECT 1 FROM irvine_allstars.profiles
               WHERE id = auth.uid() AND role = 'coach')
      AND (
        irvine_allstars.coach_has_team_access(team_id)
        OR (team_id IS NULL AND division = ANY(ARRAY(SELECT irvine_allstars.coach_divisions())))
      )
    )
  );

-- 1b. coach_has_registration_access() body. CREATE OR REPLACE is safe —
-- signature and return type are identical. All four docs+contracts policies
-- that wrap this helper automatically pick up the rewritten body.
CREATE OR REPLACE FUNCTION irvine_allstars.coach_has_registration_access(p_registration_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM irvine_allstars.tryout_registrations r
     WHERE r.id = p_registration_id
       AND (
         r.parent_email = (SELECT email FROM irvine_allstars.profiles WHERE id = auth.uid())
         OR EXISTS (SELECT 1 FROM irvine_allstars.profiles
                     WHERE id = auth.uid() AND role IN ('admin','evaluator'))
         OR (
           EXISTS (SELECT 1 FROM irvine_allstars.profiles
                    WHERE id = auth.uid() AND role = 'coach')
           AND (
             irvine_allstars.coach_has_team_access(r.team_id)
             OR (r.team_id IS NULL AND r.division = ANY(ARRAY(SELECT irvine_allstars.coach_divisions())))
           )
         )
       )
  );
$$;

-- ---------------------------------------------------------------------------
-- Change 2: add WHEN clause so the trigger only fires when team_id actually
-- changes. The function already short-circuits internally, but declaring the
-- condition at the trigger layer avoids even entering the plpgsql block when
-- team_id is unchanged, shaving overhead off every non-team UPDATE.
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_guard_team_id_mutation
  ON irvine_allstars.tryout_registrations;

CREATE TRIGGER trg_guard_team_id_mutation
  BEFORE UPDATE OF team_id ON irvine_allstars.tryout_registrations
  FOR EACH ROW
  WHEN (OLD.team_id IS DISTINCT FROM NEW.team_id)
  EXECUTE FUNCTION irvine_allstars.guard_team_id_mutation();

COMMENT ON TRIGGER trg_guard_team_id_mutation ON irvine_allstars.tryout_registrations IS
  'Blocks non-admin authenticated users from changing team_id. Fires only when team_id actually changes (WHEN clause). Bypasses when auth.uid() IS NULL (direct DB / Management API) or auth.role()=service_role (server-side API routes that already gate to admin auth).';

-- ---------------------------------------------------------------------------
-- Change 3: documentation comment on guard_team_id_mutation explaining the
-- service_role bypass + threat model.
-- ---------------------------------------------------------------------------

COMMENT ON FUNCTION irvine_allstars.guard_team_id_mutation() IS
  $doc$Trigger function: blocks non-admin authenticated clients from mutating tryout_registrations.team_id.

Bypass logic (evaluated via JWT claims, which remain accurate inside SECURITY DEFINER because auth.uid() / auth.role() read from the request.jwt GUC rather than current_user):

  * auth.uid() IS NULL  -> no JWT at all. This covers the Supabase Management API SQL endpoint, direct psql sessions, and superuser maintenance scripts. These contexts already require privileged credentials out of band, so we trust them.
  * auth.role() = 'service_role'  -> server-side API route using the service-role key. Those routes live in the Next.js server runtime and gate on admin auth before mutating, so we trust them as a class.
  * Everything else (anon, authenticated) must prove the caller has role=admin in public.profiles, otherwise we raise 42501.

Threat model:
  * The service-role JWT is server-only. It is never shipped to the browser, never embedded in client bundles, and is distributed only via server env vars. A compromise of that key is a full-database compromise independent of this trigger.
  * A leaked anon / publishable key cannot spoof service_role because the JWT is signed by Supabase with the project's JWT secret — an attacker holding only the anon key cannot mint a token with role=service_role. They will hit the default branch and fail the admin check.
  * A compromised authenticated user session likewise carries role=authenticated in its JWT and must pass the profiles.role='admin' lookup, which is the same bar RLS uses elsewhere.

RLS WITH CHECK cannot compare OLD vs NEW, so this trigger is the only layer that prevents a coach (who has UPDATE rights on their own team's rows via the scoped UPDATE policy) from rewriting team_id to move a player onto a different team.$doc$;

COMMIT;
