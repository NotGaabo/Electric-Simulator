export type ElementType =
  | 'room'
  | 'wall'
  | 'door'
  | 'window'
  | 'ceiling_light'
  | 'recessed'
  | 'wall_light'
  | 'fan'
  | 'outlet'
  | 'switch'
  | 'dimmer'
  | 'panel'
  | 'wire_hot'
  | 'wire_neutral'
  | 'wire_ground'
  | 'circuit';

export type WireType = 'wire_hot' | 'wire_neutral' | 'wire_ground' | 'circuit';

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  label?: string;
}

export interface RoomElement extends BaseElement {
  type: 'room';
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface PointElement extends BaseElement {
  type: Exclude<ElementType, 'room' | 'wall' | WireType>;
  x: number;
  y: number;
}

export interface WireElement extends BaseElement {
  type: WireType;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type FloorElement = RoomElement | PointElement | WireElement;

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'ok';
  message: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  isValid: boolean;
  stats: {
    rooms: number;
    lights: number;
    switches: number;
    outlets: number;
    panels: number;
    wires: number;
  };
}

export type ToolMode = 'select' | 'place';

export interface ToolState {
  mode: ToolMode;
  activeTool: ElementType | null;
}

export interface DrawState {
  wireStart: Point | null;
  roomStart: Point | null;
  mousePos: Point;
}