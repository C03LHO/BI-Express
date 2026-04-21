"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  HeatmapChart,
  TreemapChart,
  RadarChart,
  FunnelChart,
} from "echarts/charts";
import {
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  DatasetComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { getChartPalette, getThemeVar } from "@/lib/themes/palette";

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  HeatmapChart,
  TreemapChart,
  RadarChart,
  FunnelChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  DatasetComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

export type EChartOption = echarts.EChartsCoreOption;

export function EChart({
  option,
  height = 280,
  onReady,
  themeKey,
}: {
  option: EChartOption;
  height?: number;
  onReady?: (instance: echarts.ECharts) => void;
  themeKey?: string; // change this prop to force re-theme
}) {
  const ref = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    instanceRef.current = chart;
    onReady?.(chart);
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart) return;
    const textColor = getThemeVar("--text-secondary", "#6b7280");
    const muted = getThemeVar("--text-muted", "#9ca3af");
    const border = getThemeVar("--border", "#e5e7eb");
    const bg = getThemeVar("--surface", "#ffffff");
    const palette = getChartPalette();

    const merged: EChartOption = {
      color: palette,
      backgroundColor: "transparent",
      textStyle: { color: textColor, fontFamily: "inherit" },
      grid: { left: 40, right: 16, top: 28, bottom: 40, containLabel: true },
      tooltip: {
        trigger: "item",
        backgroundColor: bg,
        borderColor: border,
        textStyle: { color: getThemeVar("--text-primary", "#111827") },
        extraCssText: "box-shadow: 0 6px 20px rgba(0,0,0,0.08); border-radius: 10px;",
      },
      legend: { textStyle: { color: textColor } },
      xAxis: {
        axisLine: { lineStyle: { color: border } },
        axisLabel: { color: muted, hideOverlap: true },
        splitLine: { show: false },
      },
      yAxis: {
        axisLine: { show: false },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: border, type: "dashed" } },
      },
      ...option,
    };
    chart.setOption(merged, true);
  }, [option, themeKey]);

  return <div ref={ref} style={{ width: "100%", height }} />;
}
