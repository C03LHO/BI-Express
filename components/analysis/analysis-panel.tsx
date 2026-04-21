"use client";

import { useState } from "react";
import { Sparkles, X, Wand2 } from "lucide-react";
import type { ColumnRole, ColumnKind } from "@/types";
import type { ProfiledTable } from "@/lib/profiler";
import { parseIntent } from "@/lib/intent";
import { suggestDashboard } from "@/lib/suggester";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROLES: { v: ColumnRole; label: string }[] = [
  { v: "measure", label: "Medida" },
  { v: "dimension", label: "Dimensão" },
  { v: "time", label: "Tempo" },
  { v: "identifier", label: "ID" },
  { v: "ignore", label: "Ignorar" },
];

const KINDS: ColumnKind[] = [
  "number",
  "integer",
  "currency",
  "date",
  "datetime",
  "category",
  "text",
  "boolean",
];

export function AnalysisButton() {
  const [open, setOpen] = useState(false);
  const table = useAppStore((s) => s.table);
  if (!table) return null;
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="size-4" />
        <span className="hidden sm:inline">Personalizar análise</span>
      </Button>
      {open ? <AnalysisPanel onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function AnalysisPanel({ onClose }: { onClose: () => void }) {
  const table = useAppStore((s) => s.table)!;
  const setTable = useAppStore((s) => s.setTable);
  const filename = useAppStore((s) => s.filename);
  const setSpec = useAppStore((s) => s.setSpec);

  const [tab, setTab] = useState<"cols" | "text" | "charts">("cols");
  const [labels, setLabels] = useState([...table.columnLabels]);
  const [kinds, setKinds] = useState<ColumnKind[]>([...table.kinds]);
  const [roles, setRoles] = useState<ColumnRole[]>([...table.roles]);
  const [text, setText] = useState("");
  const [intentNotes, setIntentNotes] = useState<string[]>([]);

  const apply = () => {
    const next: ProfiledTable = {
      ...table,
      columnLabels: labels,
      kinds,
      roles,
      profiles: table.profiles.map((p, i) => ({ ...p, kind: kinds[i], role: roles[i] })),
    };
    setTable(next, filename);
    setSpec(suggestDashboard(next));
    onClose();
  };

  const restoreAuto = () => {
    setLabels([...table.columnNames]);
    setKinds([...table.profiles.map((p) => p.kind)]);
    setRoles([...table.profiles.map((p) => p.role)]);
  };

  const applyIntent = () => {
    const result = parseIntent(text, table);
    const nextRoles = [...roles];
    for (let i = 0; i < table.columnIds.length; i++) {
      const id = table.columnIds[i];
      if (result.roleByColumn[id]) nextRoles[i] = result.roleByColumn[id];
    }
    setRoles(nextRoles);
    setIntentNotes(result.notes);
    setTab("cols");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-2xl flex-col border-l shadow-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between border-b px-6 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2
              className="text-xl font-medium tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Personalizar análise
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Ajuste colunas, descreva o que quer ver e escolha os gráficos.
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex gap-2 border-b px-6 py-3" style={{ borderColor: "var(--border)" }}>
          {(
            [
              ["cols", "1. Colunas"],
              ["text", "2. Descrever"],
              ["charts", "3. Gráficos"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                tab === v
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border)] hover:bg-[var(--surface-elevated)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {tab === "cols" ? (
            <ColumnsTab
              table={table}
              labels={labels}
              kinds={kinds}
              roles={roles}
              onLabel={(i, v) => setLabels((a) => a.map((x, j) => (j === i ? v : x)))}
              onKind={(i, v) => setKinds((a) => a.map((x, j) => (j === i ? v : x)))}
              onRole={(i, v) => setRoles((a) => a.map((x, j) => (j === i ? v : x)))}
            />
          ) : null}
          {tab === "text" ? (
            <TextTab
              value={text}
              onChange={setText}
              onApply={applyIntent}
              notes={intentNotes}
            />
          ) : null}
          {tab === "charts" ? (
            <ChartsTab
              table={{ ...table, columnLabels: labels, kinds, roles }}
            />
          ) : null}
        </div>

        <div
          className="flex items-center justify-between gap-3 border-t px-6 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <Button variant="ghost" size="sm" onClick={restoreAuto}>
            Restaurar automático
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" onClick={apply}>
              Gerar dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColumnsTab({
  table,
  labels,
  kinds,
  roles,
  onLabel,
  onKind,
  onRole,
}: {
  table: ProfiledTable;
  labels: string[];
  kinds: ColumnKind[];
  roles: ColumnRole[];
  onLabel: (i: number, v: string) => void;
  onKind: (i: number, v: ColumnKind) => void;
  onRole: (i: number, v: ColumnRole) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {table.columnIds.map((id, i) => {
        const preview = table.rows
          .map((r) => r[i])
          .filter((v) => v !== null)
          .slice(0, 5)
          .map((v) => (v instanceof Date ? v.toLocaleDateString("pt-BR") : String(v)))
          .join(", ");
        return (
          <div
            key={id}
            className="flex flex-col gap-2 rounded-xl border p-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={labels[i]}
                onChange={(e) => onLabel(i, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border bg-transparent px-2 py-1 text-sm"
                style={{ borderColor: "var(--border)" }}
              />
              <select
                value={kinds[i]}
                onChange={(e) => onKind(i, e.target.value as ColumnKind)}
                className="rounded-lg border bg-transparent px-2 py-1 text-xs"
                style={{ borderColor: "var(--border)" }}
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <select
                value={roles[i]}
                onChange={(e) => onRole(i, e.target.value as ColumnRole)}
                className="rounded-lg border bg-transparent px-2 py-1 text-xs"
                style={{ borderColor: "var(--border)" }}
              >
                {ROLES.map((r) => (
                  <option key={r.v} value={r.v}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
              Preview: {preview || "—"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function TextTab({
  value,
  onChange,
  onApply,
  notes,
}: {
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  notes: string[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium">
        Descreva em uma frase o que esses dados representam e o que você quer ver.
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex: Registros de carga de minério, quero ver volume por produto e evolução diária."
        rows={5}
        className="rounded-xl border bg-transparent p-3 text-sm"
        style={{ borderColor: "var(--border)" }}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onApply} disabled={value.trim().length < 3}>
          <Wand2 className="size-4" />
          Aplicar sugestão
        </Button>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          100% local — sem enviar seus dados pra lugar nenhum.
        </p>
      </div>
      {notes.length > 0 ? (
        <div
          className="rounded-lg border p-3 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          {notes.map((n, i) => (
            <p key={i}>• {n}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ChartsTab({ table }: { table: ProfiledTable }) {
  const spec = suggestDashboard(table);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Prévia da proposta com as configurações atuais.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {spec.kpis.map((k) => (
          <div
            key={k.id}
            className="rounded-xl border p-3"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>
              KPI
            </p>
            <p className="font-medium">{k.title}</p>
          </div>
        ))}
        {spec.charts.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border p-3"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>
              {c.type}
            </p>
            <p className="font-medium">{c.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
