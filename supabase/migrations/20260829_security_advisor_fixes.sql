-- Security Advisor fixes (2026-08-29)
-- 1) Move RLS helper functions out of the PostgREST-exposed schema so they are
--    not callable via /rest/v1/rpc (lint 0029). Policies reference them by OID
--    and keep working; `authenticated` keeps EXECUTE so RLS evaluation succeeds.
-- 2) Drop the broad SELECT policy on the public tournament-flyers bucket
--    (lint 0025). Public object URLs (getPublicUrl) do not need a policy.

CREATE SCHEMA IF NOT EXISTS irvine_allstars_private;
REVOKE ALL ON SCHEMA irvine_allstars_private FROM PUBLIC;
GRANT USAGE ON SCHEMA irvine_allstars_private TO authenticated, service_role;

ALTER FUNCTION irvine_allstars.coach_has_team_access(uuid) SET SCHEMA irvine_allstars_private;
ALTER FUNCTION irvine_allstars.coach_divisions() SET SCHEMA irvine_allstars_private;
ALTER FUNCTION irvine_allstars.coach_has_registration_access(uuid) SET SCHEMA irvine_allstars_private;

-- Body is parsed at call time, so re-point the nested calls at the new schema.
CREATE OR REPLACE FUNCTION irvine_allstars_private.coach_has_registration_access(p_registration_id uuid)
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
             irvine_allstars_private.coach_has_team_access(r.team_id)
             OR (r.team_id IS NULL AND r.division IN (SELECT irvine_allstars_private.coach_divisions()))
           )
         )
       )
  );
$$;

DROP POLICY IF EXISTS "Public can view flyers" ON storage.objects;
