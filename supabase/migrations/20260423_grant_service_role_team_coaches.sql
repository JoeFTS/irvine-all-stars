-- Captures grant applied directly to prod during Task 12 seed work.
-- New tables in irvine_allstars don't inherit service_role grants automatically
-- (no ALTER DEFAULT PRIVILEGES is in place), so team_coaches needed an explicit grant.
GRANT SELECT, INSERT, UPDATE, DELETE ON irvine_allstars.team_coaches TO service_role;
