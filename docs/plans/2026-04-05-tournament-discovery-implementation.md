# Tournament Discovery Cron Job — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a nightly cron job that auto-discovers SoCal youth baseball tournaments via Firecrawl and inserts them as drafts for admin review.

**Architecture:** Standalone Node.js ESM script pipeline (search → parse → filter → dedupe → images → insert → notify) running on Mac Mini via PM2 cron at 2am. Uses self-hosted Firecrawl at localhost:3002 for Google search + page scraping, Supabase service role client for DB inserts + Storage uploads, and Resend for admin email notification.

**Tech Stack:** Node.js (ESM), Firecrawl HTTP API, @supabase/supabase-js, Resend

**Design doc:** `docs/plans/2026-04-05-tournament-discovery-design.md`

---

### Task 1: Config Module

**Files:**
- Create: `scripts/tournament-discovery/config.mjs`

**Step 1: Create the config file**

```javascript
// scripts/tournament-discovery/config.mjs

export const FIRECRAWL_URL = process.env.FIRECRAWL_URL || "http://localhost:3002";

export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const RESEND_API_KEY = process.env.RESEND_API_KEY;
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
export const SITE_URL = process.env.SITE_URL || "https://irvineallstars.com";

// Google search queries for Firecrawl /search
export const SEARCH_QUERIES = [
  "Southern California youth baseball tournament 2026",
  "PONY baseball tournament California",
  "USSSA baseball tournament Orange County",
  "Triple Crown baseball tournament SoCal",
  "Nations Baseball tournament California",
  "TourneyMachine baseball California",
  "South Bay Pony tournament",
  "All Star baseball tournament Southern California",
  "All Stars baseball tournament Orange County",
];

// Aggregator URLs to scrape directly for tournament listings
export const AGGREGATOR_URLS = [
  "https://tourneymachine.com/Public/Results/Tournament.aspx?IDTournament=",  // placeholder — real listing URLs go here
  "https://www.usssa.com/sports/Events-ede6.aspx?SportId=1&StateId=5",
  "https://www.triplecrownsports.com/events?state=CA&sport=baseball",
  "https://www.nationsbaseball.com/page/show/4889968-tournaments",
];

// Division keyword → division IDs mapping
export const DIVISION_MAP = {
  "shetland": ["5u", "6u"],
  "pinto": ["7u-mp", "7u-kp", "8u-mp", "8u-kp"],
  "mustang": ["9u", "10u"],
  "bronco": ["11u", "12u"],
  "pony": ["13u", "14u"],
  "5u": ["5u"],
  "6u": ["6u"],
  "7u": ["7u-mp", "7u-kp"],
  "8u": ["8u-mp", "8u-kp"],
  "9u": ["9u"],
  "10u": ["10u"],
  "11u": ["11u"],
  "12u": ["12u"],
  "13u": ["13u"],
  "14u": ["14u"],
};

// Age range keywords that indicate relevance
export const AGE_KEYWORDS = [
  "5u", "6u", "7u", "8u", "9u", "10u", "11u", "12u", "13u", "14u",
  "shetland", "pinto", "mustang", "bronco", "pony",
  "ages 4", "ages 5", "ages 6", "ages 7", "ages 8", "ages 9",
  "ages 10", "ages 11", "ages 12", "ages 13", "ages 14",
  "youth baseball",
];

// SoCal regions and cities for geographic filtering
export const SOCAL_REGIONS = [
  "orange county", "los angeles", "inland empire", "san diego",
  "ventura", "riverside", "san bernardino",
];

export const SOCAL_CITIES = [
  "irvine", "anaheim", "huntington beach", "long beach", "fullerton",
  "tustin", "costa mesa", "newport beach", "mission viejo", "lake forest",
  "laguna niguel", "san clemente", "dana point", "rancho santa margarita",
  "ladera ranch", "aliso viejo", "yorba linda", "brea", "placentia",
  "orange", "garden grove", "westminster", "fountain valley", "cypress",
  "buena park", "la habra", "san juan capistrano", "lakewood",
  "torrance", "carson", "compton", "downey", "whittier", "pasadena",
  "glendale", "burbank", "pomona", "ontario", "corona", "temecula",
  "murrieta", "oceanside", "carlsbad", "escondido", "chula vista",
  "el cajon", "santee", "poway", "encinitas", "vista",
  "southern california", "socal", "so cal",
];

// Delay between scrape requests (ms)
export const SCRAPE_DELAY_MS = 2000;
```

**Step 2: Verify syntax**

Run: `node --check scripts/tournament-discovery/config.mjs`
Expected: No output (clean parse)

**Step 3: Commit**

```bash
git add scripts/tournament-discovery/config.mjs
git commit -m "feat(discovery): add config module with search queries, division maps, and geo filters"
```

---

### Task 2: Firecrawl Search & Scrape Module

**Files:**
- Create: `scripts/tournament-discovery/search.mjs`

**Step 1: Create the search module**

```javascript
// scripts/tournament-discovery/search.mjs

import { FIRECRAWL_URL, SEARCH_QUERIES, AGGREGATOR_URLS, SCRAPE_DELAY_MS } from "./config.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run a Google search via Firecrawl /search endpoint.
 * Returns array of { url, title, description, markdown }.
 */
async function firecrawlSearch(query) {
  const res = await fetch(`${FIRECRAWL_URL}/v1/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      limit: 10,
      scrapeOptions: { formats: ["markdown"] },
    }),
  });

  if (!res.ok) {
    console.error(`Search failed for "${query}": ${res.status} ${res.statusText}`);
    return [];
  }

  const json = await res.json();
  return (json.data || []).map((r) => ({
    url: r.url,
    title: r.title || "",
    description: r.description || "",
    markdown: r.markdown || "",
  }));
}

/**
 * Scrape a single URL via Firecrawl /scrape endpoint.
 * Returns { url, title, markdown, images } or null on failure.
 */
async function firecrawlScrape(url) {
  const res = await fetch(`${FIRECRAWL_URL}/v1/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
    }),
  });

  if (!res.ok) {
    console.error(`Scrape failed for ${url}: ${res.status} ${res.statusText}`);
    return null;
  }

  const json = await res.json();
  const data = json.data || {};
  return {
    url,
    title: data.metadata?.title || "",
    markdown: data.markdown || "",
    // Extract image URLs from metadata or markdown
    images: extractImageUrls(data.markdown || "", url),
  };
}

/**
 * Extract image URLs from markdown content.
 * Looks for markdown image syntax and common flyer patterns.
 */
function extractImageUrls(markdown, pageUrl) {
  const images = [];
  // Match markdown images: ![alt](url)
  const mdImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = mdImageRegex.exec(markdown)) !== null) {
    const imgUrl = match[2];
    // Filter for likely flyer/tournament images
    if (isLikelyFlyerImage(imgUrl, match[1])) {
      images.push(resolveUrl(imgUrl, pageUrl));
    }
  }
  return images;
}

/**
 * Check if an image URL is likely a tournament flyer (not a logo/icon/nav image).
 */
function isLikelyFlyerImage(url, alt) {
  const lower = (url + " " + alt).toLowerCase();
  // Skip tiny icons, logos, social media icons, tracking pixels
  const skipPatterns = [
    "logo", "icon", "favicon", "avatar", "pixel", "tracking",
    "facebook", "twitter", "instagram", "linkedin", "youtube",
    "badge", "button", "banner-ad", "advertisement",
    ".svg", "1x1", "spacer",
  ];
  if (skipPatterns.some((p) => lower.includes(p))) return false;

  // Prefer images with flyer/tournament-related terms or large image extensions
  const flyerPatterns = [
    "flyer", "flier", "tournament", "event", "poster",
    "classic", "championship", "invitational",
    ".jpg", ".jpeg", ".png", ".webp",
  ];
  return flyerPatterns.some((p) => lower.includes(p));
}

/**
 * Resolve relative URLs against a base page URL.
 */
function resolveUrl(href, pageUrl) {
  try {
    return new URL(href, pageUrl).href;
  } catch {
    return href;
  }
}

/**
 * Run all searches and scrapes. Returns array of raw page results.
 * Each result: { url, title, markdown, images, source }
 */
export async function searchAndScrape() {
  const results = [];
  const seenUrls = new Set();

  // Phase 1: Google searches
  console.log(`Running ${SEARCH_QUERIES.length} Google searches...`);
  for (const query of SEARCH_QUERIES) {
    console.log(`  Searching: "${query}"`);
    const searchResults = await firecrawlSearch(query);
    for (const r of searchResults) {
      if (!seenUrls.has(r.url)) {
        seenUrls.add(r.url);
        results.push({
          ...r,
          images: extractImageUrls(r.markdown, r.url),
          source: "google",
        });
      }
    }
    await sleep(SCRAPE_DELAY_MS);
  }

  console.log(`Found ${results.length} unique URLs from Google searches.`);

  // Phase 2: Aggregator direct scrapes
  console.log(`\nScraping ${AGGREGATOR_URLS.length} aggregator sites...`);
  for (const url of AGGREGATOR_URLS) {
    console.log(`  Scraping: ${url}`);
    const result = await firecrawlScrape(url);
    if (result && !seenUrls.has(url)) {
      seenUrls.add(url);
      results.push({ ...result, source: "aggregator" });
    }
    await sleep(SCRAPE_DELAY_MS);
  }

  // Phase 3: Follow links from aggregator pages to individual tournament pages
  const aggregatorResults = results.filter((r) => r.source === "aggregator");
  const tournamentLinks = [];
  for (const agg of aggregatorResults) {
    const links = extractTournamentLinks(agg.markdown, agg.url);
    for (const link of links) {
      if (!seenUrls.has(link)) {
        seenUrls.add(link);
        tournamentLinks.push(link);
      }
    }
  }

  if (tournamentLinks.length > 0) {
    console.log(`\nScraping ${tournamentLinks.length} individual tournament pages from aggregators...`);
    for (const link of tournamentLinks) {
      console.log(`  Scraping: ${link}`);
      const result = await firecrawlScrape(link);
      if (result) {
        results.push({ ...result, source: "aggregator-detail" });
      }
      await sleep(SCRAPE_DELAY_MS);
    }
  }

  console.log(`\nTotal pages collected: ${results.length}`);
  return results;
}

/**
 * Extract tournament detail links from an aggregator listing page.
 */
function extractTournamentLinks(markdown, baseUrl) {
  const links = [];
  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(markdown)) !== null) {
    const text = match[1].toLowerCase();
    const href = match[2];
    // Look for links that seem to be tournament detail pages
    const tournamentTerms = [
      "tournament", "classic", "championship", "invitational",
      "cup", "series", "shootout", "showdown", "showcase",
    ];
    if (tournamentTerms.some((t) => text.includes(t))) {
      links.push(resolveUrl(href, baseUrl));
    }
  }
  return links;
}
```

**Step 2: Verify syntax**

Run: `node --check scripts/tournament-discovery/search.mjs`
Expected: No output (clean parse)

**Step 3: Commit**

```bash
git add scripts/tournament-discovery/search.mjs
git commit -m "feat(discovery): add Firecrawl search and scrape module"
```

---

### Task 3: Parse Module

**Files:**
- Create: `scripts/tournament-discovery/parse.mjs`

**Step 1: Create the parse module**

This module extracts structured tournament data from raw markdown page content.

```javascript
// scripts/tournament-discovery/parse.mjs

/**
 * Parse raw page results into tournament candidate objects.
 * Returns array of { name, startDate, endDate, location, divisionsDisplay,
 *   divisionIds, registrationUrl, host, description, flyerImageUrl, sourceUrl }
 */
export function parseTournaments(pageResults) {
  const candidates = [];

  for (const page of pageResults) {
    const parsed = parseSinglePage(page);
    if (parsed) {
      candidates.push(parsed);
    }
  }

  console.log(`Parsed ${candidates.length} tournament candidates from ${pageResults.length} pages.`);
  return candidates;
}

function parseSinglePage(page) {
  const { url, title, markdown, images } = page;
  const text = markdown || "";

  // Extract tournament name — prefer H1, fallback to page title
  const name = extractName(text, title);
  if (!name) return null;

  // Extract dates
  const dates = extractDates(text);
  if (!dates) return null;

  // Extract location
  const location = extractLocation(text);

  // Extract divisions mentioned
  const divisionsDisplay = extractDivisionsDisplay(text);

  // Extract registration URL
  const registrationUrl = extractRegistrationUrl(text, url);

  // Extract host/organizer
  const host = extractHost(text);

  // Extract description (first meaningful paragraph)
  const description = extractDescription(text);

  // Pick best flyer image
  const flyerImageUrl = images && images.length > 0 ? images[0] : null;

  return {
    name,
    startDate: dates.start,
    endDate: dates.end,
    location: location || "",
    divisionsDisplay: divisionsDisplay || "",
    registrationUrl,
    host: host || "",
    description: description || "",
    flyerImageUrl,
    sourceUrl: url,
  };
}

/**
 * Extract tournament name from content.
 */
function extractName(text, pageTitle) {
  // Try H1 first
  const h1Match = text.match(/^#\s+(.+)$/m);
  if (h1Match) {
    const h1 = h1Match[1].trim();
    // Only use if it looks like a tournament name
    if (isTournamentName(h1)) return h1;
  }

  // Try H2
  const h2Match = text.match(/^##\s+(.+)$/m);
  if (h2Match) {
    const h2 = h2Match[1].trim();
    if (isTournamentName(h2)) return h2;
  }

  // Fall back to page title
  if (pageTitle && isTournamentName(pageTitle)) return pageTitle.trim();

  return null;
}

function isTournamentName(text) {
  const lower = text.toLowerCase();
  const terms = [
    "tournament", "classic", "championship", "invitational",
    "cup", "series", "shootout", "showdown", "showcase",
    "world series", "super nit",
  ];
  return terms.some((t) => lower.includes(t));
}

/**
 * Extract start and end dates from text.
 * Returns { start: "YYYY-MM-DD", end: "YYYY-MM-DD" } or null.
 */
function extractDates(text) {
  // Pattern: "June 6-7, 2026" or "June 6 - 7, 2026"
  const rangeSameMonth = /(\w+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2}),?\s*(\d{4})/i;
  let match = text.match(rangeSameMonth);
  if (match) {
    const [, month, startDay, endDay, year] = match;
    const start = parseDate(month, startDay, year);
    const end = parseDate(month, endDay, year);
    if (start && end) return { start, end };
  }

  // Pattern: "June 6 - June 8, 2026"
  const rangeDiffMonth = /(\w+)\s+(\d{1,2})\s*[-–]\s*(\w+)\s+(\d{1,2}),?\s*(\d{4})/i;
  match = text.match(rangeDiffMonth);
  if (match) {
    const [, month1, day1, month2, day2, year] = match;
    const start = parseDate(month1, day1, year);
    const end = parseDate(month2, day2, year);
    if (start && end) return { start, end };
  }

  // Pattern: "06/06/2026 - 06/07/2026" or "6/6/2026-6/7/2026"
  const numericRange = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[-–]\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/;
  match = text.match(numericRange);
  if (match) {
    const [, m1, d1, y1, m2, d2, y2] = match;
    return {
      start: `${y1}-${m1.padStart(2, "0")}-${d1.padStart(2, "0")}`,
      end: `${y2}-${m2.padStart(2, "0")}-${d2.padStart(2, "0")}`,
    };
  }

  // Single date: "June 6, 2026" (use same date for start and end)
  const singleDate = /(\w+)\s+(\d{1,2}),?\s*(\d{4})/i;
  match = text.match(singleDate);
  if (match) {
    const [, month, day, year] = match;
    const date = parseDate(month, day, year);
    if (date) return { start: date, end: date };
  }

  return null;
}

const MONTHS = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseDate(monthStr, day, year) {
  const monthIndex = MONTHS[monthStr.toLowerCase()];
  if (monthIndex === undefined) return null;
  const d = new Date(parseInt(year), monthIndex, parseInt(day));
  if (isNaN(d.getTime())) return null;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dd}`;
}

/**
 * Extract location/venue from text.
 */
function extractLocation(text) {
  // Look for patterns like "Location: ...", "Venue: ...", "Where: ...", "Field: ..."
  const locMatch = text.match(/(?:location|venue|where|field|park|complex)\s*[:]\s*(.+)/i);
  if (locMatch) return locMatch[1].trim().split("\n")[0];

  // Look for "at [Place Name]" pattern
  const atMatch = text.match(/\bat\s+([\w\s]+(?:park|field|complex|stadium|center|facility))/i);
  if (atMatch) return atMatch[1].trim();

  return null;
}

/**
 * Extract raw division/age text from content.
 */
function extractDivisionsDisplay(text) {
  // Look for "Divisions: ..." or "Age groups: ..." patterns
  const divMatch = text.match(/(?:divisions?|age\s*groups?|ages?)\s*[:]\s*(.+)/i);
  if (divMatch) return divMatch[1].trim().split("\n")[0];
  return null;
}

/**
 * Extract registration URL from content.
 */
function extractRegistrationUrl(text, pageUrl) {
  // Look for links containing register/signup keywords
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    const linkText = match[1].toLowerCase();
    const href = match[2];
    if (
      linkText.includes("register") ||
      linkText.includes("sign up") ||
      linkText.includes("signup") ||
      href.includes("register") ||
      href.includes("signup")
    ) {
      try {
        return new URL(href, pageUrl).href;
      } catch {
        return href;
      }
    }
  }

  // Check if the page itself is a tourneymachine page (these are registration pages)
  if (pageUrl.includes("tourneymachine.com")) return pageUrl;

  return null;
}

/**
 * Extract host/organizer name.
 */
function extractHost(text) {
  const hostMatch = text.match(/(?:hosted?\s*by|organizer|presented?\s*by)\s*[:.]?\s*(.+)/i);
  if (hostMatch) return hostMatch[1].trim().split("\n")[0];
  return null;
}

/**
 * Extract a short description from the content.
 */
function extractDescription(text) {
  // Get lines that aren't headings or links, take first substantial one
  const lines = text.split("\n").filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 30 &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("[") &&
      !trimmed.startsWith("!") &&
      !trimmed.startsWith("|") &&
      !trimmed.startsWith("-")
    );
  });

  if (lines.length > 0) {
    return lines[0].trim().substring(0, 500);
  }
  return null;
}
```

**Step 2: Verify syntax**

Run: `node --check scripts/tournament-discovery/parse.mjs`
Expected: No output (clean parse)

**Step 3: Commit**

```bash
git add scripts/tournament-discovery/parse.mjs
git commit -m "feat(discovery): add tournament parser — extracts name, dates, location, divisions from markdown"
```

---

### Task 4: Filter Module

**Files:**
- Create: `scripts/tournament-discovery/filter.mjs`

**Step 1: Create the filter module**

```javascript
// scripts/tournament-discovery/filter.mjs

import {
  SOCAL_REGIONS,
  SOCAL_CITIES,
  AGE_KEYWORDS,
  DIVISION_MAP,
} from "./config.mjs";

/**
 * Filter tournament candidates for geographic and age/division relevance.
 * Also maps division keywords to our division IDs.
 * Returns filtered array with divisionIds populated.
 */
export function filterTournaments(candidates) {
  const passed = [];

  for (const t of candidates) {
    const geoMatch = matchesGeography(t);
    const divisionIds = matchDivisions(t);

    if (geoMatch && divisionIds.length > 0) {
      passed.push({
        ...t,
        divisionIds,
      });
    } else if (geoMatch) {
      // Geographic match but no specific division — could be a general youth tournament
      // Include it with empty divisions (admin can assign)
      passed.push({
        ...t,
        divisionIds: [],
      });
    }
    // If no geo match, skip entirely
  }

  console.log(`Filtered: ${passed.length} passed out of ${candidates.length} candidates.`);
  return passed;
}

/**
 * Check if tournament location/content mentions SoCal.
 */
function matchesGeography(tournament) {
  const searchText = [
    tournament.location,
    tournament.name,
    tournament.description,
    tournament.host,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Check regions
  for (const region of SOCAL_REGIONS) {
    if (searchText.includes(region)) return true;
  }

  // Check cities
  for (const city of SOCAL_CITIES) {
    // Word boundary match to avoid false positives (e.g. "vista" in "vista del lago")
    const regex = new RegExp(`\\b${city}\\b`, "i");
    if (regex.test(searchText)) return true;
  }

  return false;
}

/**
 * Match age/division keywords in tournament content.
 * Returns array of our division IDs (e.g. ["9u", "10u"]).
 */
function matchDivisions(tournament) {
  const searchText = [
    tournament.divisionsDisplay,
    tournament.name,
    tournament.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matchedIds = new Set();

  for (const [keyword, ids] of Object.entries(DIVISION_MAP)) {
    if (searchText.includes(keyword.toLowerCase())) {
      ids.forEach((id) => matchedIds.add(id));
    }
  }

  return [...matchedIds];
}
```

**Step 2: Verify syntax**

Run: `node --check scripts/tournament-discovery/filter.mjs`
Expected: No output (clean parse)

**Step 3: Commit**

```bash
git add scripts/tournament-discovery/filter.mjs
git commit -m "feat(discovery): add geographic and division filter module"
```

---

### Task 5: Deduplicate Module

**Files:**
- Create: `scripts/tournament-discovery/dedupe.mjs`

**Step 1: Create the dedupe module**

```javascript
// scripts/tournament-discovery/dedupe.mjs

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "./config.mjs";

/**
 * Deduplicate tournament candidates against existing DB entries.
 * Returns only new (non-duplicate) tournaments.
 */
export async function deduplicateTournaments(candidates) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    db: { schema: "irvine_allstars" },
  });

  // Fetch all existing tournaments
  const { data: existing, error } = await supabase
    .from("tournaments")
    .select("id, name, start_date, end_date");

  if (error) {
    console.error("Failed to fetch existing tournaments for dedup:", error.message);
    return candidates; // Proceed without dedup rather than fail
  }

  const existingList = existing || [];
  console.log(`Checking ${candidates.length} candidates against ${existingList.length} existing tournaments.`);

  const newTournaments = [];
  const duplicates = [];

  for (const candidate of candidates) {
    const isDupe = existingList.some((ex) =>
      isDuplicate(candidate, ex)
    );

    if (isDupe) {
      duplicates.push(candidate.name);
    } else {
      newTournaments.push(candidate);
    }
  }

  if (duplicates.length > 0) {
    console.log(`Skipped ${duplicates.length} duplicates: ${duplicates.join(", ")}`);
  }
  console.log(`${newTournaments.length} new tournaments to insert.`);

  return newTournaments;
}

/**
 * Check if a candidate matches an existing tournament.
 * Uses fuzzy name matching + date overlap within ±3 days.
 */
function isDuplicate(candidate, existing) {
  const nameScore = nameSimilarity(candidate.name, existing.name);
  const dateClose = datesWithinRange(candidate.startDate, existing.start_date, 3);

  return nameScore > 0.8 && dateClose;
}

/**
 * Simple normalized name similarity (0-1).
 * Strips common words, lowercases, compares token overlap.
 */
function nameSimilarity(a, b) {
  const normalize = (s) => {
    const stopWords = [
      "tournament", "classic", "championship", "invitational",
      "the", "a", "an", "of", "at", "in", "for",
      "annual", "1st", "2nd", "3rd", "4th", "5th",
      "first", "second", "third", "fourth", "fifth",
    ];
    return s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => !stopWords.includes(w) && w.length > 1);
  };

  const tokensA = normalize(a);
  const tokensB = normalize(b);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter((t) => setB.has(t));
  const union = new Set([...setA, ...setB]);

  return intersection.length / union.size; // Jaccard similarity
}

/**
 * Check if two dates are within N days of each other.
 */
function datesWithinRange(dateStr1, dateStr2, days) {
  const d1 = new Date(dateStr1 + "T12:00:00");
  const d2 = new Date(dateStr2 + "T12:00:00");
  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}
```

**Step 2: Verify syntax**

Run: `node --check scripts/tournament-discovery/dedupe.mjs`
Expected: No output (clean parse)

**Step 3: Commit**

```bash
git add scripts/tournament-discovery/dedupe.mjs
git commit -m "feat(discovery): add deduplication module with fuzzy name + date matching"
```

---

### Task 6: Image Download & Upload Module

**Files:**
- Create: `scripts/tournament-discovery/images.mjs`

**Step 1: Create the images module**

```javascript
// scripts/tournament-discovery/images.mjs

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "./config.mjs";

const BUCKET = "tournament-flyers";

/**
 * Download flyer images for tournaments and upload to Supabase Storage.
 * Mutates tournament objects in place, setting flyerStoragePath.
 */
export async function downloadAndUploadImages(tournaments) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    db: { schema: "irvine_allstars" },
  });

  let downloaded = 0;
  let failed = 0;

  for (const tournament of tournaments) {
    if (!tournament.flyerImageUrl) continue;

    try {
      console.log(`  Downloading flyer: ${tournament.flyerImageUrl}`);

      const response = await fetch(tournament.flyerImageUrl);
      if (!response.ok) {
        console.error(`    Failed to download (${response.status}): ${tournament.flyerImageUrl}`);
        failed++;
        continue;
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const buffer = Buffer.from(await response.arrayBuffer());

      // Generate a clean filename from tournament name
      const slug = tournament.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 60);
      const filename = `discovered/${slug}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filename, buffer, {
          contentType,
          upsert: false,
        });

      if (error) {
        console.error(`    Upload failed: ${error.message}`);
        failed++;
        continue;
      }

      tournament.flyerStoragePath = filename;
      downloaded++;
      console.log(`    Uploaded: ${filename}`);
    } catch (err) {
      console.error(`    Image error: ${err.message}`);
      failed++;
    }
  }

  console.log(`Images: ${downloaded} uploaded, ${failed} failed.`);
}
```

**Step 2: Verify syntax**

Run: `node --check scripts/tournament-discovery/images.mjs`
Expected: No output (clean parse)

**Step 3: Commit**

```bash
git add scripts/tournament-discovery/images.mjs
git commit -m "feat(discovery): add flyer image download and Supabase Storage upload module"
```

---

### Task 7: Insert Module

**Files:**
- Create: `scripts/tournament-discovery/insert.mjs`

**Step 1: Create the insert module**

This inserts tournaments as drafts and creates linked draft announcements, mirroring the admin panel's `handleAutoAnnounce` logic from `src/app/admin/tournaments/page.tsx:141-175`.

```javascript
// scripts/tournament-discovery/insert.mjs

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "./config.mjs";

/**
 * Insert new tournaments as drafts and create linked announcements.
 * Returns array of inserted tournament records.
 */
export async function insertTournaments(tournaments) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    db: { schema: "irvine_allstars" },
  });

  const inserted = [];

  for (const t of tournaments) {
    // Insert tournament as draft
    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        name: t.name,
        start_date: t.startDate,
        end_date: t.endDate,
        location: t.location,
        divisions_display: t.divisionsDisplay || "",
        division_ids: t.divisionIds.length > 0 ? t.divisionIds : [],
        registration_url: t.registrationUrl || null,
        host: t.host || "",
        description: t.description || "",
        flyer_url: t.flyerStoragePath || null,
        status: "draft",
        auto_announce: true,
      })
      .select()
      .single();

    if (error) {
      console.error(`  Failed to insert "${t.name}": ${error.message}`);
      continue;
    }

    console.log(`  Inserted draft tournament: "${t.name}" (${data.id})`);

    // Create linked draft announcement
    const dateRange = formatDateRange(t.startDate, t.endDate);
    const parts = [];
    if (t.location) parts.push(`Location: ${t.location}`);
    parts.push(`Dates: ${dateRange}`);
    if (t.host) parts.push(`Host: ${t.host}`);
    if (t.divisionsDisplay) parts.push(`Divisions: ${t.divisionsDisplay}`);
    if (t.registrationUrl) parts.push(`Register: ${t.registrationUrl}`);
    if (t.description) parts.push(`\n${t.description}`);

    const announcementTitle = `Tournament: ${t.name} — ${dateRange}`;
    const announcementBody = parts.join("\n");

    const { error: annError } = await supabase
      .from("announcements")
      .insert({
        title: announcementTitle,
        body: announcementBody,
        division: null, // Visible to all divisions
      });

    if (annError) {
      console.error(`  Failed to create announcement for "${t.name}": ${annError.message}`);
    } else {
      console.log(`  Created draft announcement for: "${t.name}"`);
    }

    inserted.push(data);
  }

  console.log(`\nInserted ${inserted.length} new tournaments.`);
  return inserted;
}

function formatDateRange(start, end) {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const opts = { month: "long", day: "numeric" };
  if (s.getMonth() === e.getMonth() && s.getDate() !== e.getDate()) {
    return `${s.toLocaleDateString("en-US", { month: "long" })} ${s.getDate()}-${e.getDate()}, ${s.getFullYear()}`;
  }
  if (start === end) {
    return `${s.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
  }
  return `${s.toLocaleDateString("en-US", opts)} - ${e.toLocaleDateString("en-US", opts)}, ${s.getFullYear()}`;
}
```

**Step 2: Verify syntax**

Run: `node --check scripts/tournament-discovery/insert.mjs`
Expected: No output (clean parse)

**Step 3: Commit**

```bash
git add scripts/tournament-discovery/insert.mjs
git commit -m "feat(discovery): add tournament insert module with draft announcements"
```

---

### Task 8: Notify Module

**Files:**
- Create: `scripts/tournament-discovery/notify.mjs`

**Step 1: Create the notify module**

```javascript
// scripts/tournament-discovery/notify.mjs

import { Resend } from "resend";
import { RESEND_API_KEY, ADMIN_EMAIL, SITE_URL } from "./config.mjs";

/**
 * Send admin notification email about newly discovered tournaments.
 * Only sends if there are new tournaments to report.
 */
export async function notifyAdmin(insertedTournaments) {
  if (insertedTournaments.length === 0) {
    console.log("No new tournaments — skipping admin notification.");
    return;
  }

  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    console.warn("RESEND_API_KEY or ADMIN_EMAIL not configured — skipping email.");
    return;
  }

  const resend = new Resend(RESEND_API_KEY);
  const count = insertedTournaments.length;

  const tournamentList = insertedTournaments
    .map((t) => {
      const dateRange = formatDateRange(t.start_date, t.end_date);
      return `• ${t.name}\n  ${dateRange} — ${t.location}`;
    })
    .join("\n\n");

  const { error } = await resend.emails.send({
    from: "Irvine All-Stars <noreply@irvineallstars.com>",
    to: ADMIN_EMAIL,
    subject: `${count} New Tournament${count > 1 ? "s" : ""} Discovered — Review Needed`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2>${count} New Tournament${count > 1 ? "s" : ""} Found</h2>
        <p>The tournament discovery job found ${count} new tournament${count > 1 ? "s" : ""} that need${count === 1 ? "s" : ""} your review:</p>
        <pre style="background: #f5f5f5; padding: 16px; border-radius: 8px; font-size: 14px; line-height: 1.6;">${tournamentList}</pre>
        <p>These have been added as <strong>drafts</strong> and will not be visible to coaches or parents until you publish them.</p>
        <p>
          <a href="${SITE_URL}/admin/tournaments"
             style="display: inline-block; background: #0F1B2D; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Review Tournaments
          </a>
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send admin notification:", error.message);
  } else {
    console.log(`Admin notification sent to ${ADMIN_EMAIL}.`);
  }
}

function formatDateRange(start, end) {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  if (start === end) {
    return s.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  if (s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString("en-US", { month: "long" })} ${s.getDate()}-${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${s.toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${e.toLocaleDateString("en-US", { month: "long", day: "numeric" })}, ${s.getFullYear()}`;
}
```

**Step 2: Verify syntax**

Run: `node --check scripts/tournament-discovery/notify.mjs`
Expected: No output (clean parse)

**Step 3: Commit**

```bash
git add scripts/tournament-discovery/notify.mjs
git commit -m "feat(discovery): add admin email notification module via Resend"
```

---

### Task 9: Main Orchestrator

**Files:**
- Create: `scripts/tournament-discovery/discover.mjs`

**Step 1: Create the main entry point**

```javascript
#!/usr/bin/env node

// scripts/tournament-discovery/discover.mjs
// Nightly tournament discovery cron job for Irvine All-Stars.
// Discovers SoCal youth baseball tournaments via Firecrawl and inserts as drafts.

import { searchAndScrape } from "./search.mjs";
import { parseTournaments } from "./parse.mjs";
import { filterTournaments } from "./filter.mjs";
import { deduplicateTournaments } from "./dedupe.mjs";
import { downloadAndUploadImages } from "./images.mjs";
import { insertTournaments } from "./insert.mjs";
import { notifyAdmin } from "./notify.mjs";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "./config.mjs";

async function main() {
  const startTime = Date.now();
  console.log(`\n=== Tournament Discovery Run: ${new Date().toISOString()} ===\n`);

  // Validate required env vars
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
    process.exit(1);
  }

  try {
    // Step 1: Search & scrape
    console.log("--- Step 1: Search & Scrape ---");
    const pages = await searchAndScrape();

    // Step 2: Parse
    console.log("\n--- Step 2: Parse ---");
    const candidates = parseTournaments(pages);

    // Step 3: Filter
    console.log("\n--- Step 3: Filter ---");
    const filtered = filterTournaments(candidates);

    // Step 4: Deduplicate
    console.log("\n--- Step 4: Deduplicate ---");
    const newTournaments = await deduplicateTournaments(filtered);

    if (newTournaments.length === 0) {
      console.log("\nNo new tournaments found. Done.");
      logSummary(pages.length, candidates.length, filtered.length, 0, 0, startTime);
      return;
    }

    // Step 5: Download & upload flyer images
    console.log("\n--- Step 5: Download & Upload Flyer Images ---");
    await downloadAndUploadImages(newTournaments);

    // Step 6: Insert into database
    console.log("\n--- Step 6: Insert Tournaments ---");
    const inserted = await insertTournaments(newTournaments);

    // Step 7: Notify admin
    console.log("\n--- Step 7: Notify Admin ---");
    await notifyAdmin(inserted);

    logSummary(pages.length, candidates.length, filtered.length, newTournaments.length, inserted.length, startTime);
  } catch (err) {
    console.error("\nFATAL ERROR:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

function logSummary(pagesCount, candidatesCount, filteredCount, newCount, insertedCount, startTime) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== Summary ===`);
  console.log(`  Pages scraped:      ${pagesCount}`);
  console.log(`  Candidates parsed:  ${candidatesCount}`);
  console.log(`  Passed filters:     ${filteredCount}`);
  console.log(`  New (not dupes):    ${newCount}`);
  console.log(`  Inserted as draft:  ${insertedCount}`);
  console.log(`  Elapsed:            ${elapsed}s`);
  console.log(`=== Done ===\n`);
}

main();
```

**Step 2: Verify syntax**

Run: `node --check scripts/tournament-discovery/discover.mjs`
Expected: No output (clean parse)

**Step 3: Commit**

```bash
git add scripts/tournament-discovery/discover.mjs
git commit -m "feat(discovery): add main orchestrator — search → parse → filter → dedupe → images → insert → notify"
```

---

### Task 10: PM2 Ecosystem Config

**Files:**
- Create: `scripts/tournament-discovery/ecosystem.config.cjs`

**Step 1: Create PM2 config**

```javascript
// scripts/tournament-discovery/ecosystem.config.cjs
// PM2 ecosystem config for tournament discovery cron job.
// Deploy on Mac Mini: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: "tournament-discovery",
      script: "./discover.mjs",
      cwd: __dirname,
      cron_restart: "0 2 * * *", // Run nightly at 2am
      autorestart: false,        // One-shot script, don't restart on exit
      watch: false,
      env: {
        SUPABASE_URL: "https://owuempqaheupjyslkjlg.supabase.co",
        // SUPABASE_SERVICE_ROLE_KEY: set via pm2 env or .env on Mac Mini
        // RESEND_API_KEY: set via pm2 env or .env on Mac Mini
        // ADMIN_EMAIL: set via pm2 env or .env on Mac Mini
        FIRECRAWL_URL: "http://localhost:3002",
        SITE_URL: "https://irvineallstars.com",
      },
    },
  ],
};
```

**Step 2: Verify syntax**

Run: `node --check scripts/tournament-discovery/ecosystem.config.cjs`
Expected: No output (clean parse)

**Step 3: Commit**

```bash
git add scripts/tournament-discovery/ecosystem.config.cjs
git commit -m "feat(discovery): add PM2 ecosystem config — nightly 2am cron"
```

---

### Task 11: RLS Policy for Service Role Inserts

**Files:**
- Create: `supabase/migrations/20260405_service_role_tournament_insert.sql`

**Context:** The existing RLS on `irvine_allstars.tournaments` only allows inserts from authenticated users with admin role. The cron script uses the service role key which bypasses RLS entirely, so **no migration is actually needed**. The Supabase service role key bypasses all RLS policies.

However, we should verify the announcements table also allows service role inserts (it does by default — service role bypasses RLS).

**Step 1: Verify service role bypass** (no migration needed)

The `@supabase/supabase-js` client created with the service role key automatically sets `Authorization: Bearer <service_role_key>` which bypasses RLS. No schema changes required.

**Step 2: Skip this task** — no migration needed.

---

### Task 12: Test Run (Manual)

**Step 1: Set environment variables on Mac Mini**

SSH into Mac Mini and create env file:
```bash
ssh ana@100.100.46.56
cd ~/irvine-all-stars
git pull

# Create .env file for the discovery script
cat > scripts/tournament-discovery/.env << 'EOF'
SUPABASE_URL=https://owuempqaheupjyslkjlg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<get from Supabase dashboard>
RESEND_API_KEY=<get from Resend dashboard>
ADMIN_EMAIL=<admin email address>
FIRECRAWL_URL=http://localhost:3002
SITE_URL=https://irvineallstars.com
EOF
```

Note: The script reads env vars directly from `process.env`, so either source the .env file before running or set them in the PM2 ecosystem config.

**Step 2: Run manually to test**

```bash
cd ~/irvine-all-stars/scripts/tournament-discovery
# Load env vars and run
export $(cat .env | xargs) && node discover.mjs
```

Expected: Script runs through all 7 steps, logs summary. Check PM2 logs and Supabase dashboard for draft tournaments.

**Step 3: Set up PM2 cron**

```bash
cd ~/irvine-all-stars/scripts/tournament-discovery
pm2 start ecosystem.config.cjs
pm2 save
```

Verify: `pm2 list` shows `tournament-discovery` with cron schedule.

---

Plan complete and saved to `docs/plans/2026-04-05-tournament-discovery-implementation.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach?