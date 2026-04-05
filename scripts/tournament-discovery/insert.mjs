/**
 * Insert Module — Module 7 of the tournament discovery pipeline.
 *
 * Inserts validated tournament candidates into Supabase and creates
 * linked announcements (mirrors admin auto-announce logic).
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './config.mjs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a date range for display.
 * - Same day:    "June 6, 2026"
 * - Same month:  "June 6-7, 2026"
 * - Diff months: "June 6 - July 8, 2026"
 */
export function formatDateRange(start, end) {
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');

  const opts = { month: 'long' };

  if (s.getTime() === e.getTime()) {
    // Same day
    return `${s.toLocaleDateString('en-US', opts)} ${s.getDate()}, ${s.getFullYear()}`;
  }

  if (s.getMonth() === e.getMonth()) {
    // Same month, different days
    return `${s.toLocaleDateString('en-US', opts)} ${s.getDate()}-${e.getDate()}, ${s.getFullYear()}`;
  }

  // Different months
  const sStr = s.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const eStr = e.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `${sStr} - ${eStr}, ${s.getFullYear()}`;
}

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
        location: t.location,
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

    console.log(`[insert] Inserted tournament: ${record.name} (id=${record.id})`);

    // ----- Create linked announcement -----
    const dateRange = formatDateRange(t.startDate, t.endDate);

    const parts = [];
    if (t.location) parts.push(`Location: ${t.location}`);
    parts.push(`Dates: ${dateRange}`);
    if (t.host) parts.push(`Host: ${t.host}`);
    if (t.divisionsDisplay) parts.push(`Divisions: ${t.divisionsDisplay}`);
    if (t.registrationUrl) parts.push(`Register: ${t.registrationUrl}`);
    if (t.description) parts.push(`\n${t.description}`);

    const title = `Tournament: ${t.name} — ${dateRange}`;
    const body = parts.join('\n');

    // Check if announcement already exists (mirrors admin panel logic)
    const { data: existingAnn } = await supabase
      .from('announcements')
      .select('id')
      .like('title', `Tournament:%${t.name}%`);

    if (existingAnn && existingAnn.length > 0) {
      console.log(`[insert] Announcement already exists for "${t.name}" — skipping.`);
      inserted.push(record);
      continue;
    }

    const { error: aErr } = await supabase
      .from('announcements')
      .insert({ title, body, division: null });

    if (aErr) {
      console.error(`[insert] Failed to create announcement for "${t.name}":`, aErr.message);
    } else {
      console.log(`[insert] Created announcement: ${title}`);
    }

    inserted.push(record);
  }

  console.log(`[insert] Done — ${inserted.length}/${tournaments.length} tournaments inserted`);
  return inserted;
}
