-- Create tournaments table in irvine_allstars schema
CREATE TABLE IF NOT EXISTS irvine_allstars.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  location text NOT NULL,
  divisions_display text NOT NULL DEFAULT '',
  division_ids text[] NOT NULL DEFAULT '{}',
  registration_url text,
  registration_deadline date,
  host text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  flyer_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  auto_announce boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for filtering by status and date
CREATE INDEX idx_tournaments_status_date ON irvine_allstars.tournaments (status, start_date);

-- Enable RLS
ALTER TABLE irvine_allstars.tournaments ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read published tournaments
CREATE POLICY "Published tournaments are viewable by all"
  ON irvine_allstars.tournaments FOR SELECT
  USING (status = 'published');

-- Policy: admin can do everything
CREATE POLICY "Admins can manage tournaments"
  ON irvine_allstars.tournaments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
