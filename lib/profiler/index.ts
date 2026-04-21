// Per-column stats + role inference.
// Feeds both the dashboard suggester and the "Personalizar análise" panel.

import type { TableCandidate } from "@/lib/detector";
import type { ColumnKind, ColumnProfile, ColumnRole } from "@/types";
import { isLikelyDate } from "@/lib/detector";

export interface ProfiledTable {
  candidate: TableCandidate;
  columnIds: string[]; // stable, slug-like; used as keys across the app
  columnNames: string[]; // original header labels
  columnLabels: string[]; // mutable (user can rename)
  kinds: ColumnKind[];
  roles: ColumnRole[];
  profiles: ColumnProfile[];
  // Normalized rows: strings coerced, dates as Date, numbers as number.
  rows: (string | number | boolean | Date | null)[][];
}

export function profileTable(c: TableCandidate): ProfiledTable {
  const width = c.header.length;
  const rows = c.rows.map((r) => r.slice(0, width));
  const kinds: ColumnKind[] = [];
  const roles: ColumnRole[] = [];
  const profiles: ColumnProfile[] = [];

  for (let i = 0; i < width; i++) {
    const col = rows.map((r) => r[i] ?? null);
    const kind = inferKind(col);
    kinds.push(kind);
    const cleaned = col.map((v) => coerce(v, kind));
    for (let r = 0; r < rows.length; r++) rows[r][i] = cleaned[r];

    const nonNull = cleaned.filter((v) => v !== null).length;
    const nulls = cleaned.length - nonNull;
    const distinctSet = new Set<string>();
    for (const v of cleaned) {
      if (v !== null) distinctSet.add(stringifyKey(v));
    }
    const distinct = distinctSet.size;

    let min: number | Date | undefined;
    let max: number | Date | undefined;
    let mean: number | undefined;
    let median: number | undefined;
    let stdev: number | undefined;
    let topCategories: { value: string; count: number }[] | undefined;

    if (kind === "number" || kind === "integer" || kind === "currency") {
      const nums = cleaned.filter((v): v is number => typeof v === "number");
      if (nums.length > 0) {
        min = Math.min(...nums);
        max = Math.max(...nums);
        mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const sorted = [...nums].sort((a, b) => a - b);
        median = sorted[Math.floor(sorted.length / 2)];
        const variance =
          nums.reduce((a, b) => a + (b - (mean as number)) ** 2, 0) / nums.length;
        stdev = Math.sqrt(variance);
      }
    } else if (kind === "date" || kind === "datetime") {
      const dates = cleaned.filter((v): v is Date => v instanceof Date);
      if (dates.length > 0) {
        min = new Date(Math.min(...dates.map((d) => d.getTime())));
        max = new Date(Math.max(...dates.map((d) => d.getTime())));
      }
    } else {
      const counts = new Map<string, number>();
      for (const v of cleaned) {
        if (v === null) continue;
        const k = stringifyKey(v);
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      topCategories = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([value, count]) => ({ value, count }));
    }

    const role = inferRole(kind, distinct, nonNull, cleaned.length, c.header[i], cleaned);

    const id = slugify(c.header[i], i);
    profiles.push({
      columnId: id,
      kind,
      nonNull,
      nulls,
      distinct,
      min,
      max,
      mean,
      median,
      stdev,
      topCategories,
      role,
    });
    roles.push(role);
  }

  const columnIds = c.header.map((h, i) => slugify(h, i));

  return {
    candidate: c,
    columnIds,
    columnNames: c.header,
    columnLabels: [...c.header],
    kinds,
    roles,
    profiles,
    rows,
  };
}

function inferKind(col: (string | number | boolean | Date | null)[]): ColumnKind {
  const kinds: Record<string, number> = {};
  let hasFloat = false;
  let hasCurrency = false;
  for (const v of col) {
    if (v === null || v === "") continue;
    if (v instanceof Date) {
      kinds.datetime = (kinds.datetime ?? 0) + 1;
      continue;
    }
    if (typeof v === "number") {
      if (!Number.isInteger(v)) hasFloat = true;
      kinds.number = (kinds.number ?? 0) + 1;
      continue;
    }
    if (typeof v === "boolean") {
      kinds.boolean = (kinds.boolean ?? 0) + 1;
      continue;
    }
    if (typeof v === "string") {
      const s = v.trim();
      if (/^R\$\s*-?\d[\d.,]*$/i.test(s) || /^-?\d[\d.,]*\s*R\$$/i.test(s)) {
        hasCurrency = true;
        kinds.number = (kinds.number ?? 0) + 1;
        continue;
      }
      if (/^-?\d+$/.test(s)) {
        kinds.number = (kinds.number ?? 0) + 1;
        continue;
      }
      if (/^-?\d+[.,]\d+$/.test(s)) {
        hasFloat = true;
        kinds.number = (kinds.number ?? 0) + 1;
        continue;
      }
      if (/^(sim|não|nao|yes|no|true|false)$/i.test(s)) {
        kinds.boolean = (kinds.boolean ?? 0) + 1;
        continue;
      }
      if (isLikelyDate(s)) {
        kinds.datetime = (kinds.datetime ?? 0) + 1;
        continue;
      }
      kinds.text = (kinds.text ?? 0) + 1;
    }
  }
  const total = Object.values(kinds).reduce((a, b) => a + b, 0);
  if (total === 0) return "unknown";
  const [best, count] = Object.entries(kinds).sort((a, b) => b[1] - a[1])[0];
  // Require dominance ≥ 0.7 to commit to a type; otherwise fall back to text.
  if (count / total < 0.7) return "text";
  if (best === "number") {
    if (hasCurrency) return "currency";
    return hasFloat ? "number" : "integer";
  }
  if (best === "datetime") {
    // If all seen values had no time component, call it a plain date.
    return "date";
  }
  if (best === "boolean") return "boolean";
  return "text";
}

function coerce(
  v: string | number | boolean | Date | null,
  kind: ColumnKind,
): string | number | boolean | Date | null {
  if (v === null || v === "") return null;
  if (kind === "number" || kind === "integer" || kind === "currency") {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const s = v.replace(/R\$\s*/i, "").replace(/\./g, "").replace(",", ".");
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }
  if (kind === "date" || kind === "datetime") {
    if (v instanceof Date) return v;
    if (typeof v === "string") {
      const d = parseBrDate(v) ?? new Date(v);
      return d && !isNaN(d.getTime()) ? d : null;
    }
    return null;
  }
  if (kind === "boolean") {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      if (/^(sim|yes|true|1)$/i.test(v.trim())) return true;
      if (/^(não|nao|no|false|0)$/i.test(v.trim())) return false;
    }
    return null;
  }
  if (typeof v === "string") return v.trim();
  return v;
}

function parseBrDate(s: string): Date | null {
  const m = s.trim().match(
    /^(\d{2})\/(\d{2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (!m) return null;
  const [, dd, mm, yy, hh = "0", mi = "0", ss = "0"] = m;
  const y = yy.length === 2 ? 2000 + parseInt(yy) : parseInt(yy);
  return new Date(y, parseInt(mm) - 1, parseInt(dd), parseInt(hh), parseInt(mi), parseInt(ss));
}

const ID_NAME_HINTS = [
  "id",
  "ids",
  "codigo",
  "código",
  "cod",
  "cód",
  "prefixo",
  "matricula",
  "matrícula",
  "numero",
  "número",
  "nº",
  "no.",
  "serie",
  "série",
  "cpf",
  "cnpj",
  "chassi",
  "placa",
  "registro",
  "protocolo",
  "ticket",
  "ordem",
  "os",
  "nf",
  "nota",
  "lote",
  "hash",
  "guid",
  "uuid",
];

function nameLooksLikeId(name: string): boolean {
  const n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
  if (!n) return false;
  for (const hint of ID_NAME_HINTS) {
    const re = new RegExp(`(^|[^a-z])${hint}([^a-z]|$)`);
    if (re.test(n)) return true;
  }
  return false;
}

function inferRole(
  kind: ColumnKind,
  distinct: number,
  nonNull: number,
  total: number,
  name: string,
  values: (string | number | boolean | Date | null)[],
): ColumnRole {
  const fillRate = total === 0 ? 0 : nonNull / total;
  if (fillRate < 0.05) return "ignore";
  if (kind === "date" || kind === "datetime") return "time";
  if (kind === "currency") return "measure";
  if (kind === "number" || kind === "integer") {
    if (nameLooksLikeId(name)) return "identifier";
    // Only integers can be IDs by cardinality/magnitude; floats stay as measures.
    if (kind === "integer") {
      const cardRatio = nonNull === 0 ? 0 : distinct / nonNull;
      const nums = values.filter((v): v is number => typeof v === "number");
      const avgAbs = nums.length ? nums.reduce((a, b) => a + Math.abs(b), 0) / nums.length : 0;
      // Huge magnitude + mostly unique → almost certainly an ID.
      if (avgAbs >= 1e6 && cardRatio > 0.5) return "identifier";
      // Nearly-perfect cardinality with decent distinct count → sequential ID.
      if (cardRatio > 0.95 && distinct > 50) return "identifier";
    }
    return "measure";
  }
  if (kind === "boolean") return "dimension";
  if (kind === "text") {
    if (nameLooksLikeId(name)) return "identifier";
    const cardRatio = nonNull === 0 ? 0 : distinct / nonNull;
    if (cardRatio > 0.9 && distinct > 30) return "identifier";
    if (distinct <= 50 || cardRatio < 0.3) return "dimension";
    return "ignore";
  }
  return "ignore";
}

function slugify(name: string, fallbackIndex: number): string {
  const base = (name || `col_${fallbackIndex + 1}`)
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return base || `col_${fallbackIndex + 1}`;
}

function stringifyKey(v: string | number | boolean | Date): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}
