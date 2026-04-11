// Generates a printable Snack Schedule template for coaches to download
// from /coach/corner/templates. Run once to regenerate the committed xlsx:
//
//   node scripts/generate-snack-schedule-template.mjs

import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT = path.join(__dirname, "..", "public", "templates", "snack-schedule.xlsx");

const wb = new ExcelJS.Workbook();
wb.creator = "Irvine All-Stars";
wb.created = new Date();

const ws = wb.addWorksheet("Snack Schedule", {
  views: [{ state: "frozen", ySplit: 4 }],
  pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1 },
});

// Column widths
ws.columns = [
  { key: "date", width: 14 },
  { key: "day", width: 12 },
  { key: "game", width: 32 },
  { key: "family", width: 22 },
  { key: "snack", width: 22 },
  { key: "drinks", width: 22 },
  { key: "notes", width: 26 },
];

// Title row
ws.mergeCells("A1:G1");
const title = ws.getCell("A1");
title.value = "IRVINE ALL-STARS  \u2014  SNACK SCHEDULE";
title.font = { name: "Arial Black", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
title.alignment = { vertical: "middle", horizontal: "center" };
title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF002868" } }; // flag-blue
ws.getRow(1).height = 28;

// Sub-title / team name row
ws.mergeCells("A2:G2");
const sub = ws.getCell("A2");
sub.value = "Team:                                    Division:                              Season:";
sub.font = { name: "Arial", size: 11, italic: true, color: { argb: "FF444444" } };
sub.alignment = { vertical: "middle", horizontal: "left" };
ws.getRow(2).height = 22;

// Spacer row
ws.getRow(3).height = 6;

// Header row
const headers = ["Date", "Day", "Game / Event", "Family", "Snack", "Drinks", "Notes"];
const headerRow = ws.getRow(4);
headers.forEach((h, i) => {
  const cell = headerRow.getCell(i + 1);
  cell.value = h;
  cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  cell.alignment = { vertical: "middle", horizontal: "center" };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBF0A30" } }; // flag-red
  cell.border = {
    top: { style: "thin", color: { argb: "FFCCCCCC" } },
    bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    left: { style: "thin", color: { argb: "FFCCCCCC" } },
    right: { style: "thin", color: { argb: "FFCCCCCC" } },
  };
});
headerRow.height = 22;

// Sample/blank rows with zebra striping
const sampleRows = [
  ["Sat Apr 11", "Saturday", "Practice \u2013 Irvine Community Park", "", "", "", ""],
  ["Sat Apr 18", "Saturday", "Scrimmage vs. TBD", "", "", "", ""],
  ["Sat Apr 25", "Saturday", "League Game", "", "", "", ""],
  ["Sat May 02", "Saturday", "League Game", "", "", "", ""],
];
for (let i = 0; i < 22; i++) {
  const data = sampleRows[i] ?? ["", "", "", "", "", "", ""];
  const row = ws.addRow(data);
  row.height = 24;
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    cell.font = { name: "Arial", size: 10, color: { argb: "FF222222" } };
    cell.alignment = {
      vertical: "middle",
      horizontal: col === 3 || col === 7 ? "left" : col === 1 || col === 2 ? "center" : "left",
      indent: col === 3 || col === 7 ? 1 : 0,
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: i % 2 === 0 ? "FFF7F9FC" : "FFFFFFFF" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE5E7EB" } },
      bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      left: { style: "thin", color: { argb: "FFE5E7EB" } },
      right: { style: "thin", color: { argb: "FFE5E7EB" } },
    };
  });
}

// Instructions block at the bottom
const lastRow = ws.rowCount + 2;
ws.mergeCells(`A${lastRow}:G${lastRow}`);
const notes = ws.getCell(`A${lastRow}`);
notes.value =
  "HOW TO USE: Fill in your team name and season at the top. Add dates for each practice or game, then assign a family to bring the snack and drinks. Share this sheet with parents via email or a shared drive.";
notes.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF666666" } };
notes.alignment = { wrapText: true, vertical: "top", horizontal: "left" };
ws.getRow(lastRow).height = 32;

await wb.xlsx.writeFile(OUTPUT);
console.log(`\u2713 Wrote ${OUTPUT}`);
