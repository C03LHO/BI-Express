// Given a profiled table, propose KPI cards + a list of charts.
// Three views: overview (default), temporal, categorical — each emphasizes a
// different analytical lens of the same data.

import type { ProfiledTable } from "@/lib/profiler";
import type { ChartSpec, DashboardSpec, KpiSpec, ChartType } from "@/types";

export type DashboardView = "overview" | "temporal" | "categorical";

export function suggestDashboard(
  p: ProfiledTable,
  view: DashboardView = "overview",
): DashboardSpec {
  const kpis = suggestKpis(p);
  const charts =
    view === "temporal"
      ? suggestTemporal(p)
      : view === "categorical"
      ? suggestCategorical(p)
      : suggestOverview(p);
  return { kpis, charts };
}

function suggestKpis(p: ProfiledTable): KpiSpec[] {
  const kpis: KpiSpec[] = [
    { id: "kpi_count", title: "Total de registros", aggregation: "count", format: "number" },
  ];

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

  const dimIdx = p.roles
    .map((r, i) => ({ r, i, p: p.profiles[i] }))
    .filter((x) => x.r === "dimension" && x.p.distinct >= 2 && x.p.distinct <= 50)
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

function suggestOverview(p: ProfiledTable): ChartSpec[] {
  const out: ChartSpec[] = [];
  const measures = indicesByRole(p, "measure");
  const dims = indicesByRole(p, "dimension");
  const times = indicesByRole(p, "time");

  dims.sort((a, b) => distinctScore(p, b) - distinctScore(p, a));
  measures.sort((a, b) => (p.profiles[b].stdev ?? 0) - (p.profiles[a].stdev ?? 0));

  if (times.length > 0 && measures.length > 0) {
    out.push(chart("area", `Evolução de ${p.columnLabels[measures[0]]} ao longo de ${p.columnLabels[times[0]]}`, {
      x: p.columnIds[times[0]],
      y: p.columnIds[measures[0]],
      aggregation: "sum",
    }));
  }
  if (dims.length > 0 && measures.length > 0) {
    out.push(chart("bar", `Total de ${p.columnLabels[measures[0]]} por ${p.columnLabels[dims[0]]}`, {
      x: p.columnIds[dims[0]],
      y: p.columnIds[measures[0]],
      aggregation: "sum",
    }));
  }
  if (dims.length > 1) {
    const d = dims[1];
    const distinct = p.profiles[d].distinct;
    out.push(chart(distinct <= 6 ? "donut" : "bar", `Distribuição por ${p.columnLabels[d]}`, {
      x: p.columnIds[d],
      aggregation: "count",
    }));
  }
  if (measures.length > 1 && dims.length > 0) {
    out.push(chart("bar", `Média de ${p.columnLabels[measures[1]]} por ${p.columnLabels[dims[0]]}`, {
      x: p.columnIds[dims[0]],
      y: p.columnIds[measures[1]],
      aggregation: "avg",
    }));
  }
  if (measures.length > 0) {
    out.push(chart("histogram", `Distribuição de ${p.columnLabels[measures[0]]}`, {
      x: p.columnIds[measures[0]],
    }));
  }
  if (dims.length > 2) {
    const d = dims[2];
    out.push(chart("treemap", `Volume por ${p.columnLabels[d]}`, {
      x: p.columnIds[d],
      aggregation: "count",
    }));
  }
  return out.slice(0, 6);
}

function suggestTemporal(p: ProfiledTable): ChartSpec[] {
  const out: ChartSpec[] = [];
  const measures = indicesByRole(p, "measure");
  const dims = indicesByRole(p, "dimension");
  const times = indicesByRole(p, "time");

  measures.sort((a, b) => (p.profiles[b].stdev ?? 0) - (p.profiles[a].stdev ?? 0));
  dims.sort((a, b) => distinctScore(p, b) - distinctScore(p, a));

  if (times.length === 0) return suggestOverview(p);
  const t0 = times[0];

  if (measures.length > 0) {
    out.push(chart("area", `Evolução de ${p.columnLabels[measures[0]]}`, {
      x: p.columnIds[t0],
      y: p.columnIds[measures[0]],
      aggregation: "sum",
    }));
  }
  if (measures.length > 1) {
    out.push(chart("line", `Média de ${p.columnLabels[measures[1]]} no tempo`, {
      x: p.columnIds[t0],
      y: p.columnIds[measures[1]],
      aggregation: "avg",
    }));
  }
  out.push(chart("bar", `Volume de registros por período (${p.columnLabels[t0]})`, {
    x: p.columnIds[t0],
    aggregation: "count",
  }));
  if (dims.length > 0 && measures.length > 0) {
    out.push(chart("stacked-bar", `${p.columnLabels[measures[0]]} por ${p.columnLabels[t0]} e ${p.columnLabels[dims[0]]}`, {
      x: p.columnIds[t0],
      y: p.columnIds[measures[0]],
      group: p.columnIds[dims[0]],
      aggregation: "sum",
    }));
  }
  if (times.length > 1) {
    out.push(chart("line", `Atividade em ${p.columnLabels[times[1]]}`, {
      x: p.columnIds[times[1]],
      aggregation: "count",
    }));
  }
  if (dims.length > 0) {
    out.push(chart("bar", `Top ${p.columnLabels[dims[0]]} no período`, {
      x: p.columnIds[dims[0]],
      aggregation: "count",
    }));
  }
  return out.slice(0, 6);
}

function suggestCategorical(p: ProfiledTable): ChartSpec[] {
  const out: ChartSpec[] = [];
  const measures = indicesByRole(p, "measure");
  const dims = indicesByRole(p, "dimension");

  dims.sort((a, b) => distinctScore(p, b) - distinctScore(p, a));
  measures.sort((a, b) => (p.profiles[b].stdev ?? 0) - (p.profiles[a].stdev ?? 0));

  if (dims.length === 0) return suggestOverview(p);

  const d0 = dims[0];
  const d0Distinct = p.profiles[d0].distinct;
  if (measures.length > 0) {
    out.push(chart("barh", `Ranking de ${p.columnLabels[measures[0]]} por ${p.columnLabels[d0]}`, {
      x: p.columnIds[d0],
      y: p.columnIds[measures[0]],
      aggregation: "sum",
    }));
  } else {
    out.push(chart("barh", `Top ${p.columnLabels[d0]}`, {
      x: p.columnIds[d0],
      aggregation: "count",
    }));
  }

  out.push(chart(d0Distinct <= 6 ? "donut" : "treemap", `Participação por ${p.columnLabels[d0]}`, {
    x: p.columnIds[d0],
    y: measures[0] !== undefined ? p.columnIds[measures[0]] : undefined,
    aggregation: measures[0] !== undefined ? "sum" : "count",
  }));

  if (dims.length > 1 && measures.length > 0) {
    out.push(chart("stacked-bar", `${p.columnLabels[measures[0]]} por ${p.columnLabels[d0]} e ${p.columnLabels[dims[1]]}`, {
      x: p.columnIds[d0],
      y: p.columnIds[measures[0]],
      group: p.columnIds[dims[1]],
      aggregation: "sum",
    }));
  }
  if (dims.length > 1) {
    out.push(chart("funnel", `Distribuição por ${p.columnLabels[dims[1]]}`, {
      x: p.columnIds[dims[1]],
      aggregation: "count",
    }));
  }
  if (measures.length > 1) {
    out.push(chart("bar", `Média de ${p.columnLabels[measures[1]]} por ${p.columnLabels[d0]}`, {
      x: p.columnIds[d0],
      y: p.columnIds[measures[1]],
      aggregation: "avg",
    }));
  }
  if (dims.length > 2) {
    out.push(chart("radar", `Perfil de ${p.columnLabels[dims[2]]}`, {
      x: p.columnIds[dims[2]],
      aggregation: "count",
    }));
  }
  return out.slice(0, 6);
}

function chart(
  type: ChartType,
  title: string,
  opts: {
    x?: string;
    y?: string;
    group?: string;
    aggregation?: "sum" | "avg" | "count" | "min" | "max" | "median";
  },
): ChartSpec {
  const idParts = [type, opts.x, opts.y, opts.group].filter(Boolean).join("_");
  return {
    id: `chart_${idParts}`,
    title,
    type,
    xColumnId: opts.x,
    yColumnId: opts.y,
    groupColumnId: opts.group,
    aggregation: opts.aggregation,
  };
}

function indicesByRole(p: ProfiledTable, role: string): number[] {
  return p.roles.map((r, i) => (r === role ? i : -1)).filter((i) => i >= 0);
}

function distinctScore(p: ProfiledTable, i: number): number {
  const d = p.profiles[i].distinct;
  if (d < 2) return 0;
  if (d <= 30) return 1 - Math.abs(10 - d) / 10;
  return 0.5 - Math.min(d, 500) / 1000;
}
