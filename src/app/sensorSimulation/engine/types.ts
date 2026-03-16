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

export interface LoadNode extends BaseNode {
  type: "lamp" | "motor";
  active: Signal;
}

export type AutomationNode =
  | SensorNode
  | SelectorNode
  | ContactorNode
  | TimerNode
  | LoadNode;

export interface Wire {
  id: string;
  from: string;
  to: string;
}

export interface AutomationState {
  nodes: AutomationNode[];
  wires: Wire[];
  running: boolean;
}