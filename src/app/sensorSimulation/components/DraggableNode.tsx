"use client";

import { useRef, useState } from "react";
import { AutomationNode, Mode, LampNode } from "../engine/types";

interface Props {
  node: AutomationNode;
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  onToggleSensor: (id: string) => void;
  onSetSelectorMode: (id: string, mode: Mode) => void;
  onBeginConnect: (id: string) => void;
  onFinishConnect: (id: string) => void;
  onSelect: (id: string) => void;
  isConnecting: boolean;
  isSelected: boolean;
}

function NodeIcon({ node }: { node: AutomationNode }) {
  switch (node.type) {
    case "sensor":
      return (
        <div className={`text-2xl transition-all ${node.motion ? "scale-110" : "opacity-60"}`}>
          {node.motion ? "📡" : "📡"}
        </div>
      );
    case "selector":
      return <div className="text-2xl">🔘</div>;
    case "contactor":
      return (
        <div className={`text-2xl ${node.coil ? "drop-shadow-[0_0_6px_#facc15]" : "opacity-60"}`}>
          ⚡
        </div>
      );
    case "timer":
      return (
        <div className="text-2xl relative">
          ⏱
          {node.remainingMs > 0 && (
            <span className="absolute -top-1 -right-3 text-[9px] font-mono bg-yellow-500 text-black px-0.5 rounded">
              {(node.remainingMs / 1000).toFixed(1)}
            </span>
          )}
        </div>
      );
    case "lamp":
      return (
        <div className={`text-2xl transition-all ${node.active ? "drop-shadow-[0_0_8px_#fde047]" : "opacity-40"}`}>
          💡
        </div>
      );
    case "motor":
      return (
        <div className={`text-2xl transition-all ${node.active ? "animate-spin" : "opacity-50"}`}>
          ⚙️
        </div>
      );
  }
}

function NodeLabel({ node }: { node: AutomationNode }) {
  switch (node.type) {
    case "sensor":
      return <span className={`text-[9px] font-mono ${node.motion ? "text-green-400" : "text-gray-500"}`}>{node.motion ? "MOTION" : "IDLE"}</span>;
    case "selector":
      return <span className={`text-[9px] font-mono ${node.mode !== "OFF" ? "text-green-400" : "text-gray-500"}`}>{node.mode}</span>;
    case "contactor":
      return <span className={`text-[9px] font-mono ${node.contactClosed ? "text-yellow-400" : "text-gray-500"}`}>{node.contactClosed ? "CLOSED" : "OPEN"}</span>;
    case "timer":
      return <span className={`text-[9px] font-mono ${node.output ? "text-green-400" : "text-gray-500"}`}>{node.output ? "ON" : "WAIT"}</span>;
    case "lamp":
      return (
        <span className={`text-[9px] font-mono ${node.active ? "text-yellow-300" : "text-gray-500"}`}>
          {node.active
            ? node.onRemainingMs > 0
              ? `${(node.onRemainingMs / 1000).toFixed(1)}s`
              : "ON"
            : node.onDurationMs > 0 ? `T:${node.onDurationMs / 1000}s` : "OFF"}
        </span>
      );
    case "motor":
      return <span className={`text-[9px] font-mono ${node.active ? "text-green-400" : "text-gray-500"}`}>{node.active ? "RUN" : "STOP"}</span>;
  }
}

export function DraggableNode({
  node,
  onMove,
  onRemove,
  onToggleSensor,
  onSetSelectorMode,
  onBeginConnect,
  onFinishConnect,
  onSelect,
  isConnecting,
  isSelected,
}: Props) {
  const dragStart = useRef<{ mx: number; my: number; nx: number; ny: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      nx: node.position.x,
      ny: node.position.y,
    };
    setDragging(true);

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = ev.clientX - dragStart.current.mx;
      const dy = ev.clientY - dragStart.current.my;
      onMove(node.id, dragStart.current.nx + dx, dragStart.current.ny + dy);
    };

    const onMouseUp = () => {
      setDragging(false);
      dragStart.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConnecting) {
      onFinishConnect(node.id);
      return;
    }
    // Interacciones específicas por tipo
    if (node.type === "sensor") {
      onToggleSensor(node.id);
    } else if (node.type === "selector") {
      const modes: Mode[] = ["OFF", "MANUAL", "AUTO"];
      const idx = modes.indexOf(node.mode);
      onSetSelectorMode(node.id, modes[(idx + 1) % modes.length]);
    } else if (node.type === "lamp") {
      onSelect(node.id);
    }
  };

  const isActive =
    (node.type === "lamp" && node.active) ||
    (node.type === "motor" && node.active) ||
    (node.type === "sensor" && node.motion) ||
    (node.type === "contactor" && node.contactClosed) ||
    (node.type === "timer" && node.output) ||
    (node.type === "selector" && node.mode !== "OFF");

  return (
    <div
      className={`absolute select-none flex flex-col items-center justify-center rounded-xl border-2 w-20 h-16 gap-0.5 transition-all
        ${isSelected ? "border-blue-400 ring-2 ring-blue-400/40" : isActive ? "border-yellow-400/70" : "border-gray-600"}
        ${isConnecting ? "cursor-crosshair hover:border-orange-400 hover:ring-2 hover:ring-orange-400/40" : "cursor-grab"}
        ${dragging ? "opacity-80 scale-105 z-50" : "z-10"}
        bg-gray-800 hover:bg-gray-750 shadow-lg
      `}
      style={{ left: node.position.x, top: node.position.y }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <NodeIcon node={node} />
      <NodeLabel node={node} />

      {/* Botón conectar */}
      <button
        className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 hover:bg-orange-400 rounded-full text-[9px] text-white flex items-center justify-center z-20 shadow"
        onClick={(e) => {
          e.stopPropagation();
          onBeginConnect(node.id);
        }}
        title="Conectar"
      >
        +
      </button>

      {/* Botón eliminar */}
      <button
        className="absolute -top-2 -left-2 w-4 h-4 bg-red-600 hover:bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center z-20 shadow"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(node.id);
        }}
        title="Eliminar"
      >
        ×
      </button>

      {/* Indicador one-shot en lámpara activa */}
      {node.type === "lamp" && node.active && node.onDurationMs > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-yellow-400 rounded-b-xl transition-all"
          style={{
            width: `${Math.min(100, (node.onRemainingMs / node.onDurationMs) * 100)}%`,
          }}
        />
      )}
    </div>
  );
}