"use client";

import { useState } from "react";
import { Download, FileImage, FileText, Table2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  exportDashboardPdf,
  exportDashboardPng,
  exportTableXlsx,
} from "@/lib/exporter";
import { useAppStore } from "@/store";

export function ExportMenu({ containerId }: { containerId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const table = useAppStore((s) => s.table);
  const filename = useAppStore((s) => s.filename) ?? "dashboard";
  const base = filename.replace(/\.[^.]+$/, "");

  const run = async (kind: "png" | "pdf" | "xlsx") => {
    setBusy(kind);
    try {
      if (kind === "png") await exportDashboardPng(containerId, `${base}.png`);
      if (kind === "pdf") await exportDashboardPdf(containerId, `${base}.pdf`);
      if (kind === "xlsx" && table) exportTableXlsx(table, `${base}-limpo.xlsx`);
    } catch (e) {
      alert("Erro ao exportar: " + (e as Error).message);
    } finally {
      setBusy(null);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        <span className="hidden sm:inline">Exportar</span>
      </Button>
      {open && !busy ? (
        <div
          className="absolute right-0 top-full z-50 mt-1 flex w-56 flex-col gap-1 rounded-xl border p-1.5 shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <button
            onClick={() => run("png")}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--surface-elevated)]"
          >
            <FileImage className="size-4" /> PNG (alta resolução)
          </button>
          <button
            onClick={() => run("pdf")}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--surface-elevated)]"
          >
            <FileText className="size-4" /> PDF (A4 paisagem)
          </button>
          <button
            onClick={() => run("xlsx")}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--surface-elevated)]"
          >
            <Table2 className="size-4" /> Dados limpos (.xlsx)
          </button>
        </div>
      ) : null}
    </div>
  );
}
