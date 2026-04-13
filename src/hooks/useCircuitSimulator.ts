"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { CompType, Component, Port, Wire } from "@/types/types";
import { analyzeCircuit } from "@/lib/circuit/analyzeCircuit";
import { COMP_W, COMP_H, GRID } from "@/lib/circuit/constants";
import { PALETTE, PaletteItem } from "@/components/electrical/PalettePanel";

// ─── ID counters ──────────────────────────────────────────────────────────────
let idCtr = 1;
const uid = () => `c${idCtr++}`;
const wid = () => `w${idCtr++}`;
const snap = (v: number) => Math.round(v / GRID) * GRID;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface WirePoint { x: number; y: number }

// Only voltage-source component types may have their voltage edited
const VOLTAGE_SOURCE_TYPES = new Set<CompType>(["battery", "source"]);

// ─── Port definitions ─────────────────────────────────────────────────────────
export function getPorts(type: CompType): Port[] {
  return [
    { id: "left",  dx: -COMP_W / 2, dy: 0, label: "−" },
    { id: "right", dx:  COMP_W / 2, dy: 0, label: "+" },
  ];
}

// ─── Wire geometry helpers ────────────────────────────────────────────────────

/** Builds an SVG path `d` string from all wire points (ports + intermediates). */
export function buildWirePath(
  from: WirePoint,
  intermediates: WirePoint[],
  to: WirePoint
): string {
  const pts = [from, ...intermediates, to];
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

/** Point-to-segment distance (used for node insertion). */
function distToSegment(p: WirePoint, a: WirePoint, b: WirePoint): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Returns true when `point` is within threshold pixels of any wire segment. */
export const WIRE_HIT_PX = 8;
export function isNearWire(
  wire: Wire,
  from: WirePoint,
  to: WirePoint,
  point: WirePoint
): boolean {
  const pts = [from, ...(wire.points ?? []), to];
  for (let i = 0; i < pts.length - 1; i++) {
    if (distToSegment(point, pts[i], pts[i + 1]) < WIRE_HIT_PX) return true;
  }
  return false;
}

/** Inserts a new intermediate node into the closest segment of the wire. */
export function insertNodeAtPoint(
  wire: Wire,
  from: WirePoint,
  to: WirePoint,
  click: WirePoint
): WirePoint[] {
  const pts = [from, ...(wire.points ?? []), to];
  let bestSeg = 0, bestDist = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distToSegment(click, pts[i], pts[i + 1]);
    if (d < bestDist) { bestDist = d; bestSeg = i; }
  }
  // bestSeg is an index into pts; intermediate nodes start at pts[1]
  const newPoints = [...(wire.points ?? [])];
  // insert at position (bestSeg) inside the intermediates array
  // pts[0] is `from`, so intermediates[0] === pts[1]; insertIdx = bestSeg
  newPoints.splice(bestSeg, 0, click);
  return newPoints;
}

// ─── Hook options ─────────────────────────────────────────────────────────────
interface UseCircuitSimulatorOptions {
  palette?: PaletteItem[];
}

// ─── Dragging node state ──────────────────────────────────────────────────────
interface DraggingNode {
  wireId: string;
  nodeIndex: number;
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useCircuitSimulator(options?: UseCircuitSimulatorOptions) {
  const palette = options?.palette ?? PALETTE;

  // ── Core state ──────────────────────────────────────────────────────────────
  const [components, setComponents] = useState<Component[]>([]);
  const [wires, setWires]           = useState<Wire[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingPort, setPendingPort] = useState<{ compId: string; portId: string } | null>(null);
  const [mousePos, setMousePos]       = useState<WirePoint>({ x: 0, y: 0 });
  const [draggingNode, setDraggingNode] = useState<DraggingNode | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // ── Port position ────────────────────────────────────────────────────────────
  const portPos = useCallback((compId: string, portId: string): WirePoint => {
    const comp = components.find(c => c.id === compId);
    if (!comp) return { x: 0, y: 0 };
    const port = getPorts(comp.type).find(p => p.id === portId);
    if (!port) return { x: 0, y: 0 };
    return { x: comp.x + port.dx, y: comp.y + port.dy };
  }, [components]);

  // ── Derived: pending wire start ──────────────────────────────────────────────
  const pendingStart = pendingPort
    ? portPos(pendingPort.compId, pendingPort.portId)
    : null;

  // ── Circuit analysis ─────────────────────────────────────────────────────────
  const analysis = useMemo(
    () => analyzeCircuit(components, wires),
    [components, wires]
  );

  // ── Selected component ────────────────────────────────────────────────────────
  const selectedComp = components.find(c => c.id === selectedId) ?? null;

  // ── Canvas drop ──────────────────────────────────────────────────────────────
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("compType") as CompType;
    if (!type || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = snap(e.clientX - rect.left);
    const y = snap(e.clientY - rect.top);

    const paletteItem = palette.find(p => p.type === type);
    if (!paletteItem) return;

    setComponents(prev => [
      ...prev,
      { id: uid(), type, x, y, label: paletteItem.label, ...paletteItem.defaults },
    ]);
  }, [palette]);

  // ── Mouse move: handles both wire preview and node dragging ──────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos: WirePoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // Always track mouse for wire preview
    setMousePos(pos);

    // Move intermediate node if dragging
    if (draggingNode) {
      const snapped = { x: snap(pos.x), y: snap(pos.y) };
      setWires(prev => prev.map(w => {
        if (w.id !== draggingNode.wireId) return w;
        const pts = [...(w.points ?? [])];
        pts[draggingNode.nodeIndex] = snapped;
        return { ...w, points: pts };
      }));
    }
  }, [draggingNode]);

  // ── Mouse up: stop dragging node ─────────────────────────────────────────────
  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);

  // ── Canvas click: cancel pending port / deselect ──────────────────────────────
  const handleCanvasClick = useCallback(() => {
    setPendingPort(null);
    setSelectedId(null);
  }, []);

  // ── Port click: start or complete a wire connection ───────────────────────────
  const handlePortClick = useCallback((compId: string, portId: string) => {
    if (!pendingPort) {
      setPendingPort({ compId, portId });
      return;
    }

    // Prevent self-connection
    if (pendingPort.compId === compId && pendingPort.portId === portId) {
      setPendingPort(null);
      return;
    }

    // Prevent duplicate wire on the same pair of ports
    const duplicate = wires.some(
      w =>
        (w.fromCompId === pendingPort.compId && w.fromPortId === pendingPort.portId &&
         w.toCompId   === compId             && w.toPortId   === portId) ||
        (w.fromCompId === compId             && w.fromPortId === portId &&
         w.toCompId   === pendingPort.compId && w.toPortId   === pendingPort.portId)
    );

    if (!duplicate) {
      setWires(prev => [
      ...prev,
      {
        id: wid(),
        fromCompId: pendingPort.compId,
        fromPortId: pendingPort.portId,
        toCompId: compId,
        toPortId: portId,
        points: [],
        draggingNodeIndex: null, // 👈 faltaba esto
      },
    ]);
    }

    setPendingPort(null);
  }, [pendingPort, wires]);

  // ── Component mouse-down: drag to reposition ─────────────────────────────────
  const handleCompMouseDown = useCallback((compId: string, e: React.MouseEvent) => {
    if (!containerRef.current) return;
    e.stopPropagation();
    setSelectedId(compId);

    const rect    = containerRef.current.getBoundingClientRect();
    const startX  = e.clientX - rect.left;
    const startY  = e.clientY - rect.top;
    const comp    = components.find(c => c.id === compId);
    if (!comp) return;

    const origX = comp.x, origY = comp.y;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - rect.left - startX;
      const dy = ev.clientY - rect.top  - startY;
      setComponents(prev =>
        prev.map(c =>
          c.id === compId
            ? { ...c, x: snap(origX + dx), y: snap(origY + dy) }
            : c
        )
      );
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [components]);

  // ── Wire node: insert intermediate point on click ────────────────────────────
  const insertWireNode = useCallback((wireId: string, clickPoint: WirePoint) => {
    setWires(prev => prev.map(w => {
      if (w.id !== wireId) return w;
      const from = portPos(w.fromCompId, w.fromPortId);
      const to   = portPos(w.toCompId,   w.toPortId);
      return { ...w, points: insertNodeAtPoint(w, from, to, clickPoint) };
    }));
  }, [portPos]);

  // ── Wire node: begin dragging an intermediate node ────────────────────────────
  const startDragWireNode = useCallback((wireId: string, nodeIndex: number) => {
    setDraggingNode({ wireId, nodeIndex });
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const deleteComponent = useCallback((id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    setWires(prev => prev.filter(w => w.fromCompId !== id && w.toCompId !== id));
    setSelectedId(null);
  }, []);

  const deleteWire = useCallback((id: string) => {
    setWires(prev => prev.filter(w => w.id !== id));
  }, []);

  // ── Toggle (switch / breaker) ─────────────────────────────────────────────────
  const toggleComp = useCallback((id: string) => {
    setComponents(prev =>
      prev.map(c => c.id === id ? { ...c, isOn: !c.isOn } : c)
    );
  }, []);

  // ── Update component properties ────────────────────────────────────────────────
  // Voltage may ONLY be updated on voltage-source components.
  const updateComp = useCallback((id: string, patch: Partial<Component>) => {
    setComponents(prev =>
      prev.map(c => {
        if (c.id !== id) return c;

        // Block voltage edits on non-sources
        if ("voltage" in patch && !VOLTAGE_SOURCE_TYPES.has(c.type)) {
          const { voltage: _ignored, ...safePatch } = patch as any;
          return { ...c, ...safePatch };
        }

        return { ...c, ...patch };
      })
    );
  }, []);

  // ── Clear all ─────────────────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    setComponents([]);
    setWires([]);
    setSelectedId(null);
    setPendingPort(null);
    setDraggingNode(null);
  }, []);

  // ── Public API ────────────────────────────────────────────────────────────────
  return {
    // State
    components,
    wires,
    selectedId,
    selectedComp,
    pendingPort,
    pendingStart,
    mousePos,
    analysis,
    draggingNode,
    // Refs
    containerRef,
    // Helpers
    portPos,
    getPorts,
    buildWirePath,
    // Handlers
    handleCanvasDrop,
    handleMouseMove,
    handleMouseUp,
    handleCanvasClick,
    handlePortClick,
    handleCompMouseDown,
    // Wire node editing
    insertWireNode,
    startDragWireNode,
    // CRUD
    deleteComponent,
    deleteWire,
    toggleComp,
    updateComp,
    clearAll,
  };
}