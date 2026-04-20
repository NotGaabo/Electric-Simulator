export type Signal = boolean;
export type Mode = "OFF" | "MANUAL" | "AUTO";
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

export interface SensorNode extends BaseNode {
  type: "sensor";
  motion: Signal;
  /** Si es > 0, el sensor emite pulso one-shot: se apaga solo tras onDurationMs */
  onDurationMs: number;
  /** Tiempo restante del one-shot en curso (0 = apagado o sin timer) */
  onRemainingMs: number;
  /** Señal anterior para detectar flanco de subida */
  prevMotion: Signal;
}

export interface SelectorNode extends BaseNode {
  type: "selector";
  mode: Mode;
}

export interface ContactorNode extends BaseNode {
  type: "contactor";
  coil: Signal;
  contactClosed: Signal;
}

export interface TimerNode extends BaseNode {
  type: "timer";
  input: Signal;
  output: Signal;
  delayMs: number;
  remainingMs: number;
}

export interface LampNode extends BaseNode {
  type: "lamp";
  active: Signal;
}

export interface MotorNode extends BaseNode {
  type: "motor";
  active: Signal;
}

export type LoadNode = LampNode | MotorNode;

export type AutomationNode =
  | SensorNode
  | SelectorNode
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

export interface AutomationState {
  nodes: AutomationNode[];
  wires: Wire[];
  running: boolean;
}
