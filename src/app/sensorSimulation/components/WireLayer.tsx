"use client";

import { AutomationNode, Wire } from "../engine/types";
import { NODE_WIDTH, NODE_HEIGHT } from "../constants";

interface Props {
  nodes: AutomationNode[];
  wires: Wire[];
  onRemoveWire: (id: string) => void;
}

function nodeCenter(node: AutomationNode) {
  return {
    x: node.position.x + NODE_WIDTH / 2,
    y: node.position.y + NODE_HEIGHT / 2,
  };
}

export function WireLayer({ nodes, wires, onRemoveWire }: Props) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {wires.map((wire) => {
        const from = nodes.find((n) => n.id === wire.from);
        const to = nodes.find((n) => n.id === wire.to);
        if (!from || !to) return null;
        const f = nodeCenter(from);
        const t = nodeCenter(to);
        const mx = (f.x + t.x) / 2;
        return (
          <g key={wire.id}>
            <path
              d={`M${f.x},${f.y} C${mx},${f.y} ${mx},${t.y} ${t.x},${t.y}`}
              stroke="#60a5fa"
              strokeWidth={2}
              fill="none"
              strokeDasharray="6 3"
            />
            {/* Invisible thick line for click detection */}
            <path
              d={`M${f.x},${f.y} C${mx},${f.y} ${mx},${t.y} ${t.x},${t.y}`}
              stroke="transparent"
              strokeWidth={12}
              fill="none"
              style={{ pointerEvents: "stroke", cursor: "pointer" }}
              onClick={() => onRemoveWire(wire.id)}
            />
          </g>
        );
      })}
    </svg>
  );
}