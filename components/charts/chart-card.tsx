"use client";

import { useMemo, useRef } from "react";
import { MoreHorizontal, Download, Trash2 } from "lucide-react";
import type { ECharts } from "echarts/core";
import { EChart } from "./echart";
import type { ChartSpec } from "@/types";
import type { ProfiledTable } from "@/lib/profiler";
import {
  aggregateBar,
  aggregateHistogram,
  aggregateLine,
  formatNumber,
} from "@/lib/suggester/aggregate";
import { getThemeVar } from "@/lib/themes/palette";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ChartCard({
  spec,
  table,
  themeKey,
  onRemove,
}: {
  spec: ChartSpec;
  table: ProfiledTable;
  themeKey: string;
  onRemove?: () => void;
}) {
  const instanceRef = useRef<ECharts | null>(null);
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
          ) : (
            <Button variant="ghost" size="icon" aria-hidden>
              <MoreHorizontal className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <EChart option={option} themeKey={themeKey} onReady={(c) => (instanceRef.current = c)} />
    </Card>
  );
}

function buildOption(spec: ChartSpec, table: ProfiledTable) {
  if (spec.type === "line") {
    const data = aggregateLine(table, spec);
    return {
      xAxis: { type: "category", data: data.map((d) => d.x) },
      yAxis: { type: "value" },
      tooltip: { trigger: "axis" },
      series: [
        {
          type: "line",
          smooth: true,
          areaStyle: { opacity: 0.15 },
          lineStyle: { width: 2.5 },
          symbol: "circle",
          symbolSize: 6,
          data: data.map((d) => d.y),
        },
      ],
    };
  }
  if (spec.type === "pie") {
    const { data } = aggregateBar(table, spec);
    return {
      tooltip: { trigger: "item" },
      legend: { bottom: 0 },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
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
  // bar (default) and barh
  const { data } = aggregateBar(table, spec);
  const horizontal = spec.type === "barh" || data.length > 8;
  if (horizontal) {
    // descending top-to-bottom: ECharts draws categories bottom-up, so reverse.
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
    xAxis: { type: "category", data: data.map((d) => truncate(d.x, 16)), axisLabel: { rotate: data.length > 6 ? 30 : 0 } },
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
