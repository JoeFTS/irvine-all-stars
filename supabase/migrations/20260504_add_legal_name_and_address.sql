-- Add full legal name + address fields to tryout_registrations to support
-- 2026 PONY All-Star binder/affidavit compliance.
--
-- The PONY affidavit requires the player's complete legal name as it appears
-- on the birth certificate (including middle name and suffix like Jr/III) and
-- a full mailing address. Previously we only captured first/last name and no
-- address, which made the binder name-matching rule impossible to enforce
-- and forced coaches to chase parents for addresses by hand.

ALTER TABLE irvine_allstars.tryout_registrations
  ADD COLUMN IF NOT EXISTS player_middle_name text,
  ADD COLUMN IF NOT EXISTS player_suffix       text,
  ADD COLUMN IF NOT EXISTS street_address      text,
  ADD COLUMN IF NOT EXISTS city                text,
  ADD COLUMN IF NOT EXISTS state               text,
  ADD COLUMN IF NOT EXISTS zip                 text;
