import { DEFAULT_CIRCUIT_VALUES, EQUIPMENT_CATALOG } from "./constants";
import { ElectricCircuit, EquipmentStatus, EquipmentType, OfficeEquipment } from "./types";

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function createCircuitName(index: number): string {
  return `Circuito ${index}`;
}

export function createDefaultCircuit(index: number): ElectricCircuit {
  return {
    id: createId("circuit"),
    name: createCircuitName(index),
    breakerOn: DEFAULT_CIRCUIT_VALUES.breakerOn,
    switchOn: DEFAULT_CIRCUIT_VALUES.switchOn,
    voltage: DEFAULT_CIRCUIT_VALUES.voltage,
    connection: { ...DEFAULT_CIRCUIT_VALUES.connection },
  };
}

export function createEquipmentLabel(type: EquipmentType, index: number): string {
  return `${EQUIPMENT_CATALOG[type].label} ${index}`;
}

export function createEquipment(
  type: EquipmentType,
  circuitId: string,
  index: number,
  status: EquipmentStatus = "OFF",
): OfficeEquipment {
  return {
    id: createId("equipment"),
    type,
    label: createEquipmentLabel(type, index),
    status,
    circuitId,
  };
}

export function formatPower(powerW: number): string {
  return `${powerW.toLocaleString("es-ES")} W`;
}
