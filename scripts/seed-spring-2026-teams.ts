#!/usr/bin/env -S npx tsx
/**
 * Seed Spring 2026 teams + team_coaches from CSV.
 * Re-runnable: upserts teams by (division, team_name, season=2026).
 * For each coach email present, looks up profiles by email; if found,
 * inserts a team_coaches row. If no profile yet, logs and continues.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-spring-2026-teams.ts
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  db: { schema: "irvine_allstars" },
  auth: { persistSession: false, autoRefreshToken: false },
});

interface Row {
  division: string;
  team_name: string;
  coach_name: string;
  coach_email: string;
  second_coach_email: string;
}

async function main() {
  const csvPath = path.join(process.cwd(), "sample-data/spring-2026-teams.csv");
  const text = fs.readFileSync(csvPath, "utf8");
  const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true }) as Row[];

  let teamsCreated = 0,
    teamsExisted = 0,
    coachesLinked = 0,
    coachesMissing = 0;

  for (const r of rows) {
    if (!r.team_name) continue;

    // Upsert team
    const { data: existing } = await sb
      .from("teams")
      .select("id")
      .eq("division", r.division)
      .eq("team_name", r.team_name)
      .eq("season", 2026)
      .maybeSingle();

    let teamId: string;
    if (existing) {
      teamId = existing.id;
      teamsExisted++;
    } else {
      const { data: created, error } = await sb
        .from("teams")
        .insert({
          division: r.division,
          team_name: r.team_name,
          season: 2026,
          coach_email: r.coach_email || null,
        })
        .select("id")
        .single();
      if (error || !created) {
        console.error(`! Failed to create team ${r.team_name}:`, error?.message);
        continue;
      }
      teamId = created.id;
      teamsCreated++;
    }

    // Link coach(es) via team_coaches
    const emails = [r.coach_email, r.second_coach_email].map((e) => e?.trim()).filter(Boolean);
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const role = i === 0 ? "head" : "assistant";

      const { data: profile } = await sb
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

      if (!profile) {
        console.log(`  - no profile yet for ${email} (team ${r.team_name})`);
        coachesMissing++;
        continue;
      }

      const { error: tcErr } = await sb
        .from("team_coaches")
        .upsert(
          { team_id: teamId, coach_id: profile.id, role },
          { onConflict: "team_id,coach_id" }
        );
      if (tcErr) {
        console.error(`  ! Failed to link ${email}:`, tcErr.message);
        continue;
      }
      coachesLinked++;
    }
  }

  console.log(`\nDone.`);
  console.log(`  Teams created: ${teamsCreated}`);
  console.log(`  Teams existed: ${teamsExisted}`);
  console.log(`  Coaches linked: ${coachesLinked}`);
  console.log(`  Coaches missing profile: ${coachesMissing}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
