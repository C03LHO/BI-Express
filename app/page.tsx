import { Zap } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="flex items-center gap-3">
        <span
          className="flex size-12 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{ background: "var(--accent)" }}
        >
          <Zap className="size-6" strokeWidth={2.5} />
        </span>
        <span
          className="text-3xl tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          BI Express
        </span>
      </div>

      <h1
        className="max-w-2xl text-balance text-4xl font-medium leading-tight tracking-tight sm:text-5xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Transforme qualquer planilha em um dashboard.
      </h1>

      <p
        className="max-w-xl text-balance text-base sm:text-lg"
        style={{ color: "var(--text-secondary)" }}
      >
        Upload de Excel, CSV ou TSV. O BI Express detecta a tabela real, entende as
        colunas e entrega um painel visual que faz sentido — sem configurar nada.
      </p>

      <p
        className="rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider"
        style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
      >
        Passo 1 de 11 — scaffold pronto
      </p>
    </main>
  );
}
