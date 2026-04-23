-- player_documents: scope INSERT to authorized roles only.
DROP POLICY IF EXISTS "Authenticated users can insert player documents"
  ON irvine_allstars.player_documents;

CREATE POLICY "Documents insertable per registration scope"
  ON irvine_allstars.player_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM irvine_allstars.tryout_registrations r
       WHERE r.id = player_documents.registration_id
         AND (
           -- Parent uploading for own kid
           r.parent_email = (SELECT email FROM irvine_allstars.profiles WHERE id = auth.uid())
           -- Admin / evaluator
           OR EXISTS (SELECT 1 FROM irvine_allstars.profiles
                       WHERE id = auth.uid() AND role IN ('admin','evaluator'))
           -- Coach with team access OR (undrafted in their division)
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
DROP POLICY IF EXISTS "Authenticated users can insert player contracts"
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
               OR (r.team_id IS NULL AND r.division = irvine_allstars.coach_division())
             )
           )
         )
    )
  );
