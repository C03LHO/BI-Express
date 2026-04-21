"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from "lucide-react";
import { parseFile } from "@/lib/parser";
import { detectTables, type TableCandidate } from "@/lib/detector";
import { profileTable } from "@/lib/profiler";
import { suggestDashboard } from "@/lib/suggester";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

type Step =
  | { kind: "idle" }
  | { kind: "reading"; label: string }
  | { kind: "choose"; candidates: TableCandidate[]; filename: string }
  | { kind: "error"; message: string };

export function UploadZone() {
  const [step, setStep] = useState<Step>({ kind: "idle" });
  const [drag, setDrag] = useState(false);
  const setTable = useAppStore((s) => s.setTable);
  const setSpec = useAppStore((s) => s.setSpec);
  const view = useAppStore((s) => s.view);
  const router = useRouter();

  const handleFile = useCallback(
    async (file: File) => {
      try {
        setStep({ kind: "reading", label: "Lendo arquivo…" });
        const parsed = await parseFile(file);
        setStep({ kind: "reading", label: "Detectando tabelas…" });
        const candidates = detectTables(parsed.sheets);
        if (candidates.length === 0) {
          setStep({
            kind: "error",
            message:
              "Não encontrei nenhuma tabela válida no arquivo. Verifique se há cabeçalhos e pelo menos 5 linhas de dados.",
          });
          return;
        }
        if (candidates.length > 1 && candidates[1].score > candidates[0].score * 0.75) {
          setStep({ kind: "choose", candidates, filename: file.name });
          return;
        }
        await commit(candidates[0], file.name);
      } catch (e) {
        setStep({ kind: "error", message: (e as Error).message });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  async function commit(candidate: TableCandidate, filename: string) {
    setStep({ kind: "reading", label: "Analisando colunas…" });
    await new Promise((r) => setTimeout(r, 10));
    const profiled = profileTable(candidate);
    setStep({ kind: "reading", label: "Gerando dashboard…" });
    const spec = suggestDashboard(profiled, view);
    setTable(profiled, filename);
    setSpec(spec);
    router.push("/dashboard");
  }

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  if (step.kind === "reading") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Loader2 className="size-8 animate-spin" style={{ color: "var(--accent)" }} />
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {step.label}
        </p>
      </div>
    );
  }

  if (step.kind === "choose") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 py-10">
        <h3 className="text-lg font-medium">
          Detectamos {step.candidates.length} tabelas. Qual você quer analisar?
        </h3>
        <div className="flex flex-col gap-2">
          {step.candidates.map((c, i) => (
            <button
              key={c.id}
              onClick={() => commit(c, step.filename)}
              className="flex items-center justify-between rounded-xl border p-4 text-left hover:bg-[var(--surface-elevated)]"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <div>
                <p className="font-medium">
                  {c.sheet} · {c.range} {i === 0 ? "(melhor candidata)" : ""}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {c.rows.length} linhas × {c.header.length} colunas · score {c.score}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                  Colunas: {c.header.slice(0, 6).join(", ")}
                  {c.header.length > 6 ? "…" : ""}
                </p>
              </div>
              <FileSpreadsheet className="size-5" style={{ color: "var(--accent)" }} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <label
        htmlFor="file-input"
        onDragEnter={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={cn(
          "flex w-full max-w-xl cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition",
          drag ? "scale-[1.01]" : "",
        )}
        style={{
          borderColor: drag ? "var(--accent)" : "var(--border)",
          background: drag ? "var(--surface-elevated)" : "var(--surface)",
        }}
      >
        <span
          className="flex size-14 items-center justify-center rounded-full"
          style={{ background: "var(--surface-elevated)", color: "var(--accent)" }}
        >
          <Upload className="size-6" />
        </span>
        <div>
          <p className="text-base font-medium">Arraste um arquivo ou clique para selecionar</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            .xlsx, .xls, .csv ou .tsv — processado no seu navegador
          </p>
        </div>
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls,.xlsm,.csv,.tsv,.txt"
          className="hidden"
          onChange={onInput}
        />
      </label>

      {step.kind === "error" ? (
        <div
          className="flex max-w-xl items-start gap-2 rounded-lg border p-3 text-sm"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
            color: "var(--text-secondary)",
          }}
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
          <span>{step.message}</span>
        </div>
      ) : null}
    </div>
  );
}
