// Client-side export: PNG (html2canvas-pro), PDF (jsPDF), clean XLSX (SheetJS).
// All executed against the live DOM with the active theme — no server needed.

import * as XLSX from "xlsx";
import { getThemeVar } from "@/lib/themes/palette";
import type { ProfiledTable } from "@/lib/profiler";

export async function exportDashboardPng(containerId: string, filename: string) {
  const el = document.getElementById(containerId);
  if (!el) throw new Error("Container não encontrado");
  const bg = getThemeVar("--bg", "#ffffff");
  const { default: html2canvas } = await import("html2canvas-pro");
  el.classList.add("exporting");
  try {
    const canvas = await html2canvas(el, {
      backgroundColor: bg,
      scale: 3,
      useCORS: true,
      logging: false,
    });
    triggerDownload(canvas.toDataURL("image/png"), filename);
  } finally {
    el.classList.remove("exporting");
  }
}

export async function exportDashboardPdf(containerId: string, filename: string) {
  const el = document.getElementById(containerId);
  if (!el) throw new Error("Container não encontrado");
  const bg = getThemeVar("--bg", "#ffffff");
  const { default: html2canvas } = await import("html2canvas-pro");
  const { default: JsPDFModule } = await import("jspdf");
  // jspdf default export differs across versions; coerce.
  const JsPDF = (JsPDFModule as unknown as { jsPDF?: typeof import("jspdf").jsPDF }).jsPDF ?? JsPDFModule;
  el.classList.add("exporting");
  try {
    const canvas = await html2canvas(el, {
      backgroundColor: bg,
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const img = canvas.toDataURL("image/png");
    const pdf = new (JsPDF as unknown as typeof import("jspdf").jsPDF)({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    pdf.addImage(img, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
    pdf.save(filename);
  } finally {
    el.classList.remove("exporting");
  }
}

export function exportTableXlsx(table: ProfiledTable, filename: string) {
  const header = table.columnLabels;
  const rows = table.rows.map((row) =>
    row.map((v) => {
      if (v instanceof Date) return v;
      return v;
    }),
  );
  const aoa = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");
  XLSX.writeFile(wb, filename);
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
