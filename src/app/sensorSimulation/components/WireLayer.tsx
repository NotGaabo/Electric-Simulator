"use client";

import { AutomationNode, Wire } from "../engine/types";

interface Props {
  nodes: AutomationNode[];
  wires: Wire[];
  onRemoveWire: (id: string) => void;
}

function getNodeCenter(node: AutomationNode) {
  return {
    x: node.position.x + 40, // NODE_WIDTH / 2
    y: node.position.y + 32, // NODE_HEIGHT / 2
  };
}

function isWireActive(wire: Wire, nodes: AutomationNode[]): boolean {
  const src = nodes.find((n) => n.id === wire.from);
  if (!src) return false;
  switch (src.type) {
    case "sensor": return src.motion;
    case "selector": return src.mode !== "OFF";
    case "contactor": return src.contactClosed;
    case "timer": return src.output;
    case "lamp": return src.active;
    case "motor": return src.active;
    default: return false;
  }
}

export function WireLayer({ nodes, wires, onRemoveWire }: Props) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
      <defs>
        <marker id="arrowActive" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#4ade80" />
        </marker>
        <marker id="arrowInactive" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#4b5563" />
        </marker>
      </defs>

      {wires.map((wire) => {
        const fromNode = nodes.find((n) => n.id === wire.from);
        const toNode = nodes.find((n) => n.id === wire.to);
        if (!fromNode || !toNode) return null;

        const from = getNodeCenter(fromNode);
        const to = getNodeCenter(toNode);
        const active = isWireActive(wire, nodes);

        // Curva bezier suave
        const midX = (from.x + to.x) / 2;
        const d = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;

        return (
          <g key={wire.id}>
            {/* Hit area invisible para click */}
            <path
              d={d}
              stroke="transparent"
              strokeWidth={12}
              fill="none"
              style={{ pointerEvents: "stroke", cursor: "pointer" }}
              onClick={() => onRemoveWire(wire.id)}
            />
            {/* Wire visual */}
            <path
              d={d}
              stroke={active ? "#4ade80" : "#374151"}
              strokeWidth={active ? 2.5 : 1.5}
              fill="none"
              strokeDasharray={active ? "none" : "5,4"}
              markerEnd={active ? "url(#arrowActive)" : "url(#arrowInactive)"}
              className="transition-all duration-150"
            />
            {/* Punto de origen */}
            <circle cx={from.x} cy={from.y} r={3} fill={active ? "#4ade80" : "#6b7280"} />
          </g>
        );
      })}
    </svg>
  );
}