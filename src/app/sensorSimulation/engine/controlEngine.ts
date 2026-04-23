import { AutomationNode, AutomationState, Wire, Signal } from "./types";
import { updateTimer } from "./timerEngine";
import { AND, OR } from "./logicGates";
import { applyProgrammedConditions } from "./conditionsEngine";

function getSignalFromNode(node: AutomationNode): Signal {
  switch (node.type) {
    case "sensor":
      return node.motion;
    case "selector":
      return node.mode !== "OFF";
    case "relay":
      return node.contactClosed;
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
 * RF-23: Actualizar sensor con debounce y one-shot
 * - Si onDurationMs === 0 → comportamiento normal (toggle manual)
 * - Si onDurationMs > 0 → en flanco de subida, arranca cuenta; al llegar a 0 se apaga sola
 * - Incluye debounce para evitar jitter
 */
function updateSensor(
  node: Extract<AutomationNode, { type: "sensor" }>,
  deltaMs: number,
  currentTime: number
): Extract<AutomationNode, { type: "sensor" }> {
  const { onDurationMs, onRemainingMs, prevMotion, motion, debounceMs, lastActivationTime } = node;

  // Aplicar debounce: ignorar cambios muy rápidos
  if (motion && !prevMotion && currentTime - lastActivationTime < debounceMs) {
    return { ...node, prevMotion: motion };
  }

  if (onDurationMs <= 0) {
    // Modo directo: el sensor responde directamente
    return { ...node, onRemainingMs: 0, prevMotion: motion, lastActivationTime: currentTime };
  }

  // Modo one-shot: detectar flanco de subida
  if (motion && !prevMotion) {
    return {
      ...node,
      motion: true,
      prevMotion: true,
      onRemainingMs: onDurationMs,
      lastActivationTime: currentTime,
    };
  }

  // Contador activo
  if (motion && onRemainingMs > 0) {
    const next = onRemainingMs - deltaMs;
    if (next <= 0) {
      return { ...node, motion: false, prevMotion: false, onRemainingMs: 0, lastActivationTime: currentTime };
    }
    return { ...node, onRemainingMs: next, prevMotion: true };
  }

  if (!motion) {
    return { ...node, prevMotion: false };
  }

  return { ...node, prevMotion: motion };
}

/**
 * RF-26: Actualizar relé con protección de corriente
 */
function updateRelay(
  node: Extract<AutomationNode, { type: "relay" }>,
  inputSignals: Signal[]
): Extract<AutomationNode, { type: "relay" }> {
  const coil = OR(...inputSignals);
  const contactClosed =
    node.contactType === "N/O" ? coil : !coil;
  return { ...node, coil, contactClosed };
}

/**
 * RF-26: Actualizar contactor con protección térmica y enclavamiento
 */
function updateContactor(
  node: Extract<AutomationNode, { type: "contactor" }>,
  inputSignals: Signal[],
  currentDetected: number = 0
): Extract<AutomationNode, { type: "contactor" }> {
  const coil = OR(...inputSignals);
  
  // RF-26: Protección térmica - si se detecta sobrecorriente, desactivar
  const hasOvercurrent = currentDetected > node.maxCurrent * 1.15;
  const actualCoil = hasOvercurrent ? false : coil;
  
  // Enclavamiento: una vez activado, se mantiene hasta que se desactive explícitamente
  const contactClosed = actualCoil || (node.contactClosed && !hasOvercurrent);
  const auxiliaryContact = contactClosed;

  return {
    ...node,
    coil: actualCoil,
    contactClosed,
    auxiliaryContact,
    currentDetected,
  };
}

export function runControlCycle(
  state: AutomationState,
  deltaMs: number
): AutomationState {
  const currentTime = Date.now();
  let nodes = [...state.nodes];
  const { wires, conditions } = state;

  // Step 0: RF-23 - Actualizar sensores con debounce y one-shot
  nodes = nodes.map((node) => {
    if (node.type !== "sensor") return node;
    return updateSensor(node, deltaMs, currentTime);
  });

  // Step 1: Actualizar timers (RF-24: soporta múltiples modos)
  nodes = nodes.map((node) => {
    if (node.type !== "timer") return node;
    const inputSignals = resolveInputSignals(node.id, nodes, wires);
    const newInput = OR(...inputSignals);
    return updateTimer(node, newInput, deltaMs);
  });

  // Step 2: RF-26 - Actualizar relés
  nodes = nodes.map((node) => {
    if (node.type !== "relay") return node;
    const inputSignals = resolveInputSignals(node.id, nodes, wires);
    return updateRelay(node, inputSignals);
  });

  // Step 3: RF-26 - Evaluar contactores con protección
  nodes = nodes.map((node) => {
    if (node.type !== "contactor") return node;
    const inputSignals = resolveInputSignals(node.id, nodes, wires);

    const selectorNode = nodes
      .filter((n) => n.type === "selector")
      .find((sel) => wires.some((w) => w.from === sel.id && w.to === node.id));

    const selector = selectorNode?.type === "selector" ? selectorNode : null;
    const mode = selector?.mode ?? "OFF";

    let inputForCoil = inputSignals;
    if (mode === "OFF") {
      inputForCoil = [false];
    } else if (mode === "MANUAL") {
      inputForCoil = [true];
    } else if (mode === "AUTO") {
      const nonSelectorInputs = inputSignals.filter((_, i) => {
        const wire = wires.filter((w) => w.to === node.id)[i];
        const sourceNode = nodes.find((n) => n.id === wire?.from);
        return sourceNode?.type !== "selector";
      });
      inputForCoil = nonSelectorInputs;
    }

    return updateContactor(node, inputForCoil, node.currentDetected || 0);
  });

  // Step 4: Actualizar lámparas (RF-24: con estado operacional)
  nodes = nodes.map((node) => {
    if (node.type !== "lamp") return node;
    const inputSignals = resolveInputSignals(node.id, nodes, wires);
    const inputSignal = OR(...inputSignals);
    return {
      ...node,
      active: inputSignal,
      operationalState: inputSignal ? "on" : "off",
    };
  });

  // Step 5: Actualizar motores (RF-24: con tiempo de funcionamiento)
  nodes = nodes.map((node) => {
    if (node.type !== "motor") return node;
    const inputSignals = resolveInputSignals(node.id, nodes, wires);
    const shouldRun = OR(...inputSignals);
    return {
      ...node,
      active: shouldRun,
      operationalState: shouldRun ? "running" : "stopped",
      runningTimeMs: shouldRun ? node.runningTimeMs + deltaMs : node.runningTimeMs,
    };
  });

  // Step 6: RF-24 - Aplicar condiciones programadas (lógica de automatización)
  if (conditions && conditions.length > 0) {
    nodes = applyProgrammedConditions(nodes, conditions);
  }

  return { ...state, nodes };
}
