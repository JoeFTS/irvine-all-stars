/**
 * Score parsing and validation utilities for coach score entry.
 * Supports TSV (paste from Google Sheets), CSV, and XLSX input.
 */

export interface ParsedScore {
  rowIndex: number;
  playerNumber: string;
  lastName: string;
  firstName: string;
  position: string;
  bats: string;
  throws: string;
  team: string;
  hitting: number | null;
  fielding: number | null;
  throwing: number | null;
  running: number | null;
  effort: number | null;
  attitude: number | null;
  total: number | null;
  notes: string;
  errors: string[];
  status: "valid" | "warning" | "error";
}

const VALID_SCORES = [1, 3, 5, 7, 9];
const MAX_SCORE = 9;
const MAX_TOTAL = 54;

const HEADER_KEYWORDS = [
  "last name",
  "first name",
  "hitting",
  "fielding",
  "irvine",
  "scoring:",
  "player info",
  "evaluation",
  "#",
];

function isHeaderRow(cells: string[]): boolean {
  const joined = cells.join(" ").toLowerCase();
  return HEADER_KEYWORDS.some((kw) => joined.includes(kw));
}

function isEmptyRow(cells: string[]): boolean {
  return cells.every((c) => c.trim() === "");
}

function parseNumber(val: string): number | null {
  const trimmed = val.trim();
  if (trimmed === "" || trimmed === "-") return null;
  const num = parseInt(trimmed, 10);
  return isNaN(num) ? null : num;
}

function computeTotal(score: ParsedScore): number | null {
  const vals = [
    score.hitting,
    score.fielding,
    score.throwing,
    score.running,
    score.effort,
    score.attitude,
  ];
  const filled = vals.filter((v) => v !== null) as number[];
  if (filled.length === 0) return null;
  return filled.reduce((a, b) => a + b, 0);
}

/**
 * Map an array of cell values to a ParsedScore.
 * Expected column order (matching Excel template):
 * 0: #, 1: Last Name, 2: First Name, 3: Position, 4: Bats, 5: Throws,
 * 6: Team, 7: Hitting, 8: Fielding, 9: Throwing, 10: Running, 11: Effort,
 * 12: Attitude, 13: Total, 14: Notes
 */
function cellsToScore(cells: string[], rowIndex: number): ParsedScore {
  const score: ParsedScore = {
    rowIndex,
    playerNumber: (cells[0] || "").trim(),
    lastName: (cells[1] || "").trim(),
    firstName: (cells[2] || "").trim(),
    position: (cells[3] || "").trim(),
    bats: (cells[4] || "").trim(),
    throws: (cells[5] || "").trim(),
    team: (cells[6] || "").trim(),
    hitting: parseNumber(cells[7] || ""),
    fielding: parseNumber(cells[8] || ""),
    throwing: parseNumber(cells[9] || ""),
    running: parseNumber(cells[10] || ""),
    effort: parseNumber(cells[11] || ""),
    attitude: parseNumber(cells[12] || ""),
    total: null,
    notes: (cells[14] || cells[13] || "").trim(),
    errors: [],
    status: "valid",
  };

  // If column 13 looks like a total (number), use column 14 for notes
  if (cells[13] && cells[14]) {
    score.notes = cells[14].trim();
  } else if (cells[13] && parseNumber(cells[13]) !== null && !cells[14]) {
    // Column 13 is the total, no notes
    score.notes = "";
  } else if (cells[13] && parseNumber(cells[13]) === null) {
    // Column 13 is actually notes (no total column or fewer columns)
    score.notes = cells[13].trim();
  }

  score.total = computeTotal(score);
  return score;
}

function splitCSVLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cells.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  cells.push(current);
  return cells;
}

/**
 * Parse tab-separated values (from Google Sheets / Excel copy-paste).
 */
export function parseTSV(text: string): ParsedScore[] {
  const lines = text.split(/\r?\n/);
  const scores: ParsedScore[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cells = line.split("\t");
    if (isHeaderRow(cells)) continue;
    if (isEmptyRow(cells)) continue;

    // Skip rows that only have a number in the first column and nothing else
    const hasContent = cells.slice(1).some((c) => c.trim() !== "");
    if (!hasContent) continue;

    scores.push(cellsToScore(cells, i + 1));
  }

  return scores;
}

/**
 * Parse comma-separated values.
 */
export function parseCSV(text: string): ParsedScore[] {
  const lines = text.split(/\r?\n/);
  const scores: ParsedScore[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cells = splitCSVLine(line);
    if (isHeaderRow(cells)) continue;
    if (isEmptyRow(cells)) continue;

    const hasContent = cells.slice(1).some((c) => c.trim() !== "");
    if (!hasContent) continue;

    scores.push(cellsToScore(cells, i + 1));
  }

  return scores;
}

/**
 * Parse an XLSX file buffer using ExcelJS (dynamic import).
 */
export async function parseXLSX(
  buffer: ArrayBuffer
): Promise<ParsedScore[]> {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.worksheets[0];
  if (!ws) return [];

  const scores: ParsedScore[] = [];

  ws.eachRow((row, rowNumber) => {
    const cells: string[] = [];
    for (let i = 1; i <= 16; i++) {
      const cell = row.getCell(i);
      // Use formula result if available
      const val = cell.result !== undefined ? cell.result : cell.value;
      cells.push(val != null ? String(val) : "");
    }

    if (isHeaderRow(cells)) return;
    if (isEmptyRow(cells)) return;

    // Skip rows with only a number in column A
    const hasContent = cells.slice(1).some((c) => c.trim() !== "");
    if (!hasContent) return;

    // Skip signature/footer rows
    const joined = cells.join(" ").toLowerCase();
    if (joined.includes("coach name") || joined.includes("signature")) return;

    scores.push(cellsToScore(cells, rowNumber));
  });

  return scores;
}

/**
 * Validate parsed scores and set error/warning status.
 */
export function validateScores(
  rows: ParsedScore[],
  registrationNames?: string[]
): ParsedScore[] {
  const nameSet = registrationNames
    ? new Set(registrationNames.map((n) => n.toLowerCase().trim()))
    : null;

  const seenNames = new Set<string>();

  return rows.map((row) => {
    const errors: string[] = [];
    let status: "valid" | "warning" | "error" = "valid";

    // Name required
    if (!row.lastName && !row.firstName) {
      errors.push("Player name required");
      status = "error";
    }

    // Score range validation
    const scoreFields: { key: keyof ParsedScore; label: string }[] = [
      { key: "hitting", label: "Hitting" },
      { key: "fielding", label: "Fielding" },
      { key: "throwing", label: "Throwing" },
      { key: "running", label: "Running" },
      { key: "effort", label: "Effort" },
      { key: "attitude", label: "Attitude" },
    ];

    let hasAnyScore = false;

    for (const { key, label } of scoreFields) {
      const val = row[key] as number | null;
      if (val === null) continue;
      hasAnyScore = true;

      if (val < 1 || val > MAX_SCORE) {
        errors.push(`${label} must be 1-${MAX_SCORE}`);
        status = "error";
      } else if (!VALID_SCORES.includes(val)) {
        errors.push(`${label} must be 1, 3, 5, 7, or 9`);
        if (status !== "error") status = "warning";
      }
    }

    if (!hasAnyScore) {
      errors.push("No scores entered");
      status = "error";
    }

    // Recalculate total
    row.total = computeTotal(row);

    // Check against registrations
    if (nameSet && row.firstName && row.lastName) {
      const fullName =
        `${row.firstName} ${row.lastName}`.toLowerCase().trim();
      if (!nameSet.has(fullName)) {
        errors.push("Player not found in division registrations");
        if (status !== "error") status = "warning";
      }
    }

    // Duplicate check
    const nameKey =
      `${row.firstName} ${row.lastName}`.toLowerCase().trim();
    if (nameKey && nameKey !== " " && seenNames.has(nameKey)) {
      errors.push("Duplicate entry for this player");
      if (status !== "error") status = "warning";
    }
    seenNames.add(nameKey);

    return { ...row, errors, status };
  });
}

export { MAX_SCORE, MAX_TOTAL, VALID_SCORES };
