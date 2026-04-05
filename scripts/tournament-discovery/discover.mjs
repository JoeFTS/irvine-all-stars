#!/usr/bin/env node

import { searchAndScrape } from './search.mjs';
import { parseTournaments } from './parse.mjs';
import { filterTournaments } from './filter.mjs';
import { deduplicateTournaments } from './dedupe.mjs';
import { downloadAndUploadImages } from './images.mjs';
import { insertTournaments } from './insert.mjs';
import { notifyAdmin } from './notify.mjs';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './config.mjs';

function logSummary(pagesCount, candidatesCount, filteredCount, newCount, insertedCount, startTime) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`
=== Summary ===
  Pages scraped:      ${pagesCount}
  Candidates parsed:  ${candidatesCount}
  Passed filters:     ${filteredCount}
  New (not dupes):    ${newCount}
  Inserted as draft:  ${insertedCount}
  Elapsed:            ${elapsed}s
=== Done ===`);
}

async function main() {
  const startTime = Date.now();

  console.log(`=== Tournament Discovery Run: ${new Date().toISOString()} ===`);

  // Validate required env vars
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  let pagesCount = 0;
  let candidatesCount = 0;
  let filteredCount = 0;
  let newCount = 0;
  let insertedCount = 0;

  try {
    // Step 1: Search & Scrape
    console.log('\n--- Step 1: Search & Scrape ---');
    const pages = await searchAndScrape();
    pagesCount = pages.length;
    console.log(`  Found ${pagesCount} pages`);

    // Step 2: Parse
    console.log('\n--- Step 2: Parse ---');
    const candidates = parseTournaments(pages);
    candidatesCount = candidates.length;
    console.log(`  Parsed ${candidatesCount} candidates`);

    // Step 3: Filter
    console.log('\n--- Step 3: Filter ---');
    const filtered = filterTournaments(candidates);
    filteredCount = filtered.length;
    console.log(`  ${filteredCount} passed filters`);

    // Step 4: Deduplicate
    console.log('\n--- Step 4: Deduplicate ---');
    const newTournaments = await deduplicateTournaments(filtered);
    newCount = newTournaments.length;
    console.log(`  ${newCount} new tournaments (not duplicates)`);

    if (newCount === 0) {
      console.log('\nNo new tournaments found. Exiting early.');
      logSummary(pagesCount, candidatesCount, filteredCount, newCount, insertedCount, startTime);
      return;
    }

    // Step 5: Download Images
    console.log('\n--- Step 5: Download Images ---');
    await downloadAndUploadImages(newTournaments);
    console.log('  Image processing complete');

    // Step 6: Insert Tournaments
    console.log('\n--- Step 6: Insert Tournaments ---');
    const inserted = await insertTournaments(newTournaments);
    insertedCount = inserted.length;
    console.log(`  Inserted ${insertedCount} tournaments as draft`);

    // Step 7: Notify Admin
    console.log('\n--- Step 7: Notify Admin ---');
    await notifyAdmin(inserted);
    console.log('  Admin notified');

    logSummary(pagesCount, candidatesCount, filteredCount, newCount, insertedCount, startTime);
  } catch (err) {
    console.error('\nFATAL ERROR:', err.stack || err);
    logSummary(pagesCount, candidatesCount, filteredCount, newCount, insertedCount, startTime);
    process.exit(1);
  }
}

main();
