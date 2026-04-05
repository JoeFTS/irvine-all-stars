/**
 * Firecrawl Search & Scrape Module
 * Second module of the tournament discovery pipeline.
 *
 * Wraps Firecrawl's HTTP API for Google search and page scraping.
 * Exports: searchAndScrape()
 */

import {
  FIRECRAWL_URL,
  SEARCH_QUERIES,
  AGGREGATOR_URLS,
  SCRAPE_DELAY_MS,
} from './config.mjs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Promise-based delay. */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Firecrawl API wrappers
// ---------------------------------------------------------------------------

/**
 * Search Google via Firecrawl and return scraped results.
 * @param {string} query - Search query string
 * @returns {Promise<Array<{url: string, title: string, description: string, markdown: string}>>}
 */
async function firecrawlSearch(query) {
  try {
    const res = await fetch(`${FIRECRAWL_URL}/v1/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        limit: 10,
        scrapeOptions: { formats: ['markdown'] },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      console.error(`[search] Firecrawl search failed (${res.status}): ${await res.text()}`);
      return [];
    }

    const json = await res.json();
    const results = json.data ?? [];

    return results.map((r) => ({
      url: r.url ?? '',
      title: r.metadata?.title ?? r.title ?? '',
      description: r.metadata?.description ?? r.description ?? '',
      markdown: r.markdown ?? '',
    }));
  } catch (err) {
    console.error(`[search] Firecrawl search error for "${query}":`, err.message);
    return [];
  }
}

/**
 * Scrape a single URL via Firecrawl.
 * @param {string} url - URL to scrape
 * @returns {Promise<{url: string, title: string, markdown: string, images: string[]} | null>}
 */
async function firecrawlScrape(url) {
  try {
    const res = await fetch(`${FIRECRAWL_URL}/v1/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      console.error(`[scrape] Firecrawl scrape failed (${res.status}) for ${url}: ${await res.text()}`);
      return null;
    }

    const json = await res.json();
    const data = json.data ?? {};

    return {
      url: data.metadata?.sourceURL ?? url,
      title: data.metadata?.title ?? '',
      markdown: data.markdown ?? '',
      images: extractImageUrls(data.markdown ?? '', url),
    };
  } catch (err) {
    console.error(`[scrape] Firecrawl scrape error for ${url}:`, err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Image extraction
// ---------------------------------------------------------------------------

/** Patterns that indicate an image is NOT a flyer/tournament image. */
const SKIP_PATTERNS = [
  /logo/i, /icon/i, /favicon/i, /avatar/i, /pixel/i, /tracking/i,
  /facebook/i, /twitter/i, /instagram/i, /linkedin/i, /youtube/i,
  /badge/i, /button/i, /banner-ad/i, /\.svg(\?|$)/i, /1x1/i, /spacer/i,
];

/** Patterns that indicate an image IS likely a flyer/tournament image. */
const ACCEPT_PATTERNS = [
  /flyer/i, /flier/i, /tournament/i, /event/i, /poster/i, /classic/i,
  /championship/i, /invitational/i,
  /\.jpg(\?|$)/i, /\.jpeg(\?|$)/i, /\.png(\?|$)/i, /\.webp(\?|$)/i,
];

/**
 * Determine if an image URL is likely a flyer/tournament image.
 * @param {string} url
 * @param {string} alt
 * @returns {boolean}
 */
function isLikelyFlyerImage(url, alt) {
  const combined = `${url} ${alt}`;

  // Reject if it matches any skip pattern
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(combined)) return false;
  }

  // Accept if it matches any accept pattern
  for (const pattern of ACCEPT_PATTERNS) {
    if (pattern.test(combined)) return true;
  }

  return false;
}

/**
 * Extract image URLs from markdown content.
 * Filters to likely flyer images and resolves relative URLs.
 * @param {string} markdown
 * @param {string} pageUrl
 * @returns {string[]}
 */
function extractImageUrls(markdown, pageUrl) {
  if (!markdown) return [];

  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images = [];
  let match;

  while ((match = imageRegex.exec(markdown)) !== null) {
    const alt = match[1];
    const src = match[2];

    if (!isLikelyFlyerImage(src, alt)) continue;

    // Resolve relative URLs against page URL
    try {
      const resolved = new URL(src, pageUrl).href;
      images.push(resolved);
    } catch {
      // Skip malformed URLs
    }
  }

  return images;
}

// ---------------------------------------------------------------------------
// Tournament link extraction
// ---------------------------------------------------------------------------

/** Terms that indicate a link points to a tournament page. */
const TOURNAMENT_TERMS = /tournament|classic|championship|invitational|cup|series|shootout|showdown|showcase/i;

/**
 * Extract tournament-related links from markdown content.
 * @param {string} markdown
 * @param {string} baseUrl
 * @returns {Array<{text: string, url: string}>}
 */
function extractTournamentLinks(markdown, baseUrl) {
  if (!markdown) return [];

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  const seen = new Set();
  let match;

  while ((match = linkRegex.exec(markdown)) !== null) {
    const text = match[1];
    const href = match[2];

    if (!TOURNAMENT_TERMS.test(text)) continue;

    try {
      const resolved = new URL(href, baseUrl).href;
      if (seen.has(resolved)) continue;
      seen.add(resolved);
      links.push({ text, url: resolved });
    } catch {
      // Skip malformed URLs
    }
  }

  return links;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

/**
 * Search and scrape tournament data from Google and aggregator sites.
 * @returns {Promise<Array<{url: string, title: string, markdown: string, images: string[], source: string}>>}
 */
export async function searchAndScrape() {
  const results = [];
  const seenUrls = new Set();

  /**
   * Add a result if its URL hasn't been seen yet.
   * @param {{url: string, title: string, markdown: string, images: string[], source: string}} item
   */
  function addResult(item) {
    if (!item || !item.url || seenUrls.has(item.url)) return;
    seenUrls.add(item.url);
    results.push(item);
  }

  // -----------------------------------------------------------------------
  // Phase 1: Google search via Firecrawl
  // -----------------------------------------------------------------------
  console.log(`\n=== Phase 1: Google search (${SEARCH_QUERIES.length} queries) ===`);

  for (const query of SEARCH_QUERIES) {
    console.log(`[search] Querying: "${query}"`);
    const searchResults = await firecrawlSearch(query);
    console.log(`[search]   -> ${searchResults.length} results`);

    for (const r of searchResults) {
      addResult({
        url: r.url,
        title: r.title,
        markdown: r.markdown,
        images: extractImageUrls(r.markdown, r.url),
        source: 'google',
      });
    }

    await sleep(SCRAPE_DELAY_MS);
  }

  console.log(`[search] Phase 1 complete: ${results.length} unique results`);

  // -----------------------------------------------------------------------
  // Phase 2: Direct aggregator scraping
  // -----------------------------------------------------------------------
  console.log(`\n=== Phase 2: Aggregator scraping (${AGGREGATOR_URLS.length} sites) ===`);

  const aggregatorResults = [];

  for (const url of AGGREGATOR_URLS) {
    console.log(`[scrape] Scraping aggregator: ${url}`);
    const scraped = await firecrawlScrape(url);

    if (scraped) {
      console.log(`[scrape]   -> Got ${scraped.markdown.length} chars, ${scraped.images.length} images`);
      addResult({ ...scraped, source: 'aggregator' });
      aggregatorResults.push(scraped);
    } else {
      console.log(`[scrape]   -> Failed`);
    }

    await sleep(SCRAPE_DELAY_MS);
  }

  console.log(`[scrape] Phase 2 complete: ${results.length} total unique results`);

  // -----------------------------------------------------------------------
  // Phase 3: Follow tournament links from aggregator pages
  // -----------------------------------------------------------------------
  console.log(`\n=== Phase 3: Aggregator detail pages ===`);

  const detailLinks = [];
  for (const agg of aggregatorResults) {
    const links = extractTournamentLinks(agg.markdown, agg.url);
    for (const link of links) {
      if (!seenUrls.has(link.url)) {
        detailLinks.push(link);
      }
    }
  }

  console.log(`[detail] Found ${detailLinks.length} tournament detail links to scrape`);

  for (const link of detailLinks) {
    console.log(`[detail] Scraping: ${link.url}`);
    const scraped = await firecrawlScrape(link.url);

    if (scraped) {
      console.log(`[detail]   -> Got ${scraped.markdown.length} chars, ${scraped.images.length} images`);
      addResult({ ...scraped, source: 'aggregator-detail' });
    } else {
      console.log(`[detail]   -> Failed`);
    }

    await sleep(SCRAPE_DELAY_MS);
  }

  console.log(`\n=== Search & scrape complete: ${results.length} total results ===`);
  return results;
}
