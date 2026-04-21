import { AppShell } from "@/components/app-shell";
import { BrandMark } from "@/components/brand";
import { UploadZone } from "@/components/upload/upload-zone";
import { ThemePickerButton } from "@/components/theme-picker/theme-picker";

export default function HomePage() {
  return (
    <AppShell actions={<ThemePickerButton />}>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--accent) 18%, transparent) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-40 -z-10 h-64 opacity-60 blur-3xl"
          style={{
            background:
              "conic-gradient(from 120deg, var(--chart-1), var(--chart-4), var(--chart-2), var(--chart-1))",
            maskImage:
              "radial-gradient(closest-side, rgba(0,0,0,0.45), transparent)",
          }}
        />
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-14 text-center sm:py-24">
          <BrandMark className="size-14" />
          <div className="flex flex-col items-center gap-3">
            <span
              className="rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wider"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
                color: "var(--text-secondary)",
              }}
            >
              BI no navegador · sem servidor · sem API paga
            </span>
            <h1
              className="max-w-2xl text-balance text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl"
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
            <Feature title="3 perspectivas">
              Visão geral, temporal e categórica. Troque com um clique e veja ângulos diferentes.
            </Feature>
            <Feature title="12 tipos de gráfico">
              Barras, linha, área, pizza, treemap, funil, radar, dispersão e mais — configuráveis.
            </Feature>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border p-4 text-left text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <p className="font-medium" style={{ color: "var(--text-primary)" }}>
        {title}
      </p>
      <p className="mt-1 text-xs">{children}</p>
    </div>
  );
}
