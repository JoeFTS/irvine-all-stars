-- Add volunteer acknowledgment tracking to tryout registrations.
--
-- Parents must acknowledge the volunteer requirement before they can
-- accept their roster spot or confirm tryout attendance. The acknowledgment
-- is per-parent (keyed on parent_email): if any one of a parent's current
-- registrations has volunteer_acknowledged = true, the parent is considered
-- acknowledged for all their kids this season.

ALTER TABLE irvine_allstars.tryout_registrations
  ADD COLUMN IF NOT EXISTS volunteer_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS volunteer_acknowledged_at TIMESTAMPTZ;

COMMENT ON COLUMN irvine_allstars.tryout_registrations.volunteer_acknowledged
  IS 'TRUE once the parent has acknowledged the volunteer requirement (MDT / PONY events).';
COMMENT ON COLUMN irvine_allstars.tryout_registrations.volunteer_acknowledged_at
  IS 'Timestamp when the parent clicked I Acknowledge.';
