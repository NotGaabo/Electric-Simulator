'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AppHeaderProps {
  onMenuToggle?: () => void
  showMenuButton?: boolean
}

export default function AppHeader({ onMenuToggle, showMenuButton = true }: AppHeaderProps) {
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        .app-header {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 50;
          height: 64px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          font-family: 'Sora', sans-serif;
        }

        .app-header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .app-header-logo-icon {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(99,102,241,0.2);
          flex-shrink: 0;
        }

        .app-header-logo-text {
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #0f172a;
        }

        .app-header-logo-text span { color: #6366f1; }

        .app-header-search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          color: #94a3b8;
          font-size: 0.8rem;
          cursor: pointer;
          user-select: none;
        }

        .app-header-search-kbd {
          color: #94a3b8;
          font-size: 0.7rem;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 5px;
          border: 1px solid #e2e8f0;
        }

        .app-header-btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          color: #fff;
          font-weight: 600;
          font-size: 0.8125rem;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Sora', sans-serif;
          letter-spacing: 0.01em;
          box-shadow: 0 2px 12px rgba(99,102,241,0.25);
        }

        .app-header-btn-primary:hover {
          background: linear-gradient(135deg, #4f46e5, #0891b2);
          box-shadow: 0 4px 20px rgba(99,102,241,0.35);
          transform: translateY(-1px);
        }

        .app-header-chevron { transition: transform 0.2s; }
        .app-header-chevron.open { transform: rotate(180deg); }

        .app-header-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 220px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 6px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.12);
          z-index: 100;
          animation: appHeaderDropIn 0.15s ease-out;
        }

        @keyframes appHeaderDropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .app-header-dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 9px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: 'Sora', sans-serif;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #475569;
          transition: all 0.15s;
          text-align: left;
        }

        .app-header-dropdown-item:hover { background: #f1f5f9; color: #1e293b; }

        .app-header-dropdown-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .app-header-dropdown-divider { height: 1px; background: #f1f5f9; margin: 4px 0; }

        .app-header-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #312e81, #4338ca);
          border: 2px solid rgba(99,102,241,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.05em;
        }

        .app-header-menu-btn {
          display: none;
          padding: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          color: #64748b;
          align-items: center;
          justify-content: center;
        }

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
              <button
                onClick={onMenuToggle}
                className="app-header-menu-btn"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="app-header-logo-icon">
                <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="app-header-logo-text">Auli<span>fy</span></div>
            </div>
          </div>

          {/* Center: Search */}
          <div className="app-header-search">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="app-header-search-kbd">⌘K</span>
          </div>

          {/* Right: Notifications + Nueva + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

            {/* Notifications */}
            <button style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#94a3b8', position: 'relative' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: '#6366f1', border: '1.5px solid #ffffff' }}></span>
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
                  <button className="app-header-dropdown-item" onClick={() => setShowDropdown(false)}>
                    <span className="app-header-dropdown-icon" style={{ background: 'rgba(6,182,212,0.08)' }}>
                      <svg width="15" height="15" fill="none" stroke="#0891b2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    <div>
                      <div style={{ color: '#334155' }}>Unirse a una clase</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>Con código de invitación</div>
                    </div>
                  </button>
                  <div className="app-header-dropdown-divider" />
                  <button className="app-header-dropdown-item" onClick={() => setShowDropdown(false)}>
                    <span className="app-header-dropdown-icon" style={{ background: 'rgba(99,102,241,0.08)' }}>
                      <svg width="15" height="15" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                    <div>
                      <div style={{ color: '#334155' }}>Crear una clase</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>Como instructor</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="app-header-avatar">TU</div>
          </div>
        </div>
      </header>
    </>
  )
}