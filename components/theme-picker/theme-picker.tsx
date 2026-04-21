"use client";

import { useState } from "react";
import { Palette, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEMES } from "@/lib/themes";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

export function ThemePickerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Palette className="size-4" />
        <span className="hidden sm:inline">Mudar tema</span>
      </Button>
      {open ? <ThemePickerModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function ThemePickerModal({ onClose }: { onClose: () => void }) {
  const [filter, setFilter] = useState<"all" | "light" | "dark">("all");
  const themeId = useAppStore((s) => s.themeId);
  const setThemeId = useAppStore((s) => s.setThemeId);

  const list = THEMES.filter((t) => (filter === "all" ? true : t.mode === filter));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-8"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl sm:max-h-[calc(100vh-4rem)]"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2
              className="text-xl font-medium tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Tema
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Cores, fontes e estilo visual
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Fechar">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex gap-2 border-b px-6 py-3" style={{ borderColor: "var(--border)" }}>
          {(["all", "dark", "light"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                filter === v
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border)] hover:bg-[var(--surface-elevated)]",
              )}
            >
              {v === "all" ? "Todos" : v === "dark" ? "Escuros" : "Claros"}
            </button>
          ))}
        </div>

        <div className="grid gap-4 overflow-auto p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {list.map((t) => {
            const active = themeId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setThemeId(t.id);
                  onClose();
                }}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-xl border text-left transition",
                  active ? "ring-2 ring-[var(--accent)]" : "hover:scale-[1.02]",
                )}
                style={{
                  borderColor: active ? "var(--accent)" : "var(--border)",
                  background: t.vars["--bg"],
                }}
              >
                <div className="relative flex h-28 items-center justify-center p-4">
                  <ThemePreview vars={t.vars} />
                  {active ? (
                    <span
                      className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full shadow"
                      style={{ background: t.vars["--accent"], color: "#fff" }}
                    >
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
                <div
                  className="flex items-center justify-between border-t px-3 py-2 text-xs"
                  style={{
                    background: t.vars["--surface"],
                    borderColor: t.vars["--border"],
                    color: t.vars["--text-primary"],
                  }}
                >
                  <span className="font-medium">{t.name}</span>
                  <span
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: t.vars["--text-muted"] }}
                  >
                    {t.mode}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ThemePreview({ vars }: { vars: Record<string, string> }) {
  return (
    <div
      className="flex h-full w-full items-end gap-1.5 rounded-lg px-3 pb-3 pt-5"
      style={{ background: vars["--surface"], border: `1px solid ${vars["--border"]}` }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex-1 rounded-t-md"
          style={{
            background: vars[`--chart-${i}`],
            height: `${20 + i * 12}%`,
          }}
        />
      ))}
    </div>
  );
}
