"use client";

import { useRef } from "react";
import { AutomationNode, Mode } from "../engine/types";
import { NODE_WIDTH, NODE_HEIGHT } from "../constants";

const NODE_COLORS: Record<string, string> = {
  sensor: "bg-sky-700 border-sky-400",
  selector: "bg-violet-700 border-violet-400",
  contactor: "bg-amber-700 border-amber-400",
  timer: "bg-teal-700 border-teal-400",
  lamp: "bg-yellow-600 border-yellow-400",
  motor: "bg-green-700 border-green-400",
};

const NODE_ICONS: Record<string, string> = {
  sensor: "📡",
  selector: "🔘",
  contactor: "⚡",
  timer: "⏱",
  lamp: "💡",
  motor: "⚙️",
};

interface Props {
  node: AutomationNode;
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  onToggleSensor: (id: string) => void;
  onSetSelectorMode: (id: string, mode: Mode) => void;
  onBeginConnect: (id: string) => void;
  onFinishConnect: (id: string) => void;
  isConnecting: boolean;
}

function getStatusIndicator(node: AutomationNode): { label: string; active: boolean } {
  switch (node.type) {
    case "sensor":
      return { label: node.motion ? "ON" : "OFF", active: node.motion };
    case "selector":
      return { label: node.mode, active: node.mode !== "OFF" };
    case "contactor":
      return { label: node.contactClosed ? "CLOSED" : "OPEN", active: node.contactClosed };
    case "timer":
      return {
        label: node.output ? `${(node.remainingMs / 1000).toFixed(1)}s` : "—",
        active: node.output,
      };
    case "lamp":
    case "motor":
      return { label: node.active ? "ON" : "OFF", active: node.active };
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
  isConnecting,
}: Props) {
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, select")) return;
    dragging.current = true;
    offset.current = {
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y,
    };
    e.preventDefault();

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      onMove(node.id, ev.clientX - offset.current.x, ev.clientY - offset.current.y);
    };

    const handleMouseUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const status = getStatusIndicator(node);
  const colorClass = NODE_COLORS[node.type] ?? "bg-gray-700 border-gray-400";

  return (
    <div
      className={`absolute border-2 rounded-lg shadow-lg select-none ${colorClass}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        zIndex: 10,
        cursor: "grab",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-xs text-white font-bold truncate">
          {NODE_ICONS[node.type]} {node.type.toUpperCase()}
        </span>
        <button
          className="text-red-300 hover:text-red-100 text-xs leading-none"
          onClick={() => onRemove(node.id)}
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center mt-1">
        <span
          className={`text-xs px-1 rounded font-mono ${
            status.active ? "bg-green-400 text-black" : "bg-gray-600 text-gray-300"
          }`}
        >
          {status.label}
        </span>
      </div>

      {/* Controls */}
      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1 px-1">
        {node.type === "sensor" && (
          <button
            className="text-xs bg-sky-500 hover:bg-sky-400 text-white rounded px-1"
            onClick={() => onToggleSensor(node.id)}
          >
            Toggle
          </button>
        )}
        {node.type === "selector" && (
          <select
            className="text-xs bg-violet-900 text-white rounded px-0.5 w-full"
            value={node.mode}
            onChange={(e) => onSetSelectorMode(node.id, e.target.value as Mode)}
          >
            <option value="OFF">OFF</option>
            <option value="MANUAL">MAN</option>
            <option value="AUTO">AUTO</option>
          </select>
        )}
        {node.type !== "sensor" && node.type !== "selector" && (
          <button
            className={`text-xs rounded px-1 ${
              isConnecting
                ? "bg-orange-400 text-black"
                : "bg-gray-600 hover:bg-gray-500 text-white"
            }`}
            onClick={() => (isConnecting ? onFinishConnect(node.id) : onBeginConnect(node.id))}
          >
            {isConnecting ? "→ Here" : "Wire in"}
          </button>
        )}
        {!isConnecting && (
          <button
            className="text-xs rounded px-1 bg-gray-600 hover:bg-gray-500 text-white"
            onClick={() => onBeginConnect(node.id)}
          >
            Wire out
          </button>
        )}
      </div>
    </div>
  );
}