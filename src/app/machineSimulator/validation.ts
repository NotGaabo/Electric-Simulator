import { PlacedComp, CompatResult, CompatLevel, CompType, Connection } from "./type"; 

export function checkCompatibility(placed: PlacedComp[]): CompatResult {
  const msgs: string[] = [];
  let level: CompatLevel = "ok";

  const src   = placed.find(c=>c.type==="source");
  const trafo = placed.find(c=>c.type==="transformer");
  const motor = placed.find(c=>c.type==="motor");
  const brk   = placed.find(c=>c.type==="breaker");

  if (!src||!trafo||!motor) return { level:"ok", messages:[] };

  const V1  = src.props.voltage??220;
  const n1  = trafo.props.turns1??220;
  const n2  = trafo.props.turns2??110;
  const η   = trafo.props.efficiency??0.95;
  const V2  = n2>0 ? V1*(n2/n1) : 0;
  const Vr  = motor.props.ratedVoltage??110;
  const Pr  = motor.props.ratedPower??500;
  const pf  = motor.props.powerFactor??0.85;
  const Ir  = Pr/(Vr*pf);   // corriente nominal motor
  const I1  = (Ir*n2)/(n1*η);  // corriente en primario
  const Ibk = brk?.props.ratedCurrent??Infinity;

  // ── Tensión secundaria vs tensión nominal del motor ────────────────────────
  const vRatio = V2/Vr;
  if (vRatio<0.85) {
    msgs.push(`⚠ V₂ secundaria (${V2.toFixed(0)}V) es muy baja para el motor (${Vr}V) — el motor no arrancará correctamente.`);
    level = "error";
  } else if (vRatio<0.95) {
    msgs.push(`⚠ V₂ secundaria (${V2.toFixed(0)}V) está un ${((1-vRatio)*100).toFixed(1)}% por debajo del nominal del motor — rendimiento reducido.`);
    if (level==="ok") level="warning";
  } else if (vRatio>1.1) {
    msgs.push(`⚠ V₂ secundaria (${V2.toFixed(0)}V) supera el nominal del motor (${Vr}V) en un ${((vRatio-1)*100).toFixed(1)}% — riesgo de daño al aislamiento.`);
    level = "error";
  }

  // ── Relación de transformación: elevadora vs reductora ────────────────────
  if (n1===n2) {
    msgs.push("ℹ Transformador de relación 1:1 (aislamiento galvánico, sin cambio de tensión).");
  } else if (n2>n1) {
    msgs.push(`ℹ Transformador elevador: V₂=${V2.toFixed(0)}V > V₁=${V1}V.`);
  }

  // ── Disyuntor subdimensionado ──────────────────────────────────────────────
  if (brk && I1>Ibk) {
    msgs.push(`⚠ Disyuntor (${Ibk}A) subdimensionado — la corriente de trabajo estimada en primario es ${I1.toFixed(2)}A.`);
    level = "error";
  } else if (brk && I1>Ibk*0.8) {
    msgs.push(`⚠ Disyuntor (${Ibk}A) al ${((I1/Ibk)*100).toFixed(0)}% de su capacidad — considera uno de mayor calibre.`);
    if (level==="ok") level="warning";
  }

  // ── Eficiencia baja ────────────────────────────────────────────────────────
  if (η<0.7) {
    msgs.push(`⚠ Eficiencia del transformador muy baja (${(η*100).toFixed(0)}%) — pérdidas excesivas.`);
    if (level==="ok") level="warning";
  }

  // ── Frecuencia estándar ────────────────────────────────────────────────────
  const f = src.props.frequency??60;
  if (f!==50&&f!==60) {
    msgs.push(`ℹ Frecuencia inusual (${f}Hz) — verifique que el transformador y motor soporten esta frecuencia.`);
    if (level==="ok") level="warning";
  }

  if (msgs.length===0) msgs.push("✓ Todos los parámetros son compatibles entre sí.");
  return { level, messages: msgs };
}

// ─── Validador de conexiones ───────────────────────────────────────────────────
export function validateCircuit(placed: PlacedComp[], connections: Connection[]): string[] {
  const byType = (t:CompType) => placed.find(c=>c.type===t);
  const hasWire = (a:string,b:string) =>
    connections.some(w=>(w.from===a&&w.to===b)||(w.from===b&&w.to===a));
  const errors: string[] = [];
  const source=byType("source"), trafo=byType("transformer"), motor=byType("motor"), breaker=byType("breaker");

  if (!source) errors.push("Falta la Fuente AC.");
  if (!trafo)  errors.push("Falta el Transformador.");
  if (!motor)  errors.push("Falta el Motor AC.");
  if (!source||!trafo||!motor) return errors;

  const srcToTrafoDirect = hasWire(`${source.id}-right`,`${trafo.id}-left`);
  const srcToTrafoViaBreaker = breaker
    ? hasWire(`${source.id}-right`,`${breaker.id}-left`) && hasWire(`${breaker.id}-right`,`${trafo.id}-left`)
    : false;

  if (!srcToTrafoDirect && !srcToTrafoViaBreaker) {
    if (breaker) {
      if (!hasWire(`${source.id}-right`,`${breaker.id}-left`)) errors.push("Conecta Fuente (right) → Disyuntor (left).");
      if (!hasWire(`${breaker.id}-right`,`${trafo.id}-left`)) errors.push("Conecta Disyuntor (right) → Transformador (left).");
    } else {
      errors.push("Conecta Fuente (right) → Transformador (left).");
    }
  }
  if (!hasWire(`${trafo.id}-right`,`${motor.id}-left`)) errors.push("Conecta Transformador (right) → Motor (left).");
  if (!hasWire(`${motor.id}-right`,`${source.id}-left`)) errors.push("Cierra el circuito: Motor (right) → Fuente (left).");
  if (breaker && breaker.props.isOn===false) errors.push("⚠ Disyuntor ABIERTO — el circuito está interrumpido.");
  return errors;
}