/**
 * Filter module for the tournament discovery pipeline.
 * Filters parsed candidates by SoCal geography and matches divisions.
 */

import { SOCAL_REGIONS, SOCAL_CITIES, DIVISION_MAP } from './config.mjs';

// Pre-compile word-boundary regexes for cities to avoid false positives
// (e.g. "vista" inside "vistas" or unrelated words)
const CITY_PATTERNS = SOCAL_CITIES.map(
  (city) => new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
);

/**
 * Check if a tournament mentions a SoCal region or city.
 * Combines location, name, description, and host into one search string.
 */
function matchesGeography(tournament) {
  const text = [
    tournament.location,
    tournament.name,
    tournament.description,
    tournament.host,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Check regions via simple substring match
  for (const region of SOCAL_REGIONS) {
    if (text.includes(region)) return true;
  }

  // Check cities via word-boundary regex
  for (const pattern of CITY_PATTERNS) {
    if (pattern.test(text)) return true;
  }

  return false;
}

/**
 * Match tournament text against DIVISION_MAP keywords.
 * Returns array of matched division IDs (deduplicated).
 */
function matchDivisions(tournament) {
  const text = [
    tournament.divisionsDisplay,
    tournament.name,
    tournament.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const ids = new Set();

  for (const [keyword, divisionIds] of Object.entries(DIVISION_MAP)) {
    // Use word-boundary regex for keywords to avoid partial matches
    const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (pattern.test(text)) {
      for (const id of divisionIds) {
        ids.add(id);
      }
    }
  }

  return Array.from(ids);
}

/**
 * Check if a tournament has enough quality data to be worth inserting.
 * Requires:
 *  1. Future date (start_date is today or later)
 *  2. A real location (not empty, not "TBD")
 *  3. At least one of: registration URL, divisions info, or flyer image
 */
function passesQualityCheck(tournament) {
  // Must have a future date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(tournament.startDate + 'T12:00:00');
  if (isNaN(startDate.getTime()) || startDate < today) {
    console.log(`[filter] SKIP quality: "${tournament.name}" — date in the past (${tournament.startDate})`);
    return false;
  }

  // Must have a real location
  const loc = (tournament.location || '').trim().toLowerCase();
  if (!loc || loc === 'tbd' || loc === 'location tbd') {
    console.log(`[filter] SKIP quality: "${tournament.name}" — no real location`);
    return false;
  }

  // Must have at least one useful detail beyond name + date + location
  const hasRegistration = !!tournament.registrationUrl;
  const hasDivisions = !!(tournament.divisionsDisplay || '').replace(/[^a-z0-9]/gi, '').trim();
  const hasFlyer = !!tournament.flyerImageUrl;
  const hasDescription = (tournament.description || '').length > 20;

  if (!hasRegistration && !hasDivisions && !hasFlyer && !hasDescription) {
    console.log(`[filter] SKIP quality: "${tournament.name}" — no registration, divisions, flyer, or description`);
    return false;
  }

  return true;
}

/**
 * Filter tournament candidates by geography, quality, and assign matched divisions.
 *
 * @param {Array} candidates - Parsed tournament candidates
 * @returns {Array} Filtered candidates with divisionIds field added
 */
export function filterTournaments(candidates) {
  const filtered = [];
  let geoSkipped = 0;
  let qualitySkipped = 0;

  for (const tournament of candidates) {
    if (!matchesGeography(tournament)) {
      geoSkipped++;
      continue;
    }

    if (!passesQualityCheck(tournament)) {
      qualitySkipped++;
      continue;
    }

    const divisionIds = matchDivisions(tournament);
    filtered.push({ ...tournament, divisionIds });
  }

  console.log(`[filter] ${filtered.length}/${candidates.length} passed (${geoSkipped} geo skipped, ${qualitySkipped} quality skipped)`);

  return filtered;
}
