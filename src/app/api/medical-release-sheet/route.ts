import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const WAIVER_TEXT = `1. I, as the parent or guardian, do hereby give my approval for their participation in any and all PONY BASEBALL or SOFTBALL organization league activities. I hereby grant my permission to managing personnel or other organization league representatives to authorize and obtain medical care, at my expense, from any licensed physician, hospital or medical clinic should the player become ill or injured while participating in organization league activities away from home, or where neither parent nor legal guardian is available to grant authorization for emergency treatment.

I assume all risks and hazards incidental to my child's participation, including transportation to and from the activities, and do hereby waive, release, absolve, indemnify and agree to hold harmless the local league, PONY Baseball, Inc., the organizers, sponsors, supervisors, participants and persons transporting the player to and from the activities, for any and all claims arising out of an injury to the player.

I further agree to furnish certified birth documentation for the player, upon request by organization league officials, and to return upon request the uniform and other equipment issued to the player in as good a condition as when received, except for normal wear and tear in organization league activities.

I acknowledge that participation includes possible exposure to an illness from COVID-19. I knowingly and freely assume all such risks, both known and unknown, even if arising from the negligence of other participants and assume all responsibility for my participation.

I hereby release and hold harmless PONY Baseball, Inc., their officers, officials, and/or employees, other participants, sponsors, and advertisers, with respect to any and all illness, disability, death, or loss or damage to person or property, whether arising from the negligence of releasees or otherwise, to the fullest extent permitted by law.`;

export async function GET(request: NextRequest) {
  const division = request.nextUrl.searchParams.get("division");

  if (!division) {
    return NextResponse.json({ error: "Missing division parameter" }, { status: 400 });
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  // Auth check
  const authHeader = request.headers.get("authorization");
  const cookieHeader = request.headers.get("cookie");
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: "irvine_allstars" },
    global: {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    },
  });
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabaseAuth.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "coach"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: "irvine_allstars" },
  });

  // Fetch signed contracts to get registration IDs
  const { data: contracts } = await supabase
    .from("player_contracts")
    .select("registration_id");

  const contractRegIds = new Set(
    (contracts || []).map((c: { registration_id: string }) => c.registration_id)
  );

  // Fetch selected/alternate players in this division
  const { data: allPlayers } = await supabase
    .from("tryout_registrations")
    .select("id, player_first_name, player_last_name, division")
    .eq("division", division)
    .in("status", ["selected", "alternate"])
    .order("player_last_name")
    .order("player_first_name");

  // Only include players who have signed contracts
  const players = (allPlayers || []).filter((p: { id: string }) =>
    contractRegIds.has(p.id)
  );

  // Build Excel
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Medical Release");

  // Colors
  const navy = "0A2342";
  const lightGray = "F5F5F5";
  const white = "FFFFFF";

  // Column widths — sized to fill landscape letter (~10" printable, 1 char ≈ 0.075")
  ws.columns = [
    { width: 38 }, // A: Full Name
    { width: 44 }, // B: Signature
    { width: 44 }, // C: Print Name
    { width: 20 }, // D: Relationship
    { width: 18 }, // E: Date
  ];

  // Row 1: Title
  ws.mergeCells("A1:E1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "IRVINE PONY BASEBALL — MEDICAL RELEASE / HOLD HARMLESS";
  titleCell.font = { bold: true, size: 11, color: { argb: white } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: navy } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 22;

  // Row 2: Division and season info
  ws.mergeCells("A2:E2");
  const infoCell = ws.getCell("A2");
  infoCell.value = `Division: ${division}    2026 All-Stars Season`;
  infoCell.font = { size: 9, color: { argb: navy } };
  infoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: lightGray } };
  infoCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 18;

  // Rows 3-4: Legal waiver text (compact — 2 merged rows with tiny font)
  ws.mergeCells("A3:E4");
  const waiverCell = ws.getCell("A3");
  waiverCell.value = WAIVER_TEXT;
  waiverCell.font = { size: 6 };
  waiverCell.alignment = {
    horizontal: "left",
    vertical: "top",
    wrapText: true,
  };
  ws.getRow(3).height = 58;
  ws.getRow(4).height = 58;

  // Row 5: Column headers
  const headers = [
    "Full Name (Last, First Middle)",
    "Signature of Parent or Legal Guardian",
    "Print Name of Parent or Legal Guardian",
    "Relationship",
    "Date",
  ];
  const headerRow = ws.getRow(5);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 8, color: { argb: white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: navy } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: navy } },
      bottom: { style: "thin", color: { argb: navy } },
      left: { style: "thin", color: { argb: navy } },
      right: { style: "thin", color: { argb: navy } },
    };
  });
  headerRow.height = 22;

  // Row 6+: Player data rows
  const DATA_START_ROW = 6;
  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "CCCCCC" } },
    bottom: { style: "thin", color: { argb: "CCCCCC" } },
    left: { style: "thin", color: { argb: "CCCCCC" } },
    right: { style: "thin", color: { argb: "CCCCCC" } },
  };

  players.forEach(
    (
      player: {
        player_first_name: string;
        player_last_name: string;
      },
      idx: number
    ) => {
      const rowNum = DATA_START_ROW + idx;
      const row = ws.getRow(rowNum);
      const bgColor = idx % 2 === 1 ? lightGray : white;

      const nameCell = row.getCell(1);
      nameCell.value = `${player.player_last_name}, ${player.player_first_name}`;
      nameCell.font = { size: 9 };
      nameCell.alignment = { vertical: "middle" };
      nameCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      nameCell.border = borderStyle;

      for (let c = 2; c <= 5; c++) {
        const cell = row.getCell(c);
        cell.value = null;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
        cell.border = borderStyle;
      }

      row.height = 22;
    }
  );

  // Add 3 blank rows for walk-ins
  for (let i = 0; i < 3; i++) {
    const rowNum = DATA_START_ROW + players.length + i;
    const row = ws.getRow(rowNum);
    const bgColor = (players.length + i) % 2 === 1 ? lightGray : white;

    for (let c = 1; c <= 5; c++) {
      const cell = row.getCell(c);
      cell.value = null;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.border = borderStyle;
    }
    row.height = 22;
  }

  // Print settings — landscape, fit to 1 page wide, narrow margins
  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    paperSize: 1 as ExcelJS.PaperSize,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.5,
      bottom: 0.5,
      header: 0.25,
      footer: 0.25,
    },
  };

  // Repeat header rows (title through column headers) on every printed page
  ws.pageSetup.printTitlesRow = "1:5";

  // Generate buffer
  const buffer = await wb.xlsx.writeBuffer();

  const filename = `${division.replace(/\s+/g, "_")}_Medical_Release_Sheet.xlsx`;

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
