#!/usr/bin/env node
/**
 * One-off: upload the 12 Coach Ty 10U contracts into Supabase storage
 * and insert matching player_documents rows (document_type='signed_contract').
 * Files live at: shared-content/documents/Coach Ty 10u Contracts/
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
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

const COACH_ID = "5b5fd0b4-319d-4818-98f3-0fb67765da16";
const DIVISION = "10U-Mustang";
const CONTRACT_DIR = "shared-content/documents/Coach Ty 10u Contracts";
const BUCKET = "player-documents";

// file first-name → registration id (from prior inserts)
const map = {
  Anthony:  "a0872697-6e38-44c3-bfe1-67538631dce3",
  Brayden:  "e6a2a7c4-de21-450a-97f2-3d5389b727dc",
  Cammy:    "ea99ffe2-5456-4da2-9c2d-635bb7b4f636",
  Easton:   "716b5c80-e991-4c2b-9945-353cefea7f62",
  Eric:     "2ff147ad-1821-44ad-9c3c-09113dce7800",
  Ezekiel:  "a1ea1367-b422-4396-96f9-2fb424543f2d",
  Ivan:     "db3335ac-49d3-4df6-bef4-a15057c17f00",
  Jay:      "28ecb501-b6bb-4ce0-bde4-80d57c45f738",
  Kathan:   "ac0a595d-2ea9-4d1a-90e1-a05703626981",
  Kimi:     "277d124f-b3d5-40ab-b23a-546c4c27fee7",
  Marshall: "f193da13-5dd5-40a7-aca4-dadfe8885277",
  Nolan:    "6cf75f1e-8864-4a2d-98a0-7eca066de81d",
};

const files = readdirSync(CONTRACT_DIR).filter((f) => !f.startsWith("."));
const results = [];

for (const f of files) {
  const firstName = basename(f, f.slice(f.lastIndexOf(".")));
  const regId = map[firstName];
  if (!regId) {
    console.warn(`skip ${f}: no registration mapping`);
    continue;
  }

  const { data: reg, error: regErr } = await supabase
    .from("tryout_registrations")
    .select("player_first_name, player_last_name")
    .eq("id", regId)
    .single();
  if (regErr || !reg) {
    console.error(`skip ${f}: reg fetch failed`, regErr?.message);
    continue;
  }

  const ext = f.slice(f.lastIndexOf(".")).toLowerCase();
  const storagePath = `signed-contracts/${regId}/${Date.now()}-${f}`;
  const body = readFileSync(join(CONTRACT_DIR, f));
  const contentType = ext === ".pdf" ? "application/pdf"
    : ext === ".jpeg" || ext === ".jpg" ? "image/jpeg"
    : ext === ".png" ? "image/png"
    : "application/octet-stream";

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, body, { contentType, upsert: false });
  if (upErr) {
    console.error(`upload failed ${f}:`, upErr.message);
    continue;
  }

  const { error: dbErr, data: doc } = await supabase
    .from("player_documents")
    .insert({
      registration_id: regId,
      player_name: `${reg.player_first_name} ${reg.player_last_name}`,
      division: DIVISION,
      document_type: "signed_contract",
      file_path: storagePath,
      file_name: f,
      uploaded_by: COACH_ID,
      status: "approved",
    })
    .select("id")
    .single();

  if (dbErr) {
    console.error(`db insert failed ${f}:`, dbErr.message);
    continue;
  }

  results.push({ file: f, player: `${reg.player_first_name} ${reg.player_last_name}`, doc_id: doc.id, path: storagePath });
  console.log(`✓ ${f} → ${reg.player_first_name} ${reg.player_last_name}`);
}

console.log(`\nUploaded ${results.length} of ${files.length}`);
