#!/usr/bin/env node
/**
 * Script de prueba para Machine Simulator
 * Ejecutar con: node test-machine-simulator.js
 */

// Simulación de las funciones sin dependencias externas
function calculateEnergyConsumption(powerW, timeMs) {
  const timeHours = timeMs / (1000 * 60 * 60);
  const powerKW = powerW / 1000;
  return powerKW * timeHours;
}

function calculateEnergyCost(energyKWh, costPerKWh = 0.15) {
  return energyKWh * costPerKWh;
}

function formatRunningTime(runningTimeMs) {
  const totalSeconds = Math.floor(runningTimeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const days = Math.floor(hours / 24);
  const hoursInDay = hours % 24;

  return {
    totalMs: runningTimeMs,
    totalSeconds,
    totalHours: totalSeconds / 3600,
    totalDays: totalSeconds / (3600 * 24),
    format: `${days}d ${hoursInDay}h ${minutes}m ${seconds}s`,
    simple: `${hours}h ${minutes}m`,
    hours,
    minutes,
    seconds,
    days,
  };
}

function getMaintenanceStatus(runningTimeMs) {
  const timeHours = runningTimeMs / (1000 * 60 * 60);

  const MAINTENANCE_INTERVALS = {
    inspection: 250,
    "oil-change": 500,
    revision: 1000,
    "deep-revision": 2000,
  };

  let nextLevel = null;
  let nextHours = 0;

  for (const [level, hours] of Object.entries(MAINTENANCE_INTERVALS)) {
    if (timeHours < hours) {
      nextLevel = level;
      nextHours = hours;
      break;
    }
  }

  if (!nextLevel) {
    nextLevel = "inspection";
    nextHours = MAINTENANCE_INTERVALS.inspection * Math.ceil(timeHours / MAINTENANCE_INTERVALS.inspection);
  }

  const remainingHours = nextHours - timeHours;

  let message = "";
  let urgency = "ok";

  const getDescription = (level) => {
    const descriptions = {
      inspection: "Inspección visual - Verificar componentes",
      "oil-change": "Cambio de aceite - Lubricación del motor",
      revision: "Revisión general - Mantenimiento preventivo completo",
      "deep-revision": "Revisión profunda - Mantenimiento exhaustivo",
    };
    return descriptions[level] || "Mantenimiento requerido";
  };

  if (remainingHours <= 0) {
    message = `⚠️ MANTENIMIENTO VENCIDO: ${getDescription(nextLevel)}`;
    urgency = "critical";
  } else if (remainingHours <= 10) {
    message = `🔴 PRÓXIMA: ${getDescription(nextLevel)} (${remainingHours.toFixed(1)}h)`;
    urgency = "critical";
  } else if (remainingHours <= 50) {
    message = `🟡 PRÓXIMA: ${getDescription(nextLevel)} (${remainingHours.toFixed(1)}h)`;
    urgency = "warning";
  } else {
    message = `✅ Siguiente: ${getDescription(nextLevel)} en ${remainingHours.toFixed(1)}h`;
    urgency = "ok";
  }

  return {
    level: nextLevel,
    nextMaintenanceHours: nextHours,
    message,
    urgency,
  };
}

function calculateStartupCurrent(nominalCurrent, startupMultiplier = 5) {
  return nominalCurrent * startupMultiplier;
}

function validateMotorProtection(motorNominalCurrent, protectionRating, safetyFactor = 1.25) {
  const requiredRating = motorNominalCurrent * safetyFactor;

  if (protectionRating < requiredRating) {
    return {
      isValid: false,
      requiredRating,
      warning: `Protección subdimensionada. Requerida: ${requiredRating.toFixed(1)}A, disponible: ${protectionRating}A`,
      message: "Protección insuficiente para el motor",
    };
  }

  if (protectionRating > motorNominalCurrent * 2) {
    return {
      isValid: true,
      requiredRating,
      warning: `Protección sobredimensionada. Puede no activarse en sobrecarga`,
      message: "Protección adecuada pero verificar",
    };
  }

  return {
    isValid: true,
    requiredRating,
    warning: null,
    message: "Protección adecuada",
  };
}

// ════════════════════════════════════════════════════════════════════════════════════
//  PRUEBAS
// ════════════════════════════════════════════════════════════════════════════════════

console.log("\n╔════════════════════════════════════════════════════════════════╗");
console.log("║        PRUEBAS PROFUNDAS - MACHINE SIMULATOR                 ║");
console.log("║   Consumo Energético (E = P·t) y Tiempo de Funcionamiento   ║");
console.log("╚════════════════════════════════════════════════════════════════╝\n");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${testName}`);
    testsFailed++;
  }
}

// PRUEBA 1: E = P·t
console.log("📊 PRUEBA 1: Consumo Energético (E = P·t)");
console.log("─".repeat(60));
const P = 1000; // 1000W
const t1h = 3600000; // 1 hora en ms
const E1h = calculateEnergyConsumption(P, t1h);
console.log(`Entrada: P = ${P}W, t = 1 hora`);
console.log(`Cálculo: E = ${P}W ÷ 1000 × 1h = ${E1h} kWh`);
assert(E1h === 1, "1 hora a 1000W = 1 kWh");

const E2h = calculateEnergyConsumption(P, t1h * 2);
assert(E2h === 2, "2 horas a 1000W = 2 kWh");

const E30min = calculateEnergyConsumption(500, 1800000);
assert(E30min === 0.25, "30 minutos a 500W = 0.25 kWh");
console.log();

// PRUEBA 2: Costo energético
console.log("💰 PRUEBA 2: Cálculo de Costo Energético");
console.log("─".repeat(60));
const costTest1 = calculateEnergyCost(10, 0.15);
console.log(`Entrada: 10 kWh × $0.15/kWh`);
console.log(`Cálculo: ${costTest1}`);
assert(Math.abs(costTest1 - 1.5) < 0.001, "10 kWh a $0.15/kWh = $1.50");

const costTest2 = calculateEnergyCost(100, 0.12);
assert(Math.abs(costTest2 - 12) < 0.001, "100 kWh a $0.12/kWh = $12.00");
console.log();

// PRUEBA 3: Formateo de tiempo
console.log("⏱️  PRUEBA 3: Formateo de Tiempo de Funcionamiento");
console.log("─".repeat(60));
const time1h = formatRunningTime(3600000);
console.log(`Entrada: 3,600,000 ms (1 hora)`);
console.log(`Formato: ${time1h.format}`);
assert(time1h.hours === 1 && time1h.minutes === 0, "1 hora formateada correctamente");

const time2h30 = formatRunningTime(9000000);
console.log(`Entrada: 9,000,000 ms (2.5 horas)`);
console.log(`Formato: ${time2h30.format}`);
assert(time2h30.hours === 2 && time2h30.minutes === 30, "2h 30m formateado correctamente");

const time1day = formatRunningTime(86400000);
console.log(`Entrada: 86,400,000 ms (1 día)`);
console.log(`Formato: ${time1day.format}`);
assert(time1day.days === 1, "1 día formateado correctamente");
console.log();

// PRUEBA 4: Mantenimiento preventivo
console.log("🔧 PRUEBA 4: Mantenimiento Preventivo");
console.log("─".repeat(60));
console.log("Intervalos: 250h (inspección), 500h (aceite), 1000h (general), 2000h (profundo)\n");

const scenarios = [
  { hours: 100, expectedLevel: "inspection", expectedHours: 250 },
  { hours: 250, expectedLevel: "oil-change", expectedHours: 500 },
  { hours: 500, expectedLevel: "revision", expectedHours: 1000 },
  { hours: 1000, expectedLevel: "deep-revision", expectedHours: 2000 },
  { hours: 2100, expectedLevel: "inspection", expectedHours: 2250 },
];

scenarios.forEach(({ hours, expectedLevel, expectedHours }) => {
  const ms = hours * 1000 * 60 * 60;
  const status = getMaintenanceStatus(ms);
  console.log(`  En ${hours}h: ${status.message}`);
  assert(
    status.level === expectedLevel && status.nextMaintenanceHours === expectedHours,
    `${hours}h → Próximo: ${expectedLevel} en ${expectedHours}h`
  );
});
console.log();

// PRUEBA 5: Corriente de arranque
console.log("⚡ PRUEBA 5: Corriente de Arranque del Motor");
console.log("─".repeat(60));
const tests_startup = [
  { nominal: 5, expected: 25 },   // 5A × 5 = 25A
  { nominal: 10, expected: 50 },  // 10A × 5 = 50A
  { nominal: 20, expected: 100 }, // 20A × 5 = 100A
];

tests_startup.forEach(({ nominal, expected }) => {
  const startup = calculateStartupCurrent(nominal);
  console.log(`Corriente nominal: ${nominal}A → Arranque: ${startup}A`);
  assert(startup === expected, `${nominal}A nominal = ${expected}A arranque (5×)`);
});
console.log();

// PRUEBA 6: Validación de protección
console.log("🛡️  PRUEBA 6: Validación de Protección (Breaker)");
console.log("─".repeat(60));
const protectionTests = [
  { motorI: 10, breaker: 15, expectValid: true, desc: "10A motor + 15A breaker (correcto)" },
  { motorI: 10, breaker: 12.5, expectValid: true, desc: "10A motor + 12.5A breaker (límite mín)" },
  { motorI: 10, breaker: 8, expectValid: false, desc: "10A motor + 8A breaker (insuficiente)" },
  { motorI: 10, breaker: 30, expectValid: true, desc: "10A motor + 30A breaker (sobredimensionado)" },
];

protectionTests.forEach(({ motorI, breaker, expectValid, desc }) => {
  const protection = validateMotorProtection(motorI, breaker);
  console.log(`${desc}`);
  console.log(`  → ${protection.message}`);
  assert(protection.isValid === expectValid, `${desc}: ${expectValid ? "válido" : "inválido"}`);
});
console.log();

// RESUMEN
console.log("╔════════════════════════════════════════════════════════════════╗");
console.log("║                    RESUMEN DE PRUEBAS                        ║");
console.log("╚════════════════════════════════════════════════════════════════╝");
console.log(`✅ Pruebas pasadas: ${testsPassed}`);
console.log(`❌ Pruebas fallidas: ${testsFailed}`);
console.log(`📊 Total: ${testsPassed + testsFailed}`);
console.log(`🎯 Tasa de éxito: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log();

if (testsFailed === 0) {
  console.log("🎉 ¡TODAS LAS PRUEBAS PASARON!\n");
  process.exit(0);
} else {
  console.log("⚠️  ALGUNAS PRUEBAS FALLARON\n");
  process.exit(1);
}
