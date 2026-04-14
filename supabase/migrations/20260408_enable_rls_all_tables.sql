-- Enable RLS and create policies for all irvine_allstars tables
-- Fixes Security Advisor: 10 RLS errors + 2 sensitive column warnings
-- Date: 2026-04-08

-- Helper: reusable admin check
-- EXISTS (SELECT 1 FROM irvine_allstars.profiles WHERE id = auth.uid() AND role = 'admin')

----------------------------------------------------------------------
-- 1. divisions (public read, admin write)
----------------------------------------------------------------------
ALTER TABLE irvine_allstars.divisions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON irvine_allstars.divisions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON irvine_allstars.divisions TO authenticated;

CREATE POLICY "Anyone can view divisions"
  ON irvine_allstars.divisions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage divisions"
  ON irvine_allstars.divisions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

----------------------------------------------------------------------
-- 2. announcements (authenticated read, admin write)
----------------------------------------------------------------------
ALTER TABLE irvine_allstars.announcements ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON irvine_allstars.announcements TO authenticated;
GRANT INSERT, UPDATE, DELETE ON irvine_allstars.announcements TO authenticated;

CREATE POLICY "Authenticated users can view announcements"
  ON irvine_allstars.announcements FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage announcements"
  ON irvine_allstars.announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

----------------------------------------------------------------------
-- 3. tryout_sessions (authenticated read, admin write)
----------------------------------------------------------------------
ALTER TABLE irvine_allstars.tryout_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON irvine_allstars.tryout_sessions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON irvine_allstars.tryout_sessions TO authenticated;

CREATE POLICY "Authenticated users can view tryout sessions"
  ON irvine_allstars.tryout_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage tryout sessions"
  ON irvine_allstars.tryout_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

----------------------------------------------------------------------
-- 4. evaluator_scores (evaluator insert/update, coach+admin read)
----------------------------------------------------------------------
ALTER TABLE irvine_allstars.evaluator_scores ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON irvine_allstars.evaluator_scores TO authenticated;
GRANT INSERT, UPDATE ON irvine_allstars.evaluator_scores TO authenticated;

CREATE POLICY "Evaluators can insert scores"
  ON irvine_allstars.evaluator_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role IN ('evaluator', 'admin')
    )
  );

CREATE POLICY "Evaluators can update scores"
  ON irvine_allstars.evaluator_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role IN ('evaluator', 'admin')
    )
  );

CREATE POLICY "Evaluators coaches and admins can view scores"
  ON irvine_allstars.evaluator_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role IN ('evaluator', 'coach', 'admin')
    )
  );

CREATE POLICY "Admins can delete scores"
  ON irvine_allstars.evaluator_scores FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

----------------------------------------------------------------------
-- 5. tryout_assignments (admin manage, authenticated read)
----------------------------------------------------------------------
ALTER TABLE irvine_allstars.tryout_assignments ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON irvine_allstars.tryout_assignments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON irvine_allstars.tryout_assignments TO authenticated;

CREATE POLICY "Authenticated users can view tryout assignments"
  ON irvine_allstars.tryout_assignments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage tryout assignments"
  ON irvine_allstars.tryout_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

----------------------------------------------------------------------
-- 6. assistant_coaches (coaches manage own, admin full access)
----------------------------------------------------------------------
ALTER TABLE irvine_allstars.assistant_coaches ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON irvine_allstars.assistant_coaches TO authenticated;

CREATE POLICY "Coaches can manage their own assistants"
  ON irvine_allstars.assistant_coaches FOR ALL
  USING (
    head_coach_id = auth.uid()
  );

CREATE POLICY "Admins can manage all assistant coaches"
  ON irvine_allstars.assistant_coaches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

----------------------------------------------------------------------
-- 7. tryout_registrations (anon insert, parent read own, staff read all)
----------------------------------------------------------------------
ALTER TABLE irvine_allstars.tryout_registrations ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON irvine_allstars.tryout_registrations TO authenticated;
GRANT INSERT ON irvine_allstars.tryout_registrations TO anon, authenticated;
GRANT UPDATE, DELETE ON irvine_allstars.tryout_registrations TO authenticated;

-- Public registration form (no auth required)
CREATE POLICY "Anyone can submit a registration"
  ON irvine_allstars.tryout_registrations FOR INSERT
  WITH CHECK (true);

-- Parents see only their own children (matched by email)
CREATE POLICY "Parents can view own registrations"
  ON irvine_allstars.tryout_registrations FOR SELECT
  USING (
    parent_email = (
      SELECT email FROM irvine_allstars.profiles
      WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'coach', 'evaluator')
    )
  );

-- Parents can update their own registrations
CREATE POLICY "Parents can update own registrations"
  ON irvine_allstars.tryout_registrations FOR UPDATE
  USING (
    parent_email = (
      SELECT email FROM irvine_allstars.profiles
      WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete registrations"
  ON irvine_allstars.tryout_registrations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

----------------------------------------------------------------------
-- 8. coach_applications (anon insert, admin read)
----------------------------------------------------------------------
ALTER TABLE irvine_allstars.coach_applications ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON irvine_allstars.coach_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON irvine_allstars.coach_applications TO authenticated;

-- Public application form (no auth required)
CREATE POLICY "Anyone can submit a coach application"
  ON irvine_allstars.coach_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view and manage applications"
  ON irvine_allstars.coach_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update applications"
  ON irvine_allstars.coach_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete applications"
  ON irvine_allstars.coach_applications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
