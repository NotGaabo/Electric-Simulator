// src/components/electrical/PropertiesPanel.tsx

"use client";

import { useProjectStore } from "@/store/projectStore";

export default function PropertiesPanel() {
  const { symbols, selectedId, updateSymbol, analysis } = useProjectStore();
  const selected = symbols.find((s) => s.id === selectedId);
  const compData = analysis.components.find((c) => c.id === selectedId);

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: "#64748b",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 3,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 5,
    color: "#e2e8f0",
    fontSize: 12,
    fontFamily: "monospace",
    padding: "5px 8px",
    outline: "none",
    boxSizing: "border-box",
  };

  const rowStyle: React.CSSProperties = {
    marginBottom: 12,
  };

  const statStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    fontFamily: "monospace",
    padding: "4px 0",
    borderBottom: "1px solid #1e293b",
  };

  return (
    <aside
      style={{
        width: 200,
        background: "#0f172a",
        borderLeft: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 14px 10px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          PROPIEDADES
        </div>
      </div>

      {!selected ? (
        <div style={{ padding: 14, fontSize: 11, color: "#334155", fontFamily: "monospace", lineHeight: 1.6 }}>
          Selecciona un componente para editar sus propiedades
        </div>
      ) : (
        <div style={{ padding: 14 }}>
          {/* Type badge */}
          <div
            style={{
              fontSize: 10,
              color: "#94a3b8",
              background: "#1e293b",
              borderRadius: 4,
              padding: "3px 8px",
              display: "inline-block",
              fontFamily: "monospace",
              marginBottom: 14,
            }}
          >
            {selected.type.toUpperCase()}
          </div>

          {/* Label */}
          <div style={rowStyle}>
            <div style={labelStyle}>Etiqueta</div>
            <input
              style={inputStyle}
              value={selected.label || ""}
              onChange={(e) => updateSymbol(selected.id, { label: e.target.value })}
              placeholder={selected.type}
            />
          </div>

          {/* Voltage */}
          {selected.type !== "switch" && selected.type !== "resistor" && (
            <div style={rowStyle}>
              <div style={labelStyle}>Voltaje (V)</div>
              <input
                style={inputStyle}
                type="number"
                value={selected.voltage ?? ""}
                onChange={(e) =>
                  updateSymbol(selected.id, { voltage: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          )}

          {/* Power */}
          {(selected.type === "luminaire" || selected.type === "outlet") && (
            <div style={rowStyle}>
              <div style={labelStyle}>Potencia (W)</div>
              <input
                style={inputStyle}
                type="number"
                value={selected.power ?? ""}
                onChange={(e) =>
                  updateSymbol(selected.id, { power: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          )}

          {/* Resistance */}
          {selected.type === "resistor" && (
            <div style={rowStyle}>
              <div style={labelStyle}>Resistencia (Ω)</div>
              <input
                style={inputStyle}
                type="number"
                value={selected.resistance ?? ""}
                onChange={(e) =>
                  updateSymbol(selected.id, { resistance: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          )}

          {/* Circuit analysis values */}
          {compData && (
            <div style={{ marginTop: 16 }}>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Valores calculados</div>
              <div style={statStyle}>
                <span style={{ color: "#64748b" }}>Voltaje</span>
                <span style={{ color: "#fbbf24" }}>{compData.voltage.toFixed(2)} V</span>
              </div>
              <div style={statStyle}>
                <span style={{ color: "#64748b" }}>Corriente</span>
                <span style={{ color: "#60a5fa" }}>{compData.current.toFixed(3)} A</span>
              </div>
              <div style={statStyle}>
                <span style={{ color: "#64748b" }}>Potencia</span>
                <span style={{ color: "#4ade80" }}>{compData.power.toFixed(2)} W</span>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}