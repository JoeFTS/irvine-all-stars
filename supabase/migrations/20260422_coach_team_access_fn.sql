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
