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
 * Filter tournament candidates by geography and assign matched divisions.
 *
 * - Geo match + divisions found -> included with divisionIds populated
 * - Geo match + no divisions   -> included with empty divisionIds (admin assigns)
 * - No geo match               -> excluded
 *
 * @param {Array} candidates - Parsed tournament candidates
 * @returns {Array} Filtered candidates with divisionIds field added
 */
export function filterTournaments(candidates) {
  const filtered = [];

  for (const tournament of candidates) {
    if (!matchesGeography(tournament)) continue;

    const divisionIds = matchDivisions(tournament);
    filtered.push({ ...tournament, divisionIds });
  }

  console.log(`[filter] ${filtered.length}/${candidates.length} tournaments passed geo filter`);

  return filtered;
}
