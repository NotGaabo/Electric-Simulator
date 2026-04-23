/**
 * RF-24: Motor de condiciones programadas
 * Permite automatizar encendido/apagado por condiciones programadas
 * Soporta lógica AND/OR para compuestos complejos
 */

import { AutomationNode, ProgrammedCondition, Signal } from "./types";
import { AND, OR } from "./logicGates";

/**
 * Evalúa una condición programada basándose en los nodos actuales
 * @param condition La condición a evaluar
 * @param nodes Array de nodos para obtener sus señales
 * @returns true si la condición se cumple
 */
export function evaluateCondition(
  condition: ProgrammedCondition,
  nodes: AutomationNode[]
): boolean {
  if (!condition.enabled) return false;

  const inputSignals = condition.inputNodeIds
    .map((id) => getSignalFromNode(nodes.find((n) => n.id === id)))
    .filter((signal) => signal !== null) as Signal[];

  if (inputSignals.length === 0) return false;

  if (condition.operator === "AND") {
    return AND(...inputSignals);
  } else if (condition.operator === "OR") {
    return OR(...inputSignals);
  }

  return false;
}

/**
 * Obtiene la señal actual de un nodo
 * @param node Nodo a evaluar
 * @returns true si el nodo está activo, false si no
 */
export function getSignalFromNode(node: AutomationNode | undefined): Signal | null {
  if (!node) return null;

  switch (node.type) {
    case "sensor":
      return node.motion;
    case "selector":
      return node.mode === "ON" || node.mode === "MANUAL" || node.mode === "AUTO";
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

/**
 * Aplica todas las condiciones programadas a los nodos
 * @param nodes Array de nodos
 * @param conditions Array de condiciones a evaluar
 * @returns Array de nodos actualizado con los efectos de las condiciones
 */
export function applyProgrammedConditions(
  nodes: AutomationNode[],
  conditions: ProgrammedCondition[]
): AutomationNode[] {
  let updatedNodes = [...nodes];

  // Evaluar cada condición y actualizar los nodos de salida
  for (const condition of conditions) {
    const conditionMet = evaluateCondition(condition, updatedNodes);
    const outputNode = updatedNodes.find((n) => n.id === condition.outputNodeId);

    if (!outputNode) continue;

    // Actualizar el nodo de salida basado en el resultado de la condición
    switch (outputNode.type) {
      case "lamp":
        updatedNodes = updatedNodes.map((n) =>
          n.id === outputNode.id && n.type === "lamp"
            ? { ...n, active: conditionMet, operationalState: conditionMet ? "on" : "off" }
            : n
        );
        break;

      case "motor":
        updatedNodes = updatedNodes.map((n) =>
          n.id === outputNode.id && n.type === "motor"
            ? {
                ...n,
                active: conditionMet,
                operationalState: conditionMet ? "running" : "stopped",
                runningTimeMs: conditionMet ? n.runningTimeMs + 100 : n.runningTimeMs,
              }
            : n
        );
        break;

      case "relay":
        updatedNodes = updatedNodes.map((n) =>
          n.id === outputNode.id && n.type === "relay"
            ? { ...n, contactClosed: conditionMet, coil: conditionMet }
            : n
        );
        break;

      case "contactor":
        updatedNodes = updatedNodes.map((n) =>
          n.id === outputNode.id && n.type === "contactor"
            ? { ...n, contactClosed: conditionMet, coil: conditionMet }
            : n
        );
        break;
    }
  }

  return updatedNodes;
}

/**
 * Crea una condición predeterminada para iluminación automática (RF-23, RF-24)
 */
export function createAutoLightingCondition(
  sensorIds: string[],
  lampId: string
): ProgrammedCondition {
  return {
    id: `cond-auto-light-${Date.now()}`,
    name: "Iluminación automática",
    operator: "OR",
    inputNodeIds: sensorIds,
    outputNodeId: lampId,
    enabled: true,
    description:
      "Enciende lámpara si hay movimiento detectado por cualquier sensor",
  };
}

/**
 * Crea una condición para motor con control automático (RF-24)
 */
export function createAutoMotorCondition(
  timerIds: string[],
  motorId: string,
  operator: "AND" | "OR" = "AND"
): ProgrammedCondition {
  return {
    id: `cond-auto-motor-${Date.now()}`,
    name: "Control de motor automático",
    operator,
    inputNodeIds: timerIds,
    outputNodeId: motorId,
    enabled: true,
    description: `Activa motor si ${operator === "AND" ? "TODAS" : "ALGUNA"} las condiciones se cumplen`,
  };
}
