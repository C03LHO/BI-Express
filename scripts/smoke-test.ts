// Smoke test for detector + profiler + suggester. Runs via tsx.
// Covers two nasty cases:
//   1. "Filtro" sheet + "Detalhado" with a Resumo block above the real table.
//   2. Title row ("LOTES - MOVIMENTOS") preceding the real header row — the
//      exact shape from 4 - BD_Patio_Abril_2026.xlsx.

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

// Real-world shape: a merged title row ("LOTES - MOVIMENTOS") above the header.
const patioHeader = [
  "Prefixo de Saída",
  "Id. Saída",
  "Produto",
  "UO Origem",
  "Área",
  "Origem",
  "Data Saída",
  "Volume (t)",
  "Operador",
  "Turno",
];
const products = ["Minério SS", "Minério SN", "Minério SL", "Pelota"];
const uos = ["UO-01", "UO-02", "UO-03"];
const operators = ["João", "Maria", "José", "Ana", "Carlos"];
const turnos = ["A", "B", "C"];
const areas = ["Pátio A", "Pátio B", "Pátio C"];
const patioRows: (string | number | Date | null)[][] = [];
for (let i = 0; i < 240; i++) {
  const d = new Date(2026, 3, 1 + (i % 20));
  patioRows.push([
    `PFX-${1000 + (i % 50)}`,
    20269901728000 + i, // huge integer IDs
    products[i % products.length],
    uos[i % uos.length],
    areas[i % areas.length],
    `Origem-${(i % 7) + 1}`,
    d,
    80 + Math.random() * 200,
    operators[i % operators.length],
    turnos[i % turnos.length],
  ]);
}
const patioSheet = {
  name: "Pátio",
  grid: [
    ["LOTES - MOVIMENTOS", null, null, null, null, null, null, null, null, null],
    patioHeader,
    ...patioRows,
  ],
};

const candidates = detectTables([filtroSheet, detalhadoSheet, patioSheet]);
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

// Both "Detalhado" and "Pátio" must pass. Filtro must not win.
const byName = new Map(candidates.map((c) => [c.sheet, c]));
const det = byName.get("Detalhado");
const pat = byName.get("Pátio");
if (!det) { console.error("Detalhado not detected"); process.exit(1); }
if (!pat) { console.error("Pátio not detected"); process.exit(1); }
if (candidates[0].sheet === "Filtro") { console.error("REGRESSION: Filtro won"); process.exit(1); }

// Pátio must have the real header, NOT "Coluna N".
if (pat.header[0] !== "Prefixo de Saída") {
  console.error(`REGRESSION: Pátio header[0] = ${JSON.stringify(pat.header[0])}, expected "Prefixo de Saída"`);
  process.exit(1);
}
if (pat.header.some((h) => /^Coluna \d+$/.test(h))) {
  console.error(`REGRESSION: Pátio has generic "Coluna N" labels: ${pat.header.join(" | ")}`);
  process.exit(1);
}

for (const best of [det, pat]) {
  console.log(`\n=== Profile [${best.sheet}] ===`);
  const profiled = profileTable(best);
  for (let i = 0; i < profiled.columnLabels.length; i++) {
    console.log(
      `${profiled.columnLabels[i]}: kind=${profiled.kinds[i]} role=${profiled.roles[i]} distinct=${profiled.profiles[i].distinct}`,
    );
  }

  // Patio: "Id. Saída" must be identifier, NOT measure.
  if (best.sheet === "Pátio") {
    const idIdx = profiled.columnLabels.indexOf("Id. Saída");
    if (idIdx < 0 || profiled.roles[idIdx] !== "identifier") {
      console.error(`REGRESSION: Id. Saída role = ${profiled.roles[idIdx]}, expected identifier`);
      process.exit(1);
    }
    // "Volume (t)" must remain measure.
    const volIdx = profiled.columnLabels.indexOf("Volume (t)");
    if (volIdx < 0 || profiled.roles[volIdx] !== "measure") {
      console.error(`REGRESSION: Volume role = ${profiled.roles[volIdx]}, expected measure`);
      process.exit(1);
    }
  }

  const spec = suggestDashboard(profiled);
  console.log("KPIs:", spec.kpis.map((k) => k.title).join(" | "));
  console.log("Charts:", spec.charts.map((c) => `[${c.type}] ${c.title}`).join("\n         "));

  for (const c of spec.charts) {
    if (/ por [A-Z]$/.test(c.title)) {
      console.error(`REGRESSION: chart title with single letter: ${c.title}`);
      process.exit(1);
    }
    if (/Coluna \d+/.test(c.title)) {
      console.error(`REGRESSION: chart title references generic "Coluna N": ${c.title}`);
      process.exit(1);
    }
  }
}

console.log("\n✅ Smoke test passed.");
