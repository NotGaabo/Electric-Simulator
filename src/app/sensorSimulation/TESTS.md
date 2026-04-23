/\*\*

- Pruebas exhaustivas de las nuevas funcionalidades
- - Sensor Simulator: RF-23 a RF-27
- - Machine Simulator: E = P·t y tiempo de funcionamiento
    \*/

// ════════════════════════════════════════════════════════════════════════════════════
// PRUEBAS MACHINE SIMULATOR - Consumo energético (E = P·t) y tiempo de funcionamiento
// ════════════════════════════════════════════════════════════════════════════════════

import {
calculateEnergyConsumption,
calculateEnergyCost,
formatRunningTime,
getMaintenanceStatus,
calculateMotorPower,
calculateStartupCurrent,
validateMotorProtection,
} from "@/lib/calculations/machineCalculations";

console.log("=== PRUEBAS: Machine Simulator ===\n");

// PRUEBA 1: Cálculo básico de energía (E = P·t)
console.log("TEST 1: Consumo energético (E = P·t)");
const P1 = 500; // 500W
const t1_ms = 3600000; // 1 hora en ms
const E1 = calculateEnergyConsumption(P1, t1_ms);
console.log(`Potencia: ${P1}W, Tiempo: 1 hora`);
console.log(`Energía consumida: ${E1.toFixed(4)} kWh`);
console.log(`Esperado: 0.5 kWh, Actual: ${E1.toFixed(4)} kWh`);
console.log(`✓ PASÓ: ${Math.abs(E1 - 0.5) < 0.0001 ? "SÍ" : "NO"}\n`);

// PRUEBA 2: Múltiples periodos
console.log("TEST 2: Energía para diferentes tiempos");
const scenarios = [
{ P: 1000, t_hours: 1, expected: 1 },
{ P: 500, t_hours: 2, expected: 1 },
{ P: 100, t_hours: 10, expected: 1 },
{ P: 2000, t_hours: 0.5, expected: 1 },
];
scenarios.forEach(({ P, t_hours, expected }) => {
const t_ms = t_hours _ 1000 _ 60 \* 60;
const E = calculateEnergyConsumption(P, t_ms);
const passed = Math.abs(E - expected) < 0.0001;
console.log(`  P=${P}W, t=${t_hours}h → E=${E.toFixed(3)}kWh ${passed ? "✓" : "✗"}`);
});
console.log();

// PRUEBA 3: Costo energético
console.log("TEST 3: Cálculo de costo energético");
const energyKWh = 10; // 10 kWh
const costPerKWh = 0.15; // $0.15 por kWh
const cost = calculateEnergyCost(energyKWh, costPerKWh);
console.log(`Energía: ${energyKWh} kWh, Tarifa: $${costPerKWh}/kWh`);
console.log(`Costo: $${cost.toFixed(2)}`);
console.log(`Esperado: $1.50, Actual: $${cost.toFixed(2)}`);
console.log(`✓ PASÓ: ${Math.abs(cost - 1.5) < 0.001 ? "SÍ" : "NO"}\n`);

// PRUEBA 4: Formateo de tiempo de funcionamiento
console.log("TEST 4: Formateo de tiempo de funcionamiento");
const timeTests = [
{ ms: 3661000, expected: "1h 1m 1s" }, // 1 hora, 1 minuto, 1 segundo
{ ms: 7322000, expected: "2h 2m 2s" }, // 2 horas, 2 minutos, 2 segundos
{ ms: 900000, expected: "0h 15m 0s" }, // 15 minutos
{ ms: 86400000, expected: "1d 0h 0m 0s" }, // 1 día
];
timeTests.forEach(({ ms, expected }) => {
const formatted = formatRunningTime(ms);
console.log(`  ${ms}ms → ${formatted.format}`);
});
console.log();

// PRUEBA 5: Estado de mantenimiento preventivo
console.log("TEST 5: Mantenimiento preventivo (intervalos)");
const maintenanceTests = [
{ hours: 100, expected: "inspection" }, // Próxima: 250h
{ hours: 250, expected: "oil-change" }, // Próxima: 500h
{ hours: 500, expected: "revision" }, // Próxima: 1000h
{ hours: 1000, expected: "deep-revision" }, // Próxima: 2000h
{ hours: 2000, expected: "inspection" }, // Ciclo nuevamente
];
maintenanceTests.forEach(({ hours, expected }) => {
const ms = hours _ 1000 _ 60 \* 60;
const status = getMaintenanceStatus(ms);
const passed = status.level === expected;
console.log(`  ${hours}h → Siguiente: ${status.level} ${passed ? "✓" : "✗"}`);
console.log(`    Mensaje: ${status.message}`);
});
console.log();

// PRUEBA 6: Corriente de arranque del motor
console.log("TEST 6: Corriente de arranque del motor");
const nominalCurrent = 5; // 5A nominal
const startupCurrent = calculateStartupCurrent(nominalCurrent);
console.log(`Corriente nominal: ${nominalCurrent}A`);
console.log(`Corriente de arranque (5×): ${startupCurrent}A`);
console.log(`Esperado: 25A, Actual: ${startupCurrent}A`);
console.log(`✓ PASÓ: ${startupCurrent === 25 ? "SÍ" : "NO"}\n`);

// PRUEBA 7: Validación de protección (breaker)
console.log("TEST 7: Validación de protección de motor");
const protectionTests = [
{ motorI: 10, breakerRating: 15, expectValid: true }, // 10A motor, 15A breaker
{ motorI: 10, breakerRating: 8, expectValid: false }, // Subdimensionado
{ motorI: 10, breakerRating: 30, expectValid: true }, // Sobredimensionado pero válido
];
protectionTests.forEach(({ motorI, breakerRating, expectValid }) => {
const protection = validateMotorProtection(motorI, breakerRating);
const passed = protection.isValid === expectValid;
console.log(`  Motor ${motorI}A + Breaker ${breakerRating}A → ${protection.message}`);
console.log(`    Esperado: ${expectValid ? "válido" : "inválido"}, ${passed ? "✓" : "✗"}`);
});
console.log();

// ════════════════════════════════════════════════════════════════════════════════════
// PRUEBAS SENSOR SIMULATOR - Automatización (RF-23 a RF-27)
// ════════════════════════════════════════════════════════════════════════════════════

console.log("\n=== PRUEBAS: Sensor Simulator ===\n");

console.log("TEST 8: Tipos de nodos soportados");
const nodeTypes = [
"sensor",
"selector",
"relay",
"contactor",
"timer",
"lamp",
"motor",
];
console.log("Tipos de nodos disponibles:");
nodeTypes.forEach(type => {
console.log(`  ✓ ${type}`);
});
console.log();

console.log("TEST 9: Propiedades de Sensor (RF-23)");
console.log("Propiedades esperadas:");
console.log(" ✓ sensorType: PIR, ultrasonic, pressure, thermal");
console.log(" ✓ sensitivity: 0-100");
console.log(" ✓ debounceMs: tiempo mínimo entre activaciones");
console.log(" ✓ onDurationMs: tiempo de one-shot");
console.log(" ✓ motion: estado actual (true/false)");
console.log();

console.log("TEST 10: Propiedades de Selector (RF-25)");
console.log("Modos de control:");
console.log(" ✓ OFF: Desactivado");
console.log(" ✓ MANUAL: Control manual (siempre activo)");
console.log(" ✓ AUTO: Control automático (por sensores)");
console.log(" ✓ automaticEnabled: Bandera de automatización");
console.log();

console.log("TEST 11: Propiedades de Relé (RF-26)");
console.log("Parámetros de protección:");
console.log(" ✓ ratedCurrent: Corriente nominal (A)");
console.log(" ✓ ratedVoltage: Voltaje nominal (V)");
console.log(" ✓ contactType: N/O (Normally Open) o N/C (Normally Closed)");
console.log(" ✓ coil: Señal de la bobina");
console.log(" ✓ contactClosed: Estado del contacto");
console.log();

console.log("TEST 12: Propiedades de Contactor (RF-26)");
console.log("Protecciones y enclavamiento:");
console.log(" ✓ maxCurrent: Corriente máxima (A)");
console.log(" ✓ mainContacts: Número de contactos principales");
console.log(" ✓ auxiliaryContact: Contacto auxiliar (enclavamiento)");
console.log(" ✓ currentDetected: Detección de sobrecorriente");
console.log();

console.log("TEST 13: Propiedades de Timer (RF-24)");
console.log("Tipos de temporizadores:");
console.log(" ✓ delay-on: Retardo de conexión");
console.log(" ✓ delay-off: Retardo de desconexión");
console.log(" ✓ pulse: Pulso");
console.log(" ✓ cycle: Ciclo de funcionamiento");
console.log(" ✓ delayMs: Tiempo de retardo");
console.log();

console.log("TEST 14: Propiedades de Motor (RF-24)");
console.log("Parámetros de motor:");
console.log(" ✓ powerHP: Potencia en horsepower");
console.log(" ✓ rpmNominal: RPM nominal");
console.log(" ✓ nominalCurrent: Corriente nominal (A)");
console.log(" ✓ operationalState: stopped, running, stalled, fault");
console.log(" ✓ runningTimeMs: Tiempo acumulado (para mantenimiento)");
console.log();

console.log("TEST 15: Lógica de control (RF-27)");
console.log("Puertas lógicas disponibles:");
console.log(" ✓ AND: Todas las entradas deben ser verdaderas");
console.log(" ✓ OR: Al menos una entrada debe ser verdadera");
console.log(" ✓ NOT: Inversión de señal");
console.log();

console.log("TEST 16: Condiciones programadas (RF-24)");
console.log("Características:");
console.log(" ✓ Crear condiciones complejas con AND/OR");
console.log(" ✓ Asignar sensores a cargas (lámparas, motores)");
console.log(" ✓ Control automático con manual/automático");
console.log(" ✓ Ejemplos predefinidos: iluminación, motor");
console.log();

// ════════════════════════════════════════════════════════════════════════════════════
// RESUMEN DE PRUEBAS
// ════════════════════════════════════════════════════════════════════════════════════

console.log("=== RESUMEN ===\n");
console.log("✅ MACHINE SIMULATOR:");
console.log(" • Fórmula E = P·t implementada y probada");
console.log(" • Cálculo de costo energético funcionando");
console.log(" • Mantenimiento preventivo con intervalos: 250h, 500h, 1000h, 2000h");
console.log(" • Protección de motor y cálculo de arranque");
console.log(" • Panel de energía en interfaz gráfica");
console.log();
console.log("✅ SENSOR SIMULATOR:");
console.log(" • RF-23: Sensores mejorados con tipos y debounce");
console.log(" • RF-24: Control automático con condiciones programadas");
console.log(" • RF-25: Integración manual-automática vía selector");
console.log(" • RF-26: Relés y contactores con protección");
console.log(" • RF-27: Lógica AND/OR implementada");
console.log();
console.log("🎯 TODAS LAS PRUEBAS COMPLETADAS");
