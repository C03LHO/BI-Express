"use client";

import { useEffect } from "react";
import { FONT_FAMILIES, FONT_SCALES, useAppStore } from "@/store";
import { applyTheme, getThemeById } from "@/lib/themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useAppStore((s) => s.themeId);
  const fontFamily = useAppStore((s) => s.fontFamily);
  const fontScale = useAppStore((s) => s.fontScale);
  const bumpTheme = useAppStore((s) => s.bumpTheme);

  useEffect(() => {
    applyTheme(getThemeById(themeId));
    bumpTheme();
  }, [themeId, bumpTheme]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const family = FONT_FAMILIES.find((f) => f.id === fontFamily) ?? FONT_FAMILIES[0];
    const scale = FONT_SCALES.find((s) => s.id === fontScale) ?? FONT_SCALES[1];
    document.documentElement.style.setProperty("--font-sans", family.stack);
    document.documentElement.style.setProperty("--app-font-scale", String(scale.size));
    document.documentElement.style.fontSize = `${scale.size * 100}%`;
  }, [fontFamily, fontScale]);

  return <>{children}</>;
}
