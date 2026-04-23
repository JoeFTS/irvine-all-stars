ALTER TABLE irvine_allstars.invites
  ADD COLUMN team_id uuid
  REFERENCES irvine_allstars.teams(id) ON DELETE SET NULL;

COMMENT ON COLUMN irvine_allstars.invites.team_id IS
  'Optional team to assign this coach to on signup. Inserts a team_coaches row in /api/complete-signup. Parents ignore.';
