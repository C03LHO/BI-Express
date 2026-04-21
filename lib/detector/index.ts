// Detects the real data table(s) in a workbook.
// Strategy:
//   1. For each sheet, find contiguous rectangular blocks of non-empty cells
//      separated by fully empty rows.
//   2. Within each block, probe up to N top rows as possible header rows and
//      pick the best: every candidate gets a composite score (header validity
//      + column-type consistency + density + width uniformity).
//   3. Drop report-metadata blocks (filter key/value, merged titles, "Gerado
//      por:" / "Período:" preambles, tiny summary blocks).
//   4. Return sorted candidates; UI picks the best or asks.

import type { RawSheet } from "@/lib/parser";

export interface TableCandidate {
  id: string;
  sheet: string;
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  range: string;
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

  // Anti-pattern: "filter block" — 2 cols, key/value, heterogeneous column 2.
  let isFilterBlock = false;
  if (width === 2 && height <= 60) {
    const col1 = subGrid.slice(1).map((r) => r[0]).filter((v) => v !== null && v !== "");
    const col1Unique = new Set(col1.map(String)).size;
    const col2Kinds = new Set(
      subGrid.slice(1).map((r) => r[1]).filter((v) => v !== null && v !== "").map(roughKind),
    );
    if (col1Unique === col1.length && col2Kinds.size >= 3) isFilterBlock = true;
  }

  // Metadata preamble hits (report header blurb).
  let metadataHits = 0;
  for (const row of subGrid.slice(0, Math.min(10, height))) {
    const text = row.map((c) => (c == null ? "" : String(c).toLowerCase())).join(" ");
    for (const kw of METADATA_KEYWORDS) if (text.includes(kw)) metadataHits++;
  }

  // Try up to first 8 rows as possible header rows. Pick the best scoring.
  const maxTry = Math.min(8, height - 3);
  let best: { headerIdx: number; inner: InnerScore } | null = null;
  for (let hi = 0; hi <= maxTry; hi++) {
    const inner = scoreHeaderChoice(subGrid, hi, width);
    if (!best || inner.score > best.inner.score) {
      best = { headerIdx: hi, inner };
    }
  }
  if (!best) return null;

  const headerIdx = best.headerIdx;
  const header = subGrid[headerIdx];
  const dataRows = subGrid.slice(headerIdx + 1);

  const headerNames = header.map((c, i) =>
    typeof c === "string" && c.trim().length > 0 ? c.trim() : `Coluna ${i + 1}`,
  );

  // Composite final score.
  let score = 0;
  score += Math.min(dataRows.length / 50, 1) * 25;
  score += Math.min(width / 6, 1) * 10;
  score += best.inner.headerIsValid ? 30 : 0;
  score += best.inner.density * 15;
  score += best.inner.avgDominance * 15;
  score += best.inner.widthUniformity * 10;
  score -= metadataHits * 15;
  score -= isFilterBlock ? 80 : 0;
  // Penalize skipping too many rows — prefer headerIdx=0 on ties.
  score -= headerIdx * 1.5;

  if (isFilterBlock) reasons.push("bloco de filtros chave/valor");
  if (!best.inner.headerIsValid) reasons.push("cabeçalho inválido");
  if (best.inner.density < 0.5) reasons.push(`densidade baixa (${best.inner.density.toFixed(2)})`);
  if (best.inner.avgDominance < 0.6)
    reasons.push(`tipos inconsistentes (${best.inner.avgDominance.toFixed(2)})`);

  if (score < 25) return null;

  const realStartRow = b.startRow + headerIdx;
  const range = `${colLetter(b.startCol)}${realStartRow + 1}:${colLetter(b.endCol)}${b.endRow + 1}`;

  return {
    id: `${sheet.name}!${range}`,
    sheet: sheet.name,
    startRow: realStartRow,
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

interface InnerScore {
  headerIsValid: boolean;
  density: number;
  avgDominance: number;
  widthUniformity: number;
  score: number; // composite for picking header row
}

function scoreHeaderChoice(
  subGrid: (string | number | boolean | Date | null)[][],
  headerIdx: number,
  width: number,
): InnerScore {
  const header = subGrid[headerIdx];
  const filledCount = header.filter((c) => c !== null && c !== "").length;
  const headerTextRatio =
    header.filter(
      (c) => typeof c === "string" && c.trim().length > 0 && c.trim().length <= 80,
    ).length / width;
  const headerHasNumberOnly = header.some(
    (c) =>
      typeof c === "number" ||
      (typeof c === "string" && /^-?\d+([.,]\d+)?$/.test(c.trim())),
  );
  // A valid header: mostly textual labels AND fills most of the block width
  // (guards against "title row" with 1 merged cell).
  const fillRatio = filledCount / width;
  const headerIsValid =
    headerTextRatio >= 0.7 && !headerHasNumberOnly && fillRatio >= 0.6;

  const dataRows = subGrid.slice(headerIdx + 1);
  const totalCells = dataRows.length * width;
  const filled = dataRows.reduce(
    (acc, r) => acc + r.filter((c) => c !== null && c !== "").length,
    0,
  );
  const density = totalCells === 0 ? 0 : filled / totalCells;

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
  const avgDominance = columnDominance.length
    ? columnDominance.reduce((a, b) => a + b, 0) / columnDominance.length
    : 0;

  const fullWidthRows = dataRows.filter(
    (r) => r.filter((c) => c !== null && c !== "").length >= width * 0.8,
  ).length;
  const widthUniformity = dataRows.length === 0 ? 0 : fullWidthRows / dataRows.length;

  // Composite picker score. Header validity weighs a lot; dominance/density
  // reward a choice where the rows below are consistent.
  const score =
    (headerIsValid ? 40 : 0) +
    avgDominance * 25 +
    density * 15 +
    widthUniformity * 10 +
    fillRatio * 10;

  return { headerIsValid, density, avgDominance, widthUniformity, score };
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
