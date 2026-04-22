/**
 * Cálculos avanzados para Machine Simulator
 * Incluye consumo energético (E = P·t) y tiempo de funcionamiento
 */

/**
 * RF-24 & Requisito Usuario: Consumo energético
 * E = P × t
 * @param powerW - Potencia en watts
 * @param timeMs - Tiempo en milisegundos
 * @returns Energía consumida en kWh
 */
export function calculateEnergyConsumption(powerW: number, timeMs: number): number {
  // Convertir ms a horas: timeMs / (1000 * 60 * 60)
  // Convertir W a kW: powerW / 1000
  // E = P (kW) × t (h)
  const timeHours = timeMs / (1000 * 60 * 60);
  const powerKW = powerW / 1000;
  return powerKW * timeHours;
}

/**
 * Calcula el costo del consumo energético
 * @param energyKWh - Energía consumida en kWh
 * @param costPerKWh - Costo por kWh (default: $0.15)
 * @returns Costo en unidad monetaria
 */
export function calculateEnergyCost(energyKWh: number, costPerKWh: number = 0.15): number {
  return energyKWh * costPerKWh;
}

/**
 * RF-24 & Requisito Usuario: Tiempo de funcionamiento
 * Calcula el tiempo acumulado de funcionamiento para mantenimiento preventivo
 * @param runningTimeMs - Tiempo acumulado en milisegundos
 * @returns Objeto con tiempos en diferentes unidades
 */
export function formatRunningTime(runningTimeMs: number) {
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

/**
 * Determina si se requiere mantenimiento basado en el tiempo de funcionamiento
 * Intervalos típicos de mantenimiento:
 * - 250 horas: Inspección visual
 * - 500 horas: Cambio de aceite
 * - 1000 horas: Revisión general
 * - 2000 horas: Revisión profunda
 */
export function getMaintenanceStatus(runningTimeMs: number): {
  level: "none" | "inspection" | "oil-change" | "revision" | "deep-revision";
  nextMaintenanceMs: number;
  nextMaintenanceHours: number;
  message: string;
  urgency: "ok" | "warning" | "critical";
} {
  const timeHours = runningTimeMs / (1000 * 60 * 60);

  // Definir intervalos de mantenimiento (en horas)
  const MAINTENANCE_INTERVALS = {
    inspection: 250,
    "oil-change": 500,
    revision: 1000,
    "deep-revision": 2000,
  };

  // Encontrar el siguiente mantenimiento requerido
  let nextLevel: "inspection" | "oil-change" | "revision" | "deep-revision" | null = null;
  let nextHours = 0;

  for (const [level, hours] of Object.entries(MAINTENANCE_INTERVALS)) {
    if (timeHours < hours) {
      nextLevel = level as "inspection" | "oil-change" | "revision" | "deep-revision";
      nextHours = hours;
      break;
    }
  }

  // Si pasó todas las revisiones, ciclar de nuevo
  if (!nextLevel) {
    nextLevel = "inspection";
    nextHours = MAINTENANCE_INTERVALS.inspection * Math.ceil(timeHours / MAINTENANCE_INTERVALS.inspection);
  }

  const nextMs = nextHours * 1000 * 60 * 60;
  const remainingHours = nextHours - timeHours;
  const remainingMs = remainingHours * 1000 * 60 * 60;

  let message = "";
  let urgency: "ok" | "warning" | "critical" = "ok";

  const getDescription = (level: string): string => {
    const descriptions: Record<string, string> = {
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
    nextMaintenanceMs: nextMs,
    nextMaintenanceHours: nextHours,
    message,
    urgency,
  };
}

/**
 * Calcula la potencia del motor basado en V, I y factor de potencia
 * P = V × I × cos(φ)
 * @param voltage - Voltaje en voltios
 * @param current - Corriente en amperios
 * @param powerFactor - Factor de potencia (0.7-0.95 típicamente)
 * @returns Potencia en watts
 */
export function calculateMotorPower(
  voltage: number,
  current: number,
  powerFactor: number = 0.85
): number {
  return voltage * current * powerFactor;
}

/**
 * Calcula la corriente nominal del motor (arranque)
 * Para motores AC: I_arranque ≈ 3-7 × I_nominal (típicamente 5×)
 * @param nominalCurrent - Corriente nominal en amperios
 * @param startupMultiplier - Multiplicador de arranque (default: 5)
 * @returns Corriente de arranque en amperios
 */
export function calculateStartupCurrent(
  nominalCurrent: number,
  startupMultiplier: number = 5
): number {
  return nominalCurrent * startupMultiplier;
}

/**
 * Calcula la eficiencia del motor
 * η = P_salida / P_entrada
 * @param inputPowerW - Potencia de entrada en watts
 * @param outputPowerHP - Potencia de salida en horsepower
 * @returns Eficiencia como porcentaje (0-100)
 */
export function calculateMotorEfficiency(
  inputPowerW: number,
  outputPowerHP: number
): number {
  // 1 HP = 746 W
  const outputPowerW = outputPowerHP * 746;
  if (inputPowerW === 0) return 0;
  return (outputPowerW / inputPowerW) * 100;
}

/**
 * Valida si la protección (breaker/fusible) es adecuada para el motor
 * @param motorNominalCurrent - Corriente nominal del motor
 * @param protectionRating - Capacidad de la protección
 * @param safetyFactor - Factor de seguridad (default: 1.25)
 * @returns Objeto con validación
 */
export function validateMotorProtection(
  motorNominalCurrent: number,
  protectionRating: number,
  safetyFactor: number = 1.25
): {
  isValid: boolean;
  requiredRating: number;
  warning: string | null;
  message: string;
} {
  const requiredRating = motorNominalCurrent * safetyFactor;

  if (protectionRating < requiredRating) {
    return {
      isValid: false,
      requiredRating,
      warning: `Protección subdimensionada. Requerida: ${requiredRating.toFixed(1)}A, disponible: ${protectionRating}A`,
      message: "Protección insuficiente para el motor",
    };
  }

  if (protectionRating > motorNominalCurrent * 2.5) {
    return {
      isValid: true,
      requiredRating,
      warning: `Protección sobredimensionada. Puede no activarse en sobrecarga`,
      message: "Protección adecuada pero verificar sensibilidad",
    };
  }

  if (protectionRating > motorNominalCurrent * 2) {
    return {
      isValid: true,
      requiredRating,
      warning: `Protección sobredimensionada. Considere un breaker más pequeño`,
      message: "Protección adecuada pero sobredimensionada",
    };
  }

  return {
    isValid: true,
    requiredRating,
    warning: null,
    message: "Protección adecuada",
  };
}
