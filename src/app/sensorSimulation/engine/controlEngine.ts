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

export function runControlCycle(
  state: AutomationState,
  deltaMs: number
): AutomationState {
  let nodes = [...state.nodes];
  const { wires } = state;

  // Step 1: Update timers based on their inputs
  nodes = nodes.map((node) => {
    if (node.type !== "timer") return node;
    const inputSignals = resolveInputSignals(node.id, nodes, wires);
    const newInput = OR(...inputSignals);
    return updateTimer(node, newInput, deltaMs);
  });

  // Step 2: Evaluate contactors (coil energization → contact closure)
  nodes = nodes.map((node) => {
    if (node.type !== "contactor") return node;

    const inputSignals = resolveInputSignals(node.id, nodes, wires);

    // Find selector connected to this contactor
    const selectorSignal = nodes
      .filter((n) => n.type === "selector")
      .find((sel) =>
        wires.some((w) => w.from === sel.id && w.to === node.id)
      );

    const selector = selectorSignal?.type === "selector" ? selectorSignal : null;
    const mode = selector?.mode ?? "OFF";

    let coil: Signal = false;

    if (mode === "OFF") {
      coil = false;
    } else if (mode === "MANUAL") {
      coil = true;
    } else if (mode === "AUTO") {
      // In AUTO, coil = AND of all non-selector inputs
      const nonSelectorInputs = inputSignals.filter((_, i) => {
        const wire = wires.filter((w) => w.to === node.id)[i];
        const sourceNode = nodes.find((n) => n.id === wire?.from);
        return sourceNode?.type !== "selector";
      });
      coil = nonSelectorInputs.length > 0 ? AND(...nonSelectorInputs) : false;
    }

    return {
      ...node,
      coil,
      contactClosed: coil,
    };
  });

  // Step 3: Activate loads
  nodes = nodes.map((node) => {
    if (node.type !== "lamp" && node.type !== "motor") return node;
    const inputSignals = resolveInputSignals(node.id, nodes, wires);
    const active = OR(...inputSignals);
    return { ...node, active };
  });

  return { ...state, nodes };
}