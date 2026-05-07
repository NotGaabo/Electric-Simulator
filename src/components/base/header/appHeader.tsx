'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface AppHeaderProps {
  onMenuToggle?: () => void
  showMenuButton?: boolean
  onCreateClass?: () => void
  onJoinClass?: () => void
}

export default function AppHeader({
  onMenuToggle,
  showMenuButton = true,
  onCreateClass,
  onJoinClass,
}: AppHeaderProps) {
  const { user, getUserInitials, logout, loading } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Space+Mono:wght@400;700&display=swap');

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
          --gray-100: #f1f5f9;
          --gray-200: #e2e8f0;
          --gray-300: #cbd5e1;
          --gray-400: #94a3b8;
          --gray-500: #64748b;
          --gray-700: #334155;
          --gray-900: #0f172a;
        }

        /* ── Header ── */
        .app-header {
          background: rgba(255,255,255,0.90);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--g100);
          position: sticky;
          top: 0;
          z-index: 50;
          height: 64px;
          box-shadow: 0 1px 3px rgba(34,197,94,0.06);
          font-family: 'DM Sans', sans-serif;
        }

        .app-header-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* ── Logo ── */
        .app-header-logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, var(--g500), var(--g700));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(34,197,94,0.35);
          flex-shrink: 0;
        }

        .app-header-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 15px; font-weight: 700;
          letter-spacing: -0.3px; color: var(--gray-900);
        }
        .app-header-logo-text span { color: var(--g500); }

        /* ── Search ── */
        .app-header-search {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          background: var(--g50);
          border: 1px solid var(--g100);
          border-radius: 10px;
          color: var(--gray-400);
          font-size: 0.8rem; cursor: pointer;
          user-select: none;
          min-width: 180px;
          justify-content: space-between;
        }

        .app-header-search-left {
          display: flex; align-items: center; gap: 8px;
          color: var(--gray-400); font-size: 0.8rem;
        }

        .app-header-search-kbd {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          background: var(--white);
          border: 1px solid var(--g200);
          border-radius: 5px;
          padding: 1px 6px;
          color: var(--gray-400);
        }

        /* ── Primary button ── */
        .app-header-btn-primary {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, var(--g500), var(--g700));
          color: #fff; font-weight: 500; font-size: 0.8125rem;
          border-radius: 100px; border: none; cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 14px rgba(22,163,74,0.30);
          white-space: nowrap;
        }
        .app-header-btn-primary:hover {
          box-shadow: 0 6px 20px rgba(22,163,74,0.40);
          transform: translateY(-1px);
        }

        .app-header-chevron { transition: transform 0.2s; }
        .app-header-chevron.open { transform: rotate(180deg); }

        /* ── Dropdown ── */
        .app-header-dropdown {
          position: absolute; right: 0; top: calc(100% + 8px);
          width: 224px;
          background: var(--white);
          border: 1px solid var(--g100);
          border-radius: 16px; padding: 6px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.10), 0 0 0 1px rgba(34,197,94,0.05);
          z-index: 100;
          animation: appDropIn 0.15s ease-out;
        }

        @keyframes appDropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .app-header-dropdown-item {
          width: 100%; display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 10px;
          background: transparent; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8125rem; font-weight: 500;
          color: var(--gray-500); transition: all 0.15s; text-align: left;
        }
        .app-header-dropdown-item:hover { background: var(--g50); color: var(--gray-900); }

        .app-header-dropdown-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .app-header-dropdown-divider { height: 1px; background: var(--g100); margin: 4px 0; }

        /* ── Avatar ── */
        .app-header-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, var(--g600), var(--g700));
          border: 2px solid var(--g200);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem; font-weight: 700; color: #fff; letter-spacing: 0.05em;
          cursor: pointer; transition: all 0.2s;
          flex-shrink: 0;
        }
        .app-header-avatar:hover {
          transform: scale(1.05);
          box-shadow: 0 0 12px rgba(34,197,94,0.3);
        }

        /* ── User dropdown ── */
        .app-header-user-dropdown {
          position: absolute; right: 0; top: calc(100% + 8px);
          width: 210px;
          background: var(--white);
          border: 1px solid var(--g100);
          border-radius: 16px; padding: 6px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.10), 0 0 0 1px rgba(34,197,94,0.05);
          z-index: 100;
          animation: appDropIn 0.15s ease-out;
        }

        .app-header-user-info {
          padding: 10px 12px 10px;
        }

        .app-header-user-name {
          font-size: 0.8125rem; font-weight: 500; color: var(--gray-900); margin-bottom: 2px;
        }

        .app-header-user-email {
          font-size: 0.7rem; color: var(--gray-400);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* ── Menu button (hamburger) ── */
        .app-header-menu-btn {
          display: none;
          width: 36px; height: 36px; border-radius: 9px;
          align-items: center; justify-content: center;
          background: var(--g50);
          border: 1px solid var(--g100);
          cursor: pointer; color: var(--gray-500);
          transition: all 0.15s; flex-shrink: 0;
        }
        .app-header-menu-btn:hover { background: var(--g100); color: var(--gray-700); }

        /* ── Notif bell ── */
        .app-header-notif-btn {
          width: 36px; height: 36px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          background: var(--g50); border: 1px solid var(--g100);
          cursor: pointer; color: var(--gray-400);
          position: relative; transition: all 0.15s; flex-shrink: 0;
        }
        .app-header-notif-btn:hover { background: var(--g100); color: var(--gray-500); }

        .app-header-notif-dot {
          position: absolute; top: 7px; right: 7px;
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--g500); border: 1.5px solid var(--white);
        }

        /* ── Responsive ── */
        @media (max-width: 1023px) {
          .app-header-search { display: none !important; }
          .app-header-new-label { display: none !important; }
          .app-header-menu-btn { display: flex !important; }
          .app-header-inner { padding: 0 16px !important; }
        }
      `}</style>

      <header className="app-header">
        <div className="app-header-inner">

          {/* Left: Menu button + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {showMenuButton && (
              <button className="app-header-menu-btn" onClick={onMenuToggle}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="app-header-logo-icon">
                <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="app-header-logo-text">Volti<span>fy</span></div>
            </div>
          </div>

          {/* Right: Notifications + Nueva + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

            {/* Notifications */}
            <button className="app-header-notif-btn">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="app-header-notif-dot" />
            </button>

            {/* Nueva dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button className="app-header-btn-primary" onClick={() => setShowDropdown(!showDropdown)}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="app-header-new-label">Nueva</span>
                <svg className={`app-header-chevron ${showDropdown ? 'open' : ''}`} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDropdown && (
                <div className="app-header-dropdown">
                  <button
                    className="app-header-dropdown-item"
                    onClick={() => { setShowDropdown(false); onJoinClass?.() }}
                  >
                    <span className="app-header-dropdown-icon" style={{ background: 'rgba(6,182,212,0.08)' }}>
                      <svg width="15" height="15" fill="none" stroke="#0891b2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    <div>
                      <div style={{ color: 'var(--gray-700)' }}>Unirse a una clase</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: 1 }}>Con código de invitación</div>
                    </div>
                  </button>

                  <div className="app-header-dropdown-divider" />

                  <button
                    className="app-header-dropdown-item"
                    onClick={() => { setShowDropdown(false); onCreateClass?.() }}
                  >
                    <span className="app-header-dropdown-icon" style={{ background: 'rgba(99,102,241,0.08)' }}>
                      <svg width="15" height="15" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                    <div>
                      <div style={{ color: 'var(--gray-700)' }}>Crear una clase</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: 1 }}>Como instructor</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* User avatar dropdown */}
            <div style={{ position: 'relative' }} ref={userDropdownRef}>
              <button
                className="app-header-avatar"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                title={user?.full_name || 'Usuario'}
              >
                {loading ? '...' : getUserInitials()}
              </button>

              {showUserDropdown && (
                <div className="app-header-user-dropdown">
                  <div className="app-header-user-info">
                    <div className="app-header-user-name">{user?.full_name || 'Usuario'}</div>
                    <div className="app-header-user-email">{user?.email || ''}</div>
                  </div>
                  <div className="app-header-dropdown-divider" />
                  <button
                    className="app-header-dropdown-item"
                    onClick={() => { logout(); setShowUserDropdown(false) }}
                    style={{ color: '#ef4444' }}
                  >
                    <span className="app-header-dropdown-icon" style={{ background: 'rgba(239,68,68,0.08)' }}>
                      <svg width="15" height="15" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </span>
                    <div style={{ textAlign: 'left' }}>
                      <div>Cerrar sesión</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>
    </>
  )
}