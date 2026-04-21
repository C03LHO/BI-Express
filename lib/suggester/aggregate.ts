// Row-level aggregation for each ChartSpec. Pure functions, no UI.

import type { ProfiledTable } from "@/lib/profiler";
import type { ChartSpec, KpiSpec } from "@/types";

export interface XY {
  x: string;
  y: number;
  raw?: Date | number | string;
}

export interface HistBucket {
  label: string;
  count: number;
  start: number;
  end: number;
}

export interface KpiValue {
  title: string;
  value: string;
  sub?: string;
}

const TOP_N = 10;

export function computeKpi(p: ProfiledTable, k: KpiSpec): KpiValue {
  if (k.aggregation === "count") {
    return { title: k.title, value: formatNumber(p.rows.length) };
  }
  const idx = k.columnId ? p.columnIds.indexOf(k.columnId) : -1;
  if (idx < 0) return { title: k.title, value: "—" };

  const col = p.rows.map((r) => r[idx]);
  if (k.aggregation === "distinct") {
    const set = new Set<string>();
    for (const v of col) if (v !== null) set.add(String(v));
    return { title: k.title, value: formatNumber(set.size) };
  }
  if (k.aggregation === "range") {
    const dates = col.filter((v): v is Date => v instanceof Date);
    if (dates.length === 0) return { title: k.title, value: "—" };
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    return {
      title: k.title,
      value: `${formatDate(min)} → ${formatDate(max)}`,
    };
  }
  const nums = col.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return { title: k.title, value: "—" };
  let val = 0;
  if (k.aggregation === "sum") val = nums.reduce((a, b) => a + b, 0);
  else if (k.aggregation === "avg") val = nums.reduce((a, b) => a + b, 0) / nums.length;
  else if (k.aggregation === "min") val = Math.min(...nums);
  else if (k.aggregation === "max") val = Math.max(...nums);
  return {
    title: k.title,
    value:
      k.format === "currency" ? formatCurrency(val) : formatNumber(val, 2),
    sub: k.aggregation === "sum" ? `${nums.length} valores` : undefined,
  };
}

export function aggregateBar(
  p: ProfiledTable,
  c: ChartSpec,
): { data: XY[]; groupedIntoOthers: number } {
  const xi = c.xColumnId ? p.columnIds.indexOf(c.xColumnId) : -1;
  const yi = c.yColumnId ? p.columnIds.indexOf(c.yColumnId) : -1;
  if (xi < 0) return { data: [], groupedIntoOthers: 0 };

  const groups = new Map<string, number[]>();
  for (const row of p.rows) {
    const xv = row[xi];
    if (xv === null) continue;
    const key = formatCell(xv);
    const bucket = groups.get(key) ?? [];
    if (yi >= 0 && typeof row[yi] === "number") bucket.push(row[yi] as number);
    else bucket.push(1);
    groups.set(key, bucket);
  }

  const agg = c.aggregation ?? (yi >= 0 ? "sum" : "count");
  const reduced: XY[] = [...groups.entries()].map(([x, vals]) => ({
    x,
    y: reduce(vals, agg),
  }));
  reduced.sort((a, b) => b.y - a.y);

  let others = 0;
  let data = reduced;
  if (reduced.length > TOP_N) {
    const top = reduced.slice(0, TOP_N);
    const rest = reduced.slice(TOP_N);
    others = rest.length;
    const otherSum = rest.reduce((acc, v) => acc + v.y, 0);
    data = [...top, { x: `Outros (${others})`, y: otherSum }];
  }
  return { data, groupedIntoOthers: others };
}

export function aggregateLine(p: ProfiledTable, c: ChartSpec): XY[] {
  const xi = c.xColumnId ? p.columnIds.indexOf(c.xColumnId) : -1;
  const yi = c.yColumnId ? p.columnIds.indexOf(c.yColumnId) : -1;
  if (xi < 0) return [];

  const dates: { d: Date; y: number }[] = [];
  for (const row of p.rows) {
    const xv = row[xi];
    if (!(xv instanceof Date)) continue;
    const y = yi >= 0 && typeof row[yi] === "number" ? (row[yi] as number) : 1;
    dates.push({ d: xv, y });
  }
  if (dates.length === 0) return [];

  const spanDays =
    (Math.max(...dates.map((e) => e.d.getTime())) -
      Math.min(...dates.map((e) => e.d.getTime()))) /
    86400000;
  const bin: "day" | "week" | "month" =
    spanDays <= 60 ? "day" : spanDays <= 400 ? "week" : "month";

  const buckets = new Map<string, number[]>();
  for (const { d, y } of dates) {
    const key = bucketKey(d, bin);
    const arr = buckets.get(key) ?? [];
    arr.push(y);
    buckets.set(key, arr);
  }
  const agg = c.aggregation ?? (yi >= 0 ? "sum" : "count");
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([x, vals]) => ({ x, y: reduce(vals, agg) }));
}

export function aggregateHistogram(
  p: ProfiledTable,
  c: ChartSpec,
): HistBucket[] {
  const xi = c.xColumnId ? p.columnIds.indexOf(c.xColumnId) : -1;
  if (xi < 0) return [];
  const nums = p.rows
    .map((r) => r[xi])
    .filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return [];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) {
    return [{ label: formatNumber(min, 2), count: nums.length, start: min, end: max }];
  }
  const bins = Math.min(20, Math.max(5, Math.ceil(Math.sqrt(nums.length))));
  const size = (max - min) / bins;
  const out: HistBucket[] = Array.from({ length: bins }, (_, i) => ({
    start: min + i * size,
    end: min + (i + 1) * size,
    count: 0,
    label: "",
  }));
  for (const n of nums) {
    let idx = Math.floor((n - min) / size);
    if (idx >= bins) idx = bins - 1;
    out[idx].count++;
  }
  for (const b of out) {
    b.label = `${formatNumber(b.start, 1)}–${formatNumber(b.end, 1)}`;
  }
  return out;
}

export function aggregateScatter(
  p: ProfiledTable,
  c: ChartSpec,
): { x: number; y: number }[] {
  const xi = c.xColumnId ? p.columnIds.indexOf(c.xColumnId) : -1;
  const yi = c.yColumnId ? p.columnIds.indexOf(c.yColumnId) : -1;
  if (xi < 0 || yi < 0) return [];
  const out: { x: number; y: number }[] = [];
  for (const row of p.rows) {
    const x = row[xi];
    const y = row[yi];
    if (typeof x === "number" && typeof y === "number") out.push({ x, y });
  }
  return out.slice(0, 2000);
}

export function aggregateStacked(
  p: ProfiledTable,
  c: ChartSpec,
): { categories: string[]; series: { name: string; data: number[] }[] } {
  const xi = c.xColumnId ? p.columnIds.indexOf(c.xColumnId) : -1;
  const gi = c.groupColumnId ? p.columnIds.indexOf(c.groupColumnId) : -1;
  const yi = c.yColumnId ? p.columnIds.indexOf(c.yColumnId) : -1;
  if (xi < 0 || gi < 0) return { categories: [], series: [] };

  const agg = c.aggregation ?? (yi >= 0 ? "sum" : "count");
  const byCat = new Map<string, Map<string, number[]>>();
  for (const row of p.rows) {
    const xv = row[xi];
    const gv = row[gi];
    if (xv === null || gv === null) continue;
    const xk = formatCell(xv);
    const gk = formatCell(gv);
    const inner = byCat.get(xk) ?? new Map<string, number[]>();
    const arr = inner.get(gk) ?? [];
    if (yi >= 0 && typeof row[yi] === "number") arr.push(row[yi] as number);
    else arr.push(1);
    inner.set(gk, arr);
    byCat.set(xk, inner);
  }

  const catTotals: { key: string; total: number }[] = [];
  for (const [k, inner] of byCat) {
    let total = 0;
    for (const vs of inner.values()) total += reduce(vs, agg);
    catTotals.push({ key: k, total });
  }
  catTotals.sort((a, b) => b.total - a.total);
  const topCats = catTotals.slice(0, 12).map((c) => c.key);

  const groupTotals = new Map<string, number>();
  for (const cat of topCats) {
    const inner = byCat.get(cat)!;
    for (const [g, vs] of inner) {
      groupTotals.set(g, (groupTotals.get(g) ?? 0) + reduce(vs, agg));
    }
  }
  const topGroups = [...groupTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([g]) => g);

  const series = topGroups.map((g) => ({
    name: g,
    data: topCats.map((cat) => {
      const inner = byCat.get(cat);
      const vs = inner?.get(g);
      return vs ? reduce(vs, agg) : 0;
    }),
  }));
  return { categories: topCats, series };
}

// Helpers

function reduce(vals: number[], agg: string): number {
  if (vals.length === 0) return 0;
  if (agg === "count") return vals.length;
  if (agg === "sum") return vals.reduce((a, b) => a + b, 0);
  if (agg === "avg") return vals.reduce((a, b) => a + b, 0) / vals.length;
  if (agg === "min") return Math.min(...vals);
  if (agg === "max") return Math.max(...vals);
  if (agg === "median") {
    const s = [...vals].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }
  return vals.reduce((a, b) => a + b, 0);
}

function bucketKey(d: Date, bin: "day" | "week" | "month"): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  if (bin === "month") return `${y}-${m}`;
  if (bin === "day") return `${y}-${m}-${day}`;
  const onejan = new Date(y, 0, 1);
  const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return `${y}-S${week.toString().padStart(2, "0")}`;
}

function formatCell(v: string | number | boolean | Date): string {
  if (v instanceof Date) return formatDate(v);
  return String(v);
}

export function formatNumber(n: number, digits = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(n);
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(d);
}
