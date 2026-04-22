"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ProfiledTable } from "@/lib/profiler";
import type { DashboardSpec } from "@/types";
import type { DashboardView } from "@/lib/suggester";
import { DEFAULT_THEME_ID } from "@/lib/themes";

export const FONT_FAMILIES = [
  {
    id: "inter",
    name: "Inter",
    stack: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "system",
    name: "Sistema",
    stack: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  {
    id: "serif",
    name: "Fraunces (Serifa)",
    stack: "var(--font-fraunces), ui-serif, Georgia, serif",
  },
  {
    id: "mono",
    name: "Monospace",
    stack: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
] as const;

export type FontFamilyId = (typeof FONT_FAMILIES)[number]["id"];

export const FONT_SCALES = [
  { id: "sm", name: "Pequeno", size: 0.9 },
  { id: "md", name: "Padrão", size: 1.0 },
  { id: "lg", name: "Grande", size: 1.1 },
  { id: "xl", name: "Muito grande", size: 1.2 },
] as const;

export type FontScaleId = (typeof FONT_SCALES)[number]["id"];

interface AppState {
  themeId: string;
  setThemeId: (id: string) => void;

  fontFamily: FontFamilyId;
  setFontFamily: (id: FontFamilyId) => void;
  fontScale: FontScaleId;
  setFontScale: (id: FontScaleId) => void;

  // runtime-only — not persisted (profiled tables can be huge)
  table: ProfiledTable | null;
  filename: string | null;
  spec: DashboardSpec | null;
  view: DashboardView;
  themeBump: number; // incremented on theme change to force chart re-render
  setTable: (t: ProfiledTable | null, filename: string | null) => void;
  setSpec: (s: DashboardSpec | null) => void;
  setView: (v: DashboardView) => void;
  bumpTheme: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME_ID,
      setThemeId: (id) => set({ themeId: id }),

      fontFamily: "inter",
      setFontFamily: (id) => set({ fontFamily: id }),
      fontScale: "md",
      setFontScale: (id) => set({ fontScale: id }),

      table: null,
      filename: null,
      spec: null,
      view: "overview",
      themeBump: 0,
      setTable: (t, fn) => set({ table: t, filename: fn }),
      setSpec: (s) => set({ spec: s }),
      setView: (v) => set({ view: v }),
      bumpTheme: () => set((s) => ({ themeBump: s.themeBump + 1 })),
    }),
    {
      name: "bi-express-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        themeId: s.themeId,
        fontFamily: s.fontFamily,
        fontScale: s.fontScale,
      }),
    },
  ),
);
