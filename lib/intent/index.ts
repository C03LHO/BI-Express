// Local, zero-API intent parser for the "describe what you want" textarea.
// Given free text + a profiled table, it suggests column roles and a chart set.

import type { ProfiledTable } from "@/lib/profiler";
import type { ChartSpec } from "@/types";

const MEASURE_TERMS = [
  "volume", "quantidade", "qtd", "peso", "tonelagem", "toneladas", "ton",
  "total", "soma", "valor", "custo", "preco", "preço", "receita", "faturamento",
  "numero", "número", "qtde",
];
const DIMENSION_TERMS = [
  "produto", "cliente", "categoria", "tipo", "local", "regiao", "região",
  "setor", "equipamento", "operador", "lote", "corredor", "entreposto",
  "mina", "departamento", "filial", "unidade", "fornecedor", "status",
];
const TIME_TERMS = [
  "data", "dia", "dias", "mes", "mês", "meses", "hora", "horas", "periodo",
  "período", "tempo", "quando", "ano", "semana",
];
const SUM_VERBS = ["soma", "somatorio", "somatório", "total"];
const AVG_VERBS = ["media", "média", "medio", "médio", "mediana"];
const COUNT_VERBS = ["contagem", "quantos", "quantas", "quantidade de"];
const TIMELINE_VERBS = ["evolução", "evolucao", "ao longo", "tendencia", "tendência", "historico", "histórico"];

export interface IntentResult {
  roleByColumn: Record<string, "measure" | "dimension" | "time" | "identifier" | "ignore">;
  charts: ChartSpec[];
  notes: string[];
}

export function parseIntent(text: string, table: ProfiledTable): IntentResult {
  const notes: string[] = [];
  const norm = normalize(text);
  const words = norm.split(/\s+/).filter(Boolean);
  const roleByColumn: IntentResult["roleByColumn"] = {};

  for (let i = 0; i < table.columnIds.length; i++) {
    const id = table.columnIds[i];
    const label = normalize(table.columnLabels[i]);
    let role: "measure" | "dimension" | "time" | "identifier" | "ignore" = table.roles[i];

    // Name-based cues (strongest)
    if (matchesAny(label, TIME_TERMS)) role = "time";
    else if (matchesAny(label, MEASURE_TERMS)) role = "measure";
    else if (matchesAny(label, DIMENSION_TERMS)) role = "dimension";

    // Textual cues (user mentioned this column + a verb)
    for (const w of words) {
      if (fuzzyContains(label, w) && w.length >= 4) {
        if (MEASURE_TERMS.includes(w)) role = "measure";
        if (DIMENSION_TERMS.includes(w)) role = "dimension";
        if (TIME_TERMS.includes(w)) role = "time";
      }
    }

    // Kind overrides (types win against word cues in obvious cases)
    const kind = table.kinds[i];
    if (kind === "date" || kind === "datetime") role = "time";

    roleByColumn[id] = role;
  }

  // Verb detection drives the chart set.
  const wantsTimeline = TIMELINE_VERBS.some((t) => norm.includes(t));
  const wantsSum = SUM_VERBS.some((t) => norm.includes(t));
  const wantsAvg = AVG_VERBS.some((t) => norm.includes(t));
  const wantsCount = COUNT_VERBS.some((t) => norm.includes(t));
  const agg: "sum" | "avg" | "count" = wantsAvg ? "avg" : wantsCount ? "count" : "sum";
  if (wantsSum) notes.push("Detectado: soma");
  if (wantsAvg) notes.push("Detectado: média");
  if (wantsCount) notes.push("Detectado: contagem");
  if (wantsTimeline) notes.push("Detectado: evolução temporal");

  const measures = table.columnIds.filter((id) => roleByColumn[id] === "measure");
  const dims = table.columnIds.filter((id) => roleByColumn[id] === "dimension");
  const times = table.columnIds.filter((id) => roleByColumn[id] === "time");
  const label = (id: string) =>
    table.columnLabels[table.columnIds.indexOf(id)] ?? id;

  const charts: ChartSpec[] = [];
  if (wantsTimeline && times[0] && measures[0]) {
    charts.push({
      id: `intent_line_${times[0]}_${measures[0]}`,
      title: `Evolução de ${label(measures[0])}`,
      type: "line",
      xColumnId: times[0],
      yColumnId: measures[0],
      aggregation: agg === "count" ? "count" : "sum",
    });
  }
  if (dims[0] && measures[0]) {
    charts.push({
      id: `intent_bar_${dims[0]}_${measures[0]}`,
      title: `${agg === "avg" ? "Média" : "Total"} de ${label(measures[0])} por ${label(dims[0])}`,
      type: "bar",
      xColumnId: dims[0],
      yColumnId: measures[0],
      aggregation: agg,
    });
  }
  if (dims[0] && !measures[0]) {
    charts.push({
      id: `intent_count_${dims[0]}`,
      title: `Contagem por ${label(dims[0])}`,
      type: "bar",
      xColumnId: dims[0],
      aggregation: "count",
    });
  }

  return { roleByColumn, charts, notes };
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesAny(label: string, dict: string[]): boolean {
  return dict.some((w) => label.includes(normalize(w)));
}

function fuzzyContains(a: string, b: string): boolean {
  if (a.includes(b) || b.includes(a)) return true;
  // Levenshtein with threshold 1 for words ≥5
  if (Math.abs(a.length - b.length) > 2) return false;
  if (b.length < 5) return false;
  return levenshtein(a, b) <= 2;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return dp[n];
}
