/**
 * Parse Module
 * Third module of the tournament discovery pipeline.
 *
 * Extracts structured tournament data from raw markdown page content.
 * Exports: parseTournaments()
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const TOURNAMENT_KEYWORDS = [
  'tournament', 'classic', 'championship', 'invitational', 'cup',
  'series', 'shootout', 'showdown', 'showcase', 'world series', 'super nit',
];

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Pad a number to two digits.
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Convert month string + day + year into YYYY-MM-DD.
 */
function parseDate(monthStr, day, year) {
  const m = MONTHS[monthStr.toLowerCase()];
  if (!m) return null;
  return `${year}-${pad(m)}-${pad(Number(day))}`;
}

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

/**
 * Check whether a string looks like a tournament name.
 */
function isTournamentName(text) {
  const lower = text.toLowerCase();
  return TOURNAMENT_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Extract the tournament name from markdown text and page title.
 * Tries H1, then H2, then falls back to pageTitle.
 */
function extractName(text, pageTitle) {
  // Try H1
  const h1 = text.match(/^#\s+(.+)$/m);
  if (h1 && isTournamentName(h1[1])) return h1[1].trim();

  // Try H2
  const h2 = text.match(/^##\s+(.+)$/m);
  if (h2 && isTournamentName(h2[1])) return h2[1].trim();

  // Fall back to page title
  if (pageTitle && isTournamentName(pageTitle)) return pageTitle.trim();

  return null;
}

/**
 * Extract start and end dates from text.
 * Returns { start, end } as YYYY-MM-DD strings, or null.
 */
function extractDates(text) {
  // Same-month range: "June 6-7, 2026" or "June 6 - 7, 2026"
  const sameMonth = text.match(
    /\b([A-Za-z]+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2}),?\s*(\d{4})\b/
  );
  if (sameMonth) {
    const [, month, startDay, endDay, year] = sameMonth;
    if (MONTHS[month.toLowerCase()]) {
      const start = parseDate(month, startDay, year);
      const end = parseDate(month, endDay, year);
      if (start && end) return { start, end };
    }
  }

  // Cross-month range: "June 6 - July 8, 2026"
  const crossMonth = text.match(
    /\b([A-Za-z]+)\s+(\d{1,2})\s*[-–]\s*([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})\b/
  );
  if (crossMonth) {
    const [, month1, day1, month2, day2, year] = crossMonth;
    if (MONTHS[month1.toLowerCase()] && MONTHS[month2.toLowerCase()]) {
      const start = parseDate(month1, day1, year);
      const end = parseDate(month2, day2, year);
      if (start && end) return { start, end };
    }
  }

  // Numeric range: "06/06/2026 - 06/07/2026"
  const numeric = text.match(
    /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[-–]\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\b/
  );
  if (numeric) {
    const [, m1, d1, y1, m2, d2, y2] = numeric;
    return {
      start: `${y1}-${pad(Number(m1))}-${pad(Number(d1))}`,
      end: `${y2}-${pad(Number(m2))}-${pad(Number(d2))}`,
    };
  }

  // Single date: "June 6, 2026"
  const single = text.match(/\b([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})\b/);
  if (single) {
    const [, month, day, year] = single;
    if (MONTHS[month.toLowerCase()]) {
      const d = parseDate(month, day, year);
      if (d) return { start: d, end: d };
    }
  }

  return null;
}

/**
 * Extract location / venue from text.
 */
function extractLocation(text) {
  // Label patterns: "Location:", "Venue:", etc.
  const labelMatch = text.match(
    /(?:Location|Venue|Where|Field|Park|Complex)\s*:\s*(.+)/i
  );
  if (labelMatch) return labelMatch[1].trim();

  // "at [Place Name Park/Field/Complex]"
  const atMatch = text.match(
    /\bat\s+([A-Z][A-Za-z\s']+(?:Park|Field|Complex|Stadium|Center|Centre))\b/
  );
  if (atMatch) return atMatch[1].trim();

  return null;
}

/**
 * Extract divisions / age group display text.
 */
function extractDivisionsDisplay(text) {
  const match = text.match(
    /(?:Divisions|Age\s*groups?|Ages)\s*:\s*(.+)/i
  );
  return match ? match[1].trim() : null;
}

/**
 * Extract a registration URL from markdown text.
 */
function extractRegistrationUrl(text, pageUrl) {
  // Markdown link with register-related text or href
  const linkPattern = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/gi;
  let m;
  while ((m = linkPattern.exec(text)) !== null) {
    const linkText = m[1].toLowerCase();
    const href = m[2].toLowerCase();
    if (
      /register|sign\s*up|signup/.test(linkText) ||
      /register|sign\s*up|signup/.test(href)
    ) {
      return m[2];
    }
  }

  // TourneyMachine pages are themselves registration portals
  if (pageUrl && pageUrl.includes('tourneymachine.com')) {
    return pageUrl;
  }

  return null;
}

/**
 * Extract the hosting organization.
 */
function extractHost(text) {
  const match = text.match(
    /(?:hosted\s+by|organizer|presented\s+by)\s*:?\s*(.+)/i
  );
  return match ? match[1].trim() : null;
}

/**
 * Extract a short description — first substantial line that isn't
 * a heading, link, image, table row, or list item.
 */
function extractDescription(text) {
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.length <= 30) continue;
    if (/^#{1,6}\s/.test(trimmed)) continue;       // heading
    if (/^\[.*\]\(.*\)$/.test(trimmed)) continue;  // standalone link
    if (/^!\[/.test(trimmed)) continue;             // image
    if (/^\|/.test(trimmed)) continue;              // table row
    if (/^[-*+]\s/.test(trimmed)) continue;         // unordered list
    if (/^\d+\.\s/.test(trimmed)) continue;         // ordered list

    return trimmed.length > 500 ? trimmed.slice(0, 500) : trimmed;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Page parser
// ---------------------------------------------------------------------------

/**
 * Parse a single scraped page into a tournament candidate object.
 * Returns null if essential fields (name, dates) are missing.
 */
function parseSinglePage(page) {
  const text = page.markdown || '';
  const name = extractName(text, page.title);
  if (!name) return null;

  const dates = extractDates(text);
  if (!dates) return null;

  return {
    name,
    startDate: dates.start,
    endDate: dates.end,
    location: extractLocation(text),
    divisionsDisplay: extractDivisionsDisplay(text),
    registrationUrl: extractRegistrationUrl(text, page.url),
    host: extractHost(text),
    description: extractDescription(text),
    flyerImageUrl: page.images && page.images.length > 0 ? page.images[0] : null,
    sourceUrl: page.url,
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Parse an array of scraped page results into tournament candidate objects.
 *
 * @param {Array<{url: string, title: string, markdown: string, images: string[]}>} pageResults
 * @returns {Array<Object>} Array of tournament candidate objects.
 */
export function parseTournaments(pageResults) {
  const candidates = pageResults
    .map((page) => parseSinglePage(page))
    .filter(Boolean);

  console.log(
    `[parse] Extracted ${candidates.length} tournament(s) from ${pageResults.length} page(s).`
  );

  return candidates;
}
