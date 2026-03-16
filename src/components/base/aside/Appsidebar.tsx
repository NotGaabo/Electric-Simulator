'use client'

import { useRouter, usePathname } from 'next/navigation'

interface Assignment {
  id: string
  status?: string
}

interface AppSidebarProps {
  /** Assignments array used to show quick stats. Pass [] if not applicable. */
  assignments?: Assignment[]
  /** Optional active nav key. Defaults to auto-detect via pathname. */
  activeItem?: 'dashboard' | 'clases' | 'tareas' | 'calendario' | 'calificaciones' | 'logros' | 'configuracion'
}

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
  },
  {
    key: 'clases',
    label: 'Mis Clases',
    href: '/',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    ),
  },
  {
    key: 'tareas',
    label: 'Tareas',
    href: null, // current page
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    ),
  },
  {
    key: 'calendario',
    label: 'Calendario',
    href: null,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
  },
]

const PROGRESS_ITEMS = [
  {
    key: 'calificaciones',
    label: 'Calificaciones',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
  },
  {
    key: 'logros',
    label: 'Logros',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    ),
  },
]

export default function AppSidebar({ assignments = [], activeItem }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (key: string) => {
    if (activeItem) return activeItem === key
    // Auto-detect based on pathname
    if (key === 'tareas' && pathname.includes('assignment')) return true
    if (key === 'dashboard' && pathname === '/') return true
    return false
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        .app-sidebar {
          width: 240px;
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          min-height: calc(100vh - 64px);
          padding: 20px 12px;
          flex-shrink: 0;
          font-family: 'Sora', sans-serif;
        }

        .app-sidebar-section { margin-bottom: 28px; }

        .app-sidebar-label {
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #94a3b8;
          padding: 0 12px;
          margin-bottom: 8px;
        }

        .app-sidebar-nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-family: 'Sora', sans-serif;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748b;
          transition: all 0.15s;
          text-align: left;
        }

        .app-sidebar-nav-item:hover {
          background: #f1f5f9;
          color: #334155;
        }

        .app-sidebar-nav-item.active {
          background: rgba(99,102,241,0.08);
          color: #4f46e5;
          border: 1px solid rgba(99,102,241,0.15);
        }

        .app-sidebar-stats {
          padding: 14px;
          background: rgba(99,102,241,0.04);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 12px;
          margin-top: 8px;
        }

        .app-sidebar-stats-title {
          font-size: 0.7rem;
          font-weight: 700;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }

        .app-sidebar-stats-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .app-sidebar-stats-label {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .app-sidebar-stats-value {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0f172a;
        }

        .app-sidebar-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 8px 0;
        }
      `}</style>

      <div className="app-sidebar">

        {/* Principal */}
        <div className="app-sidebar-section">
          <div className="app-sidebar-label">Principal</div>

          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`app-sidebar-nav-item ${isActive(item.key) ? 'active' : ''}`}
              onClick={() => item.href && router.push(item.href)}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {item.icon}
              </svg>
              {item.label}
            </button>
          ))}
        </div>

        {/* Progreso */}
        <div className="app-sidebar-section">
          <div className="app-sidebar-label">Progreso</div>

          {PROGRESS_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`app-sidebar-nav-item ${isActive(item.key) ? 'active' : ''}`}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {item.icon}
              </svg>
              {item.label}
            </button>
          ))}
        </div>

        {/* Sistema */}
        <div className="app-sidebar-section">
          <div className="app-sidebar-label">Sistema</div>
          <button className={`app-sidebar-nav-item ${isActive('configuracion') ? 'active' : ''}`}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuración
          </button>
        </div>

        {/* Quick stats */}
        {assignments.length > 0 && (
          <div className="app-sidebar-stats">
            <div className="app-sidebar-stats-title">Esta clase</div>
            <div className="app-sidebar-stats-row">
              <span className="app-sidebar-stats-label">Asignaciones</span>
              <span className="app-sidebar-stats-value">{assignments.length}</span>
            </div>
            <div className="app-sidebar-divider" />
            <div className="app-sidebar-stats-row">
              <span className="app-sidebar-stats-label">Entregadas</span>
              <span className="app-sidebar-stats-value" style={{ color: '#059669' }}>
                {assignments.filter(a => a.status === 'submitted').length}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}