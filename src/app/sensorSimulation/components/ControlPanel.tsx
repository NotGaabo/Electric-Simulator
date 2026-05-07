"use client";

import type { CSSProperties } from "react";
import type { AutomationNode, Wire } from "../engine/types";

type ScenarioKey = "pasillo" | "bomba" | "linea";

interface Props {
  running: boolean;
  nodes: AutomationNode[];
  wires: Wire[];
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onLoadScenario: (scenario: ScenarioKey) => void;
}

export function ControlPanel({
  running,
  nodes,
  wires,
  onStart,
  onStop,
  onReset,
  onLoadScenario,
}: Props) {
  const activeNodes = nodes.filter((node) => {
    if (node.type === "sensor") return node.motion;
    if (node.type === "selector") return node.mode !== "OFF";
    if (node.type === "relay") return node.contactClosed;
    if (node.type === "contactor") return node.contactClosed;
    if (node.type === "timer") return node.output;
    if (node.type === "lamp") return node.active;
    if (node.type === "motor") return node.active;
    return false;
  }).length;

  const presets: Array<{ key: ScenarioKey; label: string }> = [
    { key: "pasillo", label: "Pasillo" },
    { key: "bomba", label: "Bomba" },
    { key: "linea", label: "Baliza OR" },
  ];

  const baseBtn: CSSProperties = {
    border: "1px solid #1e293b",
    background: "transparent",
    color: "#94a3b8",
    fontSize: 10,
    letterSpacing: "0.08em",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'Courier New', monospace",
  };

  return (
    <div
      style={{
        background: "#060d1a",
        borderBottom: "1px solid #1e293b",
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ marginRight: 8 }}>
        <div
          style={{
            fontSize: 10,
            color: "#4ade80",
            letterSpacing: "0.15em",
            marginBottom: 2,
          }}
        >
          ⚡ AUTOMATION SIMULATOR
        </div>
        <div style={{ fontSize: 8, color: "#58677b" }}>
          IEC 60617 · Control &amp; lógica
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginRight: 10, flexWrap: "wrap" }}>
        {presets.map((preset) => (
          <button
            key={preset.key}
            onClick={() => onLoadScenario(preset.key)}
            style={{
              ...baseBtn,
              padding: "6px 8px",
              borderColor: "#1e3a5f",
              color: "#93c5fd",
              background: "rgba(59,130,246,0.08)",
            }}
          >
            ✦ {preset.label}
          </button>
        ))}
      </div>

      <button
        onClick={onStart}
        disabled={running}
        style={{
          ...baseBtn,
          opacity: running ? 0.4 : 1,
          borderColor: running ? "#1e293b" : "#14532d",
          color: running ? "#64748b" : "#4ade80",
        }}
        onMouseEnter={(e) => {
          if (running) return;
          e.currentTarget.style.borderColor = "#4ade80";
          e.currentTarget.style.color = "#4ade80";
        }}
        onMouseLeave={(e) => {
          if (running) return;
          e.currentTarget.style.borderColor = "#14532d";
          e.currentTarget.style.color = "#4ade80";
        }}
      >
        ▶ INICIAR
      </button>

      <button
        onClick={onStop}
        disabled={!running}
        style={{
          ...baseBtn,
          opacity: running ? 1 : 0.4,
          borderColor: running ? "#7f1d1d" : "#1e293b",
          color: running ? "#f87171" : "#64748b",
        }}
        onMouseEnter={(e) => {
          if (!running) return;
          e.currentTarget.style.borderColor = "#f87171";
          e.currentTarget.style.color = "#f87171";
        }}
        onMouseLeave={(e) => {
          if (!running) return;
          e.currentTarget.style.borderColor = "#7f1d1d";
          e.currentTarget.style.color = "#f87171";
        }}
      >
        ■ DETENER
      </button>

      <button
        onClick={onReset}
        style={baseBtn}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#94a3b8";
          e.currentTarget.style.color = "#e2e8f0";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#1e293b";
          e.currentTarget.style.color = "#94a3b8";
        }}
      >
        ↺ RESET
      </button>

      <div
        style={{
          marginLeft: 8,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: running ? "#4ade80" : "#334155",
          boxShadow: running ? "0 0 6px rgba(74,222,128,0.8)" : "none",
          animation: running ? "blink 1s infinite" : "none",
        }}
      />
      <span style={{ fontSize: 10, color: "#64748b" }}>
        {running ? "RUNNING" : "STOPPED"}
      </span>

      <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          { label: "NODOS", value: String(nodes.length) },
          { label: "CABLES", value: String(wires.length) },
          { label: "ACTIVOS", value: String(activeNodes) },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              minWidth: 62,
              padding: "5px 8px",
              borderRadius: 8,
              border: "1px solid #1e293b",
              background: "rgba(15,23,42,0.7)",
            }}
          >
            <div style={{ fontSize: 8, color: "#58677b", letterSpacing: "0.08em" }}>{item.label}</div>
            <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>
    </div>
  );
}
