-- Drop old broad coach policy, replace with team-scoped one.
DROP POLICY IF EXISTS "Parents can view own registrations"
  ON irvine_allstars.tryout_registrations;

CREATE POLICY "Parents and staff can view registrations (scoped)"
  ON irvine_allstars.tryout_registrations FOR SELECT
  USING (
    -- Parent sees own kids (matched by email)
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

-- Coach UPDATE same scope; admin update unchanged.
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
