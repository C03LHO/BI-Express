// Domain types for BI Express.
// Kept future-proof for multi-file join (see roadmap): data lives under DataSource.

export type ColumnKind =
  | "number"
  | "integer"
  | "currency"
  | "date"
  | "datetime"
  | "category"
  | "text"
  | "boolean"
  | "unknown";

export type ColumnRole =
  | "measure"
  | "dimension"
  | "time"
  | "identifier"
  | "ignore";

export type CellValue = string | number | boolean | Date | null;

export interface RawCell {
  value: CellValue;
  raw: unknown;
}

export interface Column {
  id: string;
  name: string;
  label: string;
  kind: ColumnKind;
  role: ColumnRole;
}

export interface Table {
  id: string;
  sheet: string;
  range: string;
  columns: Column[];
  rows: CellValue[][];
  score: number;
}

export interface DataSource {
  id: string;
  name: string;
  tables: Table[];
}

export interface ColumnProfile {
  columnId: string;
  kind: ColumnKind;
  nonNull: number;
  nulls: number;
  distinct: number;
  min?: number | Date;
  max?: number | Date;
  mean?: number;
  median?: number;
  stdev?: number;
  topCategories?: { value: string; count: number }[];
  role: ColumnRole;
}

export type ChartType =
  | "bar"
  | "barh"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "scatter"
  | "histogram"
  | "heatmap"
  | "treemap"
  | "radar"
  | "funnel"
  | "stacked-bar"
  | "kpi";

export interface ChartSpec {
  id: string;
  title: string;
  type: ChartType;
  xColumnId?: string;
  yColumnId?: string;
  groupColumnId?: string;
  aggregation?: "sum" | "avg" | "count" | "min" | "max" | "median";
  rationale?: string;
}

export interface KpiSpec {
  id: string;
  title: string;
  columnId?: string;
  aggregation: "count" | "sum" | "avg" | "min" | "max" | "distinct" | "range";
  format?: "number" | "currency" | "percent" | "date-range";
}

export interface DashboardSpec {
  kpis: KpiSpec[];
  charts: ChartSpec[];
}
