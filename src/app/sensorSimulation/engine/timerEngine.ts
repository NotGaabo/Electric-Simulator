import { TimerNode } from "./types";

export function updateTimer(
  timer: TimerNode,
  newInput: boolean,
  deltaMs: number
): TimerNode {
  if (newInput) {
    return {
      ...timer,
      input: true,
      output: true,
      remainingMs: timer.delayMs,
    };
  }
  
  if (!newInput && timer.remainingMs > 0) {
    const remaining = Math.max(0, timer.remainingMs - deltaMs);
    return {
      ...timer,
      input: false,
      output: remaining > 0,
      remainingMs: remaining,
    };
  }

  return {
    ...timer,
    input: false,
    output: false,
    remainingMs: 0,
  };
}