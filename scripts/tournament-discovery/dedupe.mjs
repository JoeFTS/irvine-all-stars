/**
 * Deduplication module for the tournament discovery pipeline.
 * Module 5: Compares candidates against existing tournaments in the database.
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './config.mjs';

// ---------------------------------------------------------------------------
// Stop words removed before comparing tournament names
// ---------------------------------------------------------------------------
const STOP_WORDS = new Set([
  'tournament', 'classic', 'championship', 'invitational',
  'the', 'a', 'an', 'of', 'at', 'in', 'for', 'annual',
  '1st', '2nd', '3rd', '4th', '5th',
  'first', 'second', 'third', 'fourth', 'fifth',
]);

// ---------------------------------------------------------------------------
// nameSimilarity — Jaccard similarity on normalized tokens
// ---------------------------------------------------------------------------
function tokenize(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

export function nameSimilarity(a, b) {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));

  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = new Set([...tokensA].filter((t) => tokensB.has(t)));
  const union = new Set([...tokensA, ...tokensB]);

  return intersection.size / union.size;
}

// ---------------------------------------------------------------------------
// datesWithinRange — true if two date strings are within ±days of each other
// ---------------------------------------------------------------------------
export function datesWithinRange(dateStr1, dateStr2, days = 3) {
  if (!dateStr1 || !dateStr2) return false;

  const d1 = new Date(`${dateStr1}T12:00:00`);
  const d2 = new Date(`${dateStr2}T12:00:00`);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= days;
}

// ---------------------------------------------------------------------------
// isDuplicate — true if name similarity > 0.8 AND dates within ±3 days
// ---------------------------------------------------------------------------
export function isDuplicate(candidate, existing) {
  const sim = nameSimilarity(candidate.name, existing.name);
  if (sim <= 0.8) return false;

  // Compare start dates (candidate uses camelCase, DB uses snake_case)
  const candidateStart = candidate.startDate || candidate.start_date;
  const existingStart = existing.startDate || existing.start_date;

  return datesWithinRange(candidateStart, existingStart, 3);
}

// ---------------------------------------------------------------------------
// deduplicateTournaments — main exported function
// ---------------------------------------------------------------------------
export async function deduplicateTournaments(candidates) {
  if (!candidates || candidates.length === 0) {
    console.log('[dedupe] No candidates to deduplicate.');
    return [];
  }

  let existingTournaments = [];

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('[dedupe] Missing Supabase credentials — skipping dedupe, returning all candidates.');
      return candidates;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      db: { schema: 'irvine_allstars' },
    });

    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, start_date, end_date');

    if (error) {
      console.warn(`[dedupe] DB query error: ${error.message} — returning all candidates (fail open).`);
      return candidates;
    }

    existingTournaments = data || [];
    console.log(`[dedupe] Loaded ${existingTournaments.length} existing tournaments from DB.`);
  } catch (err) {
    console.warn(`[dedupe] Unexpected error querying DB: ${err.message} — returning all candidates (fail open).`);
    return candidates;
  }

  const kept = [];
  let skippedDb = 0;
  let skippedBatch = 0;

  for (const candidate of candidates) {
    // Check against existing DB tournaments
    const dbDup = existingTournaments.find((existing) => isDuplicate(candidate, existing));
    if (dbDup) {
      console.log(`[dedupe] SKIP (DB duplicate): "${candidate.name}" matches "${dbDup.name}" (id=${dbDup.id})`);
      skippedDb++;
      continue;
    }

    // Check against other candidates already kept in this batch
    const batchDup = kept.find((other) => isDuplicate(candidate, other));
    if (batchDup) {
      console.log(`[dedupe] SKIP (batch duplicate): "${candidate.name}" matches "${batchDup.name}"`);
      skippedBatch++;
      continue;
    }

    kept.push(candidate);
  }

  console.log(`[dedupe] Summary: ${candidates.length} candidates → ${kept.length} new, ${skippedDb} DB dupes, ${skippedBatch} batch dupes.`);
  return kept;
}
