#!/usr/bin/env node
/**
 * Intake a signed PONY tournament affidavit PDF.
 *
 * Splits the bundle into per-page PDFs, uploads bundle + pages to Supabase
 * storage at team-docs/affidavit-final/{team_id}/, and inserts matching
 * team_documents rows (affidavit_final + affidavit_page_1/2/3...).
 *
 * Auto-detects the team from PDF text (substring match against
 * teams.team_name). Pass --team-id to override if detection misfires.
 *
 * Re-submissions: existing rows for (team_id, document_type) are deleted
 * along with their storage objects before the new upload, so a coach
 * sending a corrected affidavit cleanly replaces the old one.
 *
 * Usage:
 *   node scripts/intake_affidavit.mjs --pdf path/to/Affidavit.pdf
 *   node scripts/intake_affidavit.mjs --pdf path/to/Affidavit.pdf --team-id <uuid>
 *   node scripts/intake_affidavit.mjs --pdf path/to/Affidavit.pdf --dry-run
 */
import { createClient } from "@supabase/supabase-js";
import {
  readFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { execSync } from "node:child_process";

const ROOT = "/Users/joe/irvine-all-stars";
for (const line of readFileSync(`${ROOT}/.env.local`, "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
  db: { schema: "irvine_allstars" },
});

const BUCKET = "player-documents";

const args = process.argv.slice(2);
let pdfPath = null;
let teamIdOverride = null;
let dryRun = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--pdf") pdfPath = args[++i];
  else if (args[i] === "--team-id") teamIdOverride = args[++i];
  else if (args[i] === "--dry-run") dryRun = true;
}
if (!pdfPath) {
  console.error(
    "Usage: node scripts/intake_affidavit.mjs --pdf <path> [--team-id <uuid>] [--dry-run]"
  );
  process.exit(1);
}
if (!existsSync(pdfPath)) {
  console.error(`PDF not found: ${pdfPath}`);
  process.exit(1);
}

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}
function slugify(s) {
  return s.replace(/\s+/g, "-").replace(/[^A-Za-z0-9-]/g, "");
}

console.log(`Reading PDF: ${pdfPath}`);
const text = sh(`pdftotext -layout "${pdfPath}" -`);
const pageCount = parseInt(
  sh(`pdfinfo "${pdfPath}" | awk '/^Pages:/ {print $2}'`).trim(),
  10
);
console.log(`Pages: ${pageCount}`);

const { data: teams, error: teamsErr } = await supabase
  .from("teams")
  .select("id, division, team_name, coach_email");
if (teamsErr) {
  console.error("teams fetch:", teamsErr);
  process.exit(1);
}

let team = null;
if (teamIdOverride) {
  team = teams.find((t) => t.id === teamIdOverride);
  if (!team) {
    console.error(`team_id ${teamIdOverride} not found`);
    process.exit(1);
  }
  console.log(`Team override → ${team.team_name} (${team.division})`);
} else {
  // longest match wins to avoid "Mustang 9U" matching multiple Mustang teams
  const matches = teams
    .filter((t) => text.includes(t.team_name))
    .sort((a, b) => b.team_name.length - a.team_name.length);
  if (matches.length === 0) {
    console.error(
      "Could not auto-detect team. PDF text does not contain any teams.team_name. Pass --team-id <uuid>."
    );
    process.exit(1);
  }
  team = matches[0];
  console.log(`Auto-detected team → ${team.team_name} (${team.division})`);
  if (matches.length > 1) {
    console.log(
      `(Other partial matches: ${matches
        .slice(1)
        .map((m) => m.team_name)
        .join(", ")})`
    );
  }
}

let uploadedBy = null;
if (team.coach_email) {
  // Prefer the profile row whose id matches an auth.users id (the canonical
  // login). Some emails have duplicate profile rows from earlier migrations.
  const { data: candidates } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("email", team.coach_email);
  if (candidates && candidates.length > 0) {
    let canonical = candidates[0];
    if (candidates.length > 1) {
      const { data: authRow } = await supabase
        .schema("auth")
        .from("users")
        .select("id")
        .eq("email", team.coach_email)
        .maybeSingle();
      if (authRow) {
        const match = candidates.find((c) => c.id === authRow.id);
        if (match) canonical = match;
      }
    }
    uploadedBy = canonical.id;
    console.log(
      `Coach (uploaded_by) → ${canonical.full_name ?? canonical.email}` +
        (candidates.length > 1
          ? ` (picked from ${candidates.length} profile rows)`
          : "")
    );
  }
}
if (!uploadedBy) {
  console.warn(
    `WARN: no profile for coach_email=${team.coach_email}; uploaded_by will be null.`
  );
}

let coachLast = "Coach";
const mgr = text.match(/Manager\s+([A-Za-z'-]+),/);
if (mgr) coachLast = mgr[1];

const teamColor = team.team_name.split(" ").pop();
const slug = slugify(`${team.division}-${teamColor}-${coachLast}`);
console.log(`Slug: ${slug}`);

const localDir = `${ROOT}/shared-content/documents/affidavits/${slug}`;
mkdirSync(localDir, { recursive: true });
const bundleName = `${slug}-affidavit-bundle.pdf`;
copyFileSync(pdfPath, `${localDir}/${bundleName}`);
sh(`pdfseparate "${pdfPath}" "${localDir}/${slug}-affidavit-page-%d.pdf"`);

const records = [{ f: bundleName, type: "affidavit_final" }];
for (let n = 1; n <= pageCount; n++) {
  records.push({
    f: `${slug}-affidavit-page-${n}.pdf`,
    type: `affidavit_page_${n}`,
  });
}

console.log(`\nPlan:`);
console.log(`  team_id     = ${team.id}`);
console.log(`  division    = ${team.division}`);
console.log(`  uploaded_by = ${uploadedBy ?? "NULL"}`);
console.log(`  files:`);
for (const r of records) console.log(`    - ${r.f}  [${r.type}]`);

if (dryRun) {
  console.log(`\n(dry run - nothing uploaded or inserted)`);
  process.exit(0);
}

const ts = Date.now();
const inserted = [];
for (const { f, type } of records) {
  // wipe any existing row + storage object for this (team_id, document_type)
  const { data: existing } = await supabase
    .from("team_documents")
    .select("id, file_path")
    .eq("team_id", team.id)
    .eq("document_type", type);
  for (const row of existing ?? []) {
    if (row.file_path) {
      await supabase.storage.from(BUCKET).remove([row.file_path]);
    }
    await supabase.from("team_documents").delete().eq("id", row.id);
  }

  const storagePath = `team-docs/affidavit-final/${team.id}/${ts}-${f}`;
  const body = readFileSync(`${localDir}/${f}`);
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, body, {
      contentType: "application/pdf",
      upsert: false,
    });
  if (upErr) {
    console.error(`upload fail ${f}: ${upErr.message}`);
    continue;
  }
  const { error: dbErr, data } = await supabase
    .from("team_documents")
    .insert({
      document_type: type,
      file_path: storagePath,
      file_name: f,
      division: team.division,
      team_id: team.id,
      uploaded_by: uploadedBy,
    })
    .select("id")
    .single();
  if (dbErr) {
    console.error(`db fail ${f}: ${dbErr.message}`);
    continue;
  }
  inserted.push({ file: f, type, doc_id: data.id, path: storagePath });
  console.log(`✓ ${type} → ${storagePath}`);
}

console.log(
  `\nInserted ${inserted.length} of ${records.length} rows for ${team.team_name} (${team.division}).`
);
console.log(`Coach: https://irvineallstars.com/coach/checklist`);
console.log(`Admin: https://irvineallstars.com/admin/compliance`);
