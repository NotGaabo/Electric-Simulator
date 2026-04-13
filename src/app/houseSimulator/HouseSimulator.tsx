"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COMPONENT_DEFINITIONS,
  PALETTE_ITEMS,
} from "./constants";
import {
  buildOutletPorts,
  createId,
  hasActiveCircuits,
} from "./utils";
import {
  ComponentInstance,
  ComponentType,
  Connection,
  ConductorType,
  Circuit,
  OutletWiringMode,
  ValidationIssue,
} from "./types";
import { validateHouseState } from "./validation";

const DEFAULT_POSITION = { x: 120, y: 120 };

export default function HouseSimulator() {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  const [newComponentType, setNewComponentType] =
    useState<ComponentType>("Outlet");
  const [newOutletMode, setNewOutletMode] =
    useState<OutletWiringMode>("nonPolarized");
  const [newComponentCircuitId, setNewComponentCircuitId] = useState<string>("");

  const [fromCompId, setFromCompId] = useState<string>("");
  const [fromPortId, setFromPortId] = useState<string>("");
  const [toCompId, setToCompId] = useState<string>("");
  const [toPortId, setToPortId] = useState<string>("");
  const [connectionCircuitId, setConnectionCircuitId] = useState<string>("");
  const [conductor, setConductor] = useState<ConductorType>("L");

  useEffect(() => {
    setIssues(
      validateHouseState({
        circuits,
        components,
        connections,
      }),
    );
  }, [circuits, components, connections]);

  const validationActive = hasActiveCircuits(circuits);

  const fromPorts = useMemo(() => {
    return components.find((comp) => comp.id === fromCompId)?.ports ?? [];
  }, [components, fromCompId]);

  const toPorts = useMemo(() => {
    return components.find((comp) => comp.id === toCompId)?.ports ?? [];
  }, [components, toCompId]);

  const handleAddCircuit = () => {
    const newCircuit: Circuit = {
      id: createId("circuit"),
      name: `Circuito ${circuits.length + 1}`,
      breakerOn: true,
      voltage: 120,
    };
    setCircuits((prev) => [...prev, newCircuit]);
    setNewComponentCircuitId(newCircuit.id);
    setConnectionCircuitId(newCircuit.id);
  };

  const handleAddComponent = () => {
    const definition = COMPONENT_DEFINITIONS[newComponentType];
    const ports =
      newComponentType === "Outlet"
        ? buildOutletPorts(newOutletMode)
        : definition.ports.map((port) => ({ ...port }));

    const component: ComponentInstance = {
      id: createId("comp"),
      type: newComponentType,
      x: DEFAULT_POSITION.x,
      y: DEFAULT_POSITION.y,
      circuitId: newComponentCircuitId || undefined,
      outletMode: newComponentType === "Outlet" ? newOutletMode : undefined,
      ports,
      properties: {
        powerW: definition.defaultPowerW ?? 0,
        voltage: definition.defaultVoltage ?? 0,
      },
    };

    setComponents((prev) => [...prev, component]);
  };

  const handleAddConnection = () => {
    if (
      !fromCompId ||
      !fromPortId ||
      !toCompId ||
      !toPortId ||
      !connectionCircuitId
    ) {
      return;
    }

    if (fromCompId === toCompId && fromPortId === toPortId) {
      return;
    }

    const connection: Connection = {
      id: createId("conn"),
      circuitId: connectionCircuitId,
      fromCompId,
      fromPortId,
      toCompId,
      toPortId,
      conductor,
    };
    setConnections((prev) => [...prev, connection]);
  };

  const updateComponentCircuit = (componentId: string, circuitId: string) => {
    setComponents((prev) =>
      prev.map((component) =>
        component.id === componentId
          ? { ...component, circuitId: circuitId || undefined }
          : component,
      ),
    );
  };

  const updateOutletMode = (
    componentId: string,
    mode: OutletWiringMode,
  ) => {
    const ports = buildOutletPorts(mode);
    const validPortIds = new Set(ports.map((port) => port.id));

    setComponents((prev) =>
      prev.map((component) =>
        component.id === componentId
          ? { ...component, outletMode: mode, ports }
          : component,
      ),
    );

    setConnections((prev) =>
      prev.filter((connection) => {
        if (connection.fromCompId === componentId) {
          return validPortIds.has(connection.fromPortId);
        }
        if (connection.toCompId === componentId) {
          return validPortIds.has(connection.toPortId);
        }
        return true;
      }),
    );
  };

  return (
    <div className="flex h-full flex-col gap-6 p-6 text-slate-100">
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-[260px] rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="text-lg font-semibold">Paleta</h2>
          <p className="text-sm text-slate-400">
            Componentes disponibles
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {PALETTE_ITEMS.map((item) => (
              <li
                key={item.type}
                className="flex items-center justify-between rounded-lg border border-slate-700 px-3 py-2"
              >
                <span>{item.label}</span>
                <span className="text-xs text-slate-400">{item.shortLabel}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-[320px] flex-1 rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="text-lg font-semibold">Nuevo componente</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <label className="grid gap-1">
              Tipo
              <select
                className="rounded border border-slate-700 bg-slate-800 p-2"
                value={newComponentType}
                onChange={(event) =>
                  setNewComponentType(event.target.value as ComponentType)
                }
              >
                {Object.values(COMPONENT_DEFINITIONS).map((definition) => (
                  <option key={definition.type} value={definition.type}>
                    {definition.label}
                  </option>
                ))}
              </select>
            </label>

            {newComponentType === "Outlet" && (
              <label className="grid gap-1">
                Modo del tomacorriente
                <select
                  className="rounded border border-slate-700 bg-slate-800 p-2"
                  value={newOutletMode}
                  onChange={(event) =>
                    setNewOutletMode(event.target.value as OutletWiringMode)
                  }
                >
                  <option value="nonPolarized">No polarizado</option>
                  <option value="feedThrough">Feed-through</option>
                </select>
              </label>
            )}

            <label className="grid gap-1">
              Circuito asignado
              <select
                className="rounded border border-slate-700 bg-slate-800 p-2"
                value={newComponentCircuitId}
                onChange={(event) => setNewComponentCircuitId(event.target.value)}
              >
                <option value="">Sin circuito</option>
                {circuits.map((circuit) => (
                  <option key={circuit.id} value={circuit.id}>
                    {circuit.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="rounded bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500"
              onClick={handleAddComponent}
            >
              Agregar componente
            </button>
          </div>
        </div>

        <div className="min-w-[240px] rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="text-lg font-semibold">Circuitos</h2>
          <button
            type="button"
            className="mt-3 w-full rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            onClick={handleAddCircuit}
          >
            Agregar circuito
          </button>
          <ul className="mt-4 space-y-2 text-sm">
            {circuits.length === 0 && (
              <li className="text-slate-400">Sin circuitos</li>
            )}
            {circuits.map((circuit) => (
              <li
                key={circuit.id}
                className="rounded border border-slate-700 px-3 py-2"
              >
                {circuit.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="text-lg font-semibold">Componentes</h2>
          <div className="mt-3 space-y-3 text-sm">
            {components.length === 0 && (
              <p className="text-slate-400">No hay componentes agregados.</p>
            )}
            {components.map((component) => (
              <div
                key={component.id}
                className="rounded border border-slate-700 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{component.type}</div>
                    <div className="text-xs text-slate-400">{component.id}</div>
                  </div>
                  <label className="flex items-center gap-2 text-xs">
                    Circuito
                    <select
                      className="rounded border border-slate-700 bg-slate-800 p-1 text-xs"
                      value={component.circuitId ?? ""}
                      onChange={(event) =>
                        updateComponentCircuit(component.id, event.target.value)
                      }
                    >
                      <option value="">Sin circuito</option>
                      {circuits.map((circuit) => (
                        <option key={circuit.id} value={circuit.id}>
                          {circuit.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {component.type === "Outlet" && (
                    <label className="flex items-center gap-2 text-xs">
                      Modo
                      <select
                        className="rounded border border-slate-700 bg-slate-800 p-1 text-xs"
                        value={component.outletMode ?? "nonPolarized"}
                        onChange={(event) =>
                          updateOutletMode(
                            component.id,
                            event.target.value as OutletWiringMode,
                          )
                        }
                      >
                        <option value="nonPolarized">No polarizado</option>
                        <option value="feedThrough">Feed-through</option>
                      </select>
                    </label>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                  {component.ports.map((port) => (
                    <span
                      key={port.id}
                      className="rounded border border-slate-700 px-2 py-1"
                    >
                      {port.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="text-lg font-semibold">Conexion rapida</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <label className="grid gap-1">
              Desde componente
              <select
                className="rounded border border-slate-700 bg-slate-800 p-2"
                value={fromCompId}
                onChange={(event) => {
                  setFromCompId(event.target.value);
                  setFromPortId("");
                }}
              >
                <option value="">Seleccionar</option>
                {components.map((component) => (
                  <option key={component.id} value={component.id}>
                    {component.type} ({component.id})
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              Puerto origen
              <select
                className="rounded border border-slate-700 bg-slate-800 p-2"
                value={fromPortId}
                onChange={(event) => setFromPortId(event.target.value)}
              >
                <option value="">Seleccionar</option>
                {fromPorts.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              Conductor
              <select
                className="rounded border border-slate-700 bg-slate-800 p-2"
                value={conductor}
                onChange={(event) =>
                  setConductor(event.target.value as ConductorType)
                }
              >
                <option value="L">L</option>
                <option value="N">N</option>
                <option value="PE">PE</option>
              </select>
            </label>

            <label className="grid gap-1">
              Hacia componente
              <select
                className="rounded border border-slate-700 bg-slate-800 p-2"
                value={toCompId}
                onChange={(event) => {
                  setToCompId(event.target.value);
                  setToPortId("");
                }}
              >
                <option value="">Seleccionar</option>
                {components.map((component) => (
                  <option key={component.id} value={component.id}>
                    {component.type} ({component.id})
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              Puerto destino
              <select
                className="rounded border border-slate-700 bg-slate-800 p-2"
                value={toPortId}
                onChange={(event) => setToPortId(event.target.value)}
              >
                <option value="">Seleccionar</option>
                {toPorts.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              Circuito conexion
              <select
                className="rounded border border-slate-700 bg-slate-800 p-2"
                value={connectionCircuitId}
                onChange={(event) => setConnectionCircuitId(event.target.value)}
              >
                <option value="">Seleccionar</option>
                {circuits.map((circuit) => (
                  <option key={circuit.id} value={circuit.id}>
                    {circuit.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              onClick={handleAddConnection}
            >
              Crear conexion
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Validacion</h2>
          <span className="text-xs text-slate-400">
            {validationActive ? "Activa" : "Inactiva (sin circuitos)"}
          </span>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          {issues.length === 0 && (
            <p className="text-emerald-400">
              Sin errores detectados.
            </p>
          )}
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="rounded border border-slate-700 px-3 py-2"
            >
              <div className="font-semibold text-rose-400">{issue.level}</div>
              <div>{issue.message}</div>
              {(issue.componentId || issue.connectionId) && (
                <div className="mt-1 text-xs text-slate-400">
                  {issue.componentId && `Comp: ${issue.componentId} `}
                  {issue.connectionId && `Conn: ${issue.connectionId}`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
