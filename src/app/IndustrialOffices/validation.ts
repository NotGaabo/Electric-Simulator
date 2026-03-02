import { EQUIPMENT_CATALOG } from "./constants";
import {
  ElectricCircuit,
  EquipmentOperationalResult,
  EquipmentType,
  ValidationResult,
} from "./types";

export function validateCircuit(
  circuit: ElectricCircuit,
  equipmentType: EquipmentType,
): ValidationResult {
  const reasons: string[] = [];
  const equipment = EQUIPMENT_CATALOG[equipmentType];

  if (!circuit.breakerOn) {
    reasons.push("El breaker del circuito esta apagado.");
  }

  if (equipment.requiresSwitch && !circuit.switchOn) {
    reasons.push("El interruptor del circuito esta apagado.");
  }

  if (!circuit.connection.hasPhase) {
    reasons.push("Falta conexion de fase.");
  }

  if (!circuit.connection.hasNeutral) {
    reasons.push("Falta conexion de neutro.");
  }

  if (!circuit.connection.hasGround) {
    reasons.push("Falta conexion a tierra.");
  }

  if (
    circuit.voltage < equipment.requiredVoltage.min ||
    circuit.voltage > equipment.requiredVoltage.max
  ) {
    reasons.push(
      `Voltaje fuera de rango para ${equipment.label} (${equipment.requiredVoltage.min}-${equipment.requiredVoltage.max}V).`,
    );
  }

  return {
    isValid: reasons.length === 0,
    reasons,
  };
}

export function canEquipmentOperate(
  equipmentType: EquipmentType,
  circuit: ElectricCircuit,
): EquipmentOperationalResult {
  const validation = validateCircuit(circuit, equipmentType);

  return {
    ...validation,
    canOperate: validation.isValid,
  };
}
