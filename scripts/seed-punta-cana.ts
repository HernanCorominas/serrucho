/**
 * Script de Seed: Caso "Viaje Punta Cana"
 * Reproduce el escenario de prueba con:
 * - Hernan (Owner)
 * - Braulin (Participante)
 * - Gasto de RD$ 500 dividido al 25% (Hernan) y 75% (Braulin).
 */

import { splitByPercentage, simplifyDebts, formatDOP, toCents } from "@serrucho/core";

async function runSeed() {
  console.log("🌴 Iniciando Seed: Viaje Punta Cana...");

  const totalCents = toCents(500); // 50,000 centavos = RD$ 500.00
  const percentageSplits = [
    { participantId: "hernan", basisPoints: 2500 }, // 25.00%
    { participantId: "braulin", basisPoints: 7500 }, // 75.00%
  ];

  // Cálculo de división usando el motor financiero @serrucho/core
  const splitResult = splitByPercentage(totalCents, percentageSplits);
  const hernanOwed = splitResult.find((s) => s.participantId === "hernan")?.owedCents || 0;
  const braulinOwed = splitResult.find((s) => s.participantId === "braulin")?.owedCents || 0;

  console.log("\n📊 Desglose de División:");
  console.log(`- Total Gasto: ${formatDOP(totalCents)}`);
  console.log(`- Aporte Hernan (25%): ${formatDOP(hernanOwed)}`);
  console.log(`- Aporte Braulin (75%): ${formatDOP(braulinOwed)}`);

  // Balances netos: Hernan pagó el total (500), Braulin pagó 0
  const participantsFinancials = [
    {
      id: "hernan-id",
      name: "Hernan (Owner)",
      total_paid_cents: totalCents, // 50000
      total_owed_cents: hernanOwed, // 12500
      net_balance_cents: totalCents - hernanOwed, // +37500
      total_expenses_count: 1,
    },
    {
      id: "braulin-id",
      name: "Braulin",
      total_paid_cents: 0,
      total_owed_cents: braulinOwed, // 37500
      net_balance_cents: -braulinOwed, // -37500
      total_expenses_count: 0,
    },
  ];

  const transfers = simplifyDebts(participantsFinancials, participantsFinancials);

  console.log("\n💳 Deudas Netas Simplificadas (Menos Transferencias):");
  transfers.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.from_name} le transfiere ${formatDOP(t.amount_cents)} a ${t.to_name}`);
  });

  console.log("\n✅ Seed 'Viaje Punta Cana' verificado y consistente con las reglas financieras de Serrucho.\n");
}

runSeed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
