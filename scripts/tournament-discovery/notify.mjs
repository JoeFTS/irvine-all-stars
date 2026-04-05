/**
 * notify.mjs — Module 8: Admin email notification
 *
 * Sends a summary email to the admin when new tournaments are discovered
 * and inserted into the database.
 */

import { Resend } from 'resend';
import { RESEND_API_KEY, ADMIN_EMAIL, SITE_URL } from './config.mjs';

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
    return `${s.toLocaleDateString('en-US', opts)} ${s.getDate()}, ${s.getFullYear()}`;
  }

  if (s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString('en-US', opts)} ${s.getDate()}-${e.getDate()}, ${s.getFullYear()}`;
  }

  // Different months
  return `${s.toLocaleDateString('en-US', opts)} ${s.getDate()} - ${e.toLocaleDateString('en-US', opts)} ${e.getDate()}, ${e.getFullYear()}`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Send an admin notification email summarizing newly inserted tournaments.
 *
 * @param {Array<Object>} insertedTournaments - Supabase row objects (snake_case fields)
 */
export async function notifyAdmin(insertedTournaments) {
  if (!insertedTournaments || insertedTournaments.length === 0) {
    console.log('[notify] No new tournaments — skipping admin notification.');
    return;
  }

  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    console.warn(
      '[notify] RESEND_API_KEY or ADMIN_EMAIL not configured — skipping email notification.',
    );
    return;
  }

  const count = insertedTournaments.length;
  const plural = count === 1 ? '' : 's';

  // Build the plain-text tournament list
  const tournamentList = insertedTournaments
    .map((t) => {
      const dateRange = (t.start_date && t.end_date)
        ? formatDateRange(t.start_date, t.end_date)
        : '(dates unknown)';
      const location = t.location || 'Location TBD';
      return `\u2022 ${t.name}\n  ${dateRange} \u2014 ${location}`;
    })
    .join('\n\n');

  const adminUrl = `${SITE_URL}/admin/tournaments`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="margin-top: 0;">${count} New Tournament${plural} Found</h2>
  <p>The tournament discovery pipeline just found <strong>${count}</strong> new tournament${plural} and saved them as drafts. They won't be visible to parents until you review and publish them.</p>
  <pre style="background: #f5f5f5; border-radius: 8px; padding: 16px; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${tournamentList}</pre>
  <p style="color: #666; font-size: 14px;">These tournaments are saved as <strong>drafts</strong> and won't appear on the site until you publish them.</p>
  <div style="margin-top: 24px;">
    <a href="${adminUrl}" style="display: inline-block; background: #0F1B2D; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">Review Tournaments</a>
  </div>
  <p style="color: #999; font-size: 12px; margin-top: 32px;">Irvine All-Stars Tournament Discovery</p>
</body>
</html>`.trim();

  try {
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: 'Irvine All-Stars <noreply@irvineallstars.com>',
      to: ADMIN_EMAIL,
      subject: `${count} New Tournament${plural} Discovered \u2014 Review Needed`,
      html,
    });

    console.log(`[notify] Email sent to ${ADMIN_EMAIL} — ${count} tournament${plural} reported.`);
  } catch (err) {
    console.error('[notify] Failed to send admin email:', err.message);
  }
}
