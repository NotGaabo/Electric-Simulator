'use client';
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  const handleGoToPanel = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { router.push('/mis-clases') } else { router.push('/login') }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --white: #ffffff;
          --off-white: #f2fbf5;
          --g50:  #f0fdf4;
          --g100: #dcfce7;
          --g200: #bbf7d0;
          --g300: #86efac;
          --g400: #4ade80;
          --g500: #22c55e;
          --g600: #16a34a;
          --g700: #15803d;
          --gray-300: #cbd5e1;
          --gray-400: #94a3b8;
          --gray-500: #64748b;
          --gray-700: #334155;
          --gray-900: #0f172a;
        }
        body { font-family:'DM Sans',sans-serif; background:var(--white); color:var(--gray-900); overflow-x:hidden; }
        .grid-bg { position:fixed; inset:0; background-image: linear-gradient(rgba(34,197,94,0.07) 1px,transparent 1px), linear-gradient(90deg,rgba(34,197,94,0.07) 1px,transparent 1px); background-size:48px 48px; pointer-events:none; z-index:0; }
        .orb { position:fixed; border-radius:50%; filter:blur(80px); pointer-events:none; z-index:0; animation:float 8s ease-in-out infinite; }
        .orb-1 { width:500px; height:500px; background:radial-gradient(circle,rgba(74,222,128,0.18) 0%,transparent 70%); top:-100px; right:-100px; }
        .orb-2 { width:400px; height:400px; background:radial-gradient(circle,rgba(34,197,94,0.12) 0%,transparent 70%); bottom:100px; left:-80px; animation-delay:-4s; }
        @keyframes float { 0%,100%{transform:translateY(0px) scale(1)} 50%{transform:translateY(-30px) scale(1.05)} }
        header { position:relative; z-index:10; padding:20px 40px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--g100); background:rgba(255,255,255,0.85); backdrop-filter:blur(12px); }
        .logo { display:flex; align-items:center; gap:12px; text-decoration:none; }
        .logo-icon { width:36px; height:36px; background:linear-gradient(135deg,var(--g500),var(--g700)); border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(34,197,94,0.35); }
        .logo-text { font-family:'Space Mono',monospace; font-size:15px; font-weight:700; color:var(--gray-900); letter-spacing:-0.3px; }
        .logo-text span { color:var(--g500); }
        .nav-btn { padding:9px 22px; border:1.5px solid var(--g200); background:var(--white); color:var(--g600); border-radius:100px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; cursor:pointer; transition:all 0.2s ease; }
        .nav-btn:hover { background:var(--g50); border-color:var(--g400); transform:translateY(-1px); box-shadow:0 4px 12px rgba(34,197,94,0.2); }
        main { position:relative; z-index:1; }
        .hero { min-height:90vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:80px 24px; }
        .badge { display:inline-flex; align-items:center; gap:7px; background:var(--g50); border:1px solid var(--g200); color:var(--g600); border-radius:100px; padding:6px 16px; font-size:12px; font-weight:500; letter-spacing:0.8px; text-transform:uppercase; margin-bottom:36px; font-family:'Space Mono',monospace; animation:fadeUp 0.6s ease both; }
        .badge-dot { width:6px; height:6px; background:var(--g500); border-radius:50%; animation:pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        .hero-title { font-size:clamp(44px,7vw,88px); font-weight:300; line-height:1.05; letter-spacing:-2.5px; color:var(--gray-900); max-width:900px; margin-bottom:28px; animation:fadeUp 0.6s ease 0.1s both; }
        .hero-title strong { font-weight:500; color:var(--g600); }
        .hero-sub { font-size:18px; font-weight:300; color:var(--gray-500); max-width:560px; line-height:1.7; margin-bottom:52px; animation:fadeUp 0.6s ease 0.2s both; }
        .hero-actions { display:flex; align-items:center; gap:14px; flex-wrap:wrap; justify-content:center; animation:fadeUp 0.6s ease 0.3s both; }
        .btn-primary { padding:14px 36px; background:linear-gradient(135deg,var(--g500),var(--g700)); color:white; border:none; border-radius:100px; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:500; cursor:pointer; transition:all 0.25s ease; box-shadow:0 8px 24px rgba(22,163,74,0.35); }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(22,163,74,0.45); }
        .btn-secondary { padding:14px 36px; background:transparent; color:var(--gray-700); border:1.5px solid var(--gray-300); border-radius:100px; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:400; cursor:pointer; transition:all 0.2s ease; }
        .btn-secondary:hover { border-color:var(--g300); color:var(--g600); background:var(--g50); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .circuit-visual { margin-top:80px; width:100%; max-width:900px; background:var(--off-white); border:1px solid var(--g100); border-radius:20px; padding:32px; position:relative; overflow:hidden; animation:fadeUp 0.6s ease 0.4s both; }
        .circuit-visual::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,var(--g300),transparent); }
        .circuit-label { font-family:'Space Mono',monospace; font-size:10px; color:var(--gray-400); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:20px; }
        .circuit-svg-wrap { width:100%; overflow:hidden; }
        .features { padding:100px 40px; max-width:1100px; margin:0 auto; }
        .section-label { font-family:'Space Mono',monospace; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:var(--g500); margin-bottom:20px; }
        .section-title { font-size:clamp(28px,4vw,44px); font-weight:300; letter-spacing:-1.5px; color:var(--gray-900); margin-bottom:60px; max-width:500px; line-height:1.15; }
        .features-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:2px; background:var(--g100); border-radius:16px; overflow:hidden; border:1px solid var(--g100); }
        .feature-card { background:var(--white); padding:36px 32px; transition:background 0.2s ease; }
        .feature-card:hover { background:var(--g50); }
        .feature-icon { width:44px; height:44px; background:var(--g50); border:1px solid var(--g200); border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:20px; }
        .feature-title { font-size:16px; font-weight:500; color:var(--gray-900); margin-bottom:10px; letter-spacing:-0.3px; }
        .feature-desc { font-size:14px; color:var(--gray-400); line-height:1.65; font-weight:300; }
        .stats-bar { background:var(--g700); padding:48px 40px; display:flex; justify-content:center; gap:80px; flex-wrap:wrap; position:relative; overflow:hidden; }
        .stats-bar::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,var(--g600),var(--g700)); }
        .stat-item { text-align:center; position:relative; z-index:1; }
        .stat-num { font-family:'Space Mono',monospace; font-size:36px; font-weight:700; color:white; letter-spacing:-1px; display:block; line-height:1; margin-bottom:8px; }
        .stat-label { font-size:13px; color:rgba(255,255,255,0.6); font-weight:300; letter-spacing:0.5px; }
        .cta-section { padding:120px 40px; text-align:center; max-width:700px; margin:0 auto; }
        .cta-title { font-size:clamp(32px,5vw,56px); font-weight:300; letter-spacing:-2px; color:var(--gray-900); margin-bottom:20px; line-height:1.1; }
        .cta-title strong { font-weight:500; color:var(--g600); }
        .cta-sub { color:var(--gray-400); font-size:16px; font-weight:300; margin-bottom:40px; line-height:1.7; }
        footer { border-top:1px solid var(--g100); padding:32px 40px; display:flex; align-items:center; justify-content:space-between; position:relative; z-index:1; background:rgba(255,255,255,0.9); backdrop-filter:blur(8px); }
        .footer-text { font-size:13px; color:var(--gray-400); font-weight:300; }
        .footer-mono { font-family:'Space Mono',monospace; font-size:11px; color:var(--g500); letter-spacing:1px; }
        @media(max-width:640px) { header{padding:16px 20px} .hero{padding:60px 20px} .features{padding:60px 20px} .stats-bar{gap:40px} footer{flex-direction:column;gap:12px;text-align:center} }
      `}</style>

      <div className="grid-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <header>
        <a className="logo">
          <div className="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <span className="logo-text">Voltify<span>.</span></span>
        </a>
        <button onClick={handleGoToPanel} className="nav-btn">Abrir Voltify →</button>
      </header>

      <main>
        <section className="hero">
          <div className="badge"><span className="badge-dot" />Con IA · Simulacion de circuitos</div>
          <h1 className="hero-title">Simula circuitos<br /><strong>con Voltify.</strong></h1>
          <p className="hero-sub">Un simulador electrico avanzado impulsado por IA. Disena, analiza y comprende circuitos mediante lenguaje natural e interaccion en tiempo real.</p>
          <div className="hero-actions">
            <button onClick={handleGoToPanel} className="btn-primary">Iniciar Voltify</button>
            <button className="btn-secondary">Ver documentacion</button>
          </div>
          <div className="circuit-visual">
            <div className="circuit-label">// vista previa del circuito</div>
            <div className="circuit-svg-wrap">
              <svg viewBox="0 0 860 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'auto'}}>
                <path d="M40 100 H160"  stroke="#bbf7d0" strokeWidth="2"/>
                <path d="M220 100 H320" stroke="#bbf7d0" strokeWidth="2"/>
                <path d="M380 100 H480" stroke="#bbf7d0" strokeWidth="2"/>
                <path d="M540 100 H640" stroke="#bbf7d0" strokeWidth="2"/>
                <path d="M700 100 H820" stroke="#bbf7d0" strokeWidth="2"/>
                <circle cx="40" cy="100" r="22" stroke="#22c55e" strokeWidth="1.5" fill="white"/>
                <text x="40" y="104" textAnchor="middle" fill="#22c55e" fontSize="11" fontFamily="Space Mono">V</text>
                <rect x="160" y="88" width="60" height="24" rx="4" fill="white" stroke="#86efac" strokeWidth="1.5"/>
                <text x="190" y="104" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="Space Mono">R1</text>
                <line x1="320" y1="80" x2="320" y2="120" stroke="#22c55e" strokeWidth="2"/>
                <line x1="330" y1="80" x2="330" y2="120" stroke="#22c55e" strokeWidth="2"/>
                <path d="M320 100 H310 M330 100 H380" stroke="#bbf7d0" strokeWidth="2"/>
                <text x="325" y="140" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="Space Mono">C1</text>
                <path d="M480 100 Q495 80 510 100 Q525 80 540 100" stroke="#22c55e" strokeWidth="2" fill="none"/>
                <text x="510" y="140" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="Space Mono">L1</text>
                <rect x="640" y="88" width="60" height="24" rx="4" fill="white" stroke="#86efac" strokeWidth="1.5"/>
                <text x="670" y="104" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="Space Mono">R2</text>
                <circle cx="820" cy="100" r="22" stroke="#22c55e" strokeWidth="1.5" fill="white"/>
                <line x1="810" y1="107" x2="830" y2="107" stroke="#22c55e" strokeWidth="2"/>
                <line x1="813" y1="112" x2="827" y2="112" stroke="#22c55e" strokeWidth="1.5"/>
                <line x1="816" y1="117" x2="824" y2="117" stroke="#22c55e" strokeWidth="1"/>
                {[160,320,380,480,540,640].map((x,i)=><circle key={i} cx={x} cy="100" r="4" fill="#22c55e"/>)}
                <circle r="5" fill="#4ade80" opacity="0.9">
                  <animateMotion dur="3s" repeatCount="indefinite" path="M40,100 H820"/>
                  <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3s" repeatCount="indefinite"/>
                </circle>
                <text x="40"  y="68" textAnchor="middle" fill="#86efac" fontSize="9" fontFamily="Space Mono">12V</text>
                <text x="190" y="72" textAnchor="middle" fill="#86efac" fontSize="9" fontFamily="Space Mono">4.7Ω</text>
                <text x="670" y="72" textAnchor="middle" fill="#86efac" fontSize="9" fontFamily="Space Mono">10Ω</text>
              </svg>
            </div>
          </div>
        </section>

        <div className="stats-bar">
          {[{num:'10k+',label:'Simulaciones de circuitos'},{num:'<50ms',label:'Latencia de respuesta'},{num:'200+',label:'Tipos de componentes'},{num:'99.9%',label:'Disponibilidad SLA'}].map((s,i)=>(
            <div key={i} className="stat-item">
              <span className="stat-num">{s.num}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <section className="features">
          <div className="section-label">// capacidades</div>
          <h2 className="section-title">Todo lo que necesitas para simular</h2>
          <div className="features-grid">
            {[
              {title:'Interfaz en lenguaje natural',desc:'Describe tu circuito de forma simple. Nuestro modelo interpreta tu intencion y la convierte en configuraciones precisas de componentes.',icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>},
              {title:'Analisis en tiempo real',desc:'Calculos instantaneos de voltaje, corriente y potencia en cada nodo mientras construyes.',icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>},
              {title:'Biblioteca de componentes',desc:'Resistencias, capacitores, inductores, amplificadores operacionales y transistores en una biblioteca con mas de 200 componentes pasivos y activos.',icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/><rect x="15" y="15" width="7" height="7"/><rect x="2" y="15" width="7" height="7"/></svg>},
              {title:'Exportacion compatible con SPICE',desc:'Exporta tus simulaciones en formato netlist estandar compatible con LTspice, ngspice y otras herramientas.',icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>},
              {title:'Diagnostico de circuitos con IA',desc:'Pregunta por que tu circuito no funciona. La IA explica fallas, propone correcciones y simula la version ajustada.',icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>},
              {title:'Espacio de trabajo colaborativo',desc:'Comparte circuitos con tu equipo en tiempo real. Pensado para docentes, estudiantes e ingenieros.',icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>},
            ].map((f,i)=>(
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <h2 className="cta-title">Empieza a simular<br /><strong>ahora mismo.</strong></h2>
          <p className="cta-sub">No necesitas instalar nada. Abre el simulador y crea tu primer circuito en menos de un minuto.</p>
          <button onClick={handleGoToPanel} className="btn-primary" style={{fontSize:'16px',padding:'16px 44px'}}>Abrir simulador Voltify</button>
        </section>
      </main>

      <footer>
        <span className="footer-text">© 2026 Voltify. Todos los derechos reservados.</span>
        <span className="footer-mono">v2.0 · LMS</span>
      </footer>
    </>
  )
}
