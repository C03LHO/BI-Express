"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ChartCard } from "@/components/charts/chart-card";
import { DataTable } from "@/components/dashboard/data-table";
import { ThemePickerButton } from "@/components/theme-picker/theme-picker";
import { AnalysisButton } from "@/components/analysis/analysis-panel";
import { ExportMenu } from "@/components/dashboard/export-menu";
import { useAppStore } from "@/store";
import { computeKpi } from "@/lib/suggester/aggregate";

export default function DashboardPage() {
  const table = useAppStore((s) => s.table);
  const spec = useAppStore((s) => s.spec);
  const filename = useAppStore((s) => s.filename);
  const themeBump = useAppStore((s) => s.themeBump);
  const setSpec = useAppStore((s) => s.setSpec);
  const router = useRouter();

  useEffect(() => {
    if (!table) router.replace("/");
  }, [table, router]);

  if (!table || !spec) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center py-20 text-sm">Carregando…</div>
      </AppShell>
    );
  }

  const removeChart = (id: string) => {
    if (!spec) return;
    setSpec({ ...spec, charts: spec.charts.filter((c) => c.id !== id) });
  };

  return (
    <AppShell
      actions={
        <>
          <AnalysisButton />
          <ThemePickerButton />
          <ExportMenu containerId="dashboard-root" />
          <Link href="/">
            <Button size="sm" variant="ghost">
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Novo arquivo</span>
            </Button>
          </Link>
        </>
      }
    >
      <div
        id="dashboard-root"
        className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6"
        style={{ background: "var(--bg)" }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-medium tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {filename ?? "Dashboard"}
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {table.candidate.sheet} · {table.rows.length} linhas · {table.columnLabels.length} colunas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {spec.kpis.map((k) => {
            const v = computeKpi(table, k);
            return <KpiCard key={k.id} title={v.title} value={v.value} sub={v.sub} />;
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {spec.charts.map((c) => (
            <ChartCard
              key={c.id}
              spec={c}
              table={table}
              themeKey={`${c.id}-${themeBump}`}
              onRemove={() => removeChart(c.id)}
            />
          ))}
        </div>

        <DataTable table={table} />
      </div>
    </AppShell>
  );
}
