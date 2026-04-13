import { TimerNode, Signal } from "./types";

/**
 * Actualiza el estado de un TimerNode dado su nueva señal de entrada y el delta de tiempo.
 * - Cuando input sube (OFF→ON): inicia cuenta regresiva desde delayMs
 * - Cuando input baja (ON→OFF): resetea output y remainingMs
 * - Output se activa al llegar remainingMs a 0 mientras input estaba activo
 */
export function updateTimer(
  node: TimerNode,
  newInput: Signal,
  deltaMs: number
): TimerNode {
  // Flanco de subida → iniciar temporizador
  if (newInput && !node.input) {
    return {
      ...node,
      input: true,
      output: false,
      remainingMs: node.delayMs,
    };
  }

  // Señal cae → resetear
  if (!newInput) {
    return {
      ...node,
      input: false,
      output: false,
      remainingMs: 0,
    };
  }

  // Señal activa y contando
  if (newInput && node.remainingMs > 0) {
    const next = node.remainingMs - deltaMs;
    if (next <= 0) {
      return { ...node, remainingMs: 0, output: true };
    }
    return { ...node, remainingMs: next };
  }

  return node;
}