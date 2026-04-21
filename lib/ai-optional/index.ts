// Optional direct-from-browser calls to Gemini or Groq.
// Works only if the user pastes a key in /settings. Never leaves the client.

import { z } from "zod";

const KEY = "bi-express-ai-key";

export interface AiConfig {
  provider: "gemini" | "groq";
  key: string;
}

export function getAiConfig(): AiConfig | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as AiConfig;
    return p.provider && p.key ? p : null;
  } catch {
    return null;
  }
}

export function setAiConfig(cfg: AiConfig | null) {
  if (typeof localStorage === "undefined") return;
  if (!cfg) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(cfg));
}

export const AiSuggestionSchema = z.object({
  insights: z.array(z.string()).default([]),
  kpis: z
    .array(
      z.object({
        title: z.string(),
        column: z.string().optional(),
        aggregation: z.enum(["count", "sum", "avg", "min", "max", "distinct", "range"]),
        format: z.enum(["number", "currency", "percent", "date-range"]).optional(),
      }),
    )
    .default([]),
  charts: z
    .array(
      z.object({
        title: z.string(),
        type: z.enum(["bar", "line", "pie", "scatter", "histogram"]),
        xColumn: z.string(),
        yColumn: z.string().optional(),
        aggregation: z.enum(["sum", "avg", "count", "min", "max", "median"]).optional(),
        rationale: z.string().optional(),
      }),
    )
    .default([]),
  relevantColumns: z.array(z.string()).default([]),
  ignoreColumns: z.array(z.string()).default([]),
});

export type AiSuggestion = z.infer<typeof AiSuggestionSchema>;

const SYSTEM_PROMPT = `Você é um analista de BI. Receberá uma lista de colunas de uma tabela e uma descrição opcional do usuário. Responda APENAS com JSON válido (sem markdown, sem texto extra) no formato:
{
  "insights": ["..."],
  "kpis": [{"title":"...","column":"nome_original_da_coluna","aggregation":"sum|avg|count|min|max|distinct|range","format":"number|currency|percent|date-range"}],
  "charts": [{"title":"...","type":"bar|line|pie|scatter|histogram","xColumn":"...","yColumn":"...","aggregation":"sum|avg|count|min|max|median","rationale":"..."}],
  "relevantColumns": ["..."],
  "ignoreColumns": ["..."]
}`;

export async function suggestWithAi(input: {
  columns: { name: string; kind: string; sample: (string | number | boolean | Date | null)[] }[];
  description?: string;
}): Promise<AiSuggestion> {
  const cfg = getAiConfig();
  if (!cfg) throw new Error("Nenhuma chave de IA configurada.");
  const userPayload = JSON.stringify(input, (_k, v) => (v instanceof Date ? v.toISOString() : v));
  const user = `Descrição: ${input.description || "(nenhuma)"}\n\nColunas:\n${userPayload}`;
  const text = cfg.provider === "gemini" ? await callGemini(cfg.key, user) : await callGroq(cfg.key, user);
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const parsed = AiSuggestionSchema.parse(JSON.parse(cleaned));
  return parsed;
}

async function callGemini(key: string, user: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: { responseMimeType: "application/json" },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callGroq(key: string, user: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}
