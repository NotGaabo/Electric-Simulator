import { useState, useCallback, useRef } from "react";
import { CompProps, CompType, CompDef, PlacedComp, Connection, CompatLevel, TransformerCircuit, PhysicsResult, CompatResult } from './type'
import {GRID, COMP_W, COMP_H, COMP_DEFS} from "./constants"

// ─── Símbolos SVG ─────────────────────────────────────────────────────────────
interface SymProps { type: CompType; active: boolean; props: CompProps; selected: boolean; }

function CompSymbol({ type, active, props, selected }: SymProps) {
  const W = 140, H = 80, MID = 40;
  const sel = selected ? "drop-shadow(0 0 6px #3b82f6)" : "";

  if (type === "source") {
    const c = active ? "#f59e0b" : "#475569";
    const glow = active ? `drop-shadow(0 0 5px #f59e0b88) ${sel}` : sel;
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ filter: glow || undefined }}>
        <line x1={0} y1={MID} x2={42} y2={MID} stroke={c} strokeWidth={2}/>
        <circle cx={70} cy={MID} r={26} fill="#0a1a28" stroke={c} strokeWidth={2}/>
        <path d="M58,40 Q61,33 64,40 Q67,47 70,40 Q73,33 76,40 Q79,47 82,40"
          fill="none" stroke={active?"#fbbf24":"#64748b"} strokeWidth={2} strokeLinecap="round"/>
        <line x1={96} y1={MID} x2={W} y2={MID} stroke={c} strokeWidth={2}/>
        <text x={6}   y={MID-8} fill="#475569" fontSize={9} fontFamily="monospace">L</text>
        <text x={W-14} y={MID-8} fill="#475569" fontSize={9} fontFamily="monospace">N</text>
        <text x={70} y={H-3} textAnchor="middle" fill="#334155" fontSize={8} fontFamily="monospace">
          {props.voltage??220}V / {props.frequency??60}Hz
        </text>
      </svg>
    );
  }

  if (type === "transformer") {
    const n1=props.turns1??220, n2=props.turns2??110;
    const ratio = n2>0?(n1/n2).toFixed(2):"∞";
    const cp = active?"#818cf8":"#475569", cs = active?"#c084fc":"#334155", ck = active?"#6366f1":"#1e293b";
    const glow = active ? `drop-shadow(0 0 6px #818cf888) ${sel}` : sel;
    const archP = [24,34,44,54].map(cx=>`M${cx},${MID} Q${cx+5},${MID-12} ${cx+10},${MID}`);
    const archS = [76,87,98].map(cx=>`M${cx},${MID} Q${cx+5},${MID-12} ${cx+11},${MID}`);
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ filter: glow || undefined }}>
        <line x1={0} y1={MID} x2={24} y2={MID} stroke={cp} strokeWidth={2}/>
        {archP.map((d,i)=><path key={i} d={d} fill="none" stroke={cp} strokeWidth={2.2}/>)}
        <line x1={65} y1={MID-18} x2={65} y2={MID+12} stroke={ck} strokeWidth={3}/>
        <line x1={69} y1={MID-18} x2={69} y2={MID+12} stroke={ck} strokeWidth={3}/>
        <line x1={73} y1={MID-18} x2={73} y2={MID+12} stroke={ck} strokeWidth={3}/>
        {archS.map((d,i)=><path key={i} d={d} fill="none" stroke={cs} strokeWidth={2.2}/>)}
        <line x1={109} y1={MID} x2={W} y2={MID} stroke={cs} strokeWidth={2}/>
        <circle cx={26} cy={MID-15} r={3} fill={cp}/>
        <circle cx={78} cy={MID-15} r={3} fill={cs}/>
        <text x={70} y={14} textAnchor="middle" fill={active?"#a5b4fc":"#334155"} fontSize={9} fontFamily="monospace">a={ratio}</text>
        <text x={16} y={H-3} fill="#334155" fontSize={8} fontFamily="monospace">P</text>
        <text x={W-16} y={H-3} fill="#334155" fontSize={8} fontFamily="monospace">S</text>
        <text x={70} y={H-3} textAnchor="middle" fill="#1e3a52" fontSize={8} fontFamily="monospace">{n1}/{n2} vueltas</text>
      </svg>
    );
  }

  if (type === "motor") {
    const c = active?"#34d399":"#334155";
    const glow = active ? `drop-shadow(0 0 7px #34d39966) ${sel}` : sel;
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ filter: glow || undefined }}>
        <line x1={0} y1={MID} x2={30} y2={MID} stroke={c} strokeWidth={2}/>
        <circle cx={70} cy={MID} r={26} fill="#0a1a28" stroke={c} strokeWidth={2.5}/>
        <text x={70} y={MID+6} textAnchor="middle" fill={active?"#34d399":"#475569"} fontSize={18} fontWeight="bold" fontFamily="monospace">M</text>
        {active && <path d="M60,50 Q63,46 66,50 Q69,54 72,50 Q75,46 78,50" fill="none" stroke="#34d399" strokeWidth={1.5} opacity={0.5}/>}
        {active ? (
          <line x1={96} y1={MID} x2={W} y2={MID} stroke="#34d399" strokeWidth={3} strokeDasharray="6 3"/>
        ) : (
          <line x1={96} y1={MID} x2={W} y2={MID} stroke="#1e293b" strokeWidth={2}/>
        )}
        {active && (
          <circle cx={70} cy={MID} r={30} fill="none" stroke="rgba(52,211,153,0.15)" strokeWidth={4}>
            <animateTransform attributeName="transform" type="rotate" from="0 70 40" to="360 70 40" dur="1s" repeatCount="indefinite"/>
          </circle>
        )}
        <text x={70} y={H-3} textAnchor="middle" fill="#1e3a52" fontSize={8} fontFamily="monospace">
          {props.ratedVoltage??110}V · {props.ratedPower??500}W
        </text>
      </svg>
    );
  }

  if (type === "breaker") {
    const on = props.isOn !== false;
    const c = on?"#4ade80":"#f87171";
    const glow = active&&on ? `drop-shadow(0 0 4px #4ade8066) ${sel}` : sel;
    const armY = on ? MID : MID-18;
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ filter: glow || undefined }}>
        <line x1={0}  y1={MID} x2={48} y2={MID} stroke={c} strokeWidth={2}/>
        <line x1={92} y1={MID} x2={W}  y2={MID} stroke={c} strokeWidth={2}/>
        <circle cx={50} cy={MID} r={3.5} fill={c}/>
        <line x1={50} y1={MID} x2={90} y2={armY} stroke={c} strokeWidth={2.5} strokeLinecap="round"/>
        <circle cx={90} cy={MID} r={3.5} fill={c}/>
        {!on && <polyline points="70,24 68,28 72,32 68,36 72,40" fill="none" stroke="#f87171" strokeWidth={1.5} opacity={0.6}/>}
        <text x={70} y={H-3} textAnchor="middle" fill={c} fontSize={8} fontFamily="monospace">
          {on?"CERRADO":"ABIERTO"} · {props.ratedCurrent??10}A
        </text>
      </svg>
    );
  }

  if (type === "voltmeter") {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ filter: sel||undefined }}>
        <line x1={0} y1={MID} x2={44} y2={MID} stroke="#7dd3fc" strokeWidth={2}/>
        <circle cx={70} cy={MID} r={24} fill="#0a1a28" stroke="#7dd3fc" strokeWidth={2}/>
        <text x={70} y={MID+6} textAnchor="middle" fill="#7dd3fc" fontSize={16} fontFamily="serif">V</text>
        <line x1={94} y1={MID} x2={W} y2={MID} stroke="#7dd3fc" strokeWidth={2}/>
        <text x={52} y={MID-10} fill="#7dd3fc" fontSize={10} fontFamily="monospace">+</text>
        <text x={82} y={MID-10} fill="#7dd3fc" fontSize={10} fontFamily="monospace">−</text>
        <text x={70} y={H-3} textAnchor="middle" fill="#334155" fontSize={8} fontFamily="monospace">PARALELO</text>
      </svg>
    );
  }

  if (type === "ammeter") {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ filter: sel||undefined }}>
        <line x1={0} y1={MID} x2={44} y2={MID} stroke="#c084fc" strokeWidth={2}/>
        <circle cx={70} cy={MID} r={24} fill="#0a1a28" stroke="#c084fc" strokeWidth={2}/>
        <text x={70} y={MID+6} textAnchor="middle" fill="#c084fc" fontSize={16} fontFamily="serif">A</text>
        <line x1={94} y1={MID} x2={W} y2={MID} stroke="#c084fc" strokeWidth={2}/>
        <polygon points="10,37 18,40 10,43" fill="#c084fc" opacity={0.5}/>
        <polygon points="122,37 130,40 122,43" fill="#c084fc" opacity={0.5}/>
        <text x={70} y={H-3} textAnchor="middle" fill="#334155" fontSize={8} fontFamily="monospace">SERIE</text>
      </svg>
    );
  }

  return <div style={{ width:W, height:H, background:"#1e293b", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", color:"#475569", fontSize:10 }}>{type}</div>;
}

// ─── Física ───────────────────────────────────────────────────────────────────
function calcPhysics(circuit: TransformerCircuit): PhysicsResult | null {
  const { source, transformer, motor, breaker } = circuit;
  if (!source || !transformer) return null;
  const V1=source.voltage??220, n1=transformer.turns1??220, n2=transformer.turns2??110;
  const η=transformer.efficiency??0.95, f=source.frequency??60;
  if (n2===0) return null;
  const a=n1/n2, V2=V1/a;
  let I2=0,P_out=0,I1=0,P_in=0,losses=0;
  const breakerOpen = breaker!==undefined && breaker.isOn===false;
  if (motor && !breakerOpen) {
    const Vr=motor.ratedVoltage??110, Pr=motor.ratedPower??500, pf=motor.powerFactor??0.85;
    if (Vr>0&&pf>0) {
      const Ir=Pr/(Vr*pf), lr=Math.min(V2/Vr,1.2);
      I2=Ir*lr; P_out=V2*I2*pf; I1=(I2*n2)/(n1*η); P_in=V1*I1; losses=P_in-P_out;
    }
  }
  return {
    V1, V2:+V2.toFixed(2), a:+a.toFixed(3), n1, n2, η, f,
    I1:+I1.toFixed(3), I2:+I2.toFixed(3),
    P_in:+P_in.toFixed(1), P_out:+P_out.toFixed(1), losses:+losses.toFixed(1),
    loadFactor: motor ? +(Math.min(V2/(motor.ratedVoltage??110),1.2)*100).toFixed(1) : 0,
  };
}

// ─── Compatibilidad entre componentes ─────────────────────────────────────────
// Analiza si los parámetros eléctricos son coherentes entre sí
function checkCompatibility(placed: PlacedComp[]): CompatResult {
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
function validateCircuit(placed: PlacedComp[], connections: Connection[]): string[] {
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

// ─── Paleta ───────────────────────────────────────────────────────────────────
const PALETTE = [
  { type:"source"      as CompType, label:"Fuente AC",     cat:"Alimentación", hint:"Red monofásica" },
  { type:"transformer" as CompType, label:"Transformador", cat:"Conversión",   hint:"Adapta tensión" },
  { type:"motor"       as CompType, label:"Motor AC",      cat:"Cargas",       hint:"E eléctrica → mecánica" },
  { type:"breaker"     as CompType, label:"Disyuntor",     cat:"Protección",   hint:"Protección sobrecorriente" },
  { type:"voltmeter"   as CompType, label:"Voltímetro",    cat:"Medición",     hint:"Conectar en paralelo" },
  { type:"ammeter"     as CompType, label:"Amperímetro",   cat:"Medición",     hint:"Conectar en serie" },
];

let idCounter = 1;
const uid = () => `c${idCounter++}`;

// ─── Componente principal ──────────────────────────────────────────────────────
export default function TransformerSimulator() {
  const [placed,      setPlaced]      = useState<PlacedComp[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selected,    setSelected]    = useState<string | null>(null);
  const [pendingPort, setPendingPort] = useState<string | null>(null);
  const [running,     setRunning]     = useState(false);
  const [events,      setEvents]      = useState<string[]>([]);
  const [activeTab,   setActiveTab]   = useState<"analysis"|"theory"|"compat"|"log">("analysis");

  // Ref para tracking del drag — NO usamos estado para no re-renderizar en cada mousemove
  const dragRef = useRef<{ id:string; startX:number; startY:number; compX:number; compY:number } | null>(null);
  const isDragging = useRef(false);

  const log = useCallback((msg:string) => {
    const ts = new Date().toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
    setEvents(prev=>[`${ts} — ${msg}`,...prev].slice(0,14));
  },[]);

  const selectedComp = placed.find(c=>c.id===selected);

  const circuit = {
    source:      placed.find(c=>c.type==="source"),
    transformer: placed.find(c=>c.type==="transformer"),
    motor:       placed.find(c=>c.type==="motor"),
    breaker:     placed.find(c=>c.type==="breaker"),
  };

  const allErrors   = validateCircuit(placed, connections);
  const hardErrors  = allErrors.filter(e=>!e.startsWith("⚠"));
  const isValid     = hardErrors.length===0;
  const breakerOpen = circuit.breaker?.props.isOn===false;
  const compat      = checkCompatibility(placed);

  const physics: PhysicsResult | null = running && isValid && !breakerOpen
    ? calcPhysics({ source:circuit.source?.props, transformer:circuit.transformer?.props, motor:circuit.motor?.props, breaker:circuit.breaker?.props })
    : null;

  // ── Drag & drop desde paleta ──────────────────────────────────────────────
  const onDrop = useCallback((e:React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("compType") as CompType;
    if (!type||!COMP_DEFS[type]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round((e.clientX-rect.left)/GRID)*GRID;
    const y = Math.round((e.clientY-rect.top)/GRID)*GRID;
    const id=uid(), def=COMP_DEFS[type];
    setPlaced(prev=>[...prev,{id,type,x,y,label:`${def.label} ${id}`,props:{...def.defaults}}]);
    log(`Colocado: ${def.label}`);
  },[log]);

  // ── Interacción con componentes: drag con ref (no bloquea en running) ─────
  const onCompMouseDown = useCallback((id:string, e:React.MouseEvent) => {
    e.stopPropagation();
    setSelected(id);
    isDragging.current = false;
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      compX: placed.find(c=>c.id===id)?.x ?? 0,
      compY: placed.find(c=>c.id===id)?.y ?? 0,
    };
  },[placed]);

  const onMouseMove = useCallback((e:React.MouseEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX-d.startX, dy = e.clientY-d.startY;
    // Considerar drag solo si se mueve más de 4px
    if (!isDragging.current && Math.sqrt(dx*dx+dy*dy)<4) return;
    isDragging.current = true;
    setPlaced(prev=>prev.map(c=>c.id!==d.id?c:{
      ...c,
      x: Math.round((d.compX+dx)/GRID)*GRID,
      y: Math.round((d.compY+dy)/GRID)*GRID,
    }));
  },[]);

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
    // isDragging.current se deja como está; se resetea en onCompMouseDown
  },[]);

  // ── Click en puerto (disponible siempre, incluso en running) ─────────────
  const onPortClick = useCallback((compId:string, side:string) => {
    // En running solo permitimos conexiones informativas, no modificamos el circuito
    if (running) {
      log(`Puerto ${side} de ${compId} — detén el circuito para reconectar.`);
      return;
    }
    const portKey=`${compId}-${side}`;
    if (!pendingPort) {
      setPendingPort(portKey);
    } else if (pendingPort!==portKey) {
      setConnections(prev=>{
        const already=prev.some(w=>(w.from===pendingPort&&w.to===portKey)||(w.from===portKey&&w.to===pendingPort));
        if (already) return prev;
        return [...prev,{id:uid(),from:pendingPort,to:portKey}];
      });
      log(`Conectado: ${pendingPort} → ${portKey}`);
      setPendingPort(null);
    } else {
      setPendingPort(null);
    }
  },[pendingPort,running,log]);

  const updateProp = (id:string,key:string,value:string|boolean) => {
    setPlaced(prev=>prev.map(c=>c.id!==id?c:{
      ...c,
      props:{...c.props,[key]:typeof value==="boolean"?value:(isNaN(+value)?value:+value)},
    }));
  };

  const deleteSelected = () => {
    if (!selected) return;
    if (running) { log("Detén el circuito antes de eliminar componentes."); return; }
    setConnections(prev=>prev.filter(w=>!w.from.startsWith(selected)&&!w.to.startsWith(selected)));
    setPlaced(prev=>prev.filter(c=>c.id!==selected));
    setSelected(null);
    log("Componente eliminado.");
  };

  // ── Control del circuito ──────────────────────────────────────────────────
  const startCircuit = () => {
    if (!isValid) { log("⛔ Circuito incompleto — revisa las conexiones."); return; }
    if (breakerOpen) { log("⛔ Disyuntor ABIERTO — ciérralo antes de energizar."); return; }
    if (compat.level==="error") {
      log("⛔ Incompatibilidad detectada — revisa la pestaña Compatibilidad.");
      setActiveTab("compat");
      return;
    }
    setRunning(true);
    log("✓ Circuito ENERGIZADO correctamente.");
    if (compat.level==="warning") log("⚠ Hay advertencias de compatibilidad — revisa Compatibilidad.");
  };

  const stopCircuit = () => {
    setRunning(false);
    log("■ Circuito DETENIDO.");
  };

  // Cambio de prop del disyuntor detiene el circuito si lo abre
  const handlePropUpdate = (id:string,key:string,value:string|boolean) => {
    updateProp(id,key,value);
    if (key==="isOn" && value===false && running) {
      setRunning(false);
      log("⚠ Disyuntor abierto — circuito interrumpido automáticamente.");
    }
  };

  const resetAll = () => {
    setPlaced([]); setConnections([]); setSelected(null);
    setRunning(false); setEvents([]); setPendingPort(null);
    dragRef.current=null; isDragging.current=false;
    log("↺ Simulador reiniciado.");
  };

  // ── Posición de puerto en px ──────────────────────────────────────────────
  const portPx = (compId:string,side:string):{x:number;y:number}|null => {
    const c=placed.find(p=>p.id===compId); if (!c) return null;
    const port=COMP_DEFS[c.type]?.ports[side]; if (!port) return null;
    return { x:c.x-COMP_W/2+port.x, y:c.y-COMP_H/2+port.y };
  };

  const getPortPos = (key:string):{x:number;y:number}|null => {
    const m=key.match(/^(.+)-([^-]+)$/); if (!m) return null;
    return portPx(m[1],m[2]);
  };

  const statusColor = !isValid?"#7f1d1d":breakerOpen?"#78350f":"#14532d";
  const compatColor = compat.level==="error"?"#7f1d1d":compat.level==="warning"?"#78350f":"#14532d";

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{display:"flex",height:"100vh",background:"#050d1a",color:"#c8d8ea",
      fontFamily:"'JetBrains Mono','Courier New',monospace",userSelect:"none"}}
      onMouseMove={onMouseMove} onMouseUp={onMouseUp}>

      {/* ── Paleta ── */}
      <aside style={{width:196,borderRight:"1px solid #0f2035",background:"#030a14",overflowY:"auto",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"13px 12px 9px",borderBottom:"1px solid #0f2035"}}>
          <div style={{fontSize:9,letterSpacing:"0.18em",color:"#3b82f6",textTransform:"uppercase"}}>⚡ Simulador</div>
          <div style={{fontSize:10,color:"#334155",marginTop:2}}>Transformadores AC</div>
        </div>
        {(["Alimentación","Conversión","Cargas","Protección","Medición"] as const).map(cat=>{
          const items=PALETTE.filter(p=>p.cat===cat); if (!items.length) return null;
          return (
            <div key={cat}>
              <div style={{padding:"9px 12px 3px",fontSize:8,color:"#1e3a52",letterSpacing:"0.12em",textTransform:"uppercase"}}>{cat}</div>
              {items.map(item=>(
                <div key={item.type} draggable
                  onDragStart={e=>e.dataTransfer.setData("compType",item.type)}
                  style={{padding:"7px 12px",margin:"1px 6px",borderRadius:5,cursor:"grab",borderLeft:"2px solid transparent",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(59,130,246,0.08)";e.currentTarget.style.borderLeftColor="#3b82f6";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderLeftColor="transparent";}}>
                  <div style={{fontSize:11,color:"#7da8c4"}}>{item.label}</div>
                  <div style={{fontSize:8,color:"#1e3a52",marginTop:1}}>{item.hint}</div>
                </div>
              ))}
            </div>
          );
        })}
        <div style={{flex:1}}/>
        <div style={{padding:10,borderTop:"1px solid #0f2035",fontSize:8,color:"#1e3a52",lineHeight:1.8}}>
          <div style={{color:"#4ade80",marginBottom:3,fontSize:9}}>INSTRUCCIONES</div>
          <div>1. Arrastra al canvas</div>
          <div>2. Clic en • para conectar</div>
          <div>3. Inspecciona con clic</div>
          <div>4. Presiona ENERGIZAR</div>
          {running && <div style={{color:"#fbbf24",marginTop:6}}>Puedes seleccionar componentes mientras el circuito corre.</div>}
        </div>
      </aside>

      {/* ── Canvas ── */}
      <main style={{flex:1,position:"relative",overflow:"hidden"}}
        onDrop={onDrop} onDragOver={e=>e.preventDefault()}
        onClick={()=>{
          if (!isDragging.current) { setSelected(null); if (pendingPort) setPendingPort(null); }
        }}>

        {/* Grid */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
          <defs><pattern id="g" width={GRID} height={GRID} patternUnits="userSpaceOnUse"><circle cx={0} cy={0} r={0.8} fill="#0d1f30"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>

        {/* Cables */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
          {connections.map(w=>{
            const a=getPortPos(w.from), b=getPortPos(w.to);
            if (!a||!b) return null;
            const mx=(a.x+b.x)/2;
            const wireActive = running && !breakerOpen;
            return (
              <g key={w.id}>
                <path d={`M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`}
                  fill="none" stroke={wireActive?"#22d3ee":"#1e3a52"} strokeWidth={wireActive?2.5:1.5} strokeLinecap="round"/>
                {wireActive && (
                  <path d={`M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`}
                    fill="none" stroke="#7dd3fc" strokeWidth={1} strokeLinecap="round"
                    strokeDasharray="8 16" opacity={0.5}>
                    <animate attributeName="stroke-dashoffset" from="0" to="-48" dur="1s" repeatCount="indefinite"/>
                  </path>
                )}
              </g>
            );
          })}
        </svg>

        {/* Componentes */}
        {placed.map(comp=>{
          const def=COMP_DEFS[comp.type];
          const isSelected=selected===comp.id;
          const isActive=running&&!breakerOpen&&(comp.type==="breaker"?comp.props?.isOn!==false:true);

          return (
            <div key={comp.id}
              onMouseDown={e=>onCompMouseDown(comp.id,e)}
              style={{position:"absolute",left:comp.x-COMP_W/2,top:comp.y-COMP_H/2,
                cursor:isDragging.current&&dragRef.current?.id===comp.id?"grabbing":"grab"}}>

              <CompSymbol type={comp.type} active={isActive} props={comp.props} selected={isSelected}/>

              <div style={{textAlign:"center",fontSize:8,color:isSelected?"#60a5fa":"#1e3a52",marginTop:2,letterSpacing:"0.05em"}}>
                {comp.label}
              </div>

              {/* Puertos */}
              {Object.entries(def.ports).map(([side,pos])=>{
                const pKey=`${comp.id}-${side}`, isPending=pendingPort===pKey;
                return (
                  <div key={side}
                    onClick={e=>{e.stopPropagation();onPortClick(comp.id,side);}}
                    title={running?"Detén el circuito para reconectar":`Puerto ${side}`}
                    style={{
                      position:"absolute",left:pos.x-7,top:pos.y-7,
                      width:14,height:14,borderRadius:"50%",
                      background:isPending?"#f59e0b":running&&!breakerOpen?"#22d3ee":"#0d1f30",
                      border:`2px solid ${isPending?"#fbbf24":running?"#22d3ee44":"#3b82f6"}`,
                      cursor:running?"not-allowed":"crosshair",
                      zIndex:10,
                      boxShadow:isPending?"0 0 10px #f59e0b":running&&!breakerOpen?"0 0 4px #22d3ee44":"none",
                      transition:"all 0.2s",opacity:running?0.5:1,
                    }}/>
                );
              })}

              {/* Botón eliminar — disponible siempre que esté seleccionado */}
              {isSelected && (
                <button onClick={e=>{e.stopPropagation();deleteSelected();}}
                  title={running?"Detén el circuito para eliminar":"Eliminar componente"}
                  style={{position:"absolute",top:-11,right:-11,width:20,height:20,
                    borderRadius:"50%",border:"none",
                    background:running?"#334155":"#ef4444",color:"#fff",
                    cursor:running?"not-allowed":"pointer",fontSize:12,lineHeight:"20px",textAlign:"center",
                    boxShadow:running?"none":"0 0 6px #ef444466"}}>
                  ×
                </button>
              )}
            </div>
          );
        })}

        {/* ── Barra de control ── */}
        <div style={{position:"absolute",top:12,left:12,display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={startCircuit}
            style={{border:"1px solid #15803d",background:running?"rgba(22,163,74,.35)":"rgba(22,163,74,.18)",
              color:"#4ade80",borderRadius:5,fontSize:10,padding:"7px 16px",cursor:"pointer",
              letterSpacing:"0.08em",fontFamily:"monospace",fontWeight:running?"bold":"normal"}}>
            ▶ ENERGIZAR
          </button>
          <button onClick={stopCircuit}
            style={{border:"1px solid #9f1239",background:running?"rgba(190,24,93,.35)":"rgba(190,24,93,.13)",
              color:"#fb7185",borderRadius:5,fontSize:10,padding:"7px 16px",cursor:"pointer",
              letterSpacing:"0.08em",fontFamily:"monospace",fontWeight:running?"bold":"normal"}}>
            ■ DETENER
          </button>
          <button onClick={resetAll}
            style={{border:"1px solid #1e3a52",background:"transparent",color:"#334155",
              borderRadius:5,fontSize:10,padding:"7px 10px",cursor:"pointer",fontFamily:"monospace"}}>
            ↺ RESET
          </button>
          <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:4}}>
            <div style={{width:8,height:8,borderRadius:"50%",
              background:running&&!breakerOpen?"#4ade80":running&&breakerOpen?"#facc15":"#334155",
              boxShadow:running&&!breakerOpen?"0 0 8px #4ade80":running&&breakerOpen?"0 0 8px #facc15":"none",
              animation:running?"pulse 1.2s infinite":"none"}}/>
            <span style={{fontSize:9,fontFamily:"monospace",color:running&&!breakerOpen?"#4ade80":running&&breakerOpen?"#facc15":"#334155"}}>
              {running&&!breakerOpen?"ENERGIZADO":running&&breakerOpen?"DISYUNTOR ABIERTO":"APAGADO"}
            </span>
          </div>
        </div>

        {/* ── Panel de validación ── */}
        <div style={{position:"absolute",top:12,right:12,width:280,
          background:"rgba(3,10,20,.94)",borderRadius:8,padding:"10px 12px",fontSize:10,
          border:`1px solid ${statusColor}`,backdropFilter:"blur(4px)"}}>
          <div style={{color:"#facc15",marginBottom:6,letterSpacing:"0.1em",fontSize:9}}>VALIDACIÓN DEL CIRCUITO</div>
          {allErrors.length===0
            ? <div style={{color:"#4ade80",fontSize:9}}>✓ Circuito válido y listo para energizar</div>
            : allErrors.map((err,i)=>(
              <div key={i} style={{color:err.startsWith("⚠")?"#fcd34d":"#fca5a5",marginTop:4,fontSize:9,lineHeight:1.4}}>
                {err}
              </div>
            ))
          }
        </div>

        {placed.length===0&&(
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
            justifyContent:"center",flexDirection:"column",gap:10,pointerEvents:"none"}}>
            <div style={{fontSize:48,opacity:0.04}}>⚡</div>
            <div style={{fontSize:11,color:"#0d1f30",textAlign:"center",fontFamily:"monospace"}}>
              Arrastra componentes desde la paleta izquierda
            </div>
          </div>
        )}
      </main>

      {/* ── Panel derecho ── */}
      <aside style={{width:310,borderLeft:"1px solid #0f2035",background:"#030a14",display:"flex",flexDirection:"column"}}>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid #0f2035"}}>
          {([
            {id:"analysis",label:"Análisis"},
            {id:"compat",  label:"Compatib."},
            {id:"theory",  label:"Teoría"},
            {id:"log",     label:"Registro"},
          ] as {id:typeof activeTab;label:string}[]).map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              style={{flex:1,padding:"8px 4px",border:"none",background:"transparent",
                color:activeTab===tab.id?"#7dd3fc":"#1e3a52",
                fontSize:9,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer",
                borderBottom:activeTab===tab.id?"2px solid #3b82f6":"2px solid transparent",
                fontFamily:"monospace",transition:"all 0.15s",
                ...(tab.id==="compat"&&compat.level!=="ok"?{color:compat.level==="error"?"#fca5a5":"#fcd34d"}:{})}}>
              {tab.label}
              {tab.id==="compat"&&compat.level!=="ok"&&<span style={{marginLeft:3}}>{compat.level==="error"?"⛔":"⚠"}</span>}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto"}}>

          {/* ── Tab: Análisis ── */}
          {activeTab==="analysis"&&(
            <div style={{padding:14}}>
              <div style={{fontSize:9,color:"#3b82f6",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>
                Análisis del Transformador
              </div>
              {physics?(
                <div style={{display:"grid",gap:5}}>
                  {([
                    ["a = n₁/n₂",     `${physics.a}`,  "Relación de transf."],
                    ["V₁ primario",    `${physics.V1} V`,""],
                    ["V₂ secundario",  `${physics.V2} V`,""],
                    ["I₁ primario",    `${physics.I1} A`,""],
                    ["I₂ secundario",  `${physics.I2} A`,""],
                    ["P entrada",      `${physics.P_in} W`,""],
                    ["P salida",       `${physics.P_out} W`,""],
                    ["Pérdidas",       `${physics.losses} W`,""],
                    ["η eficiencia",   `${physics.P_in>0?((physics.P_out/physics.P_in)*100).toFixed(1):0}%`,""],
                    ["Carga motor",    `${physics.loadFactor}%`,""],
                  ] as [string,string,string][]).map(([k,v,hint])=>(
                    <div key={k} title={hint} style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid #0a1828",paddingBottom:3}}>
                      <span style={{fontSize:9,color:"#2d4a5e",fontFamily:"monospace"}}>{k}</span>
                      <span style={{fontSize:10,color:"#7dd3fc",fontWeight:"bold",fontFamily:"monospace"}}>{v}</span>
                    </div>
                  ))}
                  {/* Barra de carga del motor */}
                  <div style={{marginTop:6}}>
                    <div style={{fontSize:8,color:"#1e3a52",marginBottom:3,fontFamily:"monospace"}}>CARGA MOTOR</div>
                    <div style={{height:8,background:"#0a1828",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.min(physics.loadFactor,120)}%`,
                        background:physics.loadFactor>110?"#ef4444":physics.loadFactor>90?"#facc15":"#4ade80",
                        borderRadius:4,transition:"width 0.4s"}}/>
                    </div>
                    <div style={{fontSize:8,color:"#1e3a52",marginTop:2,fontFamily:"monospace",textAlign:"right"}}>{physics.loadFactor}%</div>
                  </div>
                </div>
              ):(
                <div style={{fontSize:9,color:"#1e3a52",lineHeight:1.7,fontFamily:"monospace"}}>
                  {isValid&&!breakerOpen?"Energiza el circuito para ver el análisis.":breakerOpen?"Disyuntor abierto — sin flujo de carga.":"Completa el circuito primero."}
                </div>
              )}
              {/* Inspector de componente seleccionado */}
              {selectedComp&&(
                <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #0f2035"}}>
                  <div style={{fontSize:9,color:"#3b82f6",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>
                    Inspector — {selectedComp.label}
                  </div>
                  <div style={{display:"grid",gap:8}}>
                    {(Object.entries(selectedComp.props) as [string,string|number|boolean][]).map(([key,val])=>(
                      <div key={key} style={{display:"flex",flexDirection:"column",gap:3}}>
                        <label style={{fontSize:8,color:"#1e3a52",textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"monospace"}}>{key}</label>
                        {typeof val==="boolean"?(
                          <button onClick={()=>handlePropUpdate(selectedComp.id,key,!val)}
                            style={{textAlign:"left",fontSize:10,padding:"5px 8px",borderRadius:4,
                              background:val?"rgba(34,197,94,.2)":"rgba(239,68,68,.15)",
                              border:`1px solid ${val?"#15803d":"#7f1d1d"}`,
                              color:val?"#4ade80":"#f87171",cursor:"pointer",fontFamily:"monospace"}}>
                            {val?"✓ Cerrado (ON)":"✗ Abierto (OFF)"}
                          </button>
                        ):(
                          <input type="number" value={val as number}
                            onChange={e=>handlePropUpdate(selectedComp.id,key,e.target.value)}
                            style={{background:"#0a1828",border:"1px solid #1e3a52",color:"#7dd3fc",
                              borderRadius:4,padding:"4px 8px",fontSize:11,outline:"none",
                              width:"100%",boxSizing:"border-box",fontFamily:"monospace"}}/>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Compatibilidad ── */}
          {activeTab==="compat"&&(
            <div style={{padding:14}}>
              <div style={{fontSize:9,color:"#3b82f6",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>
                Compatibilidad de Parámetros
              </div>
              <div style={{marginBottom:10,padding:"8px 10px",borderRadius:6,
                background:compat.level==="error"?"rgba(127,29,29,.3)":compat.level==="warning"?"rgba(120,53,15,.3)":"rgba(20,83,45,.3)",
                border:`1px solid ${compatColor}`,fontSize:9,color:compat.level==="error"?"#fca5a5":compat.level==="warning"?"#fcd34d":"#4ade80",fontFamily:"monospace"}}>
                {compat.level==="error"?"⛔ INCOMPATIBILIDAD DETECTADA":compat.level==="warning"?"⚠ ADVERTENCIAS DE COMPATIBILIDAD":"✓ PARÁMETROS COMPATIBLES"}
              </div>
              {compat.messages.map((m,i)=>(
                <div key={i} style={{fontSize:9,lineHeight:1.6,marginBottom:8,padding:"6px 8px",
                  background:"#0a1828",borderRadius:4,borderLeft:`3px solid ${m.startsWith("⚠")?"#facc15":m.startsWith("⛔")?"#f87171":"#3b82f6"}`,
                  color:m.startsWith("⚠")||m.startsWith("⛔")?"#94a3b8":"#64748b",fontFamily:"monospace"}}>
                  {m}
                </div>
              ))}
              {placed.length<3&&(
                <div style={{fontSize:9,color:"#1e3a52",fontFamily:"monospace",marginTop:8}}>
                  Agrega Fuente, Transformador y Motor para ver el análisis de compatibilidad.
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Teoría ── */}
          {activeTab==="theory"&&(
            <div style={{padding:14}}>
              <div style={{fontSize:9,color:"#3b82f6",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Principios Teóricos</div>
              {[
                ["Relación de transformación","a = n₁/n₂ = V₁/V₂ = I₂/I₁"],
                ["Potencia aparente (ideal)","S₁ = S₂  →  V₁·I₁ = V₂·I₂"],
                ["Con rendimiento η","P₂ = η · P₁"],
                ["Ley de Faraday","e = N · dΦ/dt"],
                ["Potencia activa motor","P = V · I · cos(φ)"],
                ["Corriente nominal motor","Iₙ = Pₙ / (Vₙ · pf)"],
              ].map(([t,eq])=>(
                <div key={t} style={{marginBottom:10}}>
                  <div style={{fontSize:8,color:"#2d4a5e",marginBottom:3,fontFamily:"monospace"}}>{t}</div>
                  <div style={{fontSize:10,color:"#64748b",fontFamily:"monospace",background:"#0a1828",padding:"5px 8px",borderRadius:4}}>{eq}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Tab: Registro ── */}
          {activeTab==="log"&&(
            <div style={{padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:9,color:"#3b82f6",letterSpacing:"0.14em",textTransform:"uppercase"}}>Registro de Eventos</div>
                <button onClick={()=>setEvents([])}
                  style={{fontSize:8,padding:"2px 6px",border:"1px solid #1e3a52",background:"transparent",color:"#334155",borderRadius:4,cursor:"pointer",fontFamily:"monospace"}}>
                  limpiar
                </button>
              </div>
              {events.length===0
                ? <div style={{fontSize:9,color:"#0d1f30",fontFamily:"monospace"}}>Sin eventos registrados.</div>
                : events.map((ev,i)=>(
                  <div key={i} style={{fontSize:8,color:i===0?"#4b6a85":"#1e3a52",marginBottom:5,lineHeight:1.5,fontFamily:"monospace",
                    borderLeft:i===0?"2px solid #3b82f6":"2px solid #0d1f30",paddingLeft:6,transition:"all 0.2s"}}>
                    {ev}
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </aside>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        input[type=number]::-webkit-inner-spin-button { opacity:0.25; }
        input[type=number] { -moz-appearance:textfield; }
      `}</style>
    </div>
  );
}