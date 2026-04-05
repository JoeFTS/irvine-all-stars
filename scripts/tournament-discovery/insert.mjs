/**
 * Insert Module — Module 7 of the tournament discovery pipeline.
 *
 * Inserts validated tournament candidates into Supabase and creates
 * linked announcements (mirrors admin auto-announce logic).
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './config.mjs';

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Insert tournaments into Supabase and create linked announcements.
 * @param {Array} tournaments — validated tournament candidates
 * @returns {Array} — array of successfully inserted tournament records
 */
export async function insertTournaments(tournaments) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    db: { schema: 'irvine_allstars' },
  });

  const inserted = [];

  for (const t of tournaments) {
    // ----- Insert tournament -----
    const { data: record, error: tErr } = await supabase
      .from('tournaments')
      .insert({
        name: t.name,
        start_date: t.startDate,
        end_date: t.endDate,
        location: t.location || 'TBD',
        divisions_display: t.divisionsDisplay || '',
        division_ids: t.divisionIds.length > 0 ? t.divisionIds : [],
        registration_url: t.registrationUrl || null,
        host: t.host || '',
        description: t.description || '',
        flyer_url: t.flyerStoragePath || null,
        status: 'draft',
        auto_announce: true,
      })
      .select()
      .single();

    if (tErr) {
      console.error(`[insert] Failed to insert tournament "${t.name}":`, tErr.message);
      continue;
    }

    console.log(`[insert] Inserted draft tournament: ${record.name} (id=${record.id})`);

    // NOTE: Do NOT create announcements here. The announcements table has no
    // draft/published status, so anything inserted goes live immediately.
    // Instead, the admin publishes the tournament from /admin/tournaments,
    // which triggers the existing auto-announce logic to create the announcement.

    inserted.push(record);
  }

  console.log(`[insert] Done — ${inserted.length}/${tournaments.length} tournaments inserted`);
  return inserted;
}
