-- Extract the duplicated registration-access predicate (used by docs+contracts
-- SELECT and INSERT policies) into a single SECURITY DEFINER helper. Pure
-- refactor — same predicate, same behavior. The registrations SELECT policy is
-- left as-is since it acts on its own row (not via registration_id FK).

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
             OR (r.team_id IS NULL AND r.division IN (SELECT irvine_allstars.coach_divisions()))
           )
         )
       )
  );
$$;

REVOKE EXECUTE ON FUNCTION irvine_allstars.coach_has_registration_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION irvine_allstars.coach_has_registration_access(uuid) TO authenticated;

COMMENT ON FUNCTION irvine_allstars.coach_has_registration_access(uuid) IS
  'Returns true if current user can access the given registration (parent of own kid, admin/evaluator, or coach via team or undrafted-in-division pool). DRYs the predicate used by docs+contracts policies.';

-- Rewrite the 4 doc/contract policies to use the helper.
-- (Registrations SELECT policy stays as-is since it directly references its own row,
-- not via registration_id from another table.)

DROP POLICY IF EXISTS "Documents visible per registration scope"
  ON irvine_allstars.player_documents;

CREATE POLICY "Documents visible per registration scope"
  ON irvine_allstars.player_documents FOR SELECT
  USING ( irvine_allstars.coach_has_registration_access(registration_id) );

DROP POLICY IF EXISTS "Documents insertable per registration scope"
  ON irvine_allstars.player_documents;

CREATE POLICY "Documents insertable per registration scope"
  ON irvine_allstars.player_documents FOR INSERT
  WITH CHECK ( irvine_allstars.coach_has_registration_access(registration_id) );

DROP POLICY IF EXISTS "Contracts visible per registration scope"
  ON irvine_allstars.player_contracts;

CREATE POLICY "Contracts visible per registration scope"
  ON irvine_allstars.player_contracts FOR SELECT
  USING ( irvine_allstars.coach_has_registration_access(registration_id) );

DROP POLICY IF EXISTS "Contracts insertable per registration scope"
  ON irvine_allstars.player_contracts;

CREATE POLICY "Contracts insertable per registration scope"
  ON irvine_allstars.player_contracts FOR INSERT
  WITH CHECK ( irvine_allstars.coach_has_registration_access(registration_id) );
