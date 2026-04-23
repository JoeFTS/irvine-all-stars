-- New multi-value helper: returns ALL divisions a coach has via team_coaches.
-- Replaces single-valued coach_division() in RLS policies.
CREATE OR REPLACE FUNCTION irvine_allstars.coach_divisions()
RETURNS setof text LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT t.division
    FROM irvine_allstars.team_coaches tc
    JOIN irvine_allstars.teams t ON t.id = tc.team_id
   WHERE tc.coach_id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION irvine_allstars.coach_divisions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION irvine_allstars.coach_divisions() TO authenticated;

-- Rewrite RLS policies that reference coach_division() to use IN (SELECT coach_divisions())

-- 1. tryout_registrations SELECT
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
        OR (team_id IS NULL AND division IN (SELECT irvine_allstars.coach_divisions()))
      )
    )
  );

-- 2. player_documents SELECT
DROP POLICY IF EXISTS "Documents visible per registration scope"
  ON irvine_allstars.player_documents;

CREATE POLICY "Documents visible per registration scope"
  ON irvine_allstars.player_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.tryout_registrations r
       WHERE r.id = player_documents.registration_id
         AND (
           r.parent_email = (SELECT email FROM irvine_allstars.profiles WHERE id = auth.uid())
           OR EXISTS (SELECT 1 FROM irvine_allstars.profiles
                       WHERE id = auth.uid() AND role IN ('admin','evaluator'))
           OR (
             EXISTS (SELECT 1 FROM irvine_allstars.profiles
                      WHERE id = auth.uid() AND role = 'coach')
             AND (
               irvine_allstars.coach_has_team_access(r.team_id)
               OR (r.team_id IS NULL AND r.division IN (SELECT irvine_allstars.coach_divisions()))
             )
           )
         )
    )
  );

-- 3. player_contracts SELECT
DROP POLICY IF EXISTS "Contracts visible per registration scope"
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
               OR (r.team_id IS NULL AND r.division IN (SELECT irvine_allstars.coach_divisions()))
             )
           )
         )
    )
  );

-- Same multi-value update for INSERT policies on docs+contracts (Task 16)
DROP POLICY IF EXISTS "Documents insertable per registration scope"
  ON irvine_allstars.player_documents;

CREATE POLICY "Documents insertable per registration scope"
  ON irvine_allstars.player_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM irvine_allstars.tryout_registrations r
       WHERE r.id = player_documents.registration_id
         AND (
           r.parent_email = (SELECT email FROM irvine_allstars.profiles WHERE id = auth.uid())
           OR EXISTS (SELECT 1 FROM irvine_allstars.profiles
                       WHERE id = auth.uid() AND role IN ('admin','evaluator'))
           OR (
             EXISTS (SELECT 1 FROM irvine_allstars.profiles
                      WHERE id = auth.uid() AND role = 'coach')
             AND (
               irvine_allstars.coach_has_team_access(r.team_id)
               OR (r.team_id IS NULL AND r.division IN (SELECT irvine_allstars.coach_divisions()))
             )
           )
         )
    )
  );

DROP POLICY IF EXISTS "Contracts insertable per registration scope"
  ON irvine_allstars.player_contracts;

CREATE POLICY "Contracts insertable per registration scope"
  ON irvine_allstars.player_contracts FOR INSERT
  WITH CHECK (
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
               OR (r.team_id IS NULL AND r.division IN (SELECT irvine_allstars.coach_divisions()))
             )
           )
         )
    )
  );

-- Drop the old single-valued coach_division() since nothing uses it now.
DROP FUNCTION IF EXISTS irvine_allstars.coach_division();

COMMENT ON FUNCTION irvine_allstars.coach_divisions() IS
  'Returns all divisions the current coach has via team_coaches. Used by RLS pool clauses.';
