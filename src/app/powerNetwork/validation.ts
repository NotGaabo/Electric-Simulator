import { Conductor, Pole, Trench, UndergroundCable, ValidationResult } from "./types";
import { getTensionWarning } from "./utils";

export function validateAerialNetwork(
  poles: Pole[],
  conductors: Conductor[]
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (poles.length < 2) errors.push("Se requieren al menos 2 postes para formar una red aérea");

  conductors.forEach((c) => {
    const w = getTensionWarning(c);
    if (w.type === "too_loose") warnings.push(`Conductor ${c.label}: tensión insuficiente, puede tocar el suelo`);
    if (w.type === "too_tight") warnings.push(`Conductor ${c.label}: tensión excesiva, riesgo de rotura`);
    if (!c.protected && c.voltage === "MV") warnings.push(`Conductor ${c.label}: MV sin protección mecánica`);
  });

  return { valid: errors.length === 0, warnings, errors };
}

export function validateUndergroundNetwork(
  trenches: Trench[],
  cables: UndergroundCable[]
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  trenches.forEach((t) => {
    if (!t.covered) warnings.push(`Zanja ${t.id.slice(0, 6)} sin cubrir — peligro de seguridad`);
    if (t.depth < 0.6) errors.push(`Zanja ${t.id.slice(0, 6)} muy superficial (mín. 0.6m)`);
  });

  cables.forEach((c) => {
    if (!c.hasConduit && c.voltage === "MV") warnings.push(`Cable ${c.label}: MV sin conducto protector`);
    if (!c.hasMechanicalProtection) warnings.push(`Cable ${c.label}: sin protección mecánica`);
  });

  return { valid: errors.length === 0, warnings, errors };
}