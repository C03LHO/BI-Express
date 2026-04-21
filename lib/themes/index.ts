// lib/themes — 20 themes (10 dark + 10 light). Implementation in step 7.
export type ThemeMode = "dark" | "light";

export interface Theme {
  id: string;
  name: string;
  mode: ThemeMode;
  vars: Record<string, string>;
}

export const THEMES: Theme[] = [];
