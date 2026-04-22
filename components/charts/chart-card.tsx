"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Trash2, ChevronDown } from "lucide-react";
import type { ECharts } from "echarts/core";
import { EChart } from "./echart";
import type { ChartSpec, ChartType } from "@/types";
import type { ProfiledTable } from "@/lib/profiler";
import {
  aggregateBar,
  aggregateHistogram,
  aggregateLine,
  aggregateScatter,
  aggregateStacked,
  formatNumber,
} from "@/lib/suggester/aggregate";
import { getThemeVar } from "@/lib/themes/palette";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SWITCHABLE_TYPES: { v: ChartType; label: string }[] = [
  { v: "bar", label: "Barras" },
  { v: "barh", label: "Barras horizontais" },
  { v: "stacked-bar", label: "Barras empilhadas" },
  { v: "line", label: "Linha" },
  { v: "area", label: "Área" },
  { v: "pie", label: "Pizza" },
  { v: "donut", label: "Donut" },
  { v: "treemap", label: "Treemap" },
  { v: "funnel", label: "Funil" },
  { v: "radar", label: "Radar" },
  { v: "scatter", label: "Dispersão" },
  { v: "histogram", label: "Histograma" },
];

export function ChartCard({
  spec,
  table,
  themeKey,
  onRemove,
  onChangeType,
}: {
  spec: ChartSpec;
  table: ProfiledTable;
  themeKey: string;
  onRemove?: () => void;
  onChangeType?: (type: ChartType) => void;
}) {
  const instanceRef = useRef<ECharts | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const option = useMemo(() => buildOption(spec, table), [spec, table]);

  const downloadPng = () => {
    const c = instanceRef.current;
    if (!c) return;
    const bg = getThemeVar("--surface", "#ffffff");
    const url = c.getDataURL({ pixelRatio: 3, backgroundColor: bg });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${spec.title}.png`.replace(/[^\w\-À-ɏ ]+/g, "");
    a.click();
  };

  return (
    <Card className="group flex flex-col p-4">
      <div className="flex items-start justify-between gap-3 pb-2">
        <h3 className="text-sm font-medium leading-tight" style={{ color: "var(--text-primary)" }}>
          {spec.title}
        </h3>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onChangeType ? (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMenuOpen((v) => !v)}
                title="Mudar tipo"
              >
                <span className="text-xs">Tipo</span>
                <ChevronDown className="size-3" />
              </Button>
              {menuOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border p-1 shadow-2xl"
                    style={{
                      background: "var(--surface-elevated)",
                      borderColor: "var(--border)",
                    }}
                  >
                    {SWITCHABLE_TYPES.map((t) => (
                      <button
                        key={t.v}
                        onClick={() => {
                          onChangeType(t.v);
                          setMenuOpen(false);
                        }}
                        className={cn(
                          "block w-full rounded-lg px-3 py-1.5 text-left text-xs transition",
                          spec.type === t.v
                            ? "bg-[var(--accent)] text-[var(--on-accent)]"
                            : "hover:bg-[var(--surface)]",
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={downloadPng}
            aria-label="Baixar PNG"
            title="Baixar PNG"
          >
            <Download className="size-4" />
          </Button>
          {onRemove ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label="Remover gráfico"
              title="Remover gráfico"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <EChart option={option} themeKey={themeKey} onReady={(c) => (instanceRef.current = c)} />
    </Card>
  );
}

function buildOption(spec: ChartSpec, table: ProfiledTable) {
  if (spec.type === "line" || spec.type === "area") {
    const data = aggregateLine(table, spec);
    return {
      xAxis: { type: "category", data: data.map((d) => d.x) },
      yAxis: { type: "value" },
      tooltip: { trigger: "axis" },
      series: [
        {
          type: "line",
          smooth: true,
          areaStyle: spec.type === "area" ? { opacity: 0.35 } : { opacity: 0.15 },
          lineStyle: { width: 2.5 },
          symbol: "circle",
          symbolSize: 6,
          data: data.map((d) => d.y),
        },
      ],
    };
  }

  if (spec.type === "pie" || spec.type === "donut") {
    const { data } = aggregateBar(table, spec);
    return {
      tooltip: { trigger: "item" },
      legend: { bottom: 0, textStyle: { color: getThemeVar("--text-secondary", "#6b7280") } },
      series: [
        {
          type: "pie",
          radius: spec.type === "donut" ? ["55%", "80%"] : ["0%", "75%"],
          itemStyle: { borderColor: getThemeVar("--surface", "#fff"), borderWidth: 2 },
          label: { formatter: "{b}\n{d}%" },
          data: data.map((d) => ({ name: d.x, value: d.y })),
        },
      ],
    };
  }

  if (spec.type === "histogram") {
    const buckets = aggregateHistogram(table, spec);
    return {
      xAxis: { type: "category", data: buckets.map((b) => b.label), axisLabel: { rotate: 30 } },
      yAxis: { type: "value" },
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const arr = params as { dataIndex: number; value: number }[];
          const b = buckets[arr[0].dataIndex];
          return `${b.label}<br/><b>${formatNumber(b.count)}</b> registros`;
        },
      },
      series: [
        {
          type: "bar",
          barCategoryGap: "5%",
          itemStyle: { borderRadius: [6, 6, 0, 0] },
          data: buckets.map((b) => b.count),
        },
      ],
    };
  }

  if (spec.type === "treemap") {
    const { data } = aggregateBar(table, spec);
    return {
      tooltip: { trigger: "item" },
      series: [
        {
          type: "treemap",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          label: { show: true, formatter: "{b}\n{c}" },
          upperLabel: { show: false },
          itemStyle: {
            borderColor: getThemeVar("--surface", "#fff"),
            borderWidth: 2,
            gapWidth: 2,
          },
          data: data.map((d) => ({ name: d.x, value: d.y })),
        },
      ],
    };
  }

  if (spec.type === "radar") {
    const { data } = aggregateBar(table, spec);
    const top = data.slice(0, 8);
    const max = Math.max(...top.map((d) => d.y), 1);
    return {
      tooltip: {},
      radar: {
        indicator: top.map((d) => ({ name: d.x, max })),
        axisName: { color: getThemeVar("--text-secondary", "#6b7280") },
      },
      series: [
        {
          type: "radar",
          areaStyle: { opacity: 0.3 },
          data: [{ value: top.map((d) => d.y), name: spec.title }],
        },
      ],
    };
  }

  if (spec.type === "funnel") {
    const { data } = aggregateBar(table, spec);
    return {
      tooltip: { trigger: "item" },
      legend: { bottom: 0, textStyle: { color: getThemeVar("--text-secondary", "#6b7280") } },
      series: [
        {
          type: "funnel",
          left: "5%",
          right: "5%",
          top: 10,
          bottom: 30,
          label: { formatter: "{b}: {c}" },
          data: data.slice(0, 10).map((d) => ({ name: d.x, value: d.y })),
        },
      ],
    };
  }

  if (spec.type === "scatter") {
    const points = aggregateScatter(table, spec);
    return {
      xAxis: { type: "value", scale: true },
      yAxis: { type: "value", scale: true },
      tooltip: {
        trigger: "item",
        formatter: (p: unknown) => {
          const { value } = p as { value: [number, number] };
          return `${formatNumber(value[0], 2)}<br/><b>${formatNumber(value[1], 2)}</b>`;
        },
      },
      series: [
        {
          type: "scatter",
          symbolSize: 10,
          itemStyle: { opacity: 0.7 },
          data: points.map((p) => [p.x, p.y]),
        },
      ],
    };
  }

  if (spec.type === "stacked-bar") {
    const st = aggregateStacked(table, spec);
    if (st.series.length === 0) {
      const { data } = aggregateBar(table, spec);
      return barOption(data, false);
    }
    return {
      xAxis: { type: "category", data: st.categories, axisLabel: { rotate: st.categories.length > 6 ? 30 : 0 } },
      yAxis: { type: "value" },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { bottom: 0, textStyle: { color: getThemeVar("--text-secondary", "#6b7280") } },
      series: st.series.map((s) => ({
        name: s.name,
        type: "bar",
        stack: "total",
        emphasis: { focus: "series" },
        data: s.data,
      })),
    };
  }

  // bar / barh (default)
  const { data } = aggregateBar(table, spec);
  const horizontal = spec.type === "barh" || data.length > 8;
  return barOption(data, horizontal);
}

function barOption(data: { x: string; y: number }[], horizontal: boolean) {
  if (horizontal) {
    const rev = [...data].reverse();
    return {
      grid: { left: 80, right: 24, top: 10, bottom: 30, containLabel: true },
      xAxis: { type: "value" },
      yAxis: { type: "category", data: rev.map((d) => truncate(d.x, 28)) },
      tooltip: { trigger: "axis" },
      series: [
        {
          type: "bar",
          itemStyle: { borderRadius: [0, 8, 8, 0] },
          data: rev.map((d) => d.y),
        },
      ],
    };
  }
  return {
    xAxis: {
      type: "category",
      data: data.map((d) => truncate(d.x, 16)),
      axisLabel: { rotate: data.length > 6 ? 30 : 0 },
    },
    yAxis: { type: "value" },
    tooltip: { trigger: "axis" },
    series: [
      {
        type: "bar",
        itemStyle: { borderRadius: [8, 8, 0, 0] },
        barMaxWidth: 44,
        data: data.map((d) => d.y),
      },
    ],
  };
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
