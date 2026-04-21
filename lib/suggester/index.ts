// Given a profiled table, propose KPI cards + up to 6 charts.
// Rules in the brief: use real column names, never letters; cap cardinality;
// "Top 10 + Outros" when too many categories; temporal binning when dense.

import type { ProfiledTable } from "@/lib/profiler";
import type { ChartSpec, DashboardSpec, KpiSpec } from "@/types";

export function suggestDashboard(p: ProfiledTable): DashboardSpec {
  const kpis = suggestKpis(p);
  const charts = suggestCharts(p);
  return { kpis, charts };
}

function suggestKpis(p: ProfiledTable): KpiSpec[] {
  const kpis: KpiSpec[] = [
    { id: "kpi_count", title: "Total de registros", aggregation: "count", format: "number" },
  ];

  // Most relevant measure = largest magnitude × variance.
  const measureIdx = p.roles
    .map((r, i) => ({ r, i, p: p.profiles[i] }))
    .filter((x) => x.r === "measure" && x.p.mean !== undefined)
    .sort(
      (a, b) =>
        Math.abs((b.p.mean ?? 0) * (b.p.stdev ?? 1)) -
        Math.abs((a.p.mean ?? 0) * (a.p.stdev ?? 1)),
    )[0]?.i;
  if (measureIdx !== undefined) {
    const name = p.columnLabels[measureIdx];
    kpis.push({
      id: `kpi_sum_${p.columnIds[measureIdx]}`,
      title: `Soma de ${name}`,
      columnId: p.columnIds[measureIdx],
      aggregation: "sum",
      format: p.kinds[measureIdx] === "currency" ? "currency" : "number",
    });
  }

  // Most relevant dimension = most filled, with 2-30 distinct values.
  const dimIdx = p.roles
    .map((r, i) => ({ r, i, p: p.profiles[i] }))
    .filter(
      (x) =>
        x.r === "dimension" && x.p.distinct >= 2 && x.p.distinct <= 50,
    )
    .sort((a, b) => b.p.nonNull - a.p.nonNull)[0]?.i;
  if (dimIdx !== undefined) {
    kpis.push({
      id: `kpi_distinct_${p.columnIds[dimIdx]}`,
      title: `${p.columnLabels[dimIdx]} únicos`,
      columnId: p.columnIds[dimIdx],
      aggregation: "distinct",
      format: "number",
    });
  }

  const timeIdx = p.roles.indexOf("time");
  if (timeIdx >= 0) {
    kpis.push({
      id: `kpi_range_${p.columnIds[timeIdx]}`,
      title: `Período de ${p.columnLabels[timeIdx]}`,
      columnId: p.columnIds[timeIdx],
      aggregation: "range",
      format: "date-range",
    });
  }

  return kpis.slice(0, 4);
}

function suggestCharts(p: ProfiledTable): ChartSpec[] {
  const out: ChartSpec[] = [];
  const measures = indicesByRole(p, "measure");
  const dims = indicesByRole(p, "dimension");
  const times = indicesByRole(p, "time");

  // Sort dimensions by "usefulness": not too few, not too many.
  dims.sort((a, b) => distinctScore(p, b) - distinctScore(p, a));
  measures.sort((a, b) => (p.profiles[b].stdev ?? 0) - (p.profiles[a].stdev ?? 0));

  // 1. Time + main measure → evolution.
  if (times.length > 0 && measures.length > 0) {
    out.push({
      id: `chart_time_${p.columnIds[times[0]]}_${p.columnIds[measures[0]]}`,
      title: `Evolução de ${p.columnLabels[measures[0]]} ao longo de ${p.columnLabels[times[0]]}`,
      type: "line",
      xColumnId: p.columnIds[times[0]],
      yColumnId: p.columnIds[measures[0]],
      aggregation: "sum",
    });
  }

  // 2. Top dimension × main measure.
  if (dims.length > 0 && measures.length > 0) {
    out.push({
      id: `chart_bar_${p.columnIds[dims[0]]}_${p.columnIds[measures[0]]}`,
      title: `Total de ${p.columnLabels[measures[0]]} por ${p.columnLabels[dims[0]]}`,
      type: "bar",
      xColumnId: p.columnIds[dims[0]],
      yColumnId: p.columnIds[measures[0]],
      aggregation: "sum",
    });
  }

  // 3. Second dimension count.
  if (dims.length > 1) {
    const d = dims[1];
    const distinct = p.profiles[d].distinct;
    out.push({
      id: `chart_count_${p.columnIds[d]}`,
      title: `Distribuição por ${p.columnLabels[d]}`,
      type: distinct <= 6 ? "pie" : "bar",
      xColumnId: p.columnIds[d],
      aggregation: "count",
    });
  }

  // 4. Average of secondary measure by top dimension.
  if (measures.length > 1 && dims.length > 0) {
    out.push({
      id: `chart_avg_${p.columnIds[dims[0]]}_${p.columnIds[measures[1]]}`,
      title: `Média de ${p.columnLabels[measures[1]]} por ${p.columnLabels[dims[0]]}`,
      type: "bar",
      xColumnId: p.columnIds[dims[0]],
      yColumnId: p.columnIds[measures[1]],
      aggregation: "avg",
    });
  }

  // 5. Histogram of primary measure.
  if (measures.length > 0) {
    out.push({
      id: `chart_hist_${p.columnIds[measures[0]]}`,
      title: `Distribuição de ${p.columnLabels[measures[0]]}`,
      type: "histogram",
      xColumnId: p.columnIds[measures[0]],
    });
  }

  // 6. Solo dimension count, if we still have slots and unused dims.
  if (out.length < 6 && dims.length > 2) {
    const d = dims[2];
    const distinct = p.profiles[d].distinct;
    out.push({
      id: `chart_count2_${p.columnIds[d]}`,
      title: `Contagem por ${p.columnLabels[d]}`,
      type: distinct <= 6 ? "pie" : "bar",
      xColumnId: p.columnIds[d],
      aggregation: "count",
    });
  }

  return out.slice(0, 6);
}

function indicesByRole(p: ProfiledTable, role: string): number[] {
  return p.roles
    .map((r, i) => (r === role ? i : -1))
    .filter((i) => i >= 0);
}

function distinctScore(p: ProfiledTable, i: number): number {
  const d = p.profiles[i].distinct;
  if (d < 2) return 0;
  if (d <= 30) return 1 - Math.abs(10 - d) / 10;
  return 0.5 - Math.min(d, 500) / 1000;
}
