import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const CATEGORIES = [
  { name: "Hitting", max: 9 },
  { name: "Fielding", max: 9 },
  { name: "Throwing", max: 9 },
  { name: "Running / Speed", max: 9 },
  { name: "Effort", max: 9 },
  { name: "Attitude", max: 9 },
];

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const divisionParam = request.nextUrl.searchParams.get("division");
  const isBlank = request.nextUrl.searchParams.get("blank") === "true";

  // Blank template doesn't need session_id or supabase
  if (!isBlank && !divisionParam && (!sessionId || !supabaseUrl || !supabaseAnonKey)) {
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

  if (!isBlank) {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      db: { schema: "irvine_allstars" },
    });

    const { data } = await supabase
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
    division: string;
    primary_position: string;
    secondary_position: string | null;
    bats: string;
    throws: string;
    current_team: string | null;
    jersey_number: string | null;
  }[] = [];

  if (!isBlank && (sessionId || divisionParam)) {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      db: { schema: "irvine_allstars" },
    });

    if (divisionParam) {
      // Fetch all players in the division directly
      const { data } = await supabase
        .from("tryout_registrations")
        .select(
          "player_first_name, player_last_name, division, primary_position, secondary_position, bats, throws, current_team, jersey_number"
        )
        .eq("division", divisionParam)
        .order("player_last_name")
        .order("player_first_name");

      players = data || [];
    } else if (sessionId) {
      // Fetch players assigned to a specific tryout session
      const { data: assignments } = await supabase
        .from("tryout_assignments")
        .select("registration_id")
        .eq("session_id", sessionId);

      const regIds = (assignments || []).map((a: { registration_id: string }) => a.registration_id);

      if (regIds.length > 0) {
        const { data } = await supabase
          .from("tryout_registrations")
          .select(
            "player_first_name, player_last_name, division, primary_position, secondary_position, bats, throws, current_team, jersey_number"
          )
          .in("id", regIds)
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

  // Colors
  const navy = "0A2342";
  const red = "C1121F";
  const gold = "F4B400";
  const lightGray = "F5F5F5";
  const white = "FFFFFF";

  // Column widths
  ws.columns = [
    { width: 5 },   // A: #
    { width: 16 },  // B: Last Name
    { width: 14 },  // C: First Name
    { width: 14 },  // D: Position
    { width: 8 },   // E: Bats
    { width: 8 },   // F: Throws
    { width: 14 },  // G: Team
    { width: 10 },  // H: Hitting (9)
    { width: 10 },  // I: Fielding (9)
    { width: 10 },  // J: Throwing (9)
    { width: 10 },  // K: Running/Speed (9)
    { width: 10 },  // L: Effort (9)
    { width: 10 },  // M: Attitude (9)
    { width: 10 },  // N: TOTAL
    { width: 20 },  // O: Notes
  ];

  // Row 1: Title
  ws.mergeCells("A1:O1");
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
  ws.mergeCells("A2:O2");
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
  ws.mergeCells("A3:O3");
  const guideCell = ws.getCell("A3");
  guideCell.value = "SCORING:  Score each category 1, 3, 5, 7, or 9 (9 = highest).  Total = 54 points possible.";
  guideCell.font = { size: 10, italic: true, color: { argb: red } };
  guideCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(3).height = 22;

  // Row 4: Category group headers
  ws.mergeCells("A4:G4");
  const playerHeaderCell = ws.getCell("A4");
  playerHeaderCell.value = "PLAYER INFO";
  playerHeaderCell.font = { bold: true, size: 10, color: { argb: white } };
  playerHeaderCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: navy } };
  playerHeaderCell.alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells("H4:M4");
  const evalHeaderCell = ws.getCell("H4");
  evalHeaderCell.value = "EVALUATION (fill in scores)";
  evalHeaderCell.font = { bold: true, size: 10, color: { argb: white } };
  evalHeaderCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: red } };
  evalHeaderCell.alignment = { horizontal: "center", vertical: "middle" };

  const totalHeaderCell = ws.getCell("N4");
  totalHeaderCell.value = "";
  totalHeaderCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: navy } };

  const notesHeaderCell = ws.getCell("O4");
  notesHeaderCell.value = "";
  notesHeaderCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: navy } };

  ws.getRow(4).height = 22;

  // Row 5: Column headers
  const headers = [
    "#",
    "Last Name",
    "First Name",
    "Position",
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
      fgColor: { argb: i >= 7 && i <= 12 ? red : navy },
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
  players.forEach((player, idx) => {
    const rowNum = 6 + idx;
    const row = ws.getRow(rowNum);
    const position = player.secondary_position && player.secondary_position !== "None"
      ? `${player.primary_position} / ${player.secondary_position}`
      : player.primary_position;

    const values = [
      idx + 1,
      player.player_last_name,
      player.player_first_name,
      position,
      player.bats,
      player.throws,
      player.current_team || "",
    ];

    // Player info columns
    values.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      cell.font = { size: 10 };
      cell.alignment = { horizontal: i === 0 ? "center" : "left", vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "DDDDDD" } },
        left: { style: "thin", color: { argb: "DDDDDD" } },
        right: { style: "thin", color: { argb: "DDDDDD" } },
      };
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F9F9F9" } };
      }
    });

    // Score columns (H-M) — yellow background, empty for coaches to fill
    for (let i = 7; i <= 12; i++) {
      const cell = row.getCell(i + 1);
      cell.value = null;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDE7" } };
      cell.font = { size: 12, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "DDDDDD" } },
        left: { style: "thin", color: { argb: gold } },
        right: { style: "thin", color: { argb: gold } },
      };
    }

    // Total column (N) — SUM formula
    const totalCell = row.getCell(14);
    totalCell.value = {
      formula: `SUM(H${rowNum}:M${rowNum})`,
      result: 0,
    };
    totalCell.font = { size: 12, bold: true, color: { argb: navy } };
    totalCell.alignment = { horizontal: "center", vertical: "middle" };
    totalCell.border = {
      bottom: { style: "thin", color: { argb: "DDDDDD" } },
      left: { style: "thin", color: { argb: navy } },
      right: { style: "thin", color: { argb: navy } },
    };

    // Notes column (O) — empty
    const notesCell = row.getCell(15);
    notesCell.value = null;
    notesCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDE7" } };
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

    for (let c = 2; c <= 7; c++) {
      const cell = row.getCell(c);
      cell.border = {
        bottom: { style: "thin", color: { argb: "EEEEEE" } },
      };
    }

    for (let c = 8; c <= 13; c++) {
      const cell = row.getCell(c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDE7" } };
      cell.border = {
        bottom: { style: "thin", color: { argb: "EEEEEE" } },
        left: { style: "thin", color: { argb: gold } },
        right: { style: "thin", color: { argb: gold } },
      };
    }

    const totalCell = row.getCell(14);
    totalCell.value = { formula: `SUM(H${rowNum}:M${rowNum})`, result: 0 };
    totalCell.font = { size: 12, bold: true, color: { argb: navy } };
    totalCell.alignment = { horizontal: "center", vertical: "middle" };

    row.getCell(15).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDE7" } };
    row.height = 22;
  }

  // Footer row
  const footerRowNum = 6 + players.length + blankRowCount + 1;
  ws.mergeCells(`A${footerRowNum}:O${footerRowNum}`);
  const footerCell = ws.getCell(`A${footerRowNum}`);
  footerCell.value = `Coach Name: ___________________________    Signature: ___________________________    Date: ______________`;
  footerCell.font = { size: 10, color: { argb: "666666" } };
  footerCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(footerRowNum).height = 32;

  // Print settings
  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 1 as ExcelJS.PaperSize,
  };

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
