"use client";

import { useCallback, useMemo, useState } from "react";
import { CompSVG } from "@/components/electrical/symbols/CompSVG";
import { PaletteItem } from "@/components/electrical/PalettePanel";
import { useCircuitSimulator } from "@/hooks/useCircuitSimulator";
import { GRID, COMP_H, COMP_W, PORT_R } from "@/lib/circuit/constants";
import { snap, wirePath } from "@/lib/utils";

type MaintenanceState = {
  cleaned: boolean;
  inspected: boolean;
  tested: boolean;
};

const MACHINE_PALETTE: PaletteItem[] = [
  { type: "battery", label: "Red Monofásica", cat: "Alimentación", defaults: { voltage: 120, isOn: true, label: "L/N 120V" } },
  { type: "breaker", label: "Pulsador STOP", cat: "Control", defaults: { isOn: true, label: "STOP (NC)" } },
  { type: "switch", label: "Pulsador START", cat: "Control", defaults: { isOn: false, label: "START (NO)" } },
  { type: "motor", label: "Motor Monofásico", cat: "Máquinas", defaults: { resistance: 32, ratedVoltage: 120, health: "ok", label: "M1" } },
  { type: "transformer", label: "Transformador", cat: "Máquinas", defaults: { resistance: 80, label: "TR1" } },
  { type: "stator", label: "Estator", cat: "Partes", defaults: { resistance: 25, label: "ST" } },
  { type: "rotor", label: "Rotor", cat: "Partes", defaults: { resistance: 20, label: "RT" } },
];

const defaultMaintenance: MaintenanceState = {
  cleaned: false,
  inspected: false,
  tested: false,
};

function nowLabel() {
  return new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function MachineSimulatorPage() {
  const {
    components,
    wires,
    selectedId,
    selectedComp,
    pendingPort,
    pendingStart,
    mousePos,
    analysis,
    containerRef,
    portPos,
    handleCanvasDrop,
    handleMouseMove,
    handleCanvasClick,
    handlePortClick,
    handleCompMouseDown,
    deleteComponent,
    deleteWire,
    updateComp,
    clearAll,
    getPorts,
  } = useCircuitSimulator({ palette: MACHINE_PALETTE });

  const [motorRunning, setMotorRunning] = useState<Record<string, boolean>>({});
  const [maintenance, setMaintenance] = useState<Record<string, MaintenanceState>>({});
  const [events, setEvents] = useState<string[]>([]);

  const addEvent = useCallback((text: string) => {
    setEvents(prev => [`${nowLabel()} - ${text}`, ...prev].slice(0, 8));
  }, []);

  const machineContext = useMemo(() => {
    const source = components.find(c => c.type === "battery");
    const stop = components.find(c => c.type === "breaker");
    const start = components.find(c => c.type === "switch");
    const motor = components.find(c => c.type === "motor");

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!source) errors.push("Agrega la red monofásica.");
    if (!stop) errors.push("Agrega el pulsador STOP (contacto NC).");
    if (!start) errors.push("Agrega el pulsador START (contacto NO).");
    if (!motor) errors.push("Agrega el motor monofásico.");

    const isPortLinked = (aId: string, aPort: string, bId: string, bPort: string) =>
      wires.some(w =>
        (w.fromCompId === aId && w.fromPortId === aPort && w.toCompId === bId && w.toPortId === bPort) ||
        (w.toCompId === aId && w.toPortId === aPort && w.fromCompId === bId && w.fromPortId === bPort)
      );

    if (source && stop && start && motor) {
      if (!isPortLinked(source.id, "right", stop.id, "left")) {
        errors.push("Conecta L (fuente derecha) con entrada de STOP.");
      }
      if (!isPortLinked(stop.id, "right", start.id, "left")) {
        errors.push("Conecta salida STOP con entrada START.");
      }
      if (!isPortLinked(start.id, "right", motor.id, "left")) {
        errors.push("Conecta salida START con entrada del motor.");
      }
      if (!isPortLinked(motor.id, "right", source.id, "left")) {
        errors.push("Conecta retorno del motor al neutro de la fuente.");
      }
      if (wires.length > 4) {
        warnings.push("Hay conexiones adicionales; revisa que no exista cableado sobrante.");
      }
    }

    const shortLine = source && wires.some(w =>
      (w.fromCompId === source.id && w.toCompId === source.id) ||
      (w.fromCompId === source.id && w.toCompId === motor?.id && w.fromPortId === "right" && w.toPortId === "right")
    );
    if (shortLine) errors.push("Posible cortocircuito de línea detectado.");

    return {
      source,
      stop,
      start,
      motor,
      errors,
      warnings,
      isValidConnection: errors.length === 0,
    };
  }, [components, wires]);

  const motor = machineContext.motor;
  const motorMaintenance = motor ? (maintenance[motor.id] ?? defaultMaintenance) : defaultMaintenance;
  const maintenanceComplete = motorMaintenance.cleaned && motorMaintenance.inspected && motorMaintenance.tested;
  const running = motor ? !!motorRunning[motor.id] : false;
  const effectiveRunning = running && machineContext.isValidConnection && !analysis.shortCircuit && machineContext.stop?.isOn !== false;

  const startMotor = useCallback((origin: string) => {
    const m = machineContext.motor;
    if (!m) return;
    if (!machineContext.isValidConnection) {
      addEvent(`START bloqueado (${origin}): conexión incorrecta.`);
      return;
    }
    if (machineContext.stop?.isOn === false) {
      addEvent("START bloqueado: STOP está abierto.");
      return;
    }
    const mt = maintenance[m.id] ?? defaultMaintenance;
    if (!(mt.cleaned && mt.inspected && mt.tested)) {
      updateComp(m.id, { health: "warning" });
      addEvent("START bloqueado: mantenimiento preventivo incompleto.");
      return;
    }
    if (m.health === "fault") {
      addEvent("START bloqueado: motor con falla activa.");
      return;
    }
    setMotorRunning(prev => ({ ...prev, [m.id]: true }));
    updateComp(m.id, { health: "ok" });
    addEvent(`Motor arrancado desde ${origin}.`);
  }, [machineContext, maintenance, updateComp, addEvent]);

  const stopMotor = useCallback((origin: string) => {
    const m = machineContext.motor;
    if (!m) return;
    setMotorRunning(prev => ({ ...prev, [m.id]: false }));
    addEvent(`Motor detenido desde ${origin}.`);
  }, [machineContext.motor, addEvent]);

  const pressStart = () => {
    if (!machineContext.start) return;
    updateComp(machineContext.start.id, { isOn: true });
    startMotor("pulsador START");
    setTimeout(() => updateComp(machineContext.start!.id, { isOn: false }), 180);
  };

  const pressStop = () => {
    if (!machineContext.stop) return;
    updateComp(machineContext.stop.id, { isOn: false });
    stopMotor("pulsador STOP");
    setTimeout(() => updateComp(machineContext.stop!.id, { isOn: true }), 220);
  };

  const runMaintenance = (key: keyof MaintenanceState, label: string) => {
    if (!motor) return;
    setMaintenance(prev => {
      const next = { ...(prev[motor.id] ?? defaultMaintenance), [key]: true };
      return { ...prev, [motor.id]: next };
    });
    updateComp(motor.id, { health: "ok" });
    addEvent(`Mantenimiento ejecutado: ${label}.`);
  };

  const triggerFault = () => {
    if (!motor) return;
    updateComp(motor.id, { health: "fault" });
    stopMotor("falla simulada");
    addEvent("Falla simulada: sobrecalentamiento de motor.");
  };

  const resetMachine = () => {
    clearAll();
    setMaintenance({});
    setMotorRunning({});
    setEvents([]);
  };

  const machineInfo = {
    battery: "Fuente monofásica L/N para alimentación de control y potencia.",
    breaker: "STOP (NC): al activarse abre el circuito de mando y detiene el motor.",
    switch: "START (NO): cierra momentáneamente para ordenar el arranque.",
    motor: "Motor monofásico: convierte energía eléctrica en movimiento mecánico.",
    transformer: "Transformador: adapta tensión para etapas de potencia/control.",
    stator: "Estator: parte fija con devanados que generan el campo magnético.",
    rotor: "Rotor: parte móvil acoplada al eje del motor.",
    resistor: "Elemento resistivo de apoyo para prácticas de carga.",
    capacitor: "Componente reactivo usado en prácticas de arranque.",
    luminaire: "Carga auxiliar para prácticas eléctricas básicas.",
    outlet: "Punto de servicio para ejercicios de distribución.",
  } as const;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#081220", color: "#dbe6f4", fontFamily: "'Courier New', monospace" }}>
      <aside style={{ width: 220, borderRight: "1px solid #1e293b", background: "#060d1a", overflowY: "auto" }}>
        <div style={{ padding: 14, borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", color: "#4ade80" }}>SIMULADOR DE MÁQUINAS</div>
          <div style={{ fontSize: 9, color: "#6a7d95", marginTop: 4 }}>RF-19 / RF-20 / RF-21 / RF-22</div>
        </div>
        {["Alimentación", "Control", "Máquinas", "Partes"].map(cat => {
          const items = MACHINE_PALETTE.filter(p => p.cat === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div style={{ padding: "10px 14px 4px", fontSize: 9, color: "#7f8fa8", letterSpacing: "0.08em", textTransform: "uppercase" }}>{cat}</div>
              {items.map(item => (
                <div
                  key={item.type + item.label}
                  draggable
                  onDragStart={e => e.dataTransfer.setData("compType", item.type)}
                  style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 12px", margin: "2px 6px", borderRadius: 6, cursor: "grab" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(74, 222, 128, 0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ width: 34, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", borderRadius: 5 }}>
                    <div style={{ transform: "scale(0.45)", transformOrigin: "center" }}>
                      <CompSVG comp={{ id: "", type: item.type, x: 0, y: 0, label: item.label, ...item.defaults }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#9fb2cb" }}>{item.label}</span>
                </div>
              ))}
            </div>
          );
        })}
      </aside>

      <main
        ref={containerRef}
        style={{ flex: 1, position: "relative", overflow: "hidden" }}
        onDrop={handleCanvasDrop}
        onDragOver={e => e.preventDefault()}
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
      >
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <defs>
            <pattern id="machineGrid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="0.85" fill="#1e293b" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#machineGrid)" />
        </svg>

        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {wires.map(w => {
            const from = portPos(w.fromCompId, w.fromPortId);
            const to = portPos(w.toCompId, w.toPortId);
            const d = wirePath(from.x, from.y, to.x, to.y);
            return (
              <g key={w.id}>
                <path d={d} fill="none" stroke={running ? "#22c55e" : "#3f526d"} strokeWidth={running ? 4 : 3} strokeLinecap="round" />
                <path d={d} fill="none" stroke="transparent" strokeWidth="12" onClick={e => { e.stopPropagation(); deleteWire(w.id); }} />
              </g>
            );
          })}
          {pendingStart && (
            <path d={wirePath(pendingStart.x, pendingStart.y, mousePos.x, mousePos.y)} fill="none" stroke="#4ade80" strokeDasharray="5 4" strokeWidth="2.5" />
          )}
        </svg>

        {components.map(comp => {
          const ports = getPorts(comp.type);
            const active = comp.type === "motor" ? effectiveRunning : analysis.circuitClosed;
          const isSelected = selectedId === comp.id;
          return (
            <div
              key={comp.id}
              onMouseDown={e => handleCompMouseDown(comp.id, e)}
              onDoubleClick={e => {
                e.stopPropagation();
                if (comp.type === "switch") pressStart();
                if (comp.type === "breaker") pressStop();
              }}
              style={{
                position: "absolute",
                left: snap(comp.x) - COMP_W / 2,
                top: snap(comp.y) - COMP_H / 2,
                width: COMP_W,
                height: COMP_H,
                cursor: pendingPort ? "crosshair" : "grab",
              }}
            >
              {isSelected && <div style={{ position: "absolute", inset: -4, border: "1px solid #2563eb", borderRadius: 8, boxShadow: "0 0 0 3px rgba(37,99,235,.2)" }} />}
              <div><CompSVG comp={comp} active={active} /></div>
              <div style={{ position: "absolute", top: COMP_H + 2, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "#6a7d95", whiteSpace: "nowrap" }}>
                {comp.label}
              </div>
              {isSelected && (
                <button onClick={e => { e.stopPropagation(); deleteComponent(comp.id); }} style={{ position: "absolute", top: -11, right: -11, width: 19, height: 19, borderRadius: "50%", border: "none", background: "#ef4444", color: "#fff", cursor: "pointer" }}>x</button>
              )}
              {ports.map(port => (
                <div
                  key={port.id}
                  onClick={e => { e.stopPropagation(); handlePortClick(comp.id, port.id); }}
                  style={{
                    position: "absolute",
                    left: COMP_W / 2 + port.dx - PORT_R,
                    top: COMP_H / 2 + port.dy - PORT_R,
                    width: PORT_R * 2,
                    height: PORT_R * 2,
                    borderRadius: "50%",
                    border: "2px solid #60a5fa",
                    background: "rgba(37,99,235,0.16)",
                    cursor: "crosshair",
                  }}
                />
              ))}
            </div>
          );
        })}

        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 8 }}>
          <button onClick={pressStart} style={{ border: "1px solid #15803d", background: "rgba(22,163,74,.15)", color: "#4ade80", borderRadius: 6, fontSize: 10, padding: "6px 10px", cursor: "pointer" }}>
            START
          </button>
          <button onClick={pressStop} style={{ border: "1px solid #9f1239", background: "rgba(190,24,93,.13)", color: "#fb7185", borderRadius: 6, fontSize: 10, padding: "6px 10px", cursor: "pointer" }}>
            STOP
          </button>
        </div>

        <div style={{ position: "absolute", top: 12, right: 12, width: 280, background: "rgba(15,23,42,.85)", border: "1px solid #1e293b", borderRadius: 8, padding: 10, fontSize: 10 }}>
          <div style={{ color: "#facc15", marginBottom: 6 }}>RF-20 Conexión Motor Monofásico</div>
          <div style={{ color: machineContext.isValidConnection ? "#4ade80" : "#fb7185" }}>
            {machineContext.isValidConnection ? "Conexión válida para arranque." : "Conexión incompleta o incorrecta."}
          </div>
          {machineContext.errors.map(err => <div key={err} style={{ color: "#fca5a5", marginTop: 4 }}>- {err}</div>)}
          {machineContext.warnings.map(warn => <div key={warn} style={{ color: "#fcd34d", marginTop: 4 }}>- {warn}</div>)}
        </div>
      </main>

      <aside style={{ width: 320, borderLeft: "1px solid #1e293b", background: "#060d1a", overflowY: "auto" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 10, color: "#7dd3fc", letterSpacing: "0.08em" }}>RF-19 IDENTIFICACIÓN</div>
          {selectedComp ? (
            <>
              <div style={{ marginTop: 8, fontSize: 11, color: "#cbd5e1" }}>{selectedComp.label}</div>
              <div style={{ marginTop: 4, fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>
                {machineInfo[(selectedComp.type as keyof typeof machineInfo)] ?? "Componente de práctica eléctrica."}
              </div>
            </>
          ) : (
            <div style={{ marginTop: 8, fontSize: 10, color: "#64748b" }}>Selecciona un símbolo para ver su descripción educativa.</div>
          )}
        </div>

        <div style={{ padding: 12, borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 10, color: "#7dd3fc", letterSpacing: "0.08em" }}>RF-21 ARRANQUE / PARO</div>
          <div style={{ marginTop: 6, fontSize: 11, color: running ? "#4ade80" : "#94a3b8" }}>
            Estado del motor: {effectiveRunning ? "EN MARCHA" : "DETENIDO"}
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: "#64748b" }}>
            START: {machineContext.start?.isOn ? "activo" : "reposo"} | STOP: {machineContext.stop?.isOn === false ? "abierto" : "cerrado"}
          </div>
        </div>

        <div style={{ padding: 12, borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 10, color: "#7dd3fc", letterSpacing: "0.08em" }}>RF-22 MANTENIMIENTO</div>
          <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
            <button onClick={() => runMaintenance("cleaned", "Limpieza")} style={{ fontSize: 10, padding: 6, border: "1px solid #1e293b", color: "#cbd5e1", background: motorMaintenance.cleaned ? "rgba(34,197,94,.18)" : "transparent", cursor: "pointer" }}>Limpieza</button>
            <button onClick={() => runMaintenance("inspected", "Inspección visual")} style={{ fontSize: 10, padding: 6, border: "1px solid #1e293b", color: "#cbd5e1", background: motorMaintenance.inspected ? "rgba(34,197,94,.18)" : "transparent", cursor: "pointer" }}>Inspección</button>
            <button onClick={() => runMaintenance("tested", "Prueba de funcionamiento")} style={{ fontSize: 10, padding: 6, border: "1px solid #1e293b", color: "#cbd5e1", background: motorMaintenance.tested ? "rgba(34,197,94,.18)" : "transparent", cursor: "pointer" }}>Prueba</button>
            <button onClick={triggerFault} style={{ fontSize: 10, padding: 6, border: "1px solid #7f1d1d", color: "#fca5a5", background: "rgba(153,27,27,.15)", cursor: "pointer" }}>Simular Falla</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: maintenanceComplete ? "#4ade80" : "#facc15" }}>
            Checklist: {maintenanceComplete ? "completo" : "incompleto"}
          </div>
          {motor && <div style={{ marginTop: 4, fontSize: 10, color: motor.health === "fault" ? "#f87171" : motor.health === "warning" ? "#facc15" : "#4ade80" }}>Salud del motor: {motor.health ?? "ok"}</div>}
        </div>

        <div style={{ padding: 12, borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 10, color: "#7dd3fc", letterSpacing: "0.08em" }}>Eventos</div>
          {events.length === 0 && <div style={{ marginTop: 8, fontSize: 10, color: "#64748b" }}>Sin eventos.</div>}
          {events.map(line => (
            <div key={line} style={{ marginTop: 6, fontSize: 10, color: "#94a3b8", lineHeight: 1.4 }}>
              {line}
            </div>
          ))}
        </div>

        <div style={{ padding: 12 }}>
          <button onClick={resetMachine} style={{ width: "100%", border: "1px solid #1e293b", background: "transparent", color: "#94a3b8", fontSize: 10, padding: 8, cursor: "pointer" }}>
            Reiniciar Simulador
          </button>
        </div>
      </aside>
    </div>
  );
}
