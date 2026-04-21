<div align="center">

# ⚡ BI Express

### **Transforme qualquer planilha em um dashboard de BI. No navegador. Em segundos.**

Envie um `.xlsx`, `.csv` ou `.tsv` — o BI Express detecta a tabela real, entende suas colunas e entrega um painel visual que faz sentido.
**Sem servidor. Sem API paga. Sem configurar nada.**

[![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-0ea5e9?style=flat-square)](https://c03lho.github.io/BI-Express/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![ECharts](https://img.shields.io/badge/Apache_ECharts-5-AA344D?style=flat-square)](https://echarts.apache.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](#-licença)

### 👉 **[Abrir a aplicação](https://c03lho.github.io/BI-Express/)** 👈

</div>

---

## 🧭 Por que existe

A maioria das ferramentas de *dashboard automático* tropeça em planilhas do mundo real:
abas de filtros, blocos de metadados, resumos no topo, cabeçalhos mesclados, colunas de ID com números gigantes.

O **BI Express** foi construído com um **detector de tabela inteligente** que identifica
a tabela de dados real mesmo em planilhas bagunçadas, um **profiler semântico** que distingue
medida de dimensão de identificador, e um **sugeridor determinístico** que só produz visualizações com sentido —
nunca "Distribuição de C por E".

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 📤 Upload inteligente
- `.xlsx`, `.xls`, `.csv`, `.tsv`
- Drag & drop ou clique
- **Tudo processado no seu navegador**

### 🧠 Detector de tabela
- Ignora filtros, metadados e resumos
- Pula linhas de título mescladas ("LOTES - MOVIMENTOS")
- Encontra o cabeçalho **real** mesmo com preâmbulo
- Apresenta múltiplas candidatas quando há ambiguidade

### 🔬 Profiler semântico
- Infere **tipo**: número, data, categoria, booleano, moeda
- Infere **papel**: medida, dimensão, tempo, identificador
- **Reconhece IDs** pelo nome (`Id. Saída`, `Prefixo`, `Código`)
  e pela magnitude (inteiros com 10+ dígitos, alta cardinalidade)
- Não soma mais números de CPF pensando que é métrica 🎉

</td>
<td width="50%" valign="top">

### 📊 3 perspectivas analíticas
Cada planilha gera **três dashboards diferentes** com um clique:

| Visão | Foco |
|---|---|
| **Visão geral** | KPIs + mix equilibrado |
| **Análise temporal** | Tendências, evolução, sazonalidade |
| **Análise categórica** | Rankings, participação, composição |

### 🎨 12 tipos de gráfico
Barras · Barras horizontais · Barras empilhadas · Linha · Área · Pizza · Donut · Treemap · Funil · Radar · Dispersão · Histograma
**Troque o tipo de qualquer gráfico direto no card.**

### 🌈 20 temas premium
10 dark + 10 light. Paleta aplicada em **tempo real** a todos os gráficos, sem reload.

### 💾 Export profissional
- **PNG** em alta resolução (3× pixel ratio)
- **PDF** A4 paisagem
- **XLSX** com os dados já limpos

### 🤖 IA opcional (grátis)
Gemini ou Groq com chave gratuita **sua**, guardada só no `localStorage`. O produto funciona **100% sem chave**.

### 🔒 Privacidade total
Nada sai do seu navegador — exceto se *você* ativar a IA opcional.

</td>
</tr>
</table>

---

## 🚀 Usando em 3 passos

```
1. Arraste uma planilha na tela inicial
2. Escolha a perspectiva: Visão geral · Temporal · Categórica
3. Exporte PNG, PDF ou Excel limpo
```

Nenhuma variável de ambiente, nenhum login, nenhuma conta.

---

## 🏗️ Stack

<div align="center">

| Camada | Tecnologia |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) + `output: "export"` |
| **Linguagem** | [TypeScript 5](https://www.typescriptlang.org/) `strict: true` |
| **UI** | [Tailwind CSS v4](https://tailwindcss.com/) · shadcn-style components |
| **Gráficos** | [Apache ECharts](https://echarts.apache.org/) via `echarts/core` (tree-shaking) |
| **Parsers** | [SheetJS](https://sheetjs.com/) (`xlsx`) + [PapaParse](https://www.papaparse.com/) |
| **Estado** | [Zustand](https://zustand-demo.pmnd.rs/) + persist no localStorage |
| **Validação** | [Zod](https://zod.dev/) |
| **Export** | `html2canvas-pro` (compatível com oklch) + `jsPDF` |
| **Ícones** | [Lucide](https://lucide.dev/) |
| **Package manager** | [pnpm](https://pnpm.io/) |

</div>

---

## 🧪 Rodando localmente

```bash
pnpm install
pnpm dev
```

Abra [`http://localhost:3000`](http://localhost:3000). **Nenhuma variável de ambiente é necessária.**

### Rodar o smoke test

```bash
pnpm exec tsx scripts/smoke-test.ts
```

Valida o detector em dois cenários reais:
1. Aba de **Filtros** + aba **Detalhada** com bloco "Resumo" antes da tabela.
2. Tabela com **linha de título mesclada** ("LOTES - MOVIMENTOS") acima do cabeçalho real,
   colunas de ID com inteiros gigantes, colunas de volume com floats únicos.

---

## 📤 Deploy no GitHub Pages

O app é exportado estaticamente (`next build` com `output: "export"`) e publicado via GitHub Actions em:

```
https://<seu-usuário>.github.io/BI-Express/
```

### Passos:

1. **Settings → Pages** → selecione **GitHub Actions** como source
2. `git push` na `main` — o workflow `.github/workflows/deploy.yml` cuida do resto
3. A URL aparece em cada run do Actions

Se o repositório for renomeado, ajuste `repo` em [`next.config.ts`](next.config.ts).

---

## 🧠 Como funciona o detector de tabela

Para cada aba, o detector:

**1.** Encontra blocos retangulares separados por linhas vazias.

**2.** Para cada bloco, **testa até 8 linhas candidatas a cabeçalho** (pula títulos mesclados).

**3.** Calcula um score por candidata combinando:
  - `headerValid`: ≥ 70% de células textuais + ≥ 60% de preenchimento da largura
  - `avgDominance`: consistência de tipo por coluna abaixo do candidato
  - `density`: percentual de células preenchidas
  - `widthUniformity`: linhas que batem a largura máxima
  - `metadataHits`: penaliza "Gerado por:", "Período:", "Resumo", etc.
  - `isFilterBlock`: penaliza –80 se for 2 colunas chave/valor heterogêneas

**4.** Retorna candidatas ordenadas por score. Se uma domina, usa direto. Se há empate, o usuário escolhe.

Resolvendo o bug clássico de versões anteriores: tabelas que começam com `"LOTES - MOVIMENTOS"`
numa linha mesclada não viram mais *"Coluna 2, Coluna 3, Coluna 4..."* — o algoritmo pula a linha
esparsa e detecta o cabeçalho real logo abaixo.

---

## 🎯 Como funciona o profiler semântico

Cada coluna passa por duas inferências:

### Tipo (`kind`)

Baseado em dominância ≥ 70% do tipo mais frequente: `integer`, `number`, `currency`, `date`,
`datetime`, `boolean`, `text`, `category`.

### Papel (`role`)

| Papel | Quando |
|---|---|
| **`measure`** | Floats, currency, ou inteiros sem perfil de ID |
| **`time`** | Qualquer coluna `date`/`datetime` |
| **`dimension`** | Textos com baixa cardinalidade (≤50) |
| **`identifier`** | ① nome combina com `id`/`codigo`/`prefixo`/`cpf`/`cnpj`/`matricula`/...; ② inteiros com magnitude ≥ 1e6 + cardinalidade alta; ③ sequenciais (cardinalidade > 95%) |
| **`ignore`** | Baixo preenchimento ou texto totalmente único sem perfil de ID |

O resultado: colunas como `Id. Saída` com valores `20.269.901.728` **nunca mais viram KPI de soma**.

---

## 🎨 Adicionando um tema

Edite [`lib/themes/index.ts`](lib/themes/index.ts) e adicione um objeto ao array `THEMES`:

```ts
{
  id: "meu-tema",
  name: "Meu Tema",
  mode: "dark",
  vars: {
    "--bg": "#...",
    "--surface": "#...",
    "--surface-elevated": "#...",
    "--border": "#...",
    "--text-primary": "#...",
    "--text-secondary": "#...",
    "--text-muted": "#...",
    "--accent": "#...",
    "--accent-hover": "#...",
    "--chart-1": "#...", // até --chart-8
  },
}
```

Ele aparece automaticamente no seletor. A paleta é lida em runtime via `getComputedStyle`,
então **todos os gráficos reagem à troca sem reload**.

---

## 🗂️ Estrutura de pastas

```
app/                        Páginas Next (landing, /dashboard, /settings)
components/
├─ ui/                      Button, Card (shadcn-style)
├─ charts/                  ECharts wrapper + ChartCard com switcher de tipo
├─ dashboard/               KPI, DataTable, ExportMenu
├─ upload/                  UploadZone com drag & drop
├─ theme-picker/            Modal com grid dos 20 temas
└─ analysis/                Painel "Personalizar análise"
lib/
├─ parser/                  xlsx + csv/tsv → ArrayBuffer
├─ detector/                Scoring de blocos → escolhe a tabela real
├─ profiler/                Estatísticas + papel semântico por coluna
├─ suggester/               KPIs + 3 perspectivas de dashboard
├─ intent/                  Parser PT-BR de texto livre → papéis + charts
├─ exporter/                PNG, PDF, XLSX
├─ themes/                  20 temas + aplicador
└─ ai-optional/             Gemini/Groq direto do browser
store/                      Zustand (tema + tabela + spec + view)
types/                      Domínio (DataSource → Table → Column)
scripts/                    Smoke test (tsx)
```

---

## 🤝 Parser de intenção (local, zero API)

`lib/intent/` roda **100% no navegador**:

- Dicionários PT-BR: `{volume, quantidade, valor, custo}` → **medida**; `{produto, cliente, local, setor}` → **dimensão**; `{data, dia, mês, período}` → **tempo**
- Normalização (lowercase, sem acento) + matching fuzzy (Levenshtein distância 2)
- Verbos de agregação: `{soma, total}` → `sum`; `{média, mediana}` → `avg`; `{contagem, quantos}` → `count`; `{evolução, ao longo, tendência}` → série temporal
- Regras de tipo ganham de cues textuais: qualquer coluna `date` vira `time`, sempre

---

## 🤖 IA opcional

O BI Express funciona **sem nenhuma chave**. Se quiser enriquecer a etapa de sugestão:

- **Google Gemini** (grátis, sem cartão) — https://aistudio.google.com/apikey
- **Groq** (Llama 3.3 70B grátis com rate limit) — https://console.groq.com/keys

Cole a chave em `/settings`. Fica salva **apenas no `localStorage` do seu navegador** — nunca vai pro servidor deste projeto. Ao usar a sugestão, amostras das suas colunas são enviadas direto ao provedor escolhido.

---

## 🗺️ Roadmap

- [ ] **Múltiplos arquivos com junção automática** (detectar chave por nome + tipo + sobreposição). A arquitetura já modela `DataSource → Table[]` prevendo isso.
- [ ] **Salvar dashboards** (link com hash da config).
- [ ] **Drag & drop** para reordenar gráficos.
- [ ] **Filtros cruzados** (clicar numa fatia propaga para os demais charts).
- [ ] **Custom views** salvas pelo usuário além das 3 padrão.

---

## 📝 Licença

MIT © C03LHO · Construído com ❤️ e muito café ☕
