-- player_documents: replace permissive auth-only SELECT with team-scoped scope.
DROP POLICY IF EXISTS "Authenticated users can view player documents"
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
               OR (r.team_id IS NULL AND r.division = irvine_allstars.coach_division())
             )
           )
         )
    )
  );

-- player_contracts: same pattern.
DROP POLICY IF EXISTS "Authenticated users can view player contracts"
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
