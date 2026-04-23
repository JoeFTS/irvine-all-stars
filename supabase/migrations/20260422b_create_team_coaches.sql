CREATE TABLE irvine_allstars.team_coaches (
  team_id  uuid NOT NULL REFERENCES irvine_allstars.teams(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES irvine_allstars.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'head' CHECK (role IN ('head','assistant')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, coach_id)
);

CREATE INDEX idx_team_coaches_coach ON irvine_allstars.team_coaches(coach_id);

ALTER TABLE irvine_allstars.team_coaches ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON irvine_allstars.team_coaches TO authenticated;
GRANT INSERT, UPDATE, DELETE ON irvine_allstars.team_coaches TO authenticated;

CREATE POLICY "Coaches can see their own assignments"
  ON irvine_allstars.team_coaches FOR SELECT
  USING (
    coach_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
       WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage team_coaches"
  ON irvine_allstars.team_coaches FOR ALL
  USING (
    EXISTS (SELECT 1 FROM irvine_allstars.profiles
             WHERE id = auth.uid() AND role = 'admin')
  );

-- Backfill from existing teams.coach_id
INSERT INTO irvine_allstars.team_coaches (team_id, coach_id, role)
SELECT id, coach_id, 'head'
  FROM irvine_allstars.teams
 WHERE coach_id IS NOT NULL
ON CONFLICT DO NOTHING;
