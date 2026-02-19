// src/hooks/useCircuitSimulator

"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { CompType, Component, Port, Wire } from "@/types/types";
import { analyzeCircuit } from "@/lib/circuit/analyzeCircuit";
import { COMP_W, COMP_H, GRID } from "@/lib/circuit/constants";
import { PALETTE } from "@/components/electrical/PalettePanel";

let idCtr = 1;
const uid = () => `c${idCtr++}`;
const wid = () => `w${idCtr++}`;
const snap = (v: number) => Math.round(v / GRID) * GRID;

export function getPorts(type: CompType): Port[] {
  return [
    { id: "left", dx: -COMP_W / 2, dy: 0, label: "−" },
    { id: "right", dx: COMP_W / 2, dy: 0, label: "+" },
  ];
}


export function useCircuitSimulator() {
  
  const [components, setComponents] = useState<Component[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingPort, setPendingPort] = useState<{ compId: string; portId: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const portPos = useCallback((compId: string, portId: string) => {
    const comp = components.find(c => c.id === compId);
    if (!comp) return { x: 0, y: 0 };
    const port = getPorts(comp.type).find(p => p.id === portId);
    if (!port) return { x: 0, y: 0 };
    return { x: comp.x + port.dx, y: comp.y + port.dy };
  }, [components]);

  const containerRef = useRef<HTMLDivElement>(null);
// ── Pending wire start position ───────────────────────────────────────────
  const pendingStart = pendingPort ? portPos(pendingPort.compId, pendingPort.portId) : null;

  const analysis = useMemo(
    () => analyzeCircuit(components, wires),
    [components, wires]
  );

  
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("compType") as CompType;
    if (!type || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = snap(e.clientX - rect.left);
    const y = snap(e.clientY - rect.top);

    const paletteItem = PALETTE.find(p => p.type === type);
    if (!paletteItem) return;

    setComponents(prev => [
      ...prev,
      {
        id: uid(),
        type,
        x,
        y,
        label: paletteItem.label,
        ...paletteItem.defaults,
      },
    ]);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!pendingPort || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [pendingPort]);

  const handleCanvasClick = useCallback(() => {
    setPendingPort(null);
    setSelectedId(null);
  }, []);

  const handlePortClick = useCallback((compId: string, portId: string) => {
    if (!pendingPort) {
      setPendingPort({ compId, portId });
    } else {
      if (pendingPort.compId !== compId) {
        setWires(prev => [
          ...prev,
          {
            id: wid(),
            fromCompId: pendingPort.compId,
            fromPortId: pendingPort.portId,
            toCompId: compId,
            toPortId: portId,
          },
        ]);
      }
      setPendingPort(null);
    }
  }, [pendingPort]);

  const handleCompMouseDown = useCallback((compId: string, e: React.MouseEvent) => {
    if (!containerRef.current) return;
    e.stopPropagation();
    setSelectedId(compId);

    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    const comp = components.find(c => c.id === compId);
    if (!comp) return;

    const origX = comp.x;
    const origY = comp.y;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - rect.left - startX;
      const dy = ev.clientY - rect.top - startY;

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

  const deleteComponent = useCallback((id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    setWires(prev => prev.filter(w => w.fromCompId !== id && w.toCompId !== id));
    setSelectedId(null);
  }, []);

  const deleteWire = useCallback((id: string) => {
    setWires(prev => prev.filter(w => w.id !== id));
  }, []);

  const toggleComp = useCallback((id: string) => {
    setComponents(prev =>
      prev.map(c => (c.id === id ? { ...c, isOn: !c.isOn } : c))
    );
  }, []);

  const updateComp = useCallback((id: string, updates: Partial<Component>) => {
    setComponents(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const clearAll = useCallback(() => {
    setComponents([]);
    setWires([]);
    setSelectedId(null);
    setPendingPort(null);
  }, []);

  const selectedComp = components.find(c => c.id === selectedId);

  return {
    components,
    wires,
    selectedId,
    selectedComp,
    pendingPort,
    pendingStart,
    mousePos,
    analysis,
    containerRef,
    portPos,
    handleCanvasDrop,
    handleMouseMove,
    handleCanvasClick,
    handlePortClick,
    handleCompMouseDown,
    deleteComponent,
    deleteWire,
    toggleComp,
    updateComp,
    clearAll,
    getPorts,
  };
}
