-- Adds optional team_id to registrations. Drafted = team_id IS NOT NULL.
-- Undrafted = team_id IS NULL (still visible to all coaches in division).
ALTER TABLE irvine_allstars.tryout_registrations
  ADD COLUMN team_id uuid
  REFERENCES irvine_allstars.teams(id) ON DELETE SET NULL;

CREATE INDEX idx_tryout_registrations_team_id
  ON irvine_allstars.tryout_registrations(team_id);

CREATE INDEX idx_tryout_registrations_division_status
  ON irvine_allstars.tryout_registrations(division, status)
  WHERE team_id IS NULL;

COMMENT ON COLUMN irvine_allstars.tryout_registrations.team_id IS
  'Team this player was drafted onto. NULL = undrafted (visible to all coaches in division).';
