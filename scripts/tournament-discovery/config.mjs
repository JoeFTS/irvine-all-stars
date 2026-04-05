/**
 * Configuration for the tournament discovery cron job.
 * First module of the 10-module tournament discovery pipeline.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Load .env file if present (no dotenv dependency needed)
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dirname, '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // No .env file — rely on process.env
}

// ---------------------------------------------------------------------------
// Environment variables
// ---------------------------------------------------------------------------
export const FIRECRAWL_URL = process.env.FIRECRAWL_URL || 'http://localhost:3002';
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const RESEND_API_KEY = process.env.RESEND_API_KEY;
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
export const SITE_URL = process.env.SITE_URL || 'https://irvineallstars.com';

// ---------------------------------------------------------------------------
// Google search queries for tournament discovery
// ---------------------------------------------------------------------------
export const SEARCH_QUERIES = [
  'Southern California youth baseball tournament 2026',
  'PONY baseball tournament California',
  'USSSA baseball tournament Orange County',
  'Triple Crown baseball tournament SoCal',
  'Nations Baseball tournament California',
  'TourneyMachine baseball California',
  'South Bay Pony tournament',
  'All Star baseball tournament Southern California',
  'All Stars baseball tournament Orange County',
];

// ---------------------------------------------------------------------------
// Aggregator URLs — direct scrape targets
// ---------------------------------------------------------------------------
export const AGGREGATOR_URLS = [
  'https://tourneymachine.com/Public/Results/Tournament.aspx',
  'https://usssa.com/baseball/events/socal',
  'https://www.triplecrownsports.com/events?state=CA',
  'https://www.nationsbaseball.com/tournament-calendar',
];

// ---------------------------------------------------------------------------
// Division mapping — keyword → division ID array
// ---------------------------------------------------------------------------
export const DIVISION_MAP = {
  // PONY division names
  shetland: ['5u', '6u'],
  pinto: ['7u-mp', '7u-kp', '8u-mp', '8u-kp'],
  mustang: ['9u', '10u'],
  bronco: ['11u', '12u'],
  pony: ['13u', '14u'],

  // Direct age-group mappings
  '5u': ['5u'],
  '6u': ['6u'],
  '7u': ['7u-mp', '7u-kp'],
  '8u': ['8u-mp', '8u-kp'],
  '9u': ['9u'],
  '10u': ['10u'],
  '11u': ['11u'],
  '12u': ['12u'],
  '13u': ['13u'],
  '14u': ['14u'],
};

// ---------------------------------------------------------------------------
// Age / division keywords to search for in page content
// ---------------------------------------------------------------------------
export const AGE_KEYWORDS = [
  '5u', '6u', '7u', '8u', '9u', '10u', '11u', '12u', '13u', '14u',
  'shetland', 'pinto', 'mustang', 'bronco', 'pony',
  '5-under', '6-under', '7-under', '8-under', '9-under',
  '10-under', '11-under', '12-under', '13-under', '14-under',
  '5 and under', '6 and under', '7 and under', '8 and under',
  '9 and under', '10 and under', '11 and under', '12 and under',
  '13 and under', '14 and under',
  'machine pitch', 'kid pitch', 'coach pitch',
];

// ---------------------------------------------------------------------------
// SoCal regions
// ---------------------------------------------------------------------------
export const SOCAL_REGIONS = [
  'orange county',
  'los angeles',
  'inland empire',
  'san diego',
  'ventura county',
  'riverside',
  'san bernardino',
  'south bay',
  'san gabriel valley',
  'high desert',
];

// ---------------------------------------------------------------------------
// SoCal cities — comprehensive list for matching
// ---------------------------------------------------------------------------
export const SOCAL_CITIES = [
  'irvine',
  'anaheim',
  'huntington beach',
  'long beach',
  'fullerton',
  'tustin',
  'costa mesa',
  'newport beach',
  'mission viejo',
  'lake forest',
  'laguna niguel',
  'laguna hills',
  'aliso viejo',
  'dana point',
  'san clemente',
  'san juan capistrano',
  'rancho santa margarita',
  'ladera ranch',
  'foothill ranch',
  'orange',
  'garden grove',
  'santa ana',
  'westminster',
  'fountain valley',
  'cypress',
  'buena park',
  'la habra',
  'brea',
  'yorba linda',
  'placentia',
  'seal beach',
  'los alamitos',
  'la mirada',
  'cerritos',
  'lakewood',
  'torrance',
  'carson',
  'compton',
  'downey',
  'whittier',
  'pomona',
  'claremont',
  'covina',
  'glendora',
  'azusa',
  'pasadena',
  'arcadia',
  'monrovia',
  'duarte',
  'el monte',
  'west covina',
  'diamond bar',
  'chino hills',
  'chino',
  'ontario',
  'rancho cucamonga',
  'upland',
  'fontana',
  'riverside',
  'corona',
  'norco',
  'murrieta',
  'temecula',
  'san marcos',
  'escondido',
  'oceanside',
  'carlsbad',
  'vista',
  'encinitas',
  'san bernardino',
  'redlands',
  'beaumont',
  'hemet',
  'menifee',
  'perris',
  'moreno valley',
  'eastvale',
  'jurupa valley',
  'thousand oaks',
  'simi valley',
  'camarillo',
  'oxnard',
  'ventura',
  'santa clarita',
  'palmdale',
  'lancaster',
];

// ---------------------------------------------------------------------------
// Scrape throttle
// ---------------------------------------------------------------------------
export const SCRAPE_DELAY_MS = 2000;
