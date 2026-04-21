// Reads CSS variables at runtime so ECharts always paints in the active theme.
// Safe-noops on the server (returns fallbacks).

export function getChartPalette(): string[] {
  if (typeof window === "undefined") {
    return ["#6d5bd0", "#9d8df0", "#4a3ba8", "#c4b8f5", "#8374e0", "#2a1f66", "#e0d8fa", "#3a2e85"];
  }
  const s = getComputedStyle(document.documentElement);
  const out: string[] = [];
  for (let i = 1; i <= 8; i++) {
    const v = s.getPropertyValue(`--chart-${i}`).trim();
    if (v) out.push(v);
  }
  return out.length > 0 ? out : ["#6d5bd0"];
}

export function getThemeVar(name: string, fallback = ""): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
