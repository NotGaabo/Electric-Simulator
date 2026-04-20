import { ElementType } from './types';

export const GRID_SIZE = 20;
export const MIN_ROOM_SIZE = 40;
export const CANVAS_WIDTH = 2000;
export const CANVAS_HEIGHT = 1500;

// ─── Wire visual config ───────────────────────────────────────────────────────
export const WIRE_COLORS: Record<string, string> = {
  wire_hot: '#D85A30',
  wire_neutral: '#888780',
  wire_ground: '#639922',
  circuit: '#378ADD',
};

export const WIRE_GLOW_COLORS: Record<string, string> = {
  wire_hot: 'rgba(216,90,48,0.2)',
  wire_neutral: 'rgba(136,135,128,0.15)',
  wire_ground: 'rgba(99,153,34,0.2)',
  circuit: 'rgba(55,138,221,0.2)',
};

export const WIRE_WIDTHS: Record<string, number> = {
  wire_hot: 2,
  wire_neutral: 2,
  wire_ground: 2,
  circuit: 2.5,
};

// ─── Tool categories ──────────────────────────────────────────────────────────
export type ToolCategory = {
  label: string;
  icon: string;
  tools: ToolDef[];
};

export type ToolDef = {
  type: ElementType;
  label: string;
  shortLabel: string;
  icon: string;
};

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    label: 'Estructura',
    icon: '⬜',
    tools: [
      { type: 'room',   label: 'Dibujar habitación',       shortLabel: 'Habitación', icon: '⬜' },
      { type: 'wall',   label: 'Dibujar pared',             shortLabel: 'Pared',      icon: '▬' },
      { type: 'door',   label: 'Colocar puerta',            shortLabel: 'Puerta',     icon: '🚪' },
      { type: 'window', label: 'Colocar ventana',           shortLabel: 'Ventana',    icon: '🪟' },
    ],
  },
  {
    label: 'Iluminación',
    icon: '💡',
    tools: [
      { type: 'ceiling_light', label: 'Luz de techo',              shortLabel: 'Techo',      icon: '○' },
      { type: 'recessed',      label: 'Luz empotrada (RCLT)',       shortLabel: 'Empotrada',  icon: '▣' },
      { type: 'wall_light',    label: 'Luz de pared',              shortLabel: 'Pared',      icon: '⊙' },
      { type: 'fan',           label: 'Ventilador de techo',       shortLabel: 'Ventilador', icon: '✦' },
    ],
  },
  {
    label: 'Eléctrico',
    icon: '⚡',
    tools: [
      { type: 'outlet', label: 'Tomacorriente dúplex',        shortLabel: 'Tomacte.', icon: '⊛' },
      { type: 'switch', label: 'Interruptor simple',          shortLabel: 'Interrup.', icon: 'S' },
      { type: 'dimmer', label: 'Dimmer / regulador',          shortLabel: 'Dimmer',   icon: 'D' },
      { type: 'panel',  label: 'Panel de distribución',       shortLabel: 'Panel',    icon: '▤' },
    ],
  },
  {
    label: 'Conexiones',
    icon: '~',
    tools: [
      { type: 'wire_hot',     label: 'Cable vivo (fase/L)',   shortLabel: 'Vivo',     icon: '─' },
      { type: 'wire_neutral', label: 'Cable neutro (N)',      shortLabel: 'Neutro',   icon: '─' },
      { type: 'wire_ground',  label: 'Cable tierra (T/G)',    shortLabel: 'Tierra',   icon: '─' },
      { type: 'circuit',      label: 'Circuito / derivación', shortLabel: 'Circuito', icon: '→' },
    ],
  },
];

// ─── Type sets ────────────────────────────────────────────────────────────────
export const WIRE_TYPES   = new Set<ElementType>(['wire_hot','wire_neutral','wire_ground','circuit']);
export const LIGHT_TYPES  = new Set<ElementType>(['ceiling_light','recessed','wall_light','fan']);
export const SWITCH_TYPES = new Set<ElementType>(['switch','dimmer']);

// ─── Room label suggestions ───────────────────────────────────────────────────
export const ROOM_LABEL_SUGGESTIONS = [
  'Sala', 'Cocina', 'Comedor', 'Dormitorio principal', 'Dormitorio',
  'Baño', 'Baño principal', 'Pasillo', 'Lavandería', 'Garaje',
  'Oficina', 'Cuarto de servicio', 'Terraza', 'Balcón',
];

// ─── Theme ────────────────────────────────────────────────────────────────────
export const THEME = {
  bg:       '#0a0f1e',
  bgPanel:  '#060d1a',
  border:   '#1e293b',
  borderMid:'#1e3a5f',
  text:     '#94a3b8',
  textMid:  '#475569',
  textDim:  '#334155',
  accent:   '#4ade80',
  accentDim:'rgba(74,222,128,0.12)',
  selected: '#4ade80',
} as const;