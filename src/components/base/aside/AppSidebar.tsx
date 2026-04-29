'use client'

import { useRouter, usePathname } from 'next/navigation'

interface Assignment {
  id: string
  status?: string
}

type SidebarItemKey =
  | 'mis-clases'
  | 'tareas'
  | 'calendario'
  | 'calificaciones'
  | 'students'

interface AppSidebarProps {
  assignments?: Assignment[]
  activeItem?: SidebarItemKey
}

const NAV_ITEMS: Array<{
  key: 'mis-clases' | 'tareas' | 'calendario'
  label: string
  href: string | null
  icon: React.ReactNode
}> = [
  {
    key: 'mis-clases',
    label: 'Mis Clases',
    href: '/mis-clases',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    ),
  },
  {
    key: 'tareas',
    label: 'Tareas',
    href: null,
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

const PROGRESS_ITEMS: Array<{
  key: 'calificaciones' | 'students'
  label: string
  href: string | null
  icon: React.ReactNode
}> = [
  {
    key: 'calificaciones',
    label: 'Calificaciones',
    href: null,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
  },
  {
    key: 'students',
    label: 'Estudiantes',
    href: null,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    ),
  },
]

export default function AppSidebar({ assignments = [], activeItem }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const classMatch = pathname.match(/^\/classes\/([^/]+)/)
  const classId = classMatch?.[1] ?? null

  const navItems = NAV_ITEMS.map((item) => {
    if (item.key === 'tareas') {
      return { ...item, href: classId ? `/classes/${classId}` : '/mis-clases' }
    }
    if (item.key === 'calendario') {
      return { ...item, href: classId ? `/classes/${classId}/calendario` : '/mis-clases/calendario' }
    }
    return item
  })

  const progressItems = PROGRESS_ITEMS.map((item) => {
    if (!classId) return item
    if (item.key === 'calificaciones') {
      return { ...item, href: `/classes/${classId}/grades` }
    }
    if (item.key === 'students') {
      return { ...item, href: `/classes/${classId}/students` }
    }
    return item
  })

  const isActive = (key: SidebarItemKey) => {
    if (activeItem) return activeItem === key

    if (key === 'mis-clases') {
      return pathname === '/mis-clases'
    }
    if (key === 'tareas') {
      return /^\/classes\/[^/]+$/.test(pathname)
    }
    if (key === 'calificaciones') {
      return pathname.includes('/grades')
    }
    if (key === 'students') {
      return pathname.includes('/students')
    }
    if (key === 'calendario') {
      return pathname.includes('/calendar') || pathname.includes('/calendario')
    }

    return false
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');

        :root {
          --white: #ffffff;
          --off-white: #f2fbf5;
          --g50: #f0fdf4;
          --g100: #dcfce7;
          --g200: #bbf7d0;
          --g300: #86efac;
          --g400: #4ade80;
          --g500: #22c55e;
          --g600: #16a34a;
          --g700: #15803d;
          --gray-100: #f1f5f9;
          --gray-200: #e2e8f0;
          --gray-300: #cbd5e1;
          --gray-400: #94a3b8;
          --gray-500: #64748b;
          --gray-700: #334155;
          --gray-900: #0f172a;
        }

        .app-sidebar {
          width: 240px;
          background: rgba(255,255,255,0.90);
          backdrop-filter: blur(12px);
          border-right: 1px solid var(--g100);
          min-height: calc(100vh - 64px);
          padding: 20px 12px;
          flex-shrink: 0;
          font-family: 'DM Sans', sans-serif;
        }

        .app-sidebar-section { margin-bottom: 28px; }

        .app-sidebar-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0.12em;
          color: var(--gray-400);
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
          font-size: 0.8125rem;
          font-weight: 400;
          color: var(--gray-500);
          transition: all 0.15s;
          text-align: left;
        }

        .app-sidebar-nav-item:hover {
          background: var(--g50);
          color: var(--gray-700);
        }

        .app-sidebar-nav-item.active {
          background: rgba(34,197,94,0.08);
          color: var(--g600);
          border: 1px solid rgba(34,197,94,0.18);
        }

        .app-sidebar-nav-item.active svg {
          color: var(--g600);
        }

        .app-sidebar-stats {
          padding: 14px;
          background: rgba(255,255,255,0.90);
          border: 1px solid var(--g100);
          border-radius: 12px;
          margin-top: 8px;
        }

        .app-sidebar-stats-title {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--gray-500);
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
          color: var(--gray-400);
        }

        .app-sidebar-stats-value {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--gray-900);
        }

        .app-sidebar-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 8px 0;
        }
      `}</style>

      <div className="app-sidebar">
        <div className="app-sidebar-section">
          <div className="app-sidebar-label">{'// principal'}</div>

          {navItems.map((item) => (
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

        <div className="app-sidebar-section">
          <div className="app-sidebar-label">{'// progreso'}</div>

          {progressItems.map((item) => (
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
                {assignments.filter((assignment) => assignment.status === 'submitted').length}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
