"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Palette, X, Check, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEMES } from "@/lib/themes";
import { FONT_FAMILIES, FONT_SCALES, useAppStore } from "@/store";
import { cn } from "@/lib/utils";

export function ThemePickerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Palette className="size-4" />
        <span className="hidden sm:inline">Tema & fontes</span>
      </Button>
      {open ? <ThemePickerModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function usePortal() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

function ThemePickerModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"themes" | "typography">("themes");
  const [filter, setFilter] = useState<"all" | "light" | "dark">("all");
  const themeId = useAppStore((s) => s.themeId);
  const setThemeId = useAppStore((s) => s.setThemeId);
  const fontFamily = useAppStore((s) => s.fontFamily);
  const setFontFamily = useAppStore((s) => s.setFontFamily);
  const fontScale = useAppStore((s) => s.fontScale);
  const setFontScale = useAppStore((s) => s.setFontScale);
  const mounted = usePortal();

  const list = THEMES.filter((t) => (filter === "all" ? true : t.mode === filter));

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-8"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
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
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Aparência
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Cores, tipografia e tamanho
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Fechar">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex gap-2 border-b px-6 py-3" style={{ borderColor: "var(--border)" }}>
          {(
            [
              ["themes", "Temas"],
              ["typography", "Tipografia"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                tab === v
                  ? "bg-[var(--accent)] text-[var(--on-accent)] shadow"
                  : "border border-[var(--border)] hover:bg-[var(--surface-elevated)]",
              )}
              style={tab !== v ? { color: "var(--text-primary)" } : undefined}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "themes" ? (
          <>
            <div
              className="flex gap-2 border-b px-6 py-3"
              style={{ borderColor: "var(--border)" }}
            >
              {(["all", "dark", "light"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFilter(v)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition",
                    filter === v
                      ? "bg-[var(--accent)] text-[var(--on-accent)]"
                      : "border border-[var(--border)] hover:bg-[var(--surface-elevated)]",
                  )}
                  style={filter !== v ? { color: "var(--text-primary)" } : undefined}
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
          </>
        ) : (
          <div className="flex flex-col gap-6 overflow-auto p-6">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                <Type className="size-4" />
                Fonte do texto
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {FONT_FAMILIES.map((f) => {
                  const active = fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFontFamily(f.id)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition",
                        active ? "ring-2 ring-[var(--accent)]" : "hover:bg-[var(--surface-elevated)]",
                      )}
                      style={{
                        borderColor: active ? "var(--accent)" : "var(--border)",
                        background: "var(--surface-elevated)",
                        fontFamily: f.stack,
                        color: "var(--text-primary)",
                      }}
                    >
                      <div className="text-base font-semibold">{f.name}</div>
                      <div
                        className="mt-1 text-xs"
                        style={{ color: "var(--text-muted)", fontFamily: f.stack }}
                      >
                        The quick brown fox · Sphinx of black quartz
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Tamanho do texto
              </p>
              <div className="flex flex-wrap gap-2">
                {FONT_SCALES.map((s) => {
                  const active = fontScale === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setFontScale(s.id)}
                      className={cn(
                        "flex-1 rounded-xl border px-4 py-3 text-center transition",
                        active ? "ring-2 ring-[var(--accent)]" : "hover:bg-[var(--surface-elevated)]",
                      )}
                      style={{
                        borderColor: active ? "var(--accent)" : "var(--border)",
                        background: "var(--surface-elevated)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <div className="font-semibold" style={{ fontSize: `${s.size * 16}px` }}>
                        Aa
                      </div>
                      <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        {s.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
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
