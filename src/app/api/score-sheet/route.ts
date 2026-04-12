import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CATEGORIES = [
  { name: "Hitting", max: 9 },
  { name: "Fielding", max: 9 },
  { name: "Throwing", max: 9 },
  { name: "Running / Speed", max: 9 },
  { name: "Effort", max: 9 },
  { name: "Attitude", max: 9 },
];

const POSITION_ABBREV: Record<string, string> = {
  "Pitcher": "P",
  "Catcher": "C",
  "First Base": "1B",
  "Second Base": "2B",
  "Third Base": "3B",
  "Shortstop": "SS",
  "Left Field": "LF",
  "Center Field": "CF",
  "Right Field": "RF",
  "Designated Hitter": "DH",
  "Utility": "UTIL",
};

function abbrevPosition(pos: string): string {
  return POSITION_ABBREV[pos] || pos;
}

export async function GET(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  // Auth check — must come before any data access
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

  const db = createClient(supabaseUrl!, supabaseServiceKey || supabaseAnonKey!, {
    db: { schema: "irvine_allstars" },
  });

  const sessionId = request.nextUrl.searchParams.get("session_id");
  const divisionParam = request.nextUrl.searchParams.get("division");
  const isBlank = request.nextUrl.searchParams.get("blank") === "true";

  if (!isBlank && !divisionParam && !sessionId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  let session: {
    division: string;
    session_date: string;
    start_time: string;
    end_time: string | null;
    location: string;
    field: string | null;
    max_players: number;
  } | null = null;

  if (!isBlank && !divisionParam && sessionId) {
    const { data } = await db
      .from("tryout_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    session = data;

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
  }

  // Fetch assigned players (skip for blank template)
  let players: {
    player_first_name: string;
    player_last_name: string;
    player_date_of_birth: string | null;
    division: string;
    primary_position: string;
    secondary_position: string | null;
    bats: string;
    throws: string;
    current_team: string | null;
    jersey_number: string | null;
    tryout_order: number | null;
  }[] = [];

  if (!isBlank && (sessionId || divisionParam)) {
    if (divisionParam) {
      // Fetch all players in the division directly
      const { data } = await db
        .from("tryout_registrations")
        .select(
          "player_first_name, player_last_name, player_date_of_birth, division, primary_position, secondary_position, bats, throws, current_team, jersey_number, tryout_order"
        )
        .eq("division", divisionParam)
        .order("tryout_order", { ascending: true, nullsFirst: false })
        .order("player_last_name")
        .order("player_first_name");

      players = data || [];
    } else if (sessionId) {
      // Fetch players assigned to a specific tryout session
      const { data: assignments } = await db
        .from("tryout_assignments")
        .select("registration_id")
        .eq("session_id", sessionId);

      const regIds = (assignments || []).map((a: { registration_id: string }) => a.registration_id);

      if (regIds.length > 0) {
        const { data } = await db
          .from("tryout_registrations")
          .select(
            "player_first_name, player_last_name, player_date_of_birth, division, primary_position, secondary_position, bats, throws, current_team, jersey_number, tryout_order"
          )
          .in("id", regIds)
          .order("tryout_order", { ascending: true, nullsFirst: false })
          .order("player_last_name")
          .order("player_first_name");

        players = data || [];
      }
    }
  }

  // Format date/time for header
  const dateStr = session
    ? new Date(session.session_date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";
  function fmtTime(t: string) {
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:${m} ${ampm}`;
  }
  const timeStr = session
    ? session.end_time
      ? `${fmtTime(session.start_time)} – ${fmtTime(session.end_time)}`
      : fmtTime(session.start_time)
    : "";
  const locationStr = session
    ? session.field
      ? `${session.location} — ${session.field}`
      : session.location
    : "";

  // Build Excel
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Score Sheet");

  // Colors — B&W printer friendly
  const navy = "000000";
  const red = "000000";
  const gold = "CCCCCC";
  const lightGray = "F0F0F0";
  const white = "FFFFFF";

  // Column widths
  ws.columns = [
    { width: 5 },   // A: #
    { width: 16 },  // B: Last Name
    { width: 14 },  // C: First Name
    { width: 6 },   // D: Age
    { width: 10 },  // E: Position (abbreviated)
    { width: 8 },   // F: Bats
    { width: 8 },   // G: Throws
    { width: 14 },  // H: Team
    { width: 10 },  // I: Hitting (9)
    { width: 10 },  // J: Fielding (9)
    { width: 10 },  // K: Throwing (9)
    { width: 10 },  // L: Running/Speed (9)
    { width: 10 },  // M: Effort (9)
    { width: 10 },  // N: Attitude (9)
    { width: 10 },  // O: TOTAL
    { width: 20 },  // P: Notes
  ];

  // Row 1: Title
  ws.mergeCells("A1:P1");
  const titleCell = ws.getCell("A1");
  const sheetDivision = session?.division || divisionParam || "";
  titleCell.value = isBlank
    ? "IRVINE ALL-STARS — TRYOUT SCORE SHEET"
    : `IRVINE ALL-STARS — ${sheetDivision} TRYOUT SCORE SHEET`;
  titleCell.font = { bold: true, size: 14, color: { argb: white } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: navy } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 36;

  // Row 2: Session info
  ws.mergeCells("A2:P2");
  const infoCell = ws.getCell("A2");
  infoCell.value = isBlank
    ? "Division: _______________    Date: _______________    Location: _______________"
    : divisionParam && !session
    ? `Division: ${divisionParam}    Date: _______________    Coach: _______________`
    : `${dateStr}  |  ${timeStr}  |  ${locationStr}`;
  infoCell.font = { size: 11, color: { argb: navy } };
  infoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: lightGray } };
  infoCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 24;

  // Row 3: Scoring guide
  ws.mergeCells("A3:P3");
  const guideCell = ws.getCell("A3");
  guideCell.value = "SCORING:  Score each category 1, 3, 5, 7, or 9 (9 = highest).  Total = 54 points possible.";
  guideCell.font = { size: 10, italic: true, color: { argb: red } };
  guideCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(3).height = 22;

  // Row 4: Category group headers
  ws.mergeCells("A4:H4");
  const playerHeaderCell = ws.getCell("A4");
  playerHeaderCell.value = "PLAYER INFO";
  playerHeaderCell.font = { bold: true, size: 10, color: { argb: white } };
  playerHeaderCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: navy } };
  playerHeaderCell.alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells("I4:N4");
  const evalHeaderCell = ws.getCell("I4");
  evalHeaderCell.value = "EVALUATION (fill in scores)";
  evalHeaderCell.font = { bold: true, size: 10, color: { argb: white } };
  evalHeaderCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: red } };
  evalHeaderCell.alignment = { horizontal: "center", vertical: "middle" };

  const totalHeaderCell = ws.getCell("O4");
  totalHeaderCell.value = "";
  totalHeaderCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: navy } };

  const notesHeaderCell = ws.getCell("P4");
  notesHeaderCell.value = "";
  notesHeaderCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: navy } };

  ws.getRow(4).height = 22;

  // Row 5: Column headers
  const headers = [
    "#",
    "Last Name",
    "First Name",
    "Age",
    "Pos",
    "Bats",
    "Throws",
    "Team",
    ...CATEGORIES.map((c) => `${c.name} (${c.max})`),
    "TOTAL",
    "Notes",
  ];
  const headerRow = ws.getRow(5);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 9, color: { argb: white } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: i >= 8 && i <= 13 ? red : navy },
    };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: navy } },
      bottom: { style: "thin", color: { argb: navy } },
      left: { style: "thin", color: { argb: "DDDDDD" } },
      right: { style: "thin", color: { argb: "DDDDDD" } },
    };
  });
  headerRow.height = 30;

  // Player rows
  const now = new Date();
  players.forEach((player, idx) => {
    const rowNum = 6 + idx;
    const row = ws.getRow(rowNum);
    const pos1 = abbrevPosition(player.primary_position);
    const pos2 = player.secondary_position && player.secondary_position !== "None"
      ? abbrevPosition(player.secondary_position)
      : null;
    const position = pos2 ? `${pos1} / ${pos2}` : pos1;

    let age: number | string = "";
    if (player.player_date_of_birth) {
      const dob = new Date(player.player_date_of_birth);
      age = now.getFullYear() - dob.getFullYear();
      const monthDiff = now.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
        age--;
      }
    }

    const values = [
      player.tryout_order ?? idx + 1,
      player.player_last_name,
      player.player_first_name,
      age,
      "",
      "",
      "",
      player.current_team || "",
    ];

    // Player info columns (A-H, cols 1-8)
    values.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      cell.font = { size: 10 };
      cell.alignment = { horizontal: i === 0 || i === 3 ? "center" : "left", vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "DDDDDD" } },
        left: { style: "thin", color: { argb: "DDDDDD" } },
        right: { style: "thin", color: { argb: "DDDDDD" } },
      };
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F9F9F9" } };
      }
    });

    // Score columns (I-N, cols 9-14) — yellow background, empty for coaches to fill
    for (let c = 9; c <= 14; c++) {
      const cell = row.getCell(c);
      cell.value = null;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F0F0F0" } };
      cell.font = { size: 12, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "DDDDDD" } },
        left: { style: "thin", color: { argb: gold } },
        right: { style: "thin", color: { argb: gold } },
      };
    }

    // Total column (O, col 15) — SUM formula
    const totalCell = row.getCell(15);
    totalCell.value = {
      formula: `SUM(I${rowNum}:N${rowNum})`,
      result: 0,
    };
    totalCell.font = { size: 12, bold: true, color: { argb: navy } };
    totalCell.alignment = { horizontal: "center", vertical: "middle" };
    totalCell.border = {
      bottom: { style: "thin", color: { argb: "DDDDDD" } },
      left: { style: "thin", color: { argb: navy } },
      right: { style: "thin", color: { argb: navy } },
    };

    // Notes column (P, col 16) — empty
    const notesCell = row.getCell(16);
    notesCell.value = null;
    notesCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F0F0F0" } };
    notesCell.border = {
      bottom: { style: "thin", color: { argb: "DDDDDD" } },
      left: { style: "thin", color: { argb: "DDDDDD" } },
      right: { style: "thin", color: { argb: "DDDDDD" } },
    };

    row.height = 22;
  });

  // Add empty rows for walk-ins
  const blankRowCount = isBlank ? 30 : 5;
  for (let i = 0; i < blankRowCount; i++) {
    const rowNum = 6 + players.length + i;
    const row = ws.getRow(rowNum);
    row.getCell(1).value = players.length + i + 1;
    row.getCell(1).font = { size: 10, color: { argb: "BBBBBB" } };
    row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    for (let c = 2; c <= 8; c++) {
      const cell = row.getCell(c);
      cell.border = {
        bottom: { style: "thin", color: { argb: "EEEEEE" } },
      };
    }

    for (let c = 9; c <= 14; c++) {
      const cell = row.getCell(c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F0F0F0" } };
      cell.border = {
        bottom: { style: "thin", color: { argb: "EEEEEE" } },
        left: { style: "thin", color: { argb: gold } },
        right: { style: "thin", color: { argb: gold } },
      };
    }

    const totalCell = row.getCell(15);
    totalCell.value = { formula: `SUM(I${rowNum}:N${rowNum})`, result: 0 };
    totalCell.font = { size: 12, bold: true, color: { argb: navy } };
    totalCell.alignment = { horizontal: "center", vertical: "middle" };

    row.getCell(16).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F0F0F0" } };
    row.height = 22;
  }

  // Footer row
  const footerRowNum = 6 + players.length + blankRowCount + 1;
  ws.mergeCells(`A${footerRowNum}:P${footerRowNum}`);
  const footerCell = ws.getCell(`A${footerRowNum}`);
  footerCell.value = `Coach Name: ___________________________    Signature: ___________________________    Date: ______________`;
  footerCell.font = { size: 10, color: { argb: "666666" } };
  footerCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(footerRowNum).height = 32;

  // Print settings — landscape, fit to one page wide, narrow margins
  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
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

  // Repeat header rows (title + column headers) on every printed page
  ws.pageSetup.printTitlesRow = "1:5";

  // Generate buffer
  const buffer = await wb.xlsx.writeBuffer();

  const filename = isBlank
    ? "Irvine_All-Stars_Blank_Score_Sheet.xlsx"
    : divisionParam
    ? `${divisionParam.replace(/\s+/g, "-")}_Score_Sheet.xlsx`
    : `${session!.division.replace(/\s+/g, "-")}_Score_Sheet_${session!.session_date}.xlsx`;

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
