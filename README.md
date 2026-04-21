# BI Express

> Envie qualquer planilha. Receba um dashboard de BI que faz sentido.

BI Express é um app web que transforma arquivos `.xlsx`, `.xls`, `.csv` e `.tsv` em dashboards automáticos com cartões de KPI, gráficos e tabela — **100% no navegador, sem servidor e sem API paga**.

## Por que existe

A maioria das ferramentas de "dashboard automático" tropeça em planilhas do mundo real: abas de filtros, blocos de metadados, resumos, cabeçalhos mesclados. O BI Express foi construído com um **detector de tabela** que identifica a tabela de dados real mesmo em planilhas bagunçadas, e um **sugerir de gráficos determinístico** que só produz visualizações com sentido — nunca "Distribuição de C por E".

## Features

- 📤 **Upload client-side** de `.xlsx`, `.xls`, `.csv`, `.tsv`
- 🧠 **Detector inteligente**: identifica a tabela real, pula metadados, filtros e resumos
- 🔬 **Profiler**: infere tipo (número, data, categoria, booleano, etc.) e papel (medida, dimensão, tempo) por coluna
- 📊 **Dashboard automático**: KPIs + até 6 gráficos (ECharts) com títulos em português usando os nomes reais das colunas
- ✨ **Personalizar análise**: ajuste rótulos, tipos e papéis das colunas, ou descreva em texto livre o que quer ver
- 🎨 **20 temas** (10 dark + 10 light) com troca em tempo real
- 💾 **Export** PNG (alta resolução), PDF (A4 paisagem) e `.xlsx` (dados limpos)
- 🤖 **IA opcional e gratuita** (Gemini ou Groq, chave sua) — o produto funciona **100% sem chave**
- 🔒 **Nada sai do seu navegador** (exceto se você ativar a IA opcional)

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- ECharts (via `echarts/core`) para gráficos
- SheetJS (`xlsx`) + PapaParse para leitura de arquivos
- Zustand para estado, Zod para validação
- `html2canvas-pro` + `jsPDF` para export
- pnpm

## Como rodar localmente

```bash
pnpm install
pnpm dev
```

Abra http://localhost:3000. **Nenhuma variável de ambiente é necessária.**

## Como é publicado (GitHub Pages)

O app é exportado estaticamente (`next build` com `output: "export"`) e publicado via GitHub Actions em:

```
https://<seu-usuário>.github.io/BI-Express/
```

Passos pra ativar:

1. Em **Settings → Pages**, selecione **GitHub Actions** como source.
2. Faça push na `main`. O workflow `.github/workflows/deploy.yml` builda, gera `out/` e publica.
3. Pronto. A URL aparece em cada run do Actions.

Se o repositório for renomeado, ajuste `repo` em `next.config.ts`.

## IA opcional

O BI Express funciona **sem nenhuma chave**. Se quiser enriquecer a etapa de sugestão com IA:

- **Google Gemini** (grátis, sem cartão): https://aistudio.google.com/apikey
- **Groq** (Llama 3.3 70B grátis com rate limit): https://console.groq.com/keys

Cole a chave em `/settings`. Fica salva **apenas no localStorage do seu navegador** — nunca vai pro servidor deste projeto. Ao usar a sugestão, amostras das suas colunas são enviadas direto ao provedor escolhido.

## Estrutura de pastas

```
app/                 # páginas Next (landing, /dashboard, /settings)
components/
  ui/                # button, card (shadcn-style)
  charts/            # wrapper ECharts + ChartCard
  dashboard/         # KPI, DataTable, ExportMenu
  upload/            # UploadZone com drag & drop
  theme-picker/      # modal grid de 20 temas
  analysis/          # painel "Personalizar análise"
lib/
  parser/            # xlsx + csv/tsv em ArrayBuffer
  detector/          # scoring de blocos → escolhe a tabela real
  profiler/          # estatísticas + papel por coluna
  suggester/         # KPIs + catálogo de gráficos
  intent/            # parser PT-BR de texto livre → papéis + charts
  exporter/          # PNG, PDF, XLSX
  themes/            # 20 temas + aplicador
  ai-optional/       # Gemini/Groq direto do browser
store/               # Zustand (tema + tabela + spec atual)
types/               # domínio (DataSource → Table → Column)
```

## Como funciona o detector de tabela

Para cada aba, o detector:

1. **Acha blocos retangulares** separados por linhas totalmente vazias.
2. **Calcula um score** (0–100) por bloco, combinando:
   - Tamanho (linhas × colunas)
   - Cabeçalho válido (linha 1 textual, sem número solto, ≤80 chars por célula)
   - Consistência de tipo por coluna (dominância ≥70% do tipo mais frequente)
   - Densidade de células preenchidas
   - Uniformidade de largura (% de linhas que batem a largura máxima)
3. **Penaliza anti-padrões**:
   - **Bloco chave/valor** (2 colunas, col1 sem repetição, col2 heterogênea) → score −80
   - **Metadados** ("Gerado por:", "Período:", "Filtros…", "Resumo", "Total geral") → −15 por hit
4. **Descarta** blocos com < 5 linhas ou < 2 colunas.
5. **Retorna** candidatos ordenados por score. Se só um for forte, usa direto. Se houver outros próximos, o usuário escolhe.

Isso resolve o bug da versão anterior em que abas de filtros viravam "Contagem por B" com categorias como "Ferrosos Serra Sul, Serra Norte…".

## Como funciona o parser de intenção (local)

`lib/intent/` roda **100% no navegador**, sem API:

- Dicionários PT-BR mapeiam termos → papel: `{volume, quantidade, valor, custo}` → medida; `{produto, cliente, local, setor}` → dimensão; `{data, dia, mês, período}` → tempo.
- Normalização (lowercase, sem acento) + matching fuzzy (Levenshtein distância 2).
- Verbos de agregação: `{soma, total}` → `sum`; `{média, mediana}` → `avg`; `{contagem, quantos}` → `count`; `{evolução, ao longo, tendência}` → série temporal.
- Regras de tipo ganham de cues textuais: qualquer coluna tipo `date` vira `time`, sempre.

## Como adicionar um novo tema

Edite `lib/themes/index.ts`. Empurre um objeto novo no array `THEMES` com:

```ts
{
  id: "meu-tema",
  name: "Meu Tema",
  mode: "dark" | "light",
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
    // ...
  },
}
```

Ele aparece automaticamente no seletor. A paleta é lida em runtime via `getComputedStyle`, então todos os gráficos reagem à troca sem reload.

## Testes

```bash
pnpm exec tsx scripts/smoke-test.ts
```

Simula uma planilha com aba "Filtro" (deve ser ignorada) e aba "Detalhado" com bloco "Resumo" antes da tabela real (deve ser pulado). Valida que:

- A aba de filtros não vira candidata.
- O cabeçalho real é detectado (nunca letras soltas tipo "B", "C").
- Nenhum título de gráfico fica com nome de coluna inválido.

## Roadmap

- Múltiplos arquivos com junção automática (detectar chave por nome + tipo + sobreposição de valores). A arquitetura já modela `DataSource → Table[]` prevendo isso.
- Salvar dashboards (link com hash da config).
- Drag & drop pra reordenar gráficos.

## Licença

MIT.
