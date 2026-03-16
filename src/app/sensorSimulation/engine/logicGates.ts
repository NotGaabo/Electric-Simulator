export const AND = (...inputs: boolean[]): boolean =>
  inputs.length > 0 && inputs.every(Boolean);

export const OR = (...inputs: boolean[]): boolean =>
  inputs.some(Boolean);

export const NOT = (input: boolean): boolean => !input;