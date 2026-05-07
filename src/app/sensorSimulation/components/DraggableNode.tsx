"use client";

import { useRef, useState } from "react";
import { AutomationNode, Mode } from "../engine/types";
import { LuminaireSVG } from "@/components/electrical/symbols/LuminaireSVG";

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
    case "relay":
      return (
        <div className={`text-2xl ${node.contactClosed ? "drop-shadow-[0_0_6px_#60a5fa]" : "opacity-70"}`}>
          🔌
        </div>
      );
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
        <div
          style={{
            width: 40,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: node.active ? "drop-shadow(0 0 6px rgba(253,224,71,0.8))" : "none",
            opacity: node.active ? 1 : 0.6,
          }}
        >
          <div style={{ transform: "scale(0.55)", transformOrigin: "center" }}>
            <LuminaireSVG active={node.active} />
          </div>
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
      return (
        <span
          style={{
            fontSize: 9,
            fontFamily: "'Courier New', monospace",
            color: node.motion ? "#4ade80" : "#64748b",
          }}
        >
          {node.motion
            ? node.onRemainingMs > 0
              ? `${(node.onRemainingMs / 1000).toFixed(1)}s`
              : "ON"
            : node.onDurationMs > 0
            ? `T:${node.onDurationMs / 1000}s`
            : "OFF"}
        </span>
      );
    case "selector":
      return <span className={`text-[9px] font-mono ${node.mode !== "OFF" ? "text-green-400" : "text-gray-500"}`}>{node.mode}</span>;
    case "contactor":
      return <span className={`text-[9px] font-mono ${node.contactClosed ? "text-yellow-400" : "text-gray-500"}`}>{node.contactClosed ? "CLOSED" : "OPEN"}</span>;
    case "timer":
      return <span className={`text-[9px] font-mono ${node.output ? "text-green-400" : "text-gray-500"}`}>{node.output ? "ON" : "WAIT"}</span>;
    case "lamp":
      return (
        <span
          style={{
            fontSize: 9,
            fontFamily: "'Courier New', monospace",
            color: node.active ? "#fde047" : "#64748b",
          }}
        >
          {node.active ? "ON" : "OFF"}
        </span>
      );
    case "motor":
      return <span className={`text-[9px] font-mono ${node.active ? "text-green-400" : "text-gray-500"}`}>{node.active ? "RUN" : "STOP"}</span>;
  }
}

function NodeTitle({ node }: { node: AutomationNode }) {
  const fallback = {
    sensor: "Sensor",
    selector: "Selector",
    relay: "Rele",
    contactor: "Contactor",
    timer: "Timer",
    lamp: "Lampara",
    motor: "Motor",
  }[node.type];

  return (
    <span
      style={{
        position: "absolute",
        top: 4,
        left: 8,
        right: 8,
        textAlign: "center",
        fontSize: 8,
        color: "#94a3b8",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        letterSpacing: "0.04em",
      }}
    >
      {node.label ?? fallback}
    </span>
  );
}

function getAccent(node: AutomationNode) {
  switch (node.type) {
    case "sensor":
      return "#60a5fa";
    case "selector":
      return "#c084fc";
    case "relay":
      return "#38bdf8";
    case "contactor":
      return "#facc15";
    case "timer":
      return "#fb7185";
    case "lamp":
      return "#fde047";
    case "motor":
      return "#4ade80";
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
      onSelect(node.id);
    } else if (node.type === "selector") {
      const modes: Mode[] = ["OFF", "MANUAL", "AUTO"];
      const idx = modes.indexOf(node.mode);
      onSetSelectorMode(node.id, modes[(idx + 1) % modes.length]);
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
      style={{
        position: "absolute",
        left: node.position.x,
        top: node.position.y,
        width: 80,
        height: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        borderRadius: 10,
        border: `2px solid ${
          isSelected ? "#2563eb" : isActive ? "rgba(245,158,11,0.8)" : "#334155"
        }`,
        background: "#0f172a",
        boxShadow: dragging
          ? "0 10px 24px rgba(0,0,0,0.45)"
          : "0 6px 18px rgba(0,0,0,0.35)",
        cursor: isConnecting ? "crosshair" : "grab",
        opacity: dragging ? 0.85 : 1,
        transform: dragging ? "scale(1.05)" : "none",
        zIndex: dragging ? 50 : isSelected ? 40 : 10,
        transition: "all 0.15s",
        userSelect: "none",
        overflow: "hidden",
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: getAccent(node),
          opacity: 0.9,
        }}
      />

      {isSelected && (
        <div
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: 12,
            border: "1.5px solid #2563eb",
            boxShadow: "0 0 0 3px rgba(37,99,235,0.25)",
            pointerEvents: "none",
          }}
        />
      )}

      {isActive && (
        <div
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: 14,
            background:
              "radial-gradient(ellipse, rgba(74,222,128,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      )}

      <NodeIcon node={node} />
      <NodeTitle node={node} />
      <NodeLabel node={node} />

      {/* Botón conectar */}
      <button
        style={{
          position: "absolute",
          top: -10,
          right: -10,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#f59e0b",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: 11,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20,
          boxShadow: "0 6px 12px rgba(0,0,0,0.4)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onBeginConnect(node.id);
        }}
        title="Conectar este nodo"
      >
        +
      </button>

      {/* Botón eliminar */}
      <button
        style={{
          position: "absolute",
          top: -10,
          left: -10,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#ef4444",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: 11,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20,
          boxShadow: "0 6px 12px rgba(0,0,0,0.4)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(node.id);
        }}
        title="Eliminar este nodo"
      >
        ×
      </button>

      {/* (Timer moved to sensor) */}
    </div>
  );
}
