"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AutomationState,
  AutomationNode,
  Wire,
  NodeType,
  Mode,
  WirePoint,
} from "../app/sensorSimulation/engine/types";
import { runControlCycle } from "../app/sensorSimulation/engine/controlEngine";
import { TICK_INTERVAL_MS, DEFAULT_TIMER_DELAY_MS } from "../app/sensorSimulation/constants";

let nodeCounter = 0;
function generateId(prefix: string): string {
  return `${prefix}-${++nodeCounter}-${Date.now()}`;
}

function createNode(type: NodeType, x: number, y: number): AutomationNode {
  const base = { id: generateId(type), position: { x, y } };
  switch (type) {
    case "sensor":
      return {
        ...base,
        type: "sensor",
        sensorType: "PIR",
        motion: false,
        onDurationMs: 0,
        onRemainingMs: 0,
        prevMotion: false,
        sensitivity: 75,
        debounceMs: 100,
        lastActivationTime: 0,
      };
    case "selector":
      return {
        ...base,
        type: "selector",
        mode: "OFF",
        automaticEnabled: false,
      };
    case "relay":
      return {
        ...base,
        type: "relay",
        coil: false,
        contactClosed: false,
        ratedCurrent: 10,
        ratedVoltage: 24,
        contactType: "N/O",
      };
    case "contactor":
      return {
        ...base,
        type: "contactor",
        coil: false,
        contactClosed: false,
        maxCurrent: 50,
        ratedVoltage: 220,
        mainContacts: 3,
        auxiliaryContact: false,
        currentDetected: 0,
      };
    case "timer":
      return {
        ...base,
        type: "timer",
        input: false,
        output: false,
        timerType: "delay-on",
        delayMs: DEFAULT_TIMER_DELAY_MS,
        remainingMs: 0,
      };
    case "lamp":
      return {
        ...base,
        type: "lamp",
        active: false,
        powerW: 40,
        operationalState: "off",
      };
    case "motor":
      return {
        ...base,
        type: "motor",
        active: false,
        powerHP: 1,
        rpmNominal: 1800,
        nominalCurrent: 5,
        operationalState: "stopped",
        runningTimeMs: 0,
      };
    default:
      return {
        ...base,
        type: "sensor",
        sensorType: "PIR",
        motion: false,
        onDurationMs: 0,
        onRemainingMs: 0,
        prevMotion: false,
        sensitivity: 75,
        debounceMs: 100,
        lastActivationTime: 0,
      } as AutomationNode;
  }
}

const INITIAL_STATE: AutomationState = {
  nodes: [],
  wires: [],
  running: false,
  conditions: [],
};

type ScenarioKey = "pasillo" | "bomba" | "linea";

function buildScenario(scenario: ScenarioKey): AutomationState {
  if (scenario === "pasillo") {
    return {
      running: false,
      conditions: [],
      nodes: [
        {
          id: "sensor-pasillo",
          type: "sensor",
          label: "Sensor PIR",
          position: { x: 120, y: 220 },
          sensorType: "PIR",
          motion: false,
          onDurationMs: 5000,
          onRemainingMs: 0,
          prevMotion: false,
          sensitivity: 75,
          debounceMs: 100,
          lastActivationTime: 0,
        },
        {
          id: "lamp-pasillo",
          type: "lamp",
          label: "Luz pasillo",
          position: { x: 420, y: 220 },
          active: false,
          powerW: 40,
          operationalState: "off",
        },
      ],
      wires: [{ id: "wire-pasillo-1", from: "sensor-pasillo", to: "lamp-pasillo" }],
    };
  }

  if (scenario === "bomba") {
    return {
      running: false,
      conditions: [],
      nodes: [
        {
          id: "selector-bomba",
          type: "selector",
          label: "Modo",
          position: { x: 100, y: 200 },
          mode: "AUTO",
          automaticEnabled: true,
        },
        {
          id: "sensor-bomba",
          type: "sensor",
          label: "Nivel",
          position: { x: 100, y: 330 },
          sensorType: "pressure",
          motion: false,
          onDurationMs: 3000,
          onRemainingMs: 0,
          prevMotion: false,
          sensitivity: 75,
          debounceMs: 100,
          lastActivationTime: 0,
        },
        {
          id: "timer-bomba",
          type: "timer",
          label: "Retardo",
          position: { x: 360, y: 330 },
          input: false,
          output: false,
          timerType: "delay-on",
          delayMs: 2000,
          remainingMs: 0,
        },
        {
          id: "contactor-bomba",
          type: "contactor",
          label: "Contactor",
          position: { x: 360, y: 200 },
          coil: false,
          contactClosed: false,
          maxCurrent: 50,
          ratedVoltage: 220,
          mainContacts: 3,
          auxiliaryContact: false,
          currentDetected: 0,
        },
        {
          id: "motor-bomba",
          type: "motor",
          label: "Bomba",
          position: { x: 620, y: 200 },
          active: false,
          powerHP: 1.5,
          rpmNominal: 1800,
          nominalCurrent: 5,
          operationalState: "stopped",
          runningTimeMs: 0,
        },
      ],
      wires: [
        { id: "wire-bomba-1", from: "selector-bomba", to: "contactor-bomba" },
        { id: "wire-bomba-2", from: "sensor-bomba", to: "timer-bomba" },
        { id: "wire-bomba-3", from: "timer-bomba", to: "contactor-bomba" },
        { id: "wire-bomba-4", from: "contactor-bomba", to: "motor-bomba" },
      ],
    };
  }

  return {
    running: false,
    conditions: [],
    nodes: [
      {
        id: "sensor-linea-1",
        type: "sensor",
        label: "Entrada A",
        position: { x: 120, y: 180 },
        sensorType: "ultrasonic",
        motion: false,
        onDurationMs: 1000,
        onRemainingMs: 0,
        prevMotion: false,
        sensitivity: 75,
        debounceMs: 100,
        lastActivationTime: 0,
      },
      {
        id: "sensor-linea-2",
        type: "sensor",
        label: "Entrada B",
        position: { x: 120, y: 330 },
        sensorType: "thermal",
        motion: false,
        onDurationMs: 1000,
        onRemainingMs: 0,
        prevMotion: false,
        sensitivity: 75,
        debounceMs: 100,
        lastActivationTime: 0,
      },
      {
        id: "relay-linea",
        type: "relay",
        label: "Relé OR",
        position: { x: 390, y: 255 },
        coil: false,
        contactClosed: false,
        ratedCurrent: 10,
        ratedVoltage: 24,
        contactType: "N/O",
      },
      {
        id: "lamp-linea",
        type: "lamp",
        label: "Baliza",
        position: { x: 650, y: 255 },
        active: false,
        powerW: 20,
        operationalState: "off",
      },
    ],
    wires: [
      { id: "wire-linea-1", from: "sensor-linea-1", to: "relay-linea" },
      { id: "wire-linea-2", from: "sensor-linea-2", to: "relay-linea" },
      { id: "wire-linea-3", from: "relay-linea", to: "lamp-linea" },
    ],
  };
}

export function useAutomationSimulator() {
  const [state, setState] = useState<AutomationState>(INITIAL_STATE);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Loop de simulación
  useEffect(() => {
    if (!state.running) return;
    const interval = setInterval(() => {
      setState((prev) => runControlCycle(prev, TICK_INTERVAL_MS));
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.running]);

  const startSimulation = useCallback(() => {
    setState((prev) => ({ ...prev, running: true }));
  }, []);

  const stopSimulation = useCallback(() => {
    setState((prev) => ({ ...prev, running: false }));
  }, []);

  const resetSimulation = useCallback(() => {
    setState(INITIAL_STATE);
    setSelectedNodeId(null);
    setConnectingFrom(null);
  }, []);

  const loadScenario = useCallback((scenario: ScenarioKey) => {
    setState(buildScenario(scenario));
    setSelectedNodeId(null);
    setConnectingFrom(null);
  }, []);

  const addNode = useCallback((type: NodeType, x: number, y: number) => {
    const node = createNode(type, x, y);
    setState((prev) => ({ ...prev, nodes: [...prev.nodes, node] }));
  }, []);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id ? { ...n, position: { x, y } } : n
      ),
    }));
  }, []);

  const removeNode = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== id),
      wires: prev.wires.filter((w) => w.from !== id && w.to !== id),
    }));
    setSelectedNodeId((prev) => (prev === id ? null : prev));
  }, []);

  const toggleSensor = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id && n.type === "sensor"
          ? n.onDurationMs > 0
            ? n.motion
              ? { ...n, onRemainingMs: n.onDurationMs, prevMotion: true }
              : {
                  ...n,
                  motion: true,
                  onRemainingMs: n.onDurationMs,
                  prevMotion: true,
                }
            : { ...n, motion: !n.motion }
          : n
      ),
    }));
  }, []);

  const setSelectorMode = useCallback((id: string, mode: Mode) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id && n.type === "selector" ? { ...n, mode } : n
      ),
    }));
  }, []);

  /** Configura el tiempo one-shot de un sensor (en milisegundos). 0 = sin timer */
  const setSensorDuration = useCallback((id: string, durationMs: number) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === id && n.type === "sensor"
          ? {
              ...n,
              onDurationMs: Math.max(0, durationMs),
              onRemainingMs: 0,
              motion: false,
              prevMotion: false,
            }
          : n
      ),
    }));
  }, []);

  const selectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const beginConnect = useCallback((fromId: string) => {
    setConnectingFrom(fromId);
  }, []);

  const finishConnect = useCallback(
    (toId: string) => {
      if (!connectingFrom || connectingFrom === toId) {
        setConnectingFrom(null);
        return;
      }
      const wire: Wire = {
        id: generateId("wire"),
        from: connectingFrom,
        to: toId,
      };
      setState((prev) => {
        const exists = prev.wires.some(
          (w) => w.from === wire.from && w.to === wire.to
        );
        if (exists) return prev;
        return { ...prev, wires: [...prev.wires, wire] };
      });
      setConnectingFrom(null);
    },
    [connectingFrom]
  );

  const cancelConnect = useCallback(() => {
    setConnectingFrom(null);
  }, []);

  const removeWire = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      wires: prev.wires.filter((w) => w.id !== id),
    }));
  }, []);

  const insertWirePoint = useCallback((id: string, point: WirePoint, index?: number) => {
    setState((prev) => ({
      ...prev,
      wires: prev.wires.map((w) => {
        if (w.id !== id) return w;
        const next = [...(w.points ?? [])];
        const insertAt =
          typeof index === "number" ? Math.max(0, Math.min(index, next.length)) : next.length;
        next.splice(insertAt, 0, point);
        return { ...w, points: next };
      }),
    }));
  }, []);

  const updateWirePoint = useCallback((id: string, index: number, point: WirePoint) => {
    setState((prev) => ({
      ...prev,
      wires: prev.wires.map((w) => {
        if (w.id !== id) return w;
        const next = [...(w.points ?? [])];
        if (!next[index]) return w;
        next[index] = point;
        return { ...w, points: next };
      }),
    }));
  }, []);

  return {
    state,
    connectingFrom,
    selectedNodeId,
    startSimulation,
    stopSimulation,
    resetSimulation,
    loadScenario,
    addNode,
    moveNode,
    removeNode,
    toggleSensor,
    setSelectorMode,
    setSensorDuration,
    selectNode,
    beginConnect,
    finishConnect,
    cancelConnect,
    removeWire,
    insertWirePoint,
    updateWirePoint,
  };
}
