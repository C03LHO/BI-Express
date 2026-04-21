// Smoke test for detector + profiler + suggester. Runs via tsx.
// Simulates the nasty Excel from the brief: a "Filtro" sheet + a "Detalhado"
// sheet that has a Resumo block above the real table.

import { detectTables } from "../lib/detector/index.ts";
import { profileTable } from "../lib/profiler/index.ts";
import { suggestDashboard } from "../lib/suggester/index.ts";

const filtroSheet = {
  name: "Filtro",
  grid: [
    ["Filtros Realizados", null],
    ["Período", "01/04/2026 00:00"],
    ["Até", "08/04/2026 07:55"],
    ["Exibição", "Carga Detalhado"],
    ["Minas", "Ferrosos Serra Sul, Serra Norte, Serra Leste, Entreposto Serra Leste"],
    ["Corredor", "Corredor Norte"],
    ["Etapa", "Fim do Apontamento"],
    ["Completo", "Sim"],
  ],
};

const detalhadoSheet = {
  name: "Detalhado",
  grid: [
    ["Resumo", null, null, null],
    ["Total de Cargas", 234, null, null],
    ["Volume Total (t)", 18540.2, null, null],
    [null, null, null, null],
    ["Data", "Produto", "Volume (t)", "Operador"],
    [new Date("2026-04-01"), "Minério SS", 120.5, "João"],
    [new Date("2026-04-01"), "Minério SN", 98.2, "Maria"],
    [new Date("2026-04-02"), "Minério SL", 150.0, "José"],
    [new Date("2026-04-02"), "Minério SS", 200.3, "João"],
    [new Date("2026-04-03"), "Minério SN", 110.5, "Ana"],
    [new Date("2026-04-03"), "Minério SS", 85.0, "Maria"],
    [new Date("2026-04-04"), "Minério SL", 175.5, "João"],
    [new Date("2026-04-04"), "Minério SS", 145.2, "José"],
    [new Date("2026-04-05"), "Minério SN", 162.0, "Ana"],
    [new Date("2026-04-05"), "Minério SS", 178.5, "Maria"],
  ],
};

const candidates = detectTables([filtroSheet, detalhadoSheet]);
console.log("=== Candidates ===");
for (const c of candidates) {
  console.log(
    `[${c.sheet}] ${c.range} · ${c.rows.length} rows × ${c.header.length} cols · score ${c.score}`,
  );
  console.log(`  header: ${c.header.join(" | ")}`);
  if (c.rejectedReasons) console.log(`  reasons: ${c.rejectedReasons.join("; ")}`);
}

if (candidates.length === 0) {
  console.error("NO CANDIDATES DETECTED");
  process.exit(1);
}
const best = candidates[0];
if (best.sheet === "Filtro") {
  console.error("REGRESSION: Filtro sheet picked as best candidate!");
  process.exit(1);
}
if (best.header.some((h) => /^[A-Z]$/.test(h))) {
  console.error("REGRESSION: header contains single-letter labels!");
  process.exit(1);
}

const profiled = profileTable(best);
console.log("\n=== Profile ===");
for (let i = 0; i < profiled.columnLabels.length; i++) {
  console.log(
    `${profiled.columnLabels[i]}: kind=${profiled.kinds[i]} role=${profiled.roles[i]} distinct=${profiled.profiles[i].distinct}`,
  );
}

const spec = suggestDashboard(profiled);
console.log("\n=== KPIs ===");
for (const k of spec.kpis) console.log(`- ${k.title} (${k.aggregation})`);
console.log("\n=== Charts ===");
for (const c of spec.charts) console.log(`- [${c.type}] ${c.title}`);

// Sanity: no chart title must contain single-letter column labels.
for (const c of spec.charts) {
  if (/\b[A-Z]\b/.test(c.title) && !/POR\s[A-Z]$/.test(c.title)) continue;
}
for (const c of spec.charts) {
  if (/ por [A-Z]$/.test(c.title)) {
    console.error(`REGRESSION: chart title with single letter: ${c.title}`);
    process.exit(1);
  }
}

console.log("\n✅ Smoke test passed.");
