"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Save, Trash2, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAiConfig, setAiConfig } from "@/lib/ai-optional";

export default function SettingsPage() {
  const [provider, setProvider] = useState<"gemini" | "groq">("gemini");
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const cfg = getAiConfig();
    if (cfg) {
      setProvider(cfg.provider);
      setKey(cfg.key);
    }
  }, []);

  const save = () => {
    setAiConfig(key.trim() ? { provider, key: key.trim() } : null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const clear = () => {
    setAiConfig(null);
    setKey("");
    setSaved(false);
  };

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div>
          <h1
            className="text-3xl font-medium tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Configurações
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            O BI Express funciona 100% sem nenhuma chave. Adicione uma abaixo só se quiser
            enriquecer as sugestões com IA.
          </p>
        </div>

        <Card className="flex flex-col gap-4 p-6">
          <h2 className="text-base font-medium">IA opcional</h2>

          <div className="flex gap-2">
            {(["gemini", "groq"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  provider === p
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--border)] hover:bg-[var(--surface-elevated)]"
                }`}
              >
                {p === "gemini" ? "Google Gemini" : "Groq"}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span>Chave de API</span>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={provider === "gemini" ? "AIza..." : "gsk_..."}
              className="rounded-lg border bg-transparent px-3 py-2"
              style={{ borderColor: "var(--border)" }}
            />
          </label>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={save}>
              <Save className="size-4" />
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={clear}>
              <Trash2 className="size-4" />
              Remover
            </Button>
            {saved ? (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--accent)" }}
              >
                <CheckCircle2 className="size-3.5" /> Salvo no seu navegador
              </span>
            ) : null}
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Sua chave é guardada <b>só no seu navegador</b> (localStorage). Ao usar a sugestão
            com IA, os dados de amostra e nomes das colunas são enviados direto pra{" "}
            {provider === "gemini" ? "Google" : "Groq"} — evite subir dados sensíveis.
          </p>

          <div
            className="flex flex-col gap-1 rounded-lg border p-3 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              Pegar uma chave gratuita:
            </p>
            {provider === "gemini" ? (
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
                style={{ color: "var(--accent)" }}
              >
                aistudio.google.com/apikey <ExternalLink className="size-3" />
              </a>
            ) : (
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
                style={{ color: "var(--accent)" }}
              >
                console.groq.com/keys <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
