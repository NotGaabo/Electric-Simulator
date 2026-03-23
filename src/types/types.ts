// ─── Tipos base ───────────────────────────────────────────────────────────────

export type CompType =
  | "battery"
  | "source"
  | "resistor"
  | "luminaire"
  | "outlet"
  | "led"
  | "switch"
  | "breaker";

// Alias para compatibilidad (ambos apuntan al mismo tipo)
export type ComponentType = CompType;

export type Port = {
  id: string;
  label?: string;
  dx: number; // offset relativo al componente
  dy: number;
};

export type Component = {
  id: string;
  type: CompType;
  x: number;
  y: number;
  ports?: Port[];  // opcional
  voltage?: number;
  resistance?: number;
  power?: number;
  closed?: boolean;
  isOn?: boolean;  // para toggle
  label?: string;
};

// ─── Wire ─────────────────────────────────────────────────────────────────────

export type WirePoint = { x: number; y: number };

export type Wire = {
  id: string;
  fromCompId: string;
  fromPortId: string;
  toCompId: string;
  toPortId: string;
  /** Puntos intermedios del cable. Los extremos (comp ports) se calculan en runtime,
   *  no se almacenan aquí para mantener consistencia al mover componentes. */
  points: WirePoint[];
  /** Índice del nodo actualmente arrastrado (-1 = ninguno) */
  draggingNodeIndex: number | null;
};