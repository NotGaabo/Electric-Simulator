import { AutomationNode, AutomationState, Wire, Signal } from "./types";
import { updateTimer } from "./timerEngine";
import { AND, OR } from "./logicGates";

function getSignalFromNode(node: AutomationNode): Signal {
  switch (node.type) {
    case "sensor":
      return node.motion;
    case "selector":
      return node.mode !== "OFF";
    case "contactor":
      return node.contactClosed;
    case "timer":
      return node.output;
    case "lamp":
      return node.active;
    case "motor":
      return node.active;
    default:
      return false;
  }
}

function resolveInputSignals(
  nodeId: string,
  nodes: AutomationNode[],
  wires: Wire[]
): Signal[] {
  const incomingWires = wires.filter((w) => w.to === nodeId);
  return incomingWires.map((wire) => {
    const sourceNode = nodes.find((n) => n.id === wire.from);
    return sourceNode ? getSignalFromNode(sourceNode) : false;
  });
}

/**
 * Lógica one-shot para Sensor:
 * - Si onDurationMs === 0 → comportamiento normal (toggle manual)
 * - Si onDurationMs > 0 → en flanco de subida, arranca cuenta; al llegar a 0 se apaga sola
 */
function updateSensor(node: Extract<AutomationNode, { type: "sensor" }>, deltaMs: number) {
  const { onDurationMs, onRemainingMs, prevMotion, motion } = node;

  if (onDurationMs <= 0) {
    return { ...node, onRemainingMs: 0, prevMotion: motion };
  }

  if (motion && !prevMotion) {
    return {
      ...node,
      motion: true,
      prevMotion: true,
      onRemainingMs: onDurationMs,
    };
  }

  if (motion && onRemainingMs > 0) {
    const next = onRemainingMs - deltaMs;
    if (next <= 0) {
      return { ...node, motion: false, prevMotion: false, onRemainingMs: 0 };
    }
    return { ...node, onRemainingMs: next, prevMotion: true };
  }

  if (!motion) {
    return { ...node, prevMotion: false };
  }

  return { ...node, prevMotion: motion };
}

export function runControlCycle(
  state: AutomationState,
  deltaMs: number
): AutomationState {
  let nodes = [...state.nodes];
  const { wires } = state;

  // Step 0: Actualizar sensores (one-shot opcional)
  nodes = nodes.map((node) => {
    if (node.type !== "sensor") return node;
    return updateSensor(node, deltaMs);
  });

  // Step 1: Actualizar timers
  nodes = nodes.map((node) => {
    if (node.type !== "timer") return node;
    const inputSignals = resolveInputSignals(node.id, nodes, wires);
    const newInput = OR(...inputSignals);
    return updateTimer(node, newInput, deltaMs);
  });

  // Step 2: Evaluar contactores
  nodes = nodes.map((node) => {
    if (node.type !== "contactor") return node;
    const inputSignals = resolveInputSignals(node.id, nodes, wires);

    const selectorNode = nodes
      .filter((n) => n.type === "selector")
      .find((sel) => wires.some((w) => w.from === sel.id && w.to === node.id));

    const selector = selectorNode?.type === "selector" ? selectorNode : null;
    const mode = selector?.mode ?? "OFF";

    let coil: Signal = false;
    if (mode === "OFF") {
      coil = false;
    } else if (mode === "MANUAL") {
      coil = true;
    } else if (mode === "AUTO") {
      const nonSelectorInputs = inputSignals.filter((_, i) => {
        const wire = wires.filter((w) => w.to === node.id)[i];
        const sourceNode = nodes.find((n) => n.id === wire?.from);
        return sourceNode?.type !== "selector";
      });
      coil = nonSelectorInputs.length > 0 ? AND(...nonSelectorInputs) : false;
    }

    return { ...node, coil, contactClosed: coil };
  });

  // Step 3: Activar lámparas (comportamiento directo)
  nodes = nodes.map((node) => {
    if (node.type !== "lamp") return node;
    const inputSignals = resolveInputSignals(node.id, nodes, wires);
    const inputSignal = OR(...inputSignals);
    return { ...node, active: inputSignal };
  });

  // Step 4: Activar motores (comportamiento directo)
  nodes = nodes.map((node) => {
    if (node.type !== "motor") return node;
    const inputSignals = resolveInputSignals(node.id, nodes, wires);
    return { ...node, active: OR(...inputSignals) };
  });

  return { ...state, nodes };
}
