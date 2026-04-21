"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ProfiledTable } from "@/lib/profiler";
import type { DashboardSpec } from "@/types";
import type { DashboardView } from "@/lib/suggester";
import { DEFAULT_THEME_ID } from "@/lib/themes";

interface AppState {
  themeId: string;
  setThemeId: (id: string) => void;

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
      partialize: (s) => ({ themeId: s.themeId }),
    },
  ),
);
