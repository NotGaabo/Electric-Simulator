"use client";

import { useRef } from "react";
import { AutomationNode, Wire, WirePoint } from "../engine/types";
import { NODE_HEIGHT, NODE_WIDTH } from "../constants";

interface Props {
  nodes: AutomationNode[];
  wires: Wire[];
  onRemoveWire: (id: string) => void;
  onInsertWirePoint: (id: string, point: WirePoint, index?: number) => void;
  onUpdateWirePoint: (id: string, index: number, point: WirePoint) => void;
}

function getNodeCenter(node: AutomationNode) {
  return {
    x: node.position.x + NODE_WIDTH / 2,
    y: node.position.y + NODE_HEIGHT / 2,
  };
}

function isWireActive(wire: Wire, nodes: AutomationNode[]): boolean {
  const src = nodes.find((n) => n.id === wire.from);
  if (!src) return false;
  switch (src.type) {
    case "sensor":
      return src.motion;
    case "selector":
      return src.mode !== "OFF";
    case "contactor":
      return src.contactClosed;
    case "timer":
      return src.output;
    case "lamp":
      return src.active;
    case "motor":
      return src.active;
    default:
      return false;
  }
}

function buildWirePath(from: WirePoint, points: WirePoint[], to: WirePoint) {
  const segments = [`M ${from.x} ${from.y}`];
  points.forEach((pt) => segments.push(`L ${pt.x} ${pt.y}`));
  segments.push(`L ${to.x} ${to.y}`);
  return segments.join(" ");
}

function distToSegment(p: WirePoint, a: WirePoint, b: WirePoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function findInsertIndex(from: WirePoint, points: WirePoint[], to: WirePoint, click: WirePoint) {
  const all = [from, ...points, to];
  let bestSegment = 0;
  let bestDist = Infinity;
  for (let i = 0; i < all.length - 1; i += 1) {
    const d = distToSegment(click, all[i], all[i + 1]);
    if (d < bestDist) {
      bestDist = d;
      bestSegment = i;
    }
  }
  return Math.max(0, Math.min(bestSegment, points.length));
}

export function WireLayer({
  nodes,
  wires,
  onRemoveWire,
  onInsertWirePoint,
  onUpdateWirePoint,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const pointFromEvent = (ev: { clientX: number; clientY: number }) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  };

  const startDragPoint = (wireId: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const onMove = (ev: MouseEvent) => {
      const pt = pointFromEvent(ev);
      if (!pt) return;
      onUpdateWirePoint(wireId, index, pt);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <svg ref={svgRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 5 }}>
      <defs>
        <filter id="wireGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {wires.map((wire) => {
        const fromNode = nodes.find((n) => n.id === wire.from);
        const toNode = nodes.find((n) => n.id === wire.to);
        if (!fromNode || !toNode) return null;

        const from = getNodeCenter(fromNode);
        const to = getNodeCenter(toNode);
        const active = isWireActive(wire, nodes);
        const points = wire.points ?? [];
        const d = buildWirePath(from, points, to);

        return (
          <g key={wire.id}>
            <path
              d={d}
              stroke="transparent"
              strokeWidth={16}
              fill="none"
              style={{ pointerEvents: "stroke", cursor: "crosshair" }}
              onClick={(e) => {
                e.stopPropagation();
                if (e.detail > 1) return;
                const pt = pointFromEvent(e);
                if (!pt) return;
                const insertIdx = findInsertIndex(from, points, to, pt);
                onInsertWirePoint(wire.id, pt, insertIdx);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onRemoveWire(wire.id);
              }}
            />

            {active && (
              <path
                d={d}
                fill="none"
                stroke="rgba(74,222,128,0.15)"
                strokeWidth="8"
                filter="url(#wireGlow)"
              />
            )}

            <path
              d={d}
              stroke={active ? "#4ade80" : "#334155"}
              strokeWidth={active ? 4 : 2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <circle
              cx={from.x}
              cy={from.y}
              r={3}
              fill={active ? "#4ade80" : "#6b7280"}
            />

            {points.map((pt, idx) => (
              <circle
                key={`${wire.id}-pt-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={5}
                fill="#1e40af"
                stroke="#60a5fa"
                strokeWidth="1.5"
                style={{ cursor: "grab" }}
                onMouseDown={(e) => startDragPoint(wire.id, idx, e)}
                onClick={(e) => e.stopPropagation()}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
