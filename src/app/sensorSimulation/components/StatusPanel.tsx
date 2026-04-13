"use client";

import { useState } from "react";
import { AutomationNode, LampNode } from "../engine/types";
import { LuminaireSVG } from "@/components/electrical/symbols/LuminaireSVG";

interface Props {
  nodes: AutomationNode[];
  selectedNodeId: string | null;
  onSetSensorDuration: (id: string, durationMs: number) => void;
}

function StatusRow({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "2px 0",
      }}
    >
      <span style={{ color: "#58677b", fontSize: 10 }}>{label}</span>
      <span
        style={{
          fontSize: 10,
          fontFamily: "'Courier New', monospace",
          padding: "1px 6px",
          borderRadius: 4,
          background: active ? "rgba(74,222,128,0.15)" : "#0f172a",
          color: active ? "#4ade80" : "#94a3b8",
          border: `1px solid ${active ? "rgba(74,222,128,0.4)" : "#1e293b"}`,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SensorConfig({
  sensor,
  onSetDuration,
}: {
  sensor: Extract<AutomationNode, { type: "sensor" }>;
  onSetDuration: (ms: number) => void;
}) {
  const [inputSec, setInputSec] = useState(
    sensor.onDurationMs > 0 ? String(sensor.onDurationMs / 1000) : ""
  );

  const handleApply = () => {
    const sec = parseFloat(inputSec);
    if (!isNaN(sec) && sec >= 0) {
      onSetDuration(Math.round(sec * 1000));
    }
  };

  const handleClear = () => {
    setInputSec("");
    onSetDuration(0);
  };

  return (
    <div
      style={{
        border: "1px solid #1e3a5f",
        borderRadius: 8,
        padding: 10,
        background: "rgba(96,165,250,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <p
        style={{
          color: "#93c5fd",
          fontSize: 9,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: "bold",
        }}
      >
        📡 Config Sensor
      </p>
      <p style={{ color: "#58677b", fontSize: 9 }}>ID: {sensor.id.slice(-6)}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <StatusRow label="Estado" value={sensor.motion ? "ON" : "OFF"} active={sensor.motion} />
        {sensor.onDurationMs > 0 && (
          <StatusRow label="Timer" value={`${sensor.onDurationMs / 1000}s`} active />
        )}
        {sensor.motion && sensor.onRemainingMs > 0 && (
          <StatusRow
            label="Restante"
            value={`${(sensor.onRemainingMs / 1000).toFixed(1)}s`}
            active
          />
        )}
      </div>

      {sensor.motion && sensor.onDurationMs > 0 && (
        <div
          style={{
            width: "100%",
            height: 6,
            background: "#0f172a",
            borderRadius: 999,
            overflow: "hidden",
            border: "1px solid #1e293b",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "#facc15",
              transition: "all 0.1s",
              borderRadius: 999,
              width: `${Math.min(
                100,
                (sensor.onRemainingMs / sensor.onDurationMs) * 100
              )}%`,
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 2 }}>
        <p style={{ color: "#58677b", fontSize: 9 }}>Tiempo encendido (seg):</p>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="number"
            min="0"
            step="0.5"
            value={inputSec}
            onChange={(e) => setInputSec(e.target.value)}
            placeholder="ej: 5"
            style={{
              flex: 1,
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 4,
              color: "#e2e8f0",
              fontSize: 11,
              padding: "4px 6px",
              outline: "none",
            }}
          />
          <button
            onClick={handleApply}
            style={{
              padding: "4px 8px",
              background: "transparent",
              border: "1px solid #1e3a5f",
              color: "#93c5fd",
              fontSize: 10,
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            ✓
          </button>
        </div>
        {sensor.onDurationMs > 0 && (
          <button
            onClick={handleClear}
            style={{
              fontSize: 9,
              color: "#64748b",
              background: "transparent",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ✕ Quitar timer (modo directo)
          </button>
        )}
        <p style={{ color: "#475569", fontSize: 9, lineHeight: 1.4 }}>
          {sensor.onDurationMs > 0
            ? "One-shot: emite pulso y se apaga solo"
            : "Sin timer: se mantiene por toggle"}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <p style={{ color: "#64748b", fontSize: 9 }}>Presets:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {[1, 3, 5, 10, 30].map((s) => (
            <button
              key={s}
              onClick={() => {
                setInputSec(String(s));
                onSetDuration(s * 1000);
              }}
              style={{
                padding: "2px 6px",
                borderRadius: 6,
                fontSize: 9,
                fontFamily: "'Courier New', monospace",
                border: `1px solid ${sensor.onDurationMs === s * 1000 ? "#facc15" : "#1e293b"}`,
                color: sensor.onDurationMs === s * 1000 ? "#0a0f1e" : "#94a3b8",
                background: sensor.onDurationMs === s * 1000 ? "#facc15" : "#0f172a",
                cursor: "pointer",
              }}
            >
              {s}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatusPanel({ nodes, selectedNodeId, onSetSensorDuration }: Props) {
  const sensors = nodes.filter((n) => n.type === "sensor");
  const selectors = nodes.filter((n) => n.type === "selector");
  const contactors = nodes.filter((n) => n.type === "contactor");
  const timers = nodes.filter((n) => n.type === "timer");
  const lamps = nodes.filter((n) => n.type === "lamp") as LampNode[];
  const motors = nodes.filter((n) => n.type === "motor");

  const selectedSensor =
    selectedNodeId
      ? (nodes.find((n) => n.id === selectedNodeId && n.type === "sensor") as
          | Extract<AutomationNode, { type: "sensor" }>
          | undefined)
      : undefined;

  return (
    <aside
      style={{
        width: 210,
        background: "#060d1a",
        borderLeft: "1px solid #1e293b",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: "#8a8d96",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Status
      </div>

      {selectedSensor && (
        <SensorConfig
          sensor={selectedSensor}
          onSetDuration={(ms) => onSetSensorDuration(selectedSensor.id, ms)}
        />
      )}

      {sensors.map((n) =>
        n.type === "sensor" ? (
          <StatusRow
            key={n.id}
            label={`Sensor ${n.id.slice(-4)}`}
            value={n.motion ? "ON" : "OFF"}
            active={n.motion}
          />
        ) : null
      )}

      {selectors.map((n) =>
        n.type === "selector" ? (
          <StatusRow
            key={n.id}
            label={`Selector ${n.id.slice(-4)}`}
            value={n.mode}
            active={n.mode !== "OFF"}
          />
        ) : null
      )}

      {contactors.map((n) =>
        n.type === "contactor" ? (
          <div
            key={n.id}
            style={{
              border: "1px solid #1e293b",
              borderRadius: 6,
              padding: 6,
              background: "rgba(15,23,42,0.4)",
            }}
          >
            <p style={{ color: "#64748b", fontSize: 10, marginBottom: 6 }}>
              Contactor {n.id.slice(-4)}
            </p>
            <StatusRow label="Bobina" value={n.coil ? "ON" : "OFF"} active={n.coil} />
            <StatusRow
              label="Contacto"
              value={n.contactClosed ? "CLOSED" : "OPEN"}
              active={n.contactClosed}
            />
          </div>
        ) : null
      )}

      {timers.map((n) =>
        n.type === "timer" ? (
          <div
            key={n.id}
            style={{
              border: "1px solid #1e293b",
              borderRadius: 6,
              padding: 6,
              background: "rgba(15,23,42,0.4)",
            }}
          >
            <p style={{ color: "#64748b", fontSize: 10, marginBottom: 6 }}>
              Timer {n.id.slice(-4)}
            </p>
            <StatusRow label="Output" value={n.output ? "ON" : "OFF"} active={n.output} />
            <StatusRow
              label="Restante"
              value={`${(n.remainingMs / 1000).toFixed(1)}s`}
              active={n.remainingMs > 0}
            />
          </div>
        ) : null
      )}

      {lamps.map((n) => (
        <div
          key={n.id}
          style={{
            border: "1px solid #1e293b",
            borderRadius: 6,
            padding: 6,
            cursor: "pointer",
            background: "transparent",
          }}
          onClick={() => {
            /* selección manejada desde canvas */
          }}
        >
          <p
            style={{
              color: "#64748b",
              fontSize: 10,
              marginBottom: 6,
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <span style={{ width: 18, height: 14, display: "inline-flex" }}>
              <span style={{ transform: "scale(0.25)", transformOrigin: "left center" }}>
                <LuminaireSVG active={n.active} />
              </span>
            </span>
            Lámpara {n.id.slice(-4)}
          </p>
          <StatusRow label="Estado" value={n.active ? "ON" : "OFF"} active={n.active} />
        </div>
      ))}

      {motors.map((n) =>
        n.type === "motor" ? (
          <StatusRow
            key={n.id}
            label={`Motor ${n.id.slice(-4)}`}
            value={n.active ? "RUN" : "STOP"}
            active={n.active}
          />
        ) : null
      )}

      {nodes.length === 0 && (
        <p style={{ color: "#475569", fontSize: 10, fontStyle: "italic" }}>Sin nodos</p>
      )}

      {sensors.length > 0 && !selectedSensor && (
        <p style={{ color: "#475569", fontSize: 9, fontStyle: "italic", textAlign: "center" }}>
          Clic en un 📡 para configurar su timer
        </p>
      )}
    </aside>
  );
}
