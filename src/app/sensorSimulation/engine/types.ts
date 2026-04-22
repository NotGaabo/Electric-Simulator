export type Signal = boolean;
export type Mode = "OFF" | "MANUAL" | "AUTO";
/** RF-23: Tipos de sensores de movimiento */
export type SensorType = "PIR" | "ultrasonic" | "pressure" | "thermal";
/** RF-26: Tipos de dispositivos de control */
export type ControlDeviceType = "relay" | "contactor" | "breaker";
export type NodeType =
  | "sensor"
  | "selector"
  | "relay"
  | "contactor"
  | "lamp"
  | "motor"
  | "timer";

export interface BaseNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  label?: string;
}

/** RF-23: Sensor mejorado con tipo y configuración de movimiento */
export interface SensorNode extends BaseNode {
  type: "sensor";
  /** Tipo de sensor (PIR, ultrasónico, presión, térmico) */
  sensorType: SensorType;
  motion: Signal;
  /** Si es > 0, el sensor emite pulso one-shot: se apaga solo tras onDurationMs */
  onDurationMs: number;
  /** Tiempo restante del one-shot en curso (0 = apagado o sin timer) */
  onRemainingMs: number;
  /** Señal anterior para detectar flanco de subida */
  prevMotion: Signal;
  /** RF-23: Sensibilidad del sensor (0-100) */
  sensitivity: number;
  /** RF-23: Tiempo mínimo entre activaciones (ms) para evitar jitter */
  debounceMs: number;
  lastActivationTime: number;
}

export interface SelectorNode extends BaseNode {
  type: "selector";
  mode: Mode;
  /** RF-25: Indicador de control manual vs automático */
  automaticEnabled: boolean;
}

/** RF-26: Relé mejorado con parámetros eléctricos */
export interface RelayNode extends BaseNode {
  type: "relay";
  coil: Signal;
  contactClosed: Signal;
  /** RF-26: Corriente nominal del relé (A) */
  ratedCurrent: number;
  /** RF-26: Voltaje nominal de la bobina (V) */
  ratedVoltage: number;
  /** RF-26: Contactos en serie (N/C = Normally Closed, N/O = Normally Open) */
  contactType: "N/O" | "N/C";
}

/** RF-26: Contactor mejorado con parámetros de protección */
export interface ContactorNode extends BaseNode {
  type: "contactor";
  coil: Signal;
  contactClosed: Signal;
  /** RF-26: Corriente máxima del contactor (A) */
  maxCurrent: number;
  /** RF-26: Voltaje nominal (V) */
  ratedVoltage: number;
  /** RF-26: Número de contactos principales */
  mainContacts: number;
  /** RF-26: Contacto auxiliar (para enclavamiento) */
  auxiliaryContact: Signal;
  /** RF-26: Corriente actual detectada (para protección térmica) */
  currentDetected: number;
}

export interface TimerNode extends BaseNode {
  type: "timer";
  input: Signal;
  output: Signal;
  /** RF-24: Tipo de temporizador (retardo de conexión/desconexión) */
  timerType: "delay-on" | "delay-off" | "pulse" | "cycle";
  delayMs: number;
  remainingMs: number;
  /** RF-24: Ciclo de funcionamiento para timer tipo "cycle" */
  cycleMs?: number;
}

export interface LampNode extends BaseNode {
  type: "lamp";
  active: Signal;
  /** RF-24: Potencia de la lámpara (W) */
  powerW?: number;
  /** RF-24: Estado operativo (encendida, apagada, defectuosa) */
  operationalState: "on" | "off" | "fault";
}

export interface MotorNode extends BaseNode {
  type: "motor";
  active: Signal;
  /** RF-24: Potencia del motor (HP) */
  powerHP?: number;
  /** RF-24: RPM nominal */
  rpmNominal?: number;
  /** RF-26: Corriente nominal (A) */
  nominalCurrent?: number;
  /** RF-24: Estado operativo */
  operationalState: "stopped" | "running" | "stalled" | "fault";
  /** RF-26: Tiempo de funcionamiento acumulado (ms) para mantenimiento */
  runningTimeMs: number;
}

export type LoadNode = LampNode | MotorNode;

export type AutomationNode =
  | SensorNode
  | SelectorNode
  | RelayNode
  | ContactorNode
  | TimerNode
  | LampNode
  | MotorNode;

export interface WirePoint {
  x: number;
  y: number;
}

export interface Wire {
  id: string;
  from: string;
  to: string;
  points?: WirePoint[];
}

/** RF-24: Condición programada para control automático */
export interface ProgrammedCondition {
  id: string;
  name: string;
  /** Operador lógico: AND requiere todas, OR al menos una */
  operator: "AND" | "OR";
  /** Lista de IDs de nodos que deben cumplir condición */
  inputNodeIds: string[];
  /** ID del nodo de salida a activar */
  outputNodeId: string;
  enabled: boolean;
  /** Descripción de la lógica */
  description: string;
}

export interface AutomationState {
  nodes: AutomationNode[];
  wires: Wire[];
  running: boolean;
  /** RF-24: Condiciones programadas */
  conditions: ProgrammedCondition[];
}
