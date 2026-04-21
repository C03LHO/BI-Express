"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store";
import { applyTheme, getThemeById } from "@/lib/themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useAppStore((s) => s.themeId);
  const bumpTheme = useAppStore((s) => s.bumpTheme);

  useEffect(() => {
    applyTheme(getThemeById(themeId));
    bumpTheme();
  }, [themeId, bumpTheme]);

  return <>{children}</>;
}
