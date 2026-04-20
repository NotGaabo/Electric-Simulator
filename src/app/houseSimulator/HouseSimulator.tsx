'use client';

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';

import {
  FloorElement,
  Point,
  ElementType,
  RoomElement,
  PointElement,
  WireElement,
  ValidationResult,
  DrawState,
} from './types';

import {
  GRID_SIZE,
  MIN_ROOM_SIZE,
  WIRE_COLORS,
  WIRE_GLOW_COLORS,
  WIRE_WIDTHS,
  WIRE_TYPES,
  LIGHT_TYPES,
  SWITCH_TYPES,
  ROOM_LABEL_SUGGESTIONS,
  THEME,
} from './constants';

import {
  snapPoint,
  generateId,
  isWireElement,
  isRoomElement,
  isPointElement,
  getSnappedPosition,
  downloadSVG,
  downloadJSON,
} from './utils';

import { validateCircuits } from './validation';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SymbolProps { x: number; y: number; selected?: boolean; wallSide?: 'top' | 'bottom' | 'left' | 'right' }

const COLOR = {
  stroke: (sel?: boolean) => sel ? THEME.selected : '#94a3b8',
  fill:   (sel?: boolean) => sel ? 'rgba(74,222,128,0.06)' : 'none',
};

// ─────────────────────────────────────────────────────────────────────────────
// Door Symbol — architectural style (gap in wall + swing arc)
// wallSide indicates which wall the door is on, arc swings inward
// ─────────────────────────────────────────────────────────────────────────────

function SymbolDoor({ x, y, selected, wallSide = 'bottom' }: SymbolProps) {
  const c = selected ? THEME.selected : '#94a3b8';
  const doorW = 24; // door leaf width

  // Rotation per wall side so arc always swings inward
  const rotMap: Record<string, number> = {
    bottom: 0,
    top:    180,
    right:  90,
    left:   270,
  };
  const rot = rotMap[wallSide] ?? 0;

  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      {/* Door leaf line */}
      <line x1={0} y1={0} x2={doorW} y2={0} stroke={c} strokeWidth={2} />
      {/* Swing arc: quarter circle */}
      <path
        d={`M ${doorW} 0 A ${doorW} ${doorW} 0 0 0 0 ${doorW}`}
        fill="none"
        stroke={c}
        strokeWidth={0.8}
        strokeDasharray="3,2"
        opacity={0.6}
      />
      {/* Hinge dot */}
      <circle cx={0} cy={0} r={1.5} fill={c} />
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Other Symbols
// ─────────────────────────────────────────────────────────────────────────────

function SymbolCeilingLight({ x, y, selected }: SymbolProps) {
  const c = COLOR.stroke(selected);
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={16} fill="none" stroke={c} strokeWidth={0.7} strokeDasharray="2,2" opacity={0.5} />
      <circle r={10} fill="none" stroke={c} strokeWidth={1.5} />
      <circle r={3}  fill={c} opacity={0.6} />
    </g>
  );
}

function SymbolRecessed({ x, y, selected }: SymbolProps) {
  const c = COLOR.stroke(selected);
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-9} y={-9} width={18} height={18} rx={1} fill="#0f172a" stroke={c} strokeWidth={1.5} />
      <text textAnchor="middle" y={4} fontSize={7} fontWeight={500} fill={c} fontFamily="'Courier New', monospace">RC</text>
    </g>
  );
}

function SymbolWallLight({ x, y, selected }: SymbolProps) {
  const c = COLOR.stroke(selected);
  return (
    <g transform={`translate(${x},${y})`}>
      <line x1={-14} y1={0} x2={-7} y2={0} stroke={c} strokeWidth={1.5} />
      <circle r={7} fill="none" stroke={c} strokeWidth={1.5} />
    </g>
  );
}

function SymbolFan({ x, y, selected }: SymbolProps) {
  const c = COLOR.stroke(selected);
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={-8} rx={3} ry={6} fill="none" stroke={c} strokeWidth={1.2} />
      <ellipse cx={0} cy={-8} rx={3} ry={6} fill="none" stroke={c} strokeWidth={1.2} transform="rotate(90)" />
      <ellipse cx={0} cy={-8} rx={3} ry={6} fill="none" stroke={c} strokeWidth={1.2} transform="rotate(180)" />
      <ellipse cx={0} cy={-8} rx={3} ry={6} fill="none" stroke={c} strokeWidth={1.2} transform="rotate(270)" />
      <circle r={3} fill={c} />
    </g>
  );
}

function SymbolOutlet({ x, y, selected }: SymbolProps) {
  const c = COLOR.stroke(selected);
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={8} fill="#0f172a" stroke={c} strokeWidth={1.5} />
      <line x1={-3} y1={-3.5} x2={-3} y2={3.5} stroke={c} strokeWidth={1.8} />
      <line x1={3}  y1={-3.5} x2={3}  y2={3.5} stroke={c} strokeWidth={1.8} />
    </g>
  );
}

function SymbolSwitch({ x, y, selected }: SymbolProps) {
  const c = COLOR.stroke(selected);
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-5} y={-9} width={10} height={18} rx={2} fill="#0f172a" stroke={c} strokeWidth={1.5} />
      <text textAnchor="middle" y={4} fontSize={7} fontWeight={500} fill={c} fontFamily="'Courier New', monospace">S</text>
    </g>
  );
}

function SymbolDimmer({ x, y, selected }: SymbolProps) {
  const c = COLOR.stroke(selected);
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-5} y={-9} width={10} height={18} rx={2} fill="#0f172a" stroke={c} strokeWidth={1.5} />
      <text textAnchor="middle" y={4} fontSize={7} fontWeight={500} fill={c} fontFamily="'Courier New', monospace">D</text>
    </g>
  );
}

function SymbolPanel({ x, y, selected }: SymbolProps) {
  const c = COLOR.stroke(selected);
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-10} y={-14} width={20} height={28} rx={1} fill="#0f172a" stroke={c} strokeWidth={2} />
      {[-5, 0, 5].map((cy) => (
        <line key={cy} x1={-6} y1={cy} x2={6} y2={cy} stroke="#334155" strokeWidth={1} />
      ))}
      {selected && <text textAnchor="middle" y={22} fontSize={6} fill={c} fontFamily="'Courier New', monospace">PANEL</text>}
    </g>
  );
}

const SYMBOL_MAP: Record<string, React.FC<SymbolProps>> = {
  ceiling_light: SymbolCeilingLight,
  recessed:      SymbolRecessed,
  wall_light:    SymbolWallLight,
  fan:           SymbolFan,
  outlet:        SymbolOutlet,
  switch:        SymbolSwitch,
  dimmer:        SymbolDimmer,
  panel:         SymbolPanel,
  door:          SymbolDoor,
};

// ─────────────────────────────────────────────────────────────────────────────
// Tool categories — wall & window removed
// ─────────────────────────────────────────────────────────────────────────────

const TOOL_CATEGORIES_LOCAL = [
  {
    label: 'Estructura',
    tools: [
      { type: 'room' as ElementType,  shortLabel: 'Habitación' },
      { type: 'door' as ElementType,  shortLabel: 'Puerta'     },
    ],
  },
  {
    label: 'Iluminación',
    tools: [
      { type: 'ceiling_light' as ElementType, shortLabel: 'Techo'      },
      { type: 'recessed'      as ElementType, shortLabel: 'Empotrada'  },
      { type: 'wall_light'    as ElementType, shortLabel: 'Pared'      },
      { type: 'fan'           as ElementType, shortLabel: 'Ventilador' },
    ],
  },
  {
    label: 'Eléctrico',
    tools: [
      { type: 'outlet' as ElementType, shortLabel: 'Tomacte.'  },
      { type: 'switch' as ElementType, shortLabel: 'Interrup.' },
      { type: 'dimmer' as ElementType, shortLabel: 'Dimmer'    },
      { type: 'panel'  as ElementType, shortLabel: 'Panel'     },
    ],
  },
  {
    label: 'Conexiones',
    tools: [
      { type: 'wire_hot'     as ElementType, shortLabel: 'Vivo'     },
      { type: 'wire_neutral' as ElementType, shortLabel: 'Neutro'   },
      { type: 'wire_ground'  as ElementType, shortLabel: 'Tierra'   },
      { type: 'circuit'      as ElementType, shortLabel: 'Circuito' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const S = {
  app: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: THEME.bg,
    fontFamily: "'Courier New', monospace",
  } as React.CSSProperties,

  sidebar: {
    width: 180,
    background: THEME.bgPanel,
    borderRight: `1px solid ${THEME.border}`,
    display: 'flex',
    flexDirection: 'column' as const,
    overflowY: 'auto' as const,
    flexShrink: 0,
  } as React.CSSProperties,

  sidebarHeader: {
    padding: '14px 14px 8px',
    borderBottom: `1px solid ${THEME.border}`,
  } as React.CSSProperties,

  catLabel: {
    padding: '10px 14px 4px',
    fontSize: 8,
    color: '#4b5563',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  } as React.CSSProperties,

  toolBtn: (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 14px',
    cursor: 'pointer',
    borderRadius: 5,
    margin: '1px 6px',
    transition: 'background 0.15s',
    background: active ? 'rgba(74,222,128,0.1)' : 'transparent',
    border: 'none',
    width: 'calc(100% - 12px)',
  }),

  toolIcon: {
    width: 30,
    height: 24,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } as React.CSSProperties,

  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    minWidth: 0,
  } as React.CSSProperties,

  toolbar: {
    padding: '7px 10px',
    background: THEME.bgPanel,
    borderBottom: `1px solid ${THEME.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap' as const,
    flexShrink: 0,
  } as React.CSSProperties,

  tbBtn: {
    padding: '3px 9px',
    fontSize: 9,
    background: 'transparent',
    border: `1px solid ${THEME.border}`,
    color: THEME.textMid,
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
    transition: 'all 0.15s',
  } as React.CSSProperties,

  rightPanel: {
    width: 200,
    background: THEME.bgPanel,
    borderLeft: `1px solid ${THEME.border}`,
    display: 'flex',
    flexDirection: 'column' as const,
    overflowY: 'auto' as const,
    flexShrink: 0,
  } as React.CSSProperties,

  rpSection: {
    padding: '12px 14px',
    borderBottom: `1px solid ${THEME.border}`,
  } as React.CSSProperties,

  rpTitle: {
    fontSize: 8,
    color: '#4b5563',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  } as React.CSSProperties,

  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    borderBottom: `1px solid #0f172a`,
  } as React.CSSProperties,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: detect which wall a point is closest to in a room
// Returns the side and snapped position on that wall
// ─────────────────────────────────────────────────────────────────────────────

function detectWallSide(
  p: Point,
  rooms: RoomElement[]
): { side: 'top' | 'bottom' | 'left' | 'right'; snapped: Point } {
  let bestDist = Infinity;
  let bestSide: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  let bestSnapped: Point = p;

  for (const room of rooms) {
    const { x, y, w, h } = room;
    const edges: Array<{ side: 'top' | 'bottom' | 'left' | 'right'; dist: number; snapped: Point }> = [
      { side: 'top',    dist: Math.abs(p.y - y),       snapped: { x: p.x, y } },
      { side: 'bottom', dist: Math.abs(p.y - (y + h)), snapped: { x: p.x, y: y + h } },
      { side: 'left',   dist: Math.abs(p.x - x),       snapped: { x,      y: p.y } },
      { side: 'right',  dist: Math.abs(p.x - (x + w)), snapped: { x: x + w, y: p.y } },
    ];
    for (const edge of edges) {
      // Point must be within the wall's span
      const onSpan =
        (edge.side === 'top' || edge.side === 'bottom')
          ? p.x >= x && p.x <= x + w
          : p.y >= y && p.y <= y + h;
      if (onSpan && edge.dist < bestDist) {
        bestDist  = edge.dist;
        bestSide  = edge.side;
        bestSnapped = edge.snapped;
      }
    }
  }

  return { side: bestSide, snapped: bestSnapped };
}

// ─────────────────────────────────────────────────────────────────────────────
// Architectural door rendering on the room wall
// Renders a gap (transparent break) + arc inside the room SVG layer
// ─────────────────────────────────────────────────────────────────────────────

interface DoorOnWallProps {
  el: PointElement & { wallSide?: string };
  selected: boolean;
  rooms: RoomElement[];
}

function DoorOnWall({ el, selected, rooms }: DoorOnWallProps) {
  const c = selected ? THEME.selected : '#94a3b8';
  const doorW = 24;
  const wallSide = (el as any).wallSide as 'top' | 'bottom' | 'left' | 'right' ?? 'bottom';

  // Rotation so arc always opens inward
  const rotMap: Record<string, number> = {
    bottom: 0,
    top:    180,
    left:   90,
    right:  270,
  };
  const rot = rotMap[wallSide] ?? 0;

  return (
    <g data-elid={el.id} style={{ cursor: 'pointer' }}>
      {selected && (
        <circle cx={el.x} cy={el.y} r={doorW + 4} fill="rgba(74,222,128,0.06)" />
      )}
      {/* Gap in wall: white/bg colored rectangle that "erases" the wall line */}
      {(wallSide === 'top' || wallSide === 'bottom') ? (
        <rect x={el.x - doorW / 2} y={el.y - 4} width={doorW} height={8} fill={THEME.bg} />
      ) : (
        <rect x={el.x - 4} y={el.y - doorW / 2} width={8} height={doorW} fill={THEME.bg} />
      )}
      {/* Door leaf + arc, rotated to face inward */}
      <g transform={`translate(${el.x},${el.y}) rotate(${rot})`}>
        {/* Hinge at origin */}
        <circle cx={0} cy={0} r={1.8} fill={c} />
        {/* Door leaf: horizontal line from hinge */}
        <line x1={0} y1={0} x2={doorW} y2={0} stroke={c} strokeWidth={2} strokeLinecap="round" />
        {/* Swing arc */}
        <path
          d={`M ${doorW} 0 A ${doorW} ${doorW} 0 0 0 0 ${-doorW}`}
          fill="none"
          stroke={c}
          strokeWidth={0.8}
          strokeDasharray="3,2"
          opacity={0.65}
        />
      </g>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function HouseSimulator() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef    = useRef<SVGSVGElement>(null);

  const [elements,       setElements]       = useState<FloorElement[]>([]);
  const [selectedId,     setSelectedId]     = useState<string | null>(null);
  const [activeTool,     setActiveTool]     = useState<ElementType | null>(null);
  const [drawState,      setDrawState]      = useState<DrawState>({ wireStart: null, roomStart: null, mousePos: { x: 0, y: 0 } });
  const [validation,     setValidation]     = useState<ValidationResult | null>(null);
  const [roomLabelModal, setRoomLabelModal] = useState<{ show: boolean; id: string; value: string } | null>(null);

  const isWireTool = activeTool ? WIRE_TYPES.has(activeTool) : false;
  const isRoomTool = activeTool === 'room';
  const isDoorTool = activeTool === 'door';

  // ── Canvas size fits the container exactly (no internal scroll) ──
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  useEffect(() => {
    if (!canvasRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ w: Math.max(400, width), h: Math.max(300, height) });
      }
    });
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Keyboard ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !(e.target as HTMLElement).matches('input,textarea')) {
        handleDelete(selectedId);
      }
      if (e.key === 'Escape') {
        setActiveTool(null);
        setDrawState((s) => ({ ...s, wireStart: null, roomStart: null }));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const p = getSnappedPosition(e, canvasRef);
    setDrawState((s) => ({ ...s, mousePos: p }));
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const p = getSnappedPosition(e, canvasRef);

    if (!activeTool) {
      const target = (e.target as SVGElement).closest<SVGElement>('[data-elid]');
      setSelectedId(target ? (target.dataset.elid ?? null) : null);
      return;
    }

    if (isRoomTool) {
      if (!drawState.roomStart) {
        setDrawState((s) => ({ ...s, roomStart: p }));
      } else {
        const x = Math.min(drawState.roomStart.x, p.x);
        const y = Math.min(drawState.roomStart.y, p.y);
        const w = Math.abs(p.x - drawState.roomStart.x);
        const h = Math.abs(p.y - drawState.roomStart.y);
        if (w >= MIN_ROOM_SIZE && h >= MIN_ROOM_SIZE) {
          const id = generateId();
          setElements((prev) => [...prev, { id, type: 'room', x, y, w, h, label: 'Habitación' } as RoomElement]);
          setRoomLabelModal({ show: true, id, value: '' });
        }
        setDrawState((s) => ({ ...s, roomStart: null }));
      }
      return;
    }

    if (isDoorTool) {
      // Snap to nearest wall and store wallSide
      const rooms = elements.filter(isRoomElement) as RoomElement[];
      const { side, snapped } = detectWallSide(p, rooms);
      setElements((prev) => [
        ...prev,
        { id: generateId(), type: 'door', x: snapped.x, y: snapped.y, wallSide: side } as unknown as PointElement,
      ]);
      return;
    }

    if (isWireTool) {
      if (!drawState.wireStart) {
        setDrawState((s) => ({ ...s, wireStart: p }));
      } else {
        setElements((prev) => [...prev, {
          id: generateId(), type: activeTool as WireElement['type'],
          x1: drawState.wireStart!.x, y1: drawState.wireStart!.y,
          x2: p.x, y2: p.y,
        } as WireElement]);
        setDrawState((s) => ({ ...s, wireStart: null }));
      }
      return;
    }

    setElements((prev) => [
      ...prev,
      { id: generateId(), type: activeTool as PointElement['type'], x: p.x, y: p.y } as PointElement,
    ]);
  }, [activeTool, drawState, isRoomTool, isWireTool, isDoorTool, elements]);

  const handleDelete  = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedId(null);
    setValidation(null);
  }, []);

  const handleValidate  = useCallback(() => setValidation(validateCircuits(elements)), [elements]);
  const handleClear     = useCallback(() => {
    setElements([]);
    setSelectedId(null);
    setActiveTool(null);
    setValidation(null);
    setDrawState({ wireStart: null, roomStart: null, mousePos: { x: 0, y: 0 } });
  }, []);
  const handleExportSVG  = useCallback(() => { if (svgRef.current) downloadSVG(svgRef.current); }, []);
  const handleExportJSON = useCallback(() => downloadJSON(elements), [elements]);

  const handleLoadExample = useCallback(() => {
    handleClear();
    setElements([
      { id: generateId(), type: 'room',  x: 20,  y: 20,  w: 240, h: 200, label: 'Cocina'      },
      { id: generateId(), type: 'room',  x: 260, y: 20,  w: 220, h: 200, label: 'Dormitorio'  },
      { id: generateId(), type: 'room',  x: 20,  y: 220, w: 460, h: 200, label: 'Sala'        },
      { id: generateId(), type: 'panel', x: 40,  y: 40  },
      { id: generateId(), type: 'ceiling_light', x: 140, y: 120 },
      { id: generateId(), type: 'ceiling_light', x: 360, y: 120 },
      { id: generateId(), type: 'fan',           x: 240, y: 320 },
      { id: generateId(), type: 'ceiling_light', x: 140, y: 320 },
      { id: generateId(), type: 'ceiling_light', x: 400, y: 320 },
      { id: generateId(), type: 'switch',   x: 260, y: 60  },
      { id: generateId(), type: 'switch',   x: 260, y: 220 },
      { id: generateId(), type: 'dimmer',   x: 60,  y: 220 },
      { id: generateId(), type: 'outlet',   x: 100, y: 180 },
      { id: generateId(), type: 'outlet',   x: 200, y: 180 },
      { id: generateId(), type: 'outlet',   x: 380, y: 180 },
      { id: generateId(), type: 'outlet',   x: 100, y: 380 },
      { id: generateId(), type: 'outlet',   x: 380, y: 380 },
      // Doors on walls — bottom wall of room (y+h = 220), top wall of sala
      { id: generateId(), type: 'door', x: 160, y: 220, wallSide: 'bottom' } as unknown as PointElement,
      { id: generateId(), type: 'door', x: 360, y: 220, wallSide: 'bottom' } as unknown as PointElement,
      { id: generateId(), type: 'wire_hot',     x1: 40, y1: 40,  x2: 260, y2: 60  },
      { id: generateId(), type: 'wire_neutral', x1: 40, y1: 40,  x2: 140, y2: 120 },
      { id: generateId(), type: 'wire_ground',  x1: 40, y1: 40,  x2: 100, y2: 180 },
      { id: generateId(), type: 'circuit', x1: 260, y1: 60,  x2: 140, y2: 120 },
      { id: generateId(), type: 'circuit', x1: 260, y1: 60,  x2: 360, y2: 120 },
      { id: generateId(), type: 'circuit', x1: 60,  y1: 220, x2: 240, y2: 320 },
    ] as FloorElement[]);
  }, [handleClear]);

  // ── Derived stats ──
  const stats = {
    rooms:    elements.filter((e) => e.type === 'room').length,
    lights:   elements.filter((e) => isPointElement(e) && LIGHT_TYPES.has(e.type)).length,
    outlets:  elements.filter((e) => e.type === 'outlet').length,
    switches: elements.filter((e) => isPointElement(e) && SWITCH_TYPES.has(e.type)).length,
    panels:   elements.filter((e) => e.type === 'panel').length,
    wires:    elements.filter(isWireElement).length,
  };
  const circuitActive = stats.panels > 0 && stats.wires > 0;

  const { mousePos, wireStart, roomStart } = drawState;
  const selectedEl = selectedId ? elements.find((e) => e.id === selectedId) : null;

  const rooms = elements.filter(isRoomElement) as RoomElement[];

  // Live door wall detection for preview
  const doorPreview = isDoorTool
    ? detectWallSide(mousePos, rooms)
    : null;

  const statusText = !activeTool
    ? 'Modo: Seleccionar'
    : isRoomTool && !roomStart   ? 'Habitación — clic en primer punto'
    : isRoomTool && roomStart    ? 'Clic en esquina opuesta'
    : isDoorTool                 ? 'Puerta — clic en una pared'
    : isWireTool && !wireStart   ? `${activeTool} — clic en punto inicial`
    : isWireTool && wireStart    ? 'Clic en punto final del cable'
    : `${activeTool} — clic para colocar`;

  return (
    <div style={S.app}>
      {/* ── SIDEBAR ── */}
      <aside style={S.sidebar}>
        <div style={S.sidebarHeader}>
          <div style={{ fontSize: 9, color: THEME.accent, letterSpacing: '0.15em', marginBottom: 2 }}>
            ⚡ PLANO ELÉCTRICO
          </div>
          <div style={{ fontSize: 7, color: THEME.textDim }}>IEC 60364 · Residencial</div>
        </div>

        {/* Select */}
        <div style={{ padding: '6px 6px 0' }}>
          <button
            onClick={() => { setActiveTool(null); setDrawState((s) => ({ ...s, wireStart: null, roomStart: null })); }}
            style={{ ...S.toolBtn(!activeTool), paddingLeft: 10 }}
          >
            <div style={S.toolIcon}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M2 1l10 6-5 1-3 5z" fill="none" stroke={!activeTool ? THEME.accent : '#475569'} strokeWidth="1.2"/>
              </svg>
            </div>
            <span style={{ fontSize: 10, color: !activeTool ? THEME.accent : THEME.text }}>Seleccionar</span>
          </button>
        </div>

        {/* Tool categories */}
        {TOOL_CATEGORIES_LOCAL.map((cat) => (
          <div key={cat.label}>
            <div style={S.catLabel}>{cat.label}</div>
            {cat.tools.map((tool) => {
              const isActive = activeTool === tool.type;
              const isWire   = WIRE_TYPES.has(tool.type);
              const wireCol  = WIRE_COLORS[tool.type];
              return (
                <button
                  key={tool.type}
                  onClick={() => { setActiveTool(tool.type); setDrawState((s) => ({ ...s, wireStart: null, roomStart: null })); }}
                  title={tool.shortLabel}
                  style={S.toolBtn(isActive)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isActive ? 'rgba(74,222,128,0.1)' : 'rgba(74,222,128,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isActive ? 'rgba(74,222,128,0.1)' : 'transparent')}
                >
                  <div style={S.toolIcon}>
                    {isWire ? (
                      <div style={{ width: 20, height: 2, background: wireCol, borderRadius: 1 }} />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 20 20">
                        {tool.type === 'room'          && <rect x="2" y="2" width="16" height="16" rx="1" fill="none" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1.2"/>}
                        {tool.type === 'door'          && <><line x1="10" y1="3" x2="10" y2="17" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1.5"/><path d="M10 3 A 14 14 0 0 0 24 17" fill="none" stroke="#378ADD" strokeWidth="0.8" strokeDasharray="2,1"/></>}
                        {tool.type === 'ceiling_light' && <><circle cx="10" cy="10" r="7" fill="none" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1.2"/><circle cx="10" cy="10" r="3" fill="none" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1.2"/></>}
                        {tool.type === 'recessed'      && <><rect x="4" y="4" width="12" height="12" rx="1" fill="none" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1.2"/><text x="10" y="13" textAnchor="middle" fontSize="5" fill={isActive?THEME.accent:'#475569'} fontFamily="monospace">RC</text></>}
                        {tool.type === 'wall_light'    && <><line x1="4" y1="10" x2="8" y2="10" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1.5"/><circle cx="12" cy="10" r="4" fill="none" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1.2"/></>}
                        {tool.type === 'fan'           && <><circle cx="10" cy="10" r="2" fill={isActive?THEME.accent:'#475569'}/><ellipse cx="10" cy="5" rx="2" ry="4" fill="none" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1"/><ellipse cx="10" cy="5" rx="2" ry="4" fill="none" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1" transform="rotate(90 10 10)"/></>}
                        {tool.type === 'outlet'        && <><circle cx="10" cy="10" r="6" fill="none" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1.2"/><line x1="8" y1="7" x2="8" y2="13" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1.5"/><line x1="12" y1="7" x2="12" y2="13" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1.5"/></>}
                        {tool.type === 'switch'        && <><rect x="6" y="3" width="8" height="14" rx="2" fill="none" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1.2"/><text x="10" y="12" textAnchor="middle" fontSize="5" fill={isActive?THEME.accent:'#475569'} fontFamily="monospace">S</text></>}
                        {tool.type === 'dimmer'        && <><rect x="6" y="3" width="8" height="14" rx="2" fill="none" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1.2"/><text x="10" y="12" textAnchor="middle" fontSize="5" fill={isActive?THEME.accent:'#475569'} fontFamily="monospace">D</text></>}
                        {tool.type === 'panel'         && <><rect x="5" y="2" width="10" height="16" rx="1" fill="none" stroke={isActive?THEME.accent:'#475569'} strokeWidth="1.5"/><line x1="7" y1="7" x2="13" y2="7" stroke="#334155" strokeWidth="0.8"/><line x1="7" y1="10" x2="13" y2="10" stroke="#334155" strokeWidth="0.8"/><line x1="7" y1="13" x2="13" y2="13" stroke="#334155" strokeWidth="0.8"/></>}
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: isActive ? THEME.accent : THEME.text }}>{tool.shortLabel}</span>
                </button>
              );
            })}
          </div>
        ))}

        {/* Wire legend */}
        <div style={{ marginTop: 'auto', padding: '10px 12px', borderTop: `1px solid ${THEME.border}` }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([['#D85A30','Vivo'],['#888780','Neutro'],['#639922','Tierra'],['#378ADD','Circuito']] as [string,string][]).map(([color, label]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, color: THEME.textMid }}>
                <span style={{ width: 14, height: 2, background: color, borderRadius: 1, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={S.main}>
        {/* Toolbar */}
        <div style={S.toolbar}>
          <button onClick={handleLoadExample} style={S.tbBtn}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.accent; (e.currentTarget as HTMLButtonElement).style.color = THEME.accent; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.border; (e.currentTarget as HTMLButtonElement).style.color = THEME.textMid; }}>
            📋 Ejemplo
          </button>
          <button onClick={handleValidate} style={S.tbBtn}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.accent; (e.currentTarget as HTMLButtonElement).style.color = THEME.accent; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.border; (e.currentTarget as HTMLButtonElement).style.color = THEME.textMid; }}>
            ✓ Validar
          </button>
          <button onClick={handleExportSVG} style={S.tbBtn}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.accent; (e.currentTarget as HTMLButtonElement).style.color = THEME.accent; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.border; (e.currentTarget as HTMLButtonElement).style.color = THEME.textMid; }}>
            ⬇ SVG
          </button>
          <button onClick={handleExportJSON} style={S.tbBtn}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.accent; (e.currentTarget as HTMLButtonElement).style.color = THEME.accent; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.border; (e.currentTarget as HTMLButtonElement).style.color = THEME.textMid; }}>
            ⬇ JSON
          </button>

          <div style={{ flex: 1 }} />

          <span style={{ fontSize: 9, color: THEME.textDim, background: '#0f172a', padding: '2px 8px', borderRadius: 10, border: `1px solid ${THEME.border}`, fontFamily: 'monospace' }}>
            {elements.length} elem.
          </span>

          {selectedId && (
            <button onClick={() => handleDelete(selectedId)} style={{ ...S.tbBtn, borderColor: '#7f1d1d', color: '#ef4444' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#7f1d1d'; }}>
              ✕ Eliminar
            </button>
          )}
          <button onClick={handleClear} style={{ ...S.tbBtn, borderColor: '#7f1d1d', color: '#6b7280' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#7f1d1d'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}>
            Nuevo
          </button>
        </div>

        {/* Validation bar */}
        {validation && (
          <div style={{
            padding: '5px 14px', fontSize: 10, display: 'flex', gap: 10, flexWrap: 'wrap',
            background: validation.isValid ? 'rgba(74,222,128,0.06)' : 'rgba(239,68,68,0.06)',
            color: validation.isValid ? THEME.accent : '#ef4444',
            borderBottom: `1px solid ${validation.isValid ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`,
            fontFamily: "'Courier New', monospace",
            flexShrink: 0,
          }}>
            {validation.issues.map((issue, i) => (
              <span key={i}>
                {issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : '✓'} {issue.message}
              </span>
            ))}
          </div>
        )}

        {/* ── CANVAS — fills remaining space, NO internal scroll ── */}
        <div
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          style={{
            flex: 1,
            overflow: 'hidden',   // NO scrollbar
            position: 'relative',
            cursor: activeTool ? 'crosshair' : 'default',
            background: THEME.bg,
          }}
        >
          {/* Circuit status badge */}
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 5, zIndex: 10, pointerEvents: 'none' }}>
            <div style={{
              background: circuitActive ? 'rgba(74,222,128,0.1)' : 'rgba(100,116,139,0.08)',
              border: `1px solid ${circuitActive ? 'rgba(74,222,128,0.35)' : THEME.border}`,
              color: circuitActive ? THEME.accent : '#4b5563',
              fontSize: 9, padding: '3px 10px', borderRadius: 5,
              display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
                background: circuitActive ? THEME.accent : THEME.textDim,
                ...(circuitActive ? { animation: 'hsBlink 1s infinite' } : {}),
              }} />
              {circuitActive ? 'CIRCUITO ACTIVO' : 'CIRCUITO ABIERTO'}
            </div>
            {((isWireTool && wireStart) || (isRoomTool && roomStart) || isDoorTool) ? (
              <div style={{
                background: 'rgba(74,222,128,0.08)', border: `1px solid rgba(74,222,128,0.25)`,
                color: THEME.accent, fontSize: 9, padding: '3px 10px', borderRadius: 5,
                fontFamily: 'monospace', textAlign: 'center',
              }}>
                {isWireTool   ? 'Clic en punto final — ESC cancela'
                 : isRoomTool ? 'Clic en esquina opuesta'
                 :              'Clic en una pared'}
              </div>
            ) : null}
          </div>

          {/* SVG fills the measured container exactly */}
          <svg
            ref={svgRef}
            xmlns="http://www.w3.org/2000/svg"
            width={canvasSize.w}
            height={canvasSize.h}
            style={{ display: 'block' }}
          >
            <defs>
              <pattern id="dotGrid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                <circle cx="0" cy="0" r="0.7" fill="#1e293b" />
              </pattern>
              <filter id="glowGreen">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="glowWire">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <marker id="arrowCircuit" markerWidth={6} markerHeight={4} refX={6} refY={2} orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#378ADD" />
              </marker>
            </defs>

            {/* Dot grid */}
            <rect width={canvasSize.w} height={canvasSize.h} fill="url(#dotGrid)" />

            {/* Empty state */}
            {elements.length === 0 && (
              <g style={{ pointerEvents: 'none' }}>
                <circle cx={canvasSize.w / 2} cy={canvasSize.h / 2} r={48} fill="none" stroke={THEME.border} strokeWidth={1.5} strokeDasharray="6,4" />
                <text x={canvasSize.w / 2} y={canvasSize.h / 2 - 4} textAnchor="middle" fontSize={28} fill={THEME.border} fontFamily="monospace">⚡</text>
                <text x={canvasSize.w / 2} y={canvasSize.h / 2 + 30} textAnchor="middle" fontSize={11} fill={THEME.textDim} fontFamily="monospace">
                  Selecciona una herramienta y dibuja
                </text>
              </g>
            )}

            {/* Rooms */}
            {rooms.map((room) => {
              const isSel = selectedId === room.id;
              return (
                <g key={room.id} data-elid={room.id} style={{ cursor: 'pointer' }}>
                  {isSel && (
                    <rect
                      x={room.x - 4} y={room.y - 4}
                      width={room.w + 8} height={room.h + 8}
                      rx={4} fill="none"
                      stroke="rgba(74,222,128,0.2)" strokeWidth={1}
                      filter="url(#glowGreen)"
                    />
                  )}
                  <rect
                    x={room.x} y={room.y} width={room.w} height={room.h}
                    fill={isSel ? 'rgba(74,222,128,0.04)' : 'rgba(30,41,59,0.4)'}
                    stroke={isSel ? THEME.selected : '#1e3a5f'}
                    strokeWidth={isSel ? 2 : 1.5}
                    rx={2}
                  />
                  <text
                    x={room.x + room.w / 2} y={room.y + room.h / 2}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={11}
                    fill={isSel ? THEME.accent : THEME.textDim}
                    fontFamily="'Courier New', monospace"
                  >
                    {room.label}
                  </text>
                </g>
              );
            })}

            {/* Wires */}
            {elements.filter(isWireElement).map((wire) => {
              const isSel  = selectedId === wire.id;
              const col    = isSel ? '#ffffff' : WIRE_COLORS[wire.type] ?? '#888';
              const glowCol = WIRE_GLOW_COLORS[wire.type];
              const sw     = isSel ? (WIRE_WIDTHS[wire.type] + 1.5) : WIRE_WIDTHS[wire.type];
              const isCirc = wire.type === 'circuit';
              return (
                <g key={wire.id} data-elid={wire.id} style={{ cursor: 'pointer' }}>
                  <line x1={wire.x1} y1={wire.y1} x2={wire.x2} y2={wire.y2} stroke={glowCol} strokeWidth={sw + 6} strokeLinecap="round" filter="url(#glowWire)" />
                  <line x1={wire.x1} y1={wire.y1} x2={wire.x2} y2={wire.y2} stroke={col} strokeWidth={sw} strokeLinecap="round" markerEnd={isCirc ? 'url(#arrowCircuit)' : undefined} />
                  <circle cx={wire.x1} cy={wire.y1} r={2.5} fill={col} opacity={0.6} />
                  <circle cx={wire.x2} cy={wire.y2} r={2.5} fill={col} opacity={0.6} />
                </g>
              );
            })}

            {/* Doors — architectural style (rendered above rooms so gap is visible) */}
            {elements.filter(isPointElement).filter((e) => e.type === 'door').map((el) => (
              <DoorOnWall
                key={el.id}
                el={el as any}
                selected={selectedId === el.id}
                rooms={rooms}
              />
            ))}

            {/* All other point elements */}
            {elements.filter(isPointElement).filter((e) => e.type !== 'door').map((el) => {
              const Symbol = SYMBOL_MAP[el.type];
              if (!Symbol) return null;
              const isSel = selectedId === el.id;
              return (
                <g key={el.id} data-elid={el.id} style={{ cursor: 'pointer' }}>
                  {isSel && (
                    <circle cx={el.x} cy={el.y} r={20} fill="rgba(74,222,128,0.08)" filter="url(#glowGreen)" />
                  )}
                  <Symbol x={el.x} y={el.y} selected={isSel} />
                </g>
              );
            })}

            {/* Room preview */}
            {isRoomTool && roomStart && (
              <rect
                x={Math.min(roomStart.x, mousePos.x)} y={Math.min(roomStart.y, mousePos.y)}
                width={Math.abs(mousePos.x - roomStart.x)} height={Math.abs(mousePos.y - roomStart.y)}
                fill="rgba(74,222,128,0.03)" stroke={THEME.accent} strokeWidth={1.5} strokeDasharray="5,3" rx={2}
              />
            )}

            {/* Door preview on wall */}
            {isDoorTool && doorPreview && (
              <g opacity={0.6}>
                <DoorOnWall
                  el={{ id: '__preview', type: 'door', x: doorPreview.snapped.x, y: doorPreview.snapped.y, wallSide: doorPreview.side } as any}
                  selected={false}
                  rooms={rooms}
                />
              </g>
            )}

            {/* Wire preview */}
            {isWireTool && wireStart && (
              <g>
                <line x1={wireStart.x} y1={wireStart.y} x2={mousePos.x} y2={mousePos.y} stroke={WIRE_COLORS[activeTool!] ?? '#888'} strokeWidth={1.5} strokeDasharray="6,3" opacity={0.4} />
                <circle cx={wireStart.x} cy={wireStart.y} r={4} fill={WIRE_COLORS[activeTool!]} opacity={0.8} />
              </g>
            )}

            {/* Cursor dot */}
            {activeTool && (
              <circle cx={mousePos.x} cy={mousePos.y} r={3.5} fill={THEME.accent} opacity={0.7} style={{ pointerEvents: 'none' }} />
            )}
          </svg>

          <style>{`@keyframes hsBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
        </div>

        {/* Status bar */}
        <div style={{
          padding: '4px 12px', fontSize: 9, color: THEME.textDim,
          background: THEME.bgPanel, borderTop: `1px solid ${THEME.border}`,
          display: 'flex', gap: 12, fontFamily: 'monospace', flexShrink: 0,
        }}>
          <span>{statusText}</span>
          <span style={{ flex: 1 }} />
          <span>x: {mousePos.x}  y: {mousePos.y}</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <aside style={S.rightPanel}>
        <div style={S.rpSection}>
          <div style={S.rpTitle}>Estado del Plano</div>
          {[
            { label: 'Habitaciones',   value: stats.rooms,    color: '#60a5fa' },
            { label: 'Luminarias',     value: stats.lights,   color: '#fbbf24' },
            { label: 'Tomacorrientes', value: stats.outlets,  color: '#f472b6' },
            { label: 'Interruptores',  value: stats.switches, color: '#a78bfa' },
            { label: 'Panel(es)',      value: stats.panels,   color: THEME.accent },
            { label: 'Cables',         value: stats.wires,    color: THEME.text  },
          ].map(({ label, value, color }) => (
            <div key={label} style={S.statRow}>
              <span style={{ fontSize: 9, color: THEME.textDim }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 'bold', color }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={S.rpSection}>
          <div style={S.rpTitle}>Fórmulas NEC/IEC</div>
          {['P = V · I', 'I = P / V', 'R = V / I', 'Circ. 15A = 1 440 W', 'Circ. 20A = 1 920 W'].map((f) => (
            <div key={f} style={{ fontSize: 9, color: THEME.textDim, fontFamily: "'Courier New', monospace", padding: '2px 0' }}>
              {f}
            </div>
          ))}
        </div>

        {selectedEl && (
          <div style={S.rpSection}>
            <div style={S.rpTitle}>Elemento</div>
            <div style={{ fontSize: 9, color: THEME.accent, background: 'rgba(74,222,128,0.08)', padding: '3px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 8, fontFamily: 'monospace' }}>
              {selectedEl.type.toUpperCase()}
            </div>
            <div style={{ fontSize: 9, color: THEME.textDim, lineHeight: 1.8 }}>
              <div>ID: <span style={{ color: THEME.text }}>{selectedEl.id}</span></div>
              {isPointElement(selectedEl) && <>
                <div>X: <span style={{ color: '#60a5fa' }}>{selectedEl.x}</span></div>
                <div>Y: <span style={{ color: '#60a5fa' }}>{selectedEl.y}</span></div>
                {(selectedEl as any).wallSide && <div>Pared: <span style={{ color: '#fbbf24' }}>{(selectedEl as any).wallSide}</span></div>}
              </>}
              {isWireElement(selectedEl) && <>
                <div>Desde: <span style={{ color: '#60a5fa' }}>({selectedEl.x1}, {selectedEl.y1})</span></div>
                <div>Hasta: <span style={{ color: '#60a5fa' }}>({selectedEl.x2}, {selectedEl.y2})</span></div>
              </>}
              {isRoomElement(selectedEl) && <>
                <div>Nombre: <span style={{ color: THEME.text }}>{selectedEl.label}</span></div>
                <div>W × H: <span style={{ color: '#60a5fa' }}>{selectedEl.w} × {selectedEl.h}</span></div>
              </>}
            </div>
            <button
              onClick={() => handleDelete(selectedId!)}
              style={{ width: '100%', marginTop: 10, background: 'transparent', border: `1px solid ${THEME.border}`, color: THEME.textDim, fontSize: 9, padding: '5px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', transition: 'all 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.border; (e.currentTarget as HTMLButtonElement).style.color = THEME.textDim; }}
            >
              ELIMINAR [Del]
            </button>
          </div>
        )}

        {!selectedEl && (
          <div style={{ padding: '12px 14px', fontSize: 9, color: THEME.textDim, lineHeight: 1.7 }}>
            Selecciona un elemento para ver sus propiedades
          </div>
        )}

        <div style={{ marginTop: 'auto', padding: '10px 14px', borderTop: `1px solid ${THEME.border}` }}>
          <button
            onClick={handleClear}
            style={{ width: '100%', background: 'transparent', border: `1px solid ${THEME.border}`, color: THEME.textDim, fontSize: 9, fontFamily: 'monospace', padding: '6px', borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.border; (e.currentTarget as HTMLButtonElement).style.color = THEME.textDim; }}
          >
            LIMPIAR LIENZO
          </button>
        </div>
      </aside>

      {/* ── ROOM LABEL MODAL ── */}
      {roomLabelModal?.show && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: '#0d1626', border: `1px solid ${THEME.borderMid}`,
            borderRadius: 8, padding: '20px 24px', minWidth: 300,
          }}>
            <p style={{ fontSize: 11, color: THEME.accent, letterSpacing: '0.1em', marginBottom: 14, fontFamily: 'monospace' }}>
              NOMBRE DE LA HABITACIÓN
            </p>
            <input
              autoFocus type="text"
              placeholder="Ej: Sala, Cocina, Dormitorio..."
              value={roomLabelModal.value}
              onChange={(e) => setRoomLabelModal((s) => s ? { ...s, value: e.target.value } : s)}
              onKeyDown={(e) => {
                if (e.key === 'Enter')  confirmRoomLabel();
                if (e.key === 'Escape') cancelRoomLabel();
              }}
              style={{
                width: '100%', marginBottom: 10, background: '#0a0f1e',
                border: `1px solid ${THEME.borderMid}`, borderRadius: 4,
                color: THEME.text, fontSize: 12, padding: '6px 10px',
                fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {ROOM_LABEL_SUGGESTIONS.slice(0, 7).map((s) => (
                <button
                  key={s}
                  onClick={() => setRoomLabelModal((st) => st ? { ...st, value: s } : st)}
                  style={{ fontSize: 9, padding: '3px 8px', border: `1px solid ${THEME.border}`, borderRadius: 100, background: 'transparent', cursor: 'pointer', color: THEME.textMid, fontFamily: 'monospace', transition: 'all 0.12s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.accent; (e.currentTarget as HTMLButtonElement).style.color = THEME.accent; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.border; (e.currentTarget as HTMLButtonElement).style.color = THEME.textMid; }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={cancelRoomLabel} style={{ ...S.tbBtn, fontSize: 10 }}>Cancelar</button>
              <button onClick={confirmRoomLabel} style={{ ...S.tbBtn, borderColor: 'rgba(74,222,128,0.4)', color: THEME.accent, fontSize: 10 }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function confirmRoomLabel() {
    if (!roomLabelModal) return;
    const label = roomLabelModal.value.trim() || 'Habitación';
    setElements((prev) => prev.map((el) => el.id === roomLabelModal.id ? { ...el, label } as RoomElement : el));
    setRoomLabelModal(null);
  }

  function cancelRoomLabel() {
    if (!roomLabelModal) return;
    setElements((prev) => prev.filter((el) => el.id !== roomLabelModal.id));
    setRoomLabelModal(null);
  }
}