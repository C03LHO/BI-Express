// 20 themes: 10 light + 10 dark. Each defines a full set of CSS variables;
// the app swaps them at runtime on :root via inline style.

export type ThemeMode = "dark" | "light";

export interface Theme {
  id: string;
  name: string;
  mode: ThemeMode;
  vars: Record<string, string>;
}

type V = Record<string, string>;

const light = (bg: string, surface: string, elev: string, border: string, tp: string, ts: string, tm: string, accent: string, accentH: string, charts: string[]): V => ({
  "--bg": bg,
  "--surface": surface,
  "--surface-elevated": elev,
  "--border": border,
  "--text-primary": tp,
  "--text-secondary": ts,
  "--text-muted": tm,
  "--accent": accent,
  "--accent-hover": accentH,
  ...charts.reduce((a, c, i) => ({ ...a, [`--chart-${i + 1}`]: c }), {} as V),
});

const dark = light; // same shape

export const THEMES: Theme[] = [
  // LIGHT
  {
    id: "lavender",
    name: "Lavender",
    mode: "light",
    vars: light(
      "#f6f4ff", "#ffffff", "#ffffff", "#e6e1f5",
      "#1a1333", "#4a4266", "#8b84a3",
      "#6d5bd0", "#5a48c0",
      ["#6d5bd0","#9d8df0","#4a3ba8","#c4b8f5","#3a2e85","#e0d8fa","#8374e0","#2a1f66"],
    ),
  },
  {
    id: "howlite",
    name: "Howlite",
    mode: "light",
    vars: light(
      "#f6f6f3", "#ffffff", "#fafaf7", "#e3e3de",
      "#1a1a1a", "#4d4d4d", "#8a8a85",
      "#2f2f2f", "#1f1f1f",
      ["#2f2f2f","#6b6b6b","#9e9e9e","#c8a96a","#7a6a4a","#d4c9a8","#5a5a5a","#3a3a3a"],
    ),
  },
  {
    id: "atmosphere",
    name: "Atmosphere",
    mode: "light",
    vars: light(
      "#fdf7f9", "#ffffff", "#fff5f7", "#f2e0e6",
      "#2a1624", "#5a3c52", "#9c7f91",
      "#e28aa6", "#d66d8d",
      ["#e28aa6","#f2b4c7","#b55c7c","#f7d6de","#8c3d5b","#fae5eb","#ca7e95","#712d48"],
    ),
  },
  {
    id: "kraft",
    name: "Kraft",
    mode: "light",
    vars: light(
      "#f7f1e6", "#fffaf0", "#fdf5e4", "#e8dcc2",
      "#3a2a12", "#6b4f2a", "#a68b5f",
      "#b8843a", "#a16f2a",
      ["#b8843a","#d9a860","#855a1f","#ecd39a","#613e0e","#f5e6c8","#a37040","#3f2806"],
    ),
  },
  {
    id: "sandstone",
    name: "Sandstone",
    mode: "light",
    vars: light(
      "#fbf6ed", "#ffffff", "#fcf4e5", "#ebdec1",
      "#2e2514", "#5a4a2d", "#9a8963",
      "#c87a4a", "#ae6438",
      ["#c87a4a","#e2a07a","#8f4e28","#f2c6a8","#6b3416","#f7ddca","#ad613a","#431e08"],
    ),
  },
  {
    id: "arctic",
    name: "Arctic",
    mode: "light",
    vars: light(
      "#f0f7fb", "#ffffff", "#f5fbff", "#d8e9f3",
      "#0c1e2c", "#3b5871", "#7e95aa",
      "#1f80b3", "#176798",
      ["#1f80b3","#59a8d1","#0e527b","#a8d0e6","#082f4d","#d6eaf5","#3d8fbf","#04192a"],
    ),
  },
  {
    id: "moss",
    name: "Moss",
    mode: "light",
    vars: light(
      "#f3f7ee", "#ffffff", "#f6faef", "#dde5d0",
      "#182512", "#3d5930", "#82986e",
      "#5c8a3a", "#47702b",
      ["#5c8a3a","#8ab367","#3d5e22","#bcd7a0","#243f0f","#dce9cb","#6a9c46","#111f05"],
    ),
  },
  {
    id: "pearl",
    name: "Pearl",
    mode: "light",
    vars: light(
      "#fafafa", "#ffffff", "#f4f4f5", "#e4e4e7",
      "#0a0a0a", "#404040", "#737373",
      "#0ea5e9", "#0284c7",
      ["#0ea5e9","#38bdf8","#0369a1","#7dd3fc","#075985","#bae6fd","#0284c7","#0c4a6e"],
    ),
  },
  {
    id: "citrus",
    name: "Citrus",
    mode: "light",
    vars: light(
      "#fefae0", "#ffffff", "#fffce5", "#ecdf99",
      "#3d2e02", "#6b521a", "#a78c4a",
      "#d4a017", "#b8860b",
      ["#d4a017","#eac44a","#946d08","#f4dc7f","#5c3f02","#f9e9a8","#b88c12","#2e1c00"],
    ),
  },
  {
    id: "sakura",
    name: "Sakura",
    mode: "light",
    vars: light(
      "#fff4f6", "#ffffff", "#fff8fa", "#f4d5dc",
      "#3b1621", "#6b3a49", "#a97586",
      "#e75480", "#cf3d6b",
      ["#e75480","#f47ca1","#a23359","#facad5","#6b1838","#fde1e8","#d05978","#460e22"],
    ),
  },

  // DARK
  {
    id: "indigo",
    name: "Indigo",
    mode: "dark",
    vars: dark(
      "#0f0c2b", "#1a1544", "#231c57", "#2f2866",
      "#f3f1ff", "#b5adde", "#7d75a8",
      "#8b7bf7", "#a393ff",
      ["#8b7bf7","#b4a6ff","#5c4dce","#e3dbff","#3a2ea8","#f2eeff","#9c8efa","#2a1f80"],
    ),
  },
  {
    id: "onyx",
    name: "Onyx",
    mode: "dark",
    vars: dark(
      "#0a0a0a", "#141414", "#1c1c1c", "#262626",
      "#ffffff", "#b8b8b8", "#737373",
      "#eaeaea", "#ffffff",
      ["#eaeaea","#a3a3a3","#f5f5f5","#737373","#d4d4d4","#525252","#ffffff","#404040"],
    ),
  },
  {
    id: "mystique",
    name: "Mystique",
    mode: "dark",
    vars: dark(
      "#1a0d26", "#24142e", "#2e1a3a", "#3a2347",
      "#f5e8ff", "#d0b3e6", "#9370b0",
      "#d946ef", "#c026d3",
      ["#d946ef","#f0abfc","#a21caf","#f5d0fe","#701a75","#fae8ff","#c026d3","#4a044e"],
    ),
  },
  {
    id: "blueberry",
    name: "Blueberry",
    mode: "dark",
    vars: dark(
      "#0b1633", "#132048", "#1a2a5c", "#243670",
      "#e5ecff", "#a5b4dd", "#6b7aab",
      "#4f7cff", "#3663e8",
      ["#4f7cff","#82a0ff","#2d55c7","#b9cbff","#1a3a9e","#dde6ff","#6790ff","#0f2275"],
    ),
  },
  {
    id: "graphite",
    name: "Graphite",
    mode: "dark",
    vars: dark(
      "#111113", "#1a1a1d", "#222226", "#2c2c30",
      "#f2f2f4", "#a8a8ad", "#6e6e74",
      "#7aa2f7", "#5e87e8",
      ["#7aa2f7","#a6c0ff","#4d7ad9","#cdd6ff","#2d5ab3","#e6eaff","#8ab0ff","#15356d"],
    ),
  },
  {
    id: "obsidian",
    name: "Obsidian",
    mode: "dark",
    vars: dark(
      "#060709", "#0f1115", "#161920", "#20242d",
      "#e7eaf1", "#9ea5b3", "#646b78",
      "#14b8a6", "#0d9488",
      ["#14b8a6","#5eead4","#0f766e","#99f6e4","#115e59","#ccfbf1","#2dd4bf","#042f2e"],
    ),
  },
  {
    id: "forest",
    name: "Forest",
    mode: "dark",
    vars: dark(
      "#0c1a12", "#13241b", "#1a2e23", "#22392c",
      "#e8f2eb", "#9cbda9", "#618570",
      "#22c55e", "#16a34a",
      ["#22c55e","#86efac","#15803d","#bbf7d0","#14532d","#dcfce7","#4ade80","#052e16"],
    ),
  },
  {
    id: "midnight",
    name: "Midnight",
    mode: "dark",
    vars: dark(
      "#050812", "#0c1122", "#131b33", "#1c2644",
      "#e8ecf8", "#9aa4c0", "#5e6784",
      "#6366f1", "#4f46e5",
      ["#6366f1","#a5b4fc","#4338ca","#c7d2fe","#312e81","#e0e7ff","#818cf8","#1e1b4b"],
    ),
  },
  {
    id: "cobalt",
    name: "Cobalt",
    mode: "dark",
    vars: dark(
      "#041428", "#072038", "#0b2c4a", "#123a5f",
      "#e0ecf9", "#8db0cc", "#4f7290",
      "#0ea5e9", "#0284c7",
      ["#0ea5e9","#7dd3fc","#0369a1","#bae6fd","#0c4a6e","#e0f2fe","#38bdf8","#082f49"],
    ),
  },
  {
    id: "terracotta",
    name: "Terracotta",
    mode: "dark",
    vars: dark(
      "#1a0e09", "#241511", "#2e1b17", "#39241e",
      "#f7eee8", "#d9b6a3", "#a17965",
      "#f97316", "#ea580c",
      ["#f97316","#fdba74","#c2410c","#fed7aa","#7c2d12","#ffedd5","#fb923c","#431407"],
    ),
  },
];

export const DEFAULT_THEME_ID = "lavender";

export function getThemeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v);
  // Derive a readable foreground for elements painted with --accent.
  // Bright accents (light greys, pastel yellows) need dark text; saturated
  // mid/dark accents need white. Based on sRGB relative luminance.
  const onAccent = pickOnAccent(theme.vars["--accent"] ?? "#000000");
  root.style.setProperty("--on-accent", onAccent);
  root.dataset.theme = theme.id;
  root.dataset.mode = theme.mode;
}

function pickOnAccent(hex: string): string {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const srgb = [r, g, b].map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return L > 0.6 ? "#0a0a0a" : "#ffffff";
}
