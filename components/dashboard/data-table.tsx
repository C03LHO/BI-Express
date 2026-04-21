"use client";

import { useMemo, useState } from "react";
import type { ProfiledTable } from "@/lib/profiler";
import { formatCurrency, formatDate, formatNumber } from "@/lib/suggester/aggregate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

const PAGE_SIZE = 20;

export function DataTable({ table }: { table: ProfiledTable }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ col: number; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let rows = table.rows;
    if (q) {
      const needle = q.toLowerCase();
      rows = rows.filter((r) =>
        r.some((c) => (c == null ? "" : String(c)).toLowerCase().includes(needle)),
      );
    }
    if (sort) {
      rows = [...rows].sort((a, b) => {
        const av = a[sort.col];
        const bv = b[sort.col];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = av instanceof Date && bv instanceof Date
          ? av.getTime() - bv.getTime()
          : typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), "pt-BR");
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [table.rows, q, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center justify-between gap-3 border-b p-4"
        style={{ borderColor: "var(--border)" }}
      >
        <h3 className="text-sm font-medium">Dados ({formatNumber(filtered.length)} linhas)</h3>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar…"
            className="h-9 w-56 rounded-lg border bg-transparent pl-9 pr-3 text-sm outline-none focus:ring-2"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface-elevated)" }}>
              {table.columnLabels.map((label, i) => (
                <th
                  key={i}
                  className="cursor-pointer whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                  onClick={() =>
                    setSort((s) =>
                      s?.col === i
                        ? s.dir === "asc"
                          ? { col: i, dir: "desc" }
                          : null
                        : { col: i, dir: "asc" },
                    )
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {sort?.col === i ? (
                      sort.dir === "asc" ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      )
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => (
              <tr
                key={ri}
                className="border-t"
                style={{ borderColor: "var(--border)" }}
              >
                {row.map((v, ci) => (
                  <td key={ci} className="whitespace-nowrap px-4 py-2.5">
                    {formatValue(v, table.kinds[ci])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className="flex items-center justify-between gap-3 border-t p-3 text-xs"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        <span>
          Página {page + 1} de {pageCount}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
          >
            Próxima
          </Button>
        </div>
      </div>
    </Card>
  );
}

function formatValue(v: unknown, kind: string): string {
  if (v == null) return "—";
  if (v instanceof Date) return formatDate(v);
  if (typeof v === "number") {
    if (kind === "currency") return formatCurrency(v);
    if (kind === "integer") return formatNumber(v);
    return formatNumber(v, 2);
  }
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  return String(v);
}
