// Detects the real data table(s) in a workbook.
// Strategy:
//   1. For each sheet, find contiguous rectangular blocks of non-empty cells
//      separated by fully empty rows.
//   2. Score each block: is the first row a header? are column types
//      consistent below it? is the density high enough? width uniform?
//   3. Drop report-metadata blocks (2-col vertical filters, merged titles,
//      "Gerado por:" / "Período:" preambles, tiny summary blocks).
//   4. Return sorted candidates; UI picks the best or asks.

import type { RawSheet } from "@/lib/parser";

export interface TableCandidate {
  id: string;
  sheet: string;
  // Inclusive bounds within the sheet grid (post-trim).
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  range: string; // e.g. "A5:K900"
  header: string[];
  rows: (string | number | boolean | Date | null)[][];
  score: number;
  rejectedReasons?: string[];
}

const METADATA_KEYWORDS = [
  "gerado por",
  "gerado em",
  "período",
  "periodo",
  "filtros realizados",
  "filtros aplicados",
  "exibição",
  "exibicao",
  "código lote",
  "codigo lote",
  "relatório",
  "relatorio",
  "resumo",
  "total geral",
  "subtotal",
];

export function detectTables(sheets: RawSheet[]): TableCandidate[] {
  const candidates: TableCandidate[] = [];
  for (const sheet of sheets) {
    const blocks = findBlocks(sheet);
    for (const b of blocks) {
      const cand = scoreBlock(sheet, b);
      if (cand) candidates.push(cand);
    }
  }
  return candidates.sort((a, b) => b.score - a.score);
}

interface Block {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

function findBlocks(sheet: RawSheet): Block[] {
  const g = sheet.grid;
  const blocks: Block[] = [];
  const rowIsEmpty = (r: number) =>
    !g[r] || g[r].every((c) => c === null || c === "");

  let i = 0;
  while (i < g.length) {
    if (rowIsEmpty(i)) {
      i++;
      continue;
    }
    let j = i;
    while (j < g.length && !rowIsEmpty(j)) j++;
    // Rows [i, j-1] form a vertical group. Find column bounds by max width.
    let minCol = Infinity;
    let maxCol = -1;
    for (let r = i; r < j; r++) {
      const row = g[r] ?? [];
      for (let c = 0; c < row.length; c++) {
        if (row[c] !== null && row[c] !== "") {
          if (c < minCol) minCol = c;
          if (c > maxCol) maxCol = c;
        }
      }
    }
    if (maxCol >= 0) {
      blocks.push({
        startRow: i,
        endRow: j - 1,
        startCol: minCol,
        endCol: maxCol,
      });
    }
    i = j;
  }
  return blocks;
}

function scoreBlock(sheet: RawSheet, b: Block): TableCandidate | null {
  const reasons: string[] = [];
  const height = b.endRow - b.startRow + 1;
  const width = b.endCol - b.startCol + 1;

  if (height < 5) {
    reasons.push(`altura baixa (${height} linhas)`);
    return null;
  }
  if (width < 2) {
    reasons.push(`largura baixa (${width} colunas)`);
    return null;
  }

  const subGrid: (string | number | boolean | Date | null)[][] = [];
  for (let r = b.startRow; r <= b.endRow; r++) {
    const row: (string | number | boolean | Date | null)[] = [];
    const src = sheet.grid[r] ?? [];
    for (let c = b.startCol; c <= b.endCol; c++) {
      row.push(src[c] ?? null);
    }
    subGrid.push(row);
  }

  // Heuristic: is row 0 a header?
  const header = subGrid[0];
  const headerTextRatio =
    header.filter((c) => typeof c === "string" && c.trim().length > 0 && c.trim().length <= 80)
      .length / width;
  const headerHasNumberOnly = header.some(
    (c) => typeof c === "number" || (typeof c === "string" && /^-?\d+([.,]\d+)?$/.test(c.trim())),
  );
  const headerIsValid = headerTextRatio >= 0.7 && !headerHasNumberOnly;

  // Density of the data portion.
  const dataRows = subGrid.slice(1);
  const totalCells = dataRows.length * width;
  const filled = dataRows.reduce(
    (acc, r) => acc + r.filter((c) => c !== null && c !== "").length,
    0,
  );
  const density = totalCells === 0 ? 0 : filled / totalCells;

  // Column type consistency.
  const columnDominance: number[] = [];
  for (let c = 0; c < width; c++) {
    const kinds: Record<string, number> = {};
    for (const row of dataRows) {
      const v = row[c];
      if (v === null || v === "") continue;
      const k = roughKind(v);
      kinds[k] = (kinds[k] ?? 0) + 1;
    }
    const total = Object.values(kinds).reduce((a, b) => a + b, 0);
    const max = total === 0 ? 0 : Math.max(...Object.values(kinds));
    columnDominance.push(total === 0 ? 0 : max / total);
  }
  const avgDominance =
    columnDominance.reduce((a, b) => a + b, 0) / columnDominance.length;

  // Width uniformity: what fraction of rows hit the full width?
  const fullWidthRows = dataRows.filter(
    (r) => r.filter((c) => c !== null && c !== "").length >= width * 0.8,
  ).length;
  const widthUniformity = dataRows.length === 0 ? 0 : fullWidthRows / dataRows.length;

  // Anti-pattern: "filter block" — 2 cols, key/value, heterogeneous column 2.
  let isFilterBlock = false;
  if (width === 2 && height <= 60) {
    const col1 = dataRows.map((r) => r[0]).filter((v) => v !== null && v !== "");
    const col1Unique = new Set(col1.map(String)).size;
    const col2Kinds = new Set(
      dataRows.map((r) => r[1]).filter((v) => v !== null && v !== "").map(roughKind),
    );
    if (col1Unique === col1.length && col2Kinds.size >= 3) isFilterBlock = true;
  }

  // Anti-pattern: metadata preamble (short text paragraphs).
  let metadataHits = 0;
  for (const row of subGrid.slice(0, Math.min(10, height))) {
    const text = row.map((c) => (c == null ? "" : String(c).toLowerCase())).join(" ");
    for (const kw of METADATA_KEYWORDS) if (text.includes(kw)) metadataHits++;
  }

  const headerNames = header.map((c, i) =>
    typeof c === "string" && c.trim().length > 0 ? c.trim() : `Coluna ${i + 1}`,
  );

  // Final score.
  let score = 0;
  score += Math.min(height / 50, 1) * 25; // size
  score += Math.min(width / 6, 1) * 10;
  score += headerIsValid ? 30 : 0;
  score += density * 15;
  score += avgDominance * 15;
  score += widthUniformity * 10;
  score -= metadataHits * 15;
  score -= isFilterBlock ? 80 : 0;

  if (isFilterBlock) reasons.push("bloco de filtros chave/valor");
  if (!headerIsValid) reasons.push("cabeçalho inválido");
  if (density < 0.5) reasons.push(`densidade baixa (${density.toFixed(2)})`);
  if (avgDominance < 0.6) reasons.push(`tipos inconsistentes (${avgDominance.toFixed(2)})`);

  // Reject weakly.
  if (score < 25) return null;

  const range = `${colLetter(b.startCol)}${b.startRow + 1}:${colLetter(b.endCol)}${b.endRow + 1}`;

  return {
    id: `${sheet.name}!${range}`,
    sheet: sheet.name,
    startRow: b.startRow,
    endRow: b.endRow,
    startCol: b.startCol,
    endCol: b.endCol,
    range,
    header: headerNames,
    rows: dataRows,
    score: Math.round(score * 10) / 10,
    rejectedReasons: reasons.length ? reasons : undefined,
  };
}

function roughKind(v: unknown): "number" | "date" | "bool" | "text" {
  if (v instanceof Date) return "date";
  if (typeof v === "number") return "number";
  if (typeof v === "boolean") return "bool";
  if (typeof v === "string") {
    const s = v.trim();
    if (/^-?\d+([.,]\d+)?$/.test(s)) return "number";
    if (isLikelyDate(s)) return "date";
    return "text";
  }
  return "text";
}

export function isLikelyDate(s: string): boolean {
  if (!s) return false;
  // Common BR + ISO forms
  if (/^\d{2}\/\d{2}\/\d{2,4}(\s+\d{1,2}:\d{2}(:\d{2})?)?$/.test(s)) return true;
  if (/^\d{4}-\d{2}-\d{2}(T|\s)?(\d{2}:\d{2}(:\d{2})?)?/.test(s)) return true;
  return false;
}

function colLetter(c: number): string {
  let s = "";
  let n = c;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}
