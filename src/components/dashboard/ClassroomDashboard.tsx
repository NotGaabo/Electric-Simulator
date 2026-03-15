'use client'

import { useDashboard } from '@/hooks/useDashboard'

export default function ClassroomDashboard() {
  const { goToClass,
    deleteClass,
    getTeacherInitials,
    getTeacherName,
    getPaletteForClass,
    createClass,
    dropdownRef,
    joinClass,
    classes,
    showCreateModal,
    setShowCreateModal,
    showJoinModal,
    setShowJoinModal,
    showDropdown,
    setShowDropdown,
    showSidebar,
    setShowSidebar,
    name,
    setName,
    description,
    setDescription,
    joinCode,
    setJoinCode,
    loading,
    joinLoading,
    fetchingClasses,
    formatDate} = useDashboard()

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }

        body {
          font-family: 'Sora', sans-serif;
          background: #ffffff;
        }

        .lms-root {
          min-height: 100vh;
          background: #f8fafc;
          background-image:
            radial-gradient(ellipse 80% 50% at 20% -20%, rgba(99,102,241,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(6,182,212,0.05) 0%, transparent 60%);
          color: #1e293b;
        }

        /* ── Header ── */
        .lms-header {
          background: #ffffff;
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 50;
          height: 64px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .lms-logo-icon {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(99,102,241,0.2);
        }

        .lms-logo-text {
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #0f172a;
        }

        .lms-logo-text span {
          color: #6366f1;
        }

        /* ── Dropdown button ── */
        .lms-btn-primary {
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

        .lms-btn-primary:hover {
          background: linear-gradient(135deg, #4f46e5, #0891b2);
          box-shadow: 0 4px 20px rgba(99,102,241,0.35);
          transform: translateY(-1px);
        }

        .lms-chevron {
          transition: transform 0.2s;
        }

        .lms-chevron.open {
          transform: rotate(180deg);
        }

        /* ── Dropdown menu ── */
        .lms-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 220px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 6px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(99,102,241,0.05);
          z-index: 100;
          animation: dropIn 0.15s ease-out;
        }

        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .lms-dropdown-item {
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

        .lms-dropdown-item:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .lms-dropdown-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .lms-dropdown-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 4px 0;
        }

        /* ── Avatar ── */
        .lms-avatar {
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

        /* ── Sidebar ── */
        .lms-sidebar {
          width: 240px;
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          min-height: calc(100vh - 64px);
          padding: 20px 12px;
          flex-shrink: 0;
        }

        .lms-sidebar-section {
          margin-bottom: 28px;
        }

        .lms-sidebar-label {
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #94a3b8;
          padding: 0 12px;
          margin-bottom: 8px;
        }

        .lms-nav-item {
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

        .lms-nav-item:hover {
          background: #f1f5f9;
          color: #334155;
        }

        .lms-nav-item.active {
          background: rgba(99,102,241,0.08);
          color: #4f46e5;
          border: 1px solid rgba(99,102,241,0.15);
        }

        .lms-nav-item.active svg {
          color: #4f46e5;
        }

        /* ── Stats strip ── */
        .lms-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .lms-stat-pill {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 20px;
          flex: 1;
          min-width: 120px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .lms-stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1;
          margin-bottom: 4px;
        }

        .lms-stat-value.amber { color: #6366f1; }
        .lms-stat-value.blue  { color: #0891b2; }
        .lms-stat-value.green { color: #059669; }

        .lms-stat-label {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 500;
        }

        /* ── Section header ── */
        .lms-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .lms-section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .lms-section-subtitle {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 2px;
        }

        /* ── Cards grid ── */
        .lms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        /* ── Class card ── */
        .lms-card {
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.25s;
          position: relative;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }

        .lms-card:hover {
          transform: translateY(-3px);
          border-color: rgba(99,102,241,0.2);
          box-shadow: 0 16px 40px rgba(0,0,0,0.1);
        }

        .lms-card-header {
          position: relative;
          height: 120px;
          overflow: hidden;
          padding: 20px;
        }

        .lms-card-pattern {
          position: absolute;
          inset: 0;
          opacity: 0.07;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .lms-card-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(4px);
          color: rgba(255,255,255,0.9);
          border: 1px solid rgba(255,255,255,0.25);
        }

        .lms-card-title {
          position: relative;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
          margin-bottom: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .lms-card-desc {
          position: relative;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.65);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lms-card-accent-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }

        .lms-card:hover .lms-card-accent-bar {
          transform: scaleX(1);
        }

        .lms-card-body {
          padding: 14px 16px;
          border-top: 1px solid #f1f5f9;
        }

        .lms-teacher-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .lms-teacher-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.625rem;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        .lms-teacher-info-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #334155;
        }

        .lms-teacher-info-date {
          font-size: 0.7rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .lms-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid #f1f5f9;
        }

        .lms-card-action {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.15s;
          color: #94a3b8;
        }

        .lms-card-action:hover {
          background: #f1f5f9;
          color: #64748b;
        }

        .lms-card-action.danger:hover {
          background: rgba(239,68,68,0.06);
          border-color: rgba(239,68,68,0.2);
          color: #ef4444;
        }

        /* ── Add card ── */
        .lms-add-card {
          border-radius: 16px;
          border: 1.5px dashed #cbd5e1;
          background: transparent;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 220px;
          transition: all 0.2s;
          color: #94a3b8;
          font-family: 'Sora', sans-serif;
        }

        .lms-add-card:hover {
          border-color: rgba(99,102,241,0.4);
          background: rgba(99,102,241,0.03);
          color: #6366f1;
        }

        .lms-add-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .lms-add-card:hover .lms-add-icon {
          background: rgba(99,102,241,0.08);
          border-color: rgba(99,102,241,0.2);
        }

        .lms-add-label {
          font-size: 0.8125rem;
          font-weight: 600;
        }

        /* ── Empty state ── */
        .lms-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .lms-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: rgba(99,102,241,0.06);
          border: 1px solid rgba(99,102,241,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .lms-empty-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .lms-empty-sub {
          font-size: 0.875rem;
          color: #94a3b8;
          margin-bottom: 24px;
        }

        /* ── Spinner ── */
        .lms-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .lms-spin-ring {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(99,102,241,0.12);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Modal ── */
        .lms-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.45);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 16px;
          animation: fadeOverlay 0.15s ease-out;
        }

        @keyframes fadeOverlay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .lms-modal {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          max-width: 460px;
          width: 100%;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,0.15);
          animation: slideModal 0.2s ease-out;
        }

        @keyframes slideModal {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .lms-modal-header {
          padding: 24px 24px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .lms-modal-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lms-modal-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lms-modal-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .lms-modal-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          color: #94a3b8;
          transition: all 0.15s;
        }

        .lms-modal-close:hover {
          background: #f1f5f9;
          color: #64748b;
        }

        .lms-modal-body {
          padding: 24px;
        }

        .lms-modal-body .space-y > * + * {
          margin-top: 18px;
        }

        .lms-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 8px;
        }

        .lms-input {
          width: 100%;
          padding: 11px 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          color: #1e293b;
          font-family: 'Sora', sans-serif;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.15s;
        }

        .lms-input::placeholder { color: #cbd5e1; }

        .lms-input:focus {
          border-color: rgba(99,102,241,0.5);
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .lms-input.blue:focus {
          border-color: rgba(6,182,212,0.5);
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(6,182,212,0.1);
        }

        .lms-textarea {
          resize: none;
          min-height: 80px;
        }

        .lms-code-input {
          font-family: 'DM Mono', monospace;
          font-size: 1.5rem;
          text-align: center;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          padding: 16px 14px;
        }

        .lms-info-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 0.75rem;
          line-height: 1.5;
        }

        .lms-modal-footer {
          padding: 16px 24px 20px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          border-top: 1px solid #f1f5f9;
        }

        .lms-btn-ghost {
          padding: 9px 18px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: transparent;
          color: #64748b;
          font-family: 'Sora', sans-serif;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .lms-btn-ghost:hover {
          background: #f8fafc;
          color: #334155;
        }

        .lms-btn-submit {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 20px;
          border-radius: 10px;
          border: none;
          font-family: 'Sora', sans-serif;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .lms-btn-submit.amber {
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          color: #fff;
          box-shadow: 0 2px 12px rgba(99,102,241,0.25);
        }

        .lms-btn-submit.amber:hover:not(:disabled) {
          box-shadow: 0 4px 20px rgba(99,102,241,0.35);
          transform: translateY(-1px);
        }

        .lms-btn-submit.blue {
          background: linear-gradient(135deg, #0891b2, #06b6d4);
          color: #fff;
          box-shadow: 0 2px 12px rgba(6,182,212,0.25);
        }

        .lms-btn-submit.blue:hover:not(:disabled) {
          box-shadow: 0 4px 20px rgba(6,182,212,0.35);
          transform: translateY(-1px);
        }

        .lms-btn-submit:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        /* card fade-in */
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Mobile sidebar overlay */
        .lms-mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          z-index: 40;
        }

        .lms-sidebar-mobile {
          position: fixed;
          top: 64px;
          left: 0;
          z-index: 45;
          transition: transform 0.3s ease;
        }

        @media (min-width: 1024px) {
          .lms-sidebar-mobile { position: sticky; transform: none !important; }
        }

        /* ── Responsive ── */
        @media (max-width: 1023px) {
          .lms-header-search { display: none !important; }
          .lms-header-new-label { display: none !important; }
        }

        @media (max-width: 767px) {
          .lms-main-pad { padding: 20px 16px !important; }
          .lms-page-title { font-size: 1.2rem !important; }
          .lms-stats { gap: 10px !important; }
          .lms-stat-pill { padding: 12px 14px !important; min-width: 100px !important; }
          .lms-stat-value { font-size: 1.4rem !important; }
          .lms-grid { grid-template-columns: 1fr !important; }
          .lms-header-inner { padding: 0 16px !important; }
          .lms-mobile-menu-btn { display: flex !important; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .lms-main-pad { padding: 24px 24px !important; }
          .lms-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lms-mobile-menu-btn { display: flex !important; }
        }

        @media (min-width: 1024px) {
          .lms-mobile-menu-btn { display: none !important; }
        }
      `}</style>

      <div className="lms-root">
        {/* ── Header ── */}
        <header className="lms-header">
          <div className="lms-header-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lms-mobile-menu-btn"
                style={{ padding: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', color: '#64748b', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="lms-logo-icon">
                  <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <div className="lms-logo-text">Auli<span>fy</span></div>
                </div>
              </div>
            </div>

            {/* Center search hint */}
            <div className="lms-header-search" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span style={{ display: 'none' }}>Buscar clases...</span>
              <span style={{ color: '#94a3b8', fontSize: '0.7rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: 5, border: '1px solid #e2e8f0' }}>⌘K</span>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Notification bell */}
              <button style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#94a3b8', position: 'relative' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: '#6366f1', border: '1.5px solid #ffffff' }}></span>
              </button>

              {/* Dropdown trigger */}
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button className="lms-btn-primary" onClick={() => setShowDropdown(!showDropdown)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="lms-header-new-label">Nueva</span>
                  <svg className={`lms-chevron ${showDropdown ? 'open' : ''}`} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="lms-dropdown">
                    <button className="lms-dropdown-item" onClick={() => { setShowDropdown(false); setShowJoinModal(true) }}>
                      <span className="lms-dropdown-icon" style={{ background: 'rgba(6,182,212,0.08)' }}>
                        <svg width="15" height="15" fill="none" stroke="#0891b2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                      <div>
                        <div style={{ color: '#334155' }}>Unirse a una clase</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>Con código de invitación</div>
                      </div>
                    </button>

                    <div className="lms-dropdown-divider" />

                    <button className="lms-dropdown-item" onClick={() => { setShowDropdown(false); setShowCreateModal(true) }}>
                      <span className="lms-dropdown-icon" style={{ background: 'rgba(99,102,241,0.08)' }}>
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

              {/* Avatar */}
              <div className="lms-avatar">TU</div>
            </div>
          </div>
        </header>

        <div style={{ display: 'flex' }}>
          {/* Mobile overlay */}
          {showSidebar && (
            <div className="lms-mobile-overlay" onClick={() => setShowSidebar(false)} />
          )}

          {/* ── Sidebar ── */}
          <aside
            className="lms-sidebar-mobile"
            style={{ transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)' }}
          >
            <div className="lms-sidebar">
              <div className="lms-sidebar-section">
                <div className="lms-sidebar-label">Principal</div>
                <button className="lms-nav-item active">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </button>
                <button className="lms-nav-item">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Mis Clases
                </button>
                <button className="lms-nav-item">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Tareas
                </button>
                <button className="lms-nav-item">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Calendario
                </button>
              </div>

              <div className="lms-sidebar-section">
                <div className="lms-sidebar-label">Progreso</div>
                <button className="lms-nav-item">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Calificaciones
                </button>
                <button className="lms-nav-item">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Logros
                </button>
              </div>

              <div className="lms-sidebar-section">
                <div className="lms-sidebar-label">Sistema</div>
                <button className="lms-nav-item">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Configuración
                </button>
              </div>

              {/* Progress widget */}
              {(() => {
                const studentClasses = classes.filter(c => c.my_role === 'student' && c.progress != null)
                const avg = studentClasses.length > 0
                  ? Math.round(studentClasses.reduce((sum, c) => sum + (c.progress ?? 0), 0) / studentClasses.length)
                  : null
                if (avg === null) return null
                return (
                  <div style={{ padding: '14px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 12, marginTop: 8 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Tu progreso</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Completado</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1' }}>{avg}%</span>
                    </div>
                    <div style={{ height: 4, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${avg}%`, background: 'linear-gradient(90deg, #6366f1, #06b6d4)', borderRadius: 99, transition: 'width 0.6s ease' }}></div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </aside>

          {/* ── Main ── */}
          <main className="lms-main-pad" style={{ flex: 1, padding: '32px 32px', overflowX: 'hidden' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>

              {/* Content */}
              {fetchingClasses && classes.length === 0 ? (
                <div className="lms-spinner">
                  <div>
                    <div className="lms-spin-ring" style={{ margin: '0 auto 16px' }}></div>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center' }}>Cargando clases...</p>
                  </div>
                </div>
              ) : classes.length === 0 ? (
                <div className="lms-empty">
                  <div>
                    <div className="lms-empty-icon">
                      <svg width="32" height="32" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="lms-empty-title">No tienes clases aún</div>
                    <div className="lms-empty-sub">Crea tu primera clase o únete con un código</div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      <button className="lms-btn-ghost" onClick={() => setShowJoinModal(true)}>Unirse a clase</button>
                      <button className="lms-btn-submit amber" onClick={() => setShowCreateModal(true)}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Crear clase
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="lms-section-header">
                    <div>
                      <div className="lms-section-title">Todas las clases</div>
                      <div className="lms-section-subtitle">Semestre actual</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ padding: '6px 10px', borderRadius: 8, background: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontFamily: 'Sora, sans-serif', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filtrar
                      </button>
                    </div>
                  </div>

                  <div className="lms-grid">
                    {classes.map((classItem, index) => {
                      const palette = getPaletteForClass(classItem.id)
                      return (
                        <div
                          key={classItem.id}
                          className="lms-card"
                          onClick={() => goToClass(classItem.id)}
                          style={{ animation: `cardIn 0.3s ease-out ${index * 0.06}s backwards` }}
                        >
                          {/* Card header */}
                          <div
                            className="lms-card-header"
                            style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
                          >
                            <div className="lms-card-pattern"></div>

                            <div className="lms-card-badge">Activa</div>

                            {/* Decorative accent circle */}
                            <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: palette.accent, opacity: 0.15 }}></div>
                            <div style={{ position: 'absolute', top: -10, left: -10, width: 50, height: 50, borderRadius: '50%', background: '#fff', opacity: 0.05 }}></div>

                            <div className="lms-card-title">{classItem.name}</div>
                            <div className="lms-card-desc">{classItem.description || 'Sin descripción'}</div>

                            <div className="lms-card-accent-bar" style={{ background: `linear-gradient(90deg, ${palette.accent}, transparent)` }}></div>
                          </div>

                          {/* Card body */}
                          <div className="lms-card-body">
                            <div className="lms-teacher-row">
                              <div
                                className="lms-teacher-avatar"
                                style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
                              >
                                {getTeacherInitials(classItem)}
                              </div>
                              <div>
                                <div className="lms-teacher-info-name">{getTeacherName(classItem)}</div>
                                <div className="lms-teacher-info-date">
                                  <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDate(classItem.created_at)}
                                </div>
                              </div>
                            </div>

                            {/* Progress bar — solo para estudiantes */}
                            {classItem.my_role === 'student' && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Progreso del curso</span>
                                <span style={{ fontSize: '0.65rem', color: palette.accent, fontWeight: 700 }}>
                                  {classItem.progress ?? 0}%
                                </span>
                              </div>
                              <div style={{ height: 3, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%',
                                  width: `${classItem.progress ?? 0}%`,
                                  background: palette.accent,
                                  borderRadius: 99,
                                  transition: 'width 0.6s ease'
                                }}></div>
                              </div>
                            </div>
                            )}

                            <div className="lms-card-footer">
                              <div style={{ display: 'flex', gap: 6 }}>
                                {/* Members */}
                                <button
                                  className="lms-card-action"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Miembros"
                                >
                                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                </button>
                                {/* Delete */}
                                <button
                                  className="lms-card-action danger"
                                  onClick={(e) => { e.stopPropagation(); deleteClass(classItem.id, classItem.name) }}
                                  title="Eliminar"
                                >
                                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>

                              <button
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif', transition: 'all 0.15s' }}
                                onClick={(e) => { e.stopPropagation(); goToClass(classItem.id) }}
                              >
                                Abrir
                                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Add card */}
                    <button className="lms-add-card" onClick={() => setShowCreateModal(true)}>
                      <div className="lms-add-icon">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="lms-add-label">Crear nueva clase</div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>

        {/* ── Create Class Modal ── */}
        {showCreateModal && (
          <div className="lms-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="lms-modal" onClick={(e) => e.stopPropagation()}>
              <div className="lms-modal-header">
                <div className="lms-modal-title-row">
                  <div className="lms-modal-icon" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <div className="lms-modal-title">Crear clase</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>Como instructor</div>
                  </div>
                </div>
                <button className="lms-modal-close" onClick={() => setShowCreateModal(false)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="lms-modal-body">
                <div className="space-y">
                  <div>
                    <label className="lms-label">Nombre de la clase *</label>
                    <input
                      className="lms-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Matemáticas Avanzadas 2025"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="lms-label">Descripción</label>
                    <textarea
                      className="lms-input lms-textarea"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe de qué trata tu clase..."
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="lms-modal-footer">
                <button className="lms-btn-ghost" onClick={() => setShowCreateModal(false)} disabled={loading}>Cancelar</button>
                <button className="lms-btn-submit amber" onClick={createClass} disabled={loading || !name.trim()}>
                  {loading ? (
                    <>
                      <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Crear clase
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Join Class Modal ── */}
        {showJoinModal && (
          <div className="lms-overlay" onClick={() => { setShowJoinModal(false); setJoinCode('') }}>
            <div className="lms-modal" onClick={(e) => e.stopPropagation()}>
              <div className="lms-modal-header">
                <div className="lms-modal-title-row">
                  <div className="lms-modal-icon" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
                    <svg width="18" height="18" fill="none" stroke="#06b6d4" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="lms-modal-title">Unirse a una clase</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>Con código de invitación</div>
                  </div>
                </div>
                <button className="lms-modal-close" onClick={() => { setShowJoinModal(false); setJoinCode('') }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="lms-modal-body">
                <div className="space-y">
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.6 }}>
                    Solicita el código de clase a tu instructor e ingrésalo a continuación.
                  </p>
                  <div>
                    <label className="lms-label">Código de clase *</label>
                    <input
                      className="lms-input lms-code-input blue"
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && joinClass()}
                      placeholder="ABC123"
                      maxLength={10}
                      disabled={joinLoading}
                      autoFocus
                    />
                  </div>
                  <div className="lms-info-box" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.12)', color: '#0891b2' }}>
                    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>El código distingue mayúsculas y minúsculas. Ingrésalo exactamente como te lo compartió tu instructor.</span>
                  </div>
                </div>
              </div>

              <div className="lms-modal-footer">
                <button className="lms-btn-ghost" onClick={() => { setShowJoinModal(false); setJoinCode('') }} disabled={joinLoading}>Cancelar</button>
                <button className="lms-btn-submit blue" onClick={joinClass} disabled={joinLoading || !joinCode.trim()}>
                  {joinLoading ? (
                    <>
                      <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}></div>
                      Uniéndose...
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Unirse
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
