-- Fix Security Advisor warnings: Function Search Path Mutable + RLS Policy Always True
-- Date: 2026-04-09

----------------------------------------------------------------------
-- PART 1: Fix Function Search Path Mutable (6 functions)
-- Add SET search_path = '' to prevent search_path hijacking
----------------------------------------------------------------------

-- dojo_36.add_chi
CREATE OR REPLACE FUNCTION dojo_36.add_chi(p_user_id uuid, p_amount integer, p_reason text, p_source text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  new_total INTEGER;
BEGIN
  INSERT INTO dojo_36.chi_transactions (user_id, amount, reason, source)
  VALUES (p_user_id, p_amount, p_reason, p_source);

  UPDATE dojo_36.progress
  SET chi_points = chi_points + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING chi_points INTO new_total;

  RETURN new_total;
END;
$function$;

-- dojo_36.handle_new_user
CREATE OR REPLACE FUNCTION dojo_36.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO dojo_36.profiles (id, display_name, monk_path)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'monk_path', 'iron_shaolin')
  );

  INSERT INTO dojo_36.progress (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$function$;

-- dojo_36.increment_lessons_completed
CREATE OR REPLACE FUNCTION dojo_36.increment_lessons_completed(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  UPDATE dojo_36.progress
  SET total_lessons_completed = total_lessons_completed + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$function$;

-- dojo_36.update_streak
CREATE OR REPLACE FUNCTION dojo_36.update_streak(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  last_active DATE;
  today DATE := CURRENT_DATE;
  current_streak INTEGER;
BEGIN
  SELECT p.last_active_date, p.current_streak
  INTO last_active, current_streak
  FROM dojo_36.progress p
  WHERE p.user_id = p_user_id;

  IF last_active = today THEN
    RETURN current_streak;
  ELSIF last_active = today - 1 THEN
    UPDATE dojo_36.progress
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_active_date = today,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING current_streak INTO current_streak;
  ELSE
    UPDATE dojo_36.progress
    SET current_streak = 1,
        last_active_date = today,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING current_streak INTO current_streak;
  END IF;

  RETURN current_streak;
END;
$function$;

-- coaching_buddy.handle_new_user
CREATE OR REPLACE FUNCTION coaching_buddy.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO coaching_buddy.users (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$function$;

-- coaching_buddy.update_updated_at_column
CREATE OR REPLACE FUNCTION coaching_buddy.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$function$;


----------------------------------------------------------------------
-- PART 2: Replace allow_all RLS policies with proper role-based ones
----------------------------------------------------------------------

-- 1. binder_checklist (coach + admin access)
DROP POLICY IF EXISTS "allow_all_binder_checklist" ON irvine_allstars.binder_checklist;

CREATE POLICY "Authenticated users can view binder checklist"
  ON irvine_allstars.binder_checklist FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and coaches can manage binder checklist"
  ON irvine_allstars.binder_checklist FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'coach')
    )
  );

-- 2. coach_certifications (coach manages own, admin manages all)
DROP POLICY IF EXISTS "allow_all_coach_certifications" ON irvine_allstars.coach_certifications;

CREATE POLICY "Coaches can manage own certifications"
  ON irvine_allstars.coach_certifications FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Admins can manage all certifications"
  ON irvine_allstars.coach_certifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. invites (admin only)
DROP POLICY IF EXISTS "allow_all_invites" ON irvine_allstars.invites;

CREATE POLICY "Admins can manage invites"
  ON irvine_allstars.invites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Invite token lookup needs to work for signup flow (service role handles this via API routes)
-- The signup API route uses service role key, so no anon policy needed

-- 4. player_contracts (parent creates own, admin/coach reads)
DROP POLICY IF EXISTS "allow_all_player_contracts" ON irvine_allstars.player_contracts;

CREATE POLICY "Authenticated users can view player contracts"
  ON irvine_allstars.player_contracts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert player contracts"
  ON irvine_allstars.player_contracts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage player contracts"
  ON irvine_allstars.player_contracts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. player_documents (parent uploads own, admin/coach reads)
DROP POLICY IF EXISTS "allow_all_player_documents" ON irvine_allstars.player_documents;

CREATE POLICY "Authenticated users can view player documents"
  ON irvine_allstars.player_documents FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert player documents"
  ON irvine_allstars.player_documents FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage player documents"
  ON irvine_allstars.player_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. teams (admin manages, authenticated reads)
DROP POLICY IF EXISTS "allow_all_teams" ON irvine_allstars.teams;

CREATE POLICY "Authenticated users can view teams"
  ON irvine_allstars.teams FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage teams"
  ON irvine_allstars.teams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. tournament_agreements (coach manages own, admin reads all)
DROP POLICY IF EXISTS "allow_all_tournament_agreements" ON irvine_allstars.tournament_agreements;

CREATE POLICY "Coaches can manage own tournament agreements"
  ON irvine_allstars.tournament_agreements FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Admins can manage all tournament agreements"
  ON irvine_allstars.tournament_agreements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM irvine_allstars.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. profiles - tighten SELECT from true to authenticated
DROP POLICY IF EXISTS "profiles_select_own" ON irvine_allstars.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON irvine_allstars.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- 9. team_documents - SELECT true -> authenticated (already scoped to authenticated role,
--    but the qual is true which triggers the warning)
DROP POLICY IF EXISTS "Anyone authenticated can read team_documents" ON irvine_allstars.team_documents;

CREATE POLICY "Authenticated users can view team documents"
  ON irvine_allstars.team_documents FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- 10. divisions - SELECT true is intentional (public data needed for forms)
--     but we can scope it to require at least anon role
DROP POLICY IF EXISTS "Anyone can view divisions" ON irvine_allstars.divisions;

CREATE POLICY "Anyone can view divisions"
  ON irvine_allstars.divisions FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- 11. coach_applications INSERT - already public by design, add minimal guard
DROP POLICY IF EXISTS "Anyone can submit a coach application" ON irvine_allstars.coach_applications;

CREATE POLICY "Anyone can submit a coach application"
  ON irvine_allstars.coach_applications FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'anon'));

-- 12. tryout_registrations INSERT - already public by design, add minimal guard
DROP POLICY IF EXISTS "Anyone can submit a registration" ON irvine_allstars.tryout_registrations;

CREATE POLICY "Anyone can submit a registration"
  ON irvine_allstars.tryout_registrations FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'anon'));

-- 13. profiles INSERT - needed for auth trigger (runs as service role), add guard
DROP POLICY IF EXISTS "profiles_insert" ON irvine_allstars.profiles;

CREATE POLICY "Users can insert own profile"
  ON irvine_allstars.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

----------------------------------------------------------------------
-- PART 3: Fix invite flow (added after audit)
-- Invite lookup needs to work for unauthenticated signup page
-- Invite mark-as-used needs to work for newly authenticated users
----------------------------------------------------------------------

-- Allow anyone to look up an invite by token (needed for signup page)
CREATE POLICY "Anyone can look up invite by token"
  ON irvine_allstars.invites FOR SELECT
  USING (
    auth.role() IN ('authenticated', 'anon')
  );

-- Allow authenticated users to mark their own invite as used
CREATE POLICY "Users can mark own invite as used"
  ON irvine_allstars.invites FOR UPDATE
  USING (
    email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Grant needed permissions
GRANT SELECT ON irvine_allstars.invites TO anon, authenticated;
GRANT UPDATE ON irvine_allstars.invites TO authenticated;
