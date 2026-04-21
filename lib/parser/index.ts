// Reads user-uploaded files entirely in the browser. No network.
// Returns a uniform shape: array of "raw sheets" — 2D arrays of cells with a
// sheet name and a note of whether cells came as Excel-serial dates.

import * as XLSX from "xlsx";
import Papa from "papaparse";

export interface RawSheet {
  name: string;
  // Grid is row-major. Missing cells are null. Values keep their native types.
  grid: (string | number | boolean | Date | null)[][];
}

export type ParsedFile = {
  filename: string;
  sheets: RawSheet[];
};

export async function parseFile(file: File): Promise<ParsedFile> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")) {
    return parseDelimited(file);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".xlsm")) {
    return parseWorkbook(file);
  }
  throw new Error(
    `Formato não suportado: ${file.name}. Use .xlsx, .xls, .csv ou .tsv.`,
  );
}

async function parseDelimited(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const delimiter = file.name.toLowerCase().endsWith(".tsv") ? "\t" : undefined;
  const parsed = Papa.parse<string[]>(text, {
    delimiter,
    skipEmptyLines: false,
    dynamicTyping: true,
  });
  const grid = (parsed.data as unknown[][]).map((row) =>
    row.map((c) => normalizeCell(c)),
  );
  return {
    filename: file.name,
    sheets: [{ name: stripExt(file.name), grid }],
  };
}

async function parseWorkbook(file: File): Promise<ParsedFile> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheets: RawSheet[] = wb.SheetNames.map((sheetName) => {
    const ws = wb.Sheets[sheetName];
    // header: 1 → 2D array. defval: null → keep empty cells as null.
    // raw: true → keep native types (numbers, Date, booleans).
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: null,
      raw: true,
      blankrows: true,
    });
    const grid = rows.map((r) => (r as unknown[]).map((c) => normalizeCell(c)));
    return { name: sheetName, grid };
  });
  return { filename: file.name, sheets };
}

function normalizeCell(c: unknown): string | number | boolean | Date | null {
  if (c == null) return null;
  if (c instanceof Date) return c;
  if (typeof c === "string") {
    const t = c.trim();
    if (t === "" || t === "-" || t === "—" || t === "(vazio)") return null;
    if (/^n\/a$/i.test(t) || /^null$/i.test(t)) return null;
    return t;
  }
  if (typeof c === "number") return Number.isFinite(c) ? c : null;
  if (typeof c === "boolean") return c;
  return String(c);
}

function stripExt(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}
