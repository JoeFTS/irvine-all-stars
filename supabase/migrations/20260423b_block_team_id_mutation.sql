-- Trigger: only admins (or service_role / direct DB connections bypassing RLS) may change
-- team_id on a registration. RLS WITH CHECK can't compare OLD vs NEW, so this trigger fills that gap.
--
-- Bypass logic notes:
-- - The function is SECURITY DEFINER so it can read profiles. Inside SECURITY DEFINER, current_user
--   becomes the function owner (postgres), so current_user/session_user are NOT reliable
--   discriminators. Instead we rely on auth.role() / auth.uid() which read from the JWT claims
--   GUC and remain accurate inside DEFINER.
-- - auth.uid() IS NULL → no JWT (Management API SQL endpoint, direct psql, superuser scripts).
-- - auth.role() = 'service_role' → server-side API route using the service-role key. Those routes
--   already gate to admin auth before mutating, so we trust them.
-- - Anything else (anon, authenticated) must pass the admin profile lookup.
CREATE OR REPLACE FUNCTION irvine_allstars.guard_team_id_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_admin boolean;
  v_uid uuid := auth.uid();
  v_role text := auth.role();
BEGIN
  -- No JWT (direct DB / Management API) or service_role → bypass.
  IF v_uid IS NULL OR v_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.team_id IS DISTINCT FROM OLD.team_id THEN
    SELECT EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
       WHERE id = v_uid AND role = 'admin'
    ) INTO is_admin;

    IF NOT is_admin THEN
      RAISE EXCEPTION 'Only admins may change team_id on tryout_registrations'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION irvine_allstars.guard_team_id_mutation() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_guard_team_id_mutation
  ON irvine_allstars.tryout_registrations;

CREATE TRIGGER trg_guard_team_id_mutation
  BEFORE UPDATE OF team_id ON irvine_allstars.tryout_registrations
  FOR EACH ROW
  EXECUTE FUNCTION irvine_allstars.guard_team_id_mutation();

COMMENT ON TRIGGER trg_guard_team_id_mutation ON irvine_allstars.tryout_registrations IS
  'Blocks non-admin authenticated users from changing team_id. Bypasses when auth.uid() IS NULL (direct DB / Management API) or auth.role()=service_role (server-side API routes that already gate to admin auth).';
