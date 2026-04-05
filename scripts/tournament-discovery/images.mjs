/**
 * Images module — downloads tournament flyer images and uploads them to Supabase Storage.
 * Module 6 of the tournament discovery pipeline.
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './config.mjs';

const BUCKET = 'tournament-flyers';

/**
 * Slugify a tournament name for use as a filename.
 * Lowercase, replace non-alphanumeric with hyphens, trim hyphens, max 60 chars.
 */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Determine file extension from content-type header.
 */
function extFromContentType(contentType) {
  if (contentType && contentType.includes('png')) return 'png';
  if (contentType && contentType.includes('webp')) return 'webp';
  return 'jpg';
}

/**
 * Download flyer images from external URLs and upload to Supabase Storage.
 * Mutates each tournament in place, setting `flyerStoragePath` on success.
 *
 * @param {Array<Object>} tournaments - Array of tournament objects with optional `flyerImageUrl`.
 */
export async function downloadAndUploadImages(tournaments) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[images] Missing Supabase credentials — skipping image uploads.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    db: { schema: 'irvine_allstars' },
  });

  let downloaded = 0;
  let failed = 0;

  for (const tournament of tournaments) {
    if (!tournament.flyerImageUrl) continue;

    // Download the image
    let response;
    try {
      response = await fetch(tournament.flyerImageUrl, {
        signal: AbortSignal.timeout(30000),
      });
    } catch (err) {
      console.warn(`[images] fetch error for "${tournament.name}": ${err.message}`);
      failed++;
      continue;
    }

    if (!response.ok) {
      console.warn(`[images] fetch failed for "${tournament.name}": ${response.status} ${response.statusText}`);
      failed++;
      continue;
    }

    const contentType = response.headers.get('content-type') || '';
    const ext = extFromContentType(contentType);
    const buffer = Buffer.from(await response.arrayBuffer());

    const slug = slugify(tournament.name);
    const filename = `discovered/${slug}-${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType, upsert: false });

    if (error) {
      console.warn(`[images] upload error for "${tournament.name}": ${error.message}`);
      failed++;
      continue;
    }

    tournament.flyerStoragePath = filename;
    downloaded++;
  }

  console.log(`[images] ${downloaded} uploaded, ${failed} failed`);
}
