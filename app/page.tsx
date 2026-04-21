import { AppShell } from "@/components/app-shell";
import { BrandMark } from "@/components/brand";
import { UploadZone } from "@/components/upload/upload-zone";

export default function HomePage() {
  return (
    <AppShell>
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-14 text-center sm:py-20">
        <BrandMark className="size-14" />
        <div className="flex flex-col items-center gap-3">
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
        </div>
        <UploadZone />
        <div
          className="grid w-full max-w-3xl grid-cols-1 gap-3 pt-6 sm:grid-cols-3"
          style={{ color: "var(--text-secondary)" }}
        >
          <Feature title="Detecção inteligente">
            Ignora metadados, filtros e resumos. Acha a tabela real mesmo em abas bagunçadas.
          </Feature>
          <Feature title="20 temas prontos">
            Dark e light. Paleta se aplica em tempo real a todos os gráficos.
          </Feature>
          <Feature title="100% no navegador">
            Seus dados não saem do seu computador. Nenhuma API paga envolvida.
          </Feature>
        </div>
      </section>
    </AppShell>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-4 text-left text-sm"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <p className="font-medium" style={{ color: "var(--text-primary)" }}>
        {title}
      </p>
      <p className="mt-1 text-xs">{children}</p>
    </div>
  );
}
