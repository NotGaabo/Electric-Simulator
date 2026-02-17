// src/components/electrical/CircuitStatsBar.tsx

"use client";

import { useProjectStore } from "@/store/projectStore";

export default function CircuitStatsBar() {
  const { analysis, symbols, clearAll } = useProjectStore();

  const fmt = (n: number, decimals = 2) => {
    if (!isFinite(n)) return "∞";
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toFixed(decimals);
  };

  const totalLoad = symbols.reduce((sum, s) => sum + (s.power || 0), 0);

  const stats = [
    { label: "Voltaje Total", value: fmt(analysis.totalVoltage), unit: "V", color: "#fbbf24" },
    { label: "Corriente", value: fmt(analysis.totalCurrent, 3), unit: "A", color: "#60a5fa" },
    { label: "Resistencia", value: fmt(analysis.totalResistance), unit: "Ω", color: "#f472b6" },
    { label: "Potencia", value: fmt(analysis.totalPower), unit: "W", color: "#4ade80" },
    { label: "Carga Total", value: fmt(totalLoad), unit: "W", color: "#a78bfa" },
    { label: "Componentes", value: String(symbols.length), unit: "", color: "#94a3b8" },
  ];

  return (
    <div
      style={{
        height: 52,
        background: "#020617",
        borderTop: "1px solid #1e293b",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 0,
        flexShrink: 0,
      }}
    >
      {/* Formula badge */}
      <div
        style={{
          fontSize: 9,
          fontFamily: "monospace",
          color: "#334155",
          marginRight: 20,
          flexShrink: 0,
        }}
      >
        V=IR · P=VI · R_s=ΣR · 1/R_p=Σ(1/R)
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 0, flex: 1 }}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "0 16px",
              borderLeft: i === 0 ? "none" : "1px solid #1e293b",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontFamily: "'Courier New', monospace",
                color: s.color,
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              {s.value}
              <span style={{ fontSize: 9, marginLeft: 2, opacity: 0.7 }}>{s.unit}</span>
            </span>
            <span
              style={{
                fontSize: 8,
                color: "#475569",
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginTop: 2,
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Clear button */}
      <button
        onClick={clearAll}
        style={{
          marginLeft: "auto",
          background: "transparent",
          border: "1px solid #1e293b",
          color: "#475569",
          fontSize: 11,
          fontFamily: "monospace",
          padding: "4px 10px",
          borderRadius: 5,
          cursor: "pointer",
          transition: "all 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#ef4444";
          e.currentTarget.style.color = "#ef4444";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#1e293b";
          e.currentTarget.style.color = "#475569";
        }}
      >
        LIMPIAR
      </button>
    </div>
  );
}