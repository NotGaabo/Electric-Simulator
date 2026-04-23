'use client'

import { useRef, useState, useEffect } from 'react'
import AppHeader from '@/components/base/header/appHeader'
import AppSidebar from '@/components/base/aside/AppSidebar'
import { useDashboard } from '@/hooks/useDashboard'
import { useAuth } from '@/hooks/useAuth' // ajusta la ruta según tu proyecto


export default function ClassroomDashboard() {
  const { goToClass,
    deleteClass,
    getTeacherInitials,
    getTeacherName,
    getPaletteForClass,
    createClass,
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
    joinLoading,
    fetchingClasses,
    formatDate} = useDashboard()

  const { user, getUserInitials, logout, loading } = useAuth()
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

        * { box-sizing: border-box; }

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

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--white);
          margin: 0; padding: 0;
        }

        .lms-root {
          min-height: 100vh;
          background: var(--off-white);
          background-image:
            linear-gradient(rgba(34,197,94,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          color: var(--gray-900);
          position: relative;
        }

        /* Orb background */
        .lms-root::before {
          content: '';
          position: fixed;
          width: 500px; height: 500px;
          border-radius: 50%;
          filter: blur(100px);
          background: radial-gradient(circle, rgba(74,222,128,0.14) 0%, transparent 70%);
          top: -100px; right: -100px;
          pointer-events: none;
          z-index: 0;
        }
        .lms-root::after {
          content: '';
          position: fixed;
          width: 400px; height: 400px;
          border-radius: 50%;
          filter: blur(90px);
          background: radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 70%);
          bottom: 100px; left: -100px;
          pointer-events: none;
          z-index: 0;
        }

        /* ── Header ── */
        .lms-header {
          background: rgba(255,255,255,0.90);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--g100);
          position: sticky;
          top: 0;
          z-index: 50;
          height: 64px;
          box-shadow: 0 1px 3px rgba(34,197,94,0.06);
        }
        

        .lms-header-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .lms-logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, var(--g500), var(--g700));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(34,197,94,0.35);
        }

        .lms-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 15px; font-weight: 700;
          letter-spacing: -0.3px; color: var(--gray-900);
        }
        .lms-logo-text span { color: var(--g500); }

        /* ── Dropdown button ── */
        .lms-btn-primary {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, var(--g500), var(--g700));
          color: #fff; font-weight: 500; font-size: 0.8125rem;
          border-radius: 100px; border: none; cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 14px rgba(22,163,74,0.30);
        }
        .lms-btn-primary:hover {
          box-shadow: 0 6px 20px rgba(22,163,74,0.40);
          transform: translateY(-1px);
        }

        .lms-chevron { transition: transform 0.2s; }
        .lms-chevron.open { transform: rotate(180deg); }

        /* ── Dropdown menu ── */
        .lms-dropdown {
          position: absolute; right: 0; top: calc(100% + 8px);
          width: 224px;
          background: var(--white);
          border: 1px solid var(--g100);
          border-radius: 16px; padding: 6px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.10), 0 0 0 1px rgba(34,197,94,0.05);
          z-index: 100;
          animation: dropIn 0.15s ease-out;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .lms-dropdown-item {
          width: 100%; display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 10px;
          background: transparent; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8125rem; font-weight: 500;
          color: var(--gray-500); transition: all 0.15s; text-align: left;
        }
        .lms-dropdown-item:hover { background: var(--g50); color: var(--gray-900); }

        .lms-dropdown-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .lms-dropdown-divider { height: 1px; background: var(--g100); margin: 4px 0; }

        /* ── Avatar ── */
        .lms-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, var(--g600), var(--g700));
          border: 2px solid var(--g200);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem; font-weight: 700; color: #fff; letter-spacing: 0.05em;
        }

        /* ── Sidebar ── */
        .lms-sidebar {
          width: 240px;
          background: rgba(255,255,255,0.90);
          backdrop-filter: blur(12px);
          border-right: 1px solid var(--g100);
          min-height: calc(100vh - 64px);
          padding: 20px 12px;
          flex-shrink: 0;
        }

        .lms-sidebar-section { margin-bottom: 28px; }

        .lms-sidebar-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem; font-weight: 400;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: var(--gray-400); padding: 0 12px; margin-bottom: 8px;
        }

        .lms-nav-item {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 10px; border: none;
          background: transparent; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8125rem; font-weight: 400;
          color: var(--gray-500); transition: all 0.15s; text-align: left;
        }
        .lms-nav-item:hover { background: var(--g50); color: var(--gray-700); }
        .lms-nav-item.active {
          background: rgba(34,197,94,0.08);
          color: var(--g600);
          border: 1px solid rgba(34,197,94,0.18);
        }
        .lms-nav-item.active svg { color: var(--g600); }

        /* ── Stats strip ── */
        .lms-stats { display: flex; gap: 16px; margin-bottom: 32px; flex-wrap: wrap; }

        .lms-stat-pill {
          background: rgba(255,255,255,0.90);
          border: 1px solid var(--g100);
          border-radius: 14px; padding: 16px 20px;
          flex: 1; min-width: 120px;
          box-shadow: 0 1px 4px rgba(34,197,94,0.06);
        }
        .lms-stat-value {
          font-family: 'Space Mono', monospace;
          font-size: 1.6rem; font-weight: 700;
          color: var(--gray-900); line-height: 1; margin-bottom: 4px;
        }
        .lms-stat-value.green  { color: var(--g600); }
        .lms-stat-value.green2 { color: var(--g500); }
        .lms-stat-value.green3 { color: var(--g700); }

        .lms-stat-label { font-size: 0.75rem; color: var(--gray-400); font-weight: 300; }

        /* ── Section header ── */
        .lms-section-header {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
        }
        .lms-section-title {
          font-size: 1rem; font-weight: 500;
          color: var(--gray-900); letter-spacing: -0.3px;
        }
        .lms-section-subtitle { font-size: 0.75rem; color: var(--gray-400); margin-top: 2px; font-weight: 300; }

        /* ── Cards grid ── */
        .lms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

        /* ── Class card ── */
        .lms-card {
          border-radius: 16px; overflow: hidden;
          background: rgba(255,255,255,0.95);
          border: 1px solid var(--g100);
          cursor: pointer; transition: all 0.25s; position: relative;
          box-shadow: 0 1px 4px rgba(34,197,94,0.05);
        }
        .lms-card:hover {
          transform: translateY(-3px);
          border-color: var(--g300);
          box-shadow: 0 16px 40px rgba(34,197,94,0.12);
        }

        .lms-card-header { position: relative; height: 120px; overflow: hidden; padding: 20px; }

        .lms-card-pattern {
          position: absolute; inset: 0; opacity: 0.07;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .lms-card-badge {
          position: absolute; top: 14px; right: 14px;
          padding: 3px 8px; border-radius: 6px;
          font-family: 'Space Mono', monospace;
          font-size: 0.6rem; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase;
          background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);
          color: rgba(255,255,255,0.9); border: 1px solid rgba(255,255,255,0.25);
        }

        .lms-card-title {
          position: relative; font-size: 1rem; font-weight: 500;
          color: #fff; line-height: 1.3; margin-bottom: 6px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .lms-card-desc {
          position: relative; font-size: 0.75rem; color: rgba(255,255,255,0.65);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 300;
        }

        .lms-card-accent-bar {
          position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease;
        }
        .lms-card:hover .lms-card-accent-bar { transform: scaleX(1); }

        .lms-card-body { padding: 14px 16px; border-top: 1px solid var(--g50); }

        .lms-teacher-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }

        .lms-teacher-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Space Mono', monospace;
          font-size: 0.55rem; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .lms-teacher-info-name { font-size: 0.8rem; font-weight: 500; color: var(--gray-700); }
        .lms-teacher-info-date {
          font-size: 0.7rem; color: var(--gray-400);
          display: flex; align-items: center; gap: 4px; font-weight: 300;
        }

        .lms-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 10px; border-top: 1px solid var(--g50);
        }

        .lms-card-action {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: 1px solid var(--g100);
          cursor: pointer; transition: all 0.15s; color: var(--gray-400);
        }
        .lms-card-action:hover { background: var(--g50); color: var(--gray-500); border-color: var(--g200); }
        .lms-card-action.danger:hover {
          background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.2); color: #ef4444;
        }

        /* ── Add card ── */
        .lms-add-card {
          border-radius: 16px; border: 1.5px dashed var(--g200);
          background: transparent; cursor: pointer;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; min-height: 220px; transition: all 0.2s;
          color: var(--gray-400); font-family: 'DM Sans', sans-serif;
        }
        .lms-add-card:hover { border-color: var(--g400); background: rgba(34,197,94,0.03); color: var(--g600); }

        .lms-add-icon {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: var(--g50); border: 1px solid var(--g100); transition: all 0.2s;
        }
        .lms-add-card:hover .lms-add-icon { background: rgba(34,197,94,0.08); border-color: var(--g300); }

        .lms-add-label { font-size: 0.8125rem; font-weight: 500; }

        /* ── Empty state ── */
        .lms-empty { display: flex; align-items: center; justify-content: center; min-height: 400px; text-align: center; }

        .lms-empty-icon {
          width: 72px; height: 72px; border-radius: 20px;
          background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.15);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
        }
        .lms-empty-title { font-size: 1.1rem; font-weight: 500; color: var(--gray-900); margin-bottom: 8px; }
        .lms-empty-sub { font-size: 0.875rem; color: var(--gray-400); margin-bottom: 24px; font-weight: 300; }

        /* ── Spinner ── */
        .lms-spinner { display: flex; align-items: center; justify-content: center; min-height: 400px; }
        .lms-spin-ring {
          width: 40px; height: 40px;
          border: 3px solid rgba(34,197,94,0.12);
          border-top-color: var(--g500); border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Modal ── */
        .lms-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.40);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 200; padding: 16px;
          animation: fadeOverlay 0.15s ease-out;
        }
        @keyframes fadeOverlay { from { opacity:0; } to { opacity:1; } }

        .lms-modal {
          background: var(--white);
          border: 1px solid var(--g100);
          border-radius: 20px; max-width: 460px; width: 100%; overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(34,197,94,0.06);
          animation: slideModal 0.2s ease-out;
        }
        @keyframes slideModal {
          from { opacity:0; transform:translateY(16px) scale(0.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }

        .lms-modal-header {
          padding: 24px 24px 20px;
          border-bottom: 1px solid var(--g50);
          display: flex; align-items: center; justify-content: space-between;
        }
        .lms-modal-title-row { display: flex; align-items: center; gap: 12px; }
        .lms-modal-icon {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .lms-modal-title {
          font-size: 1.05rem; font-weight: 500;
          color: var(--gray-900); letter-spacing: -0.3px;
        }

        .lms-modal-close {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: var(--g50); border: 1px solid var(--g100);
          cursor: pointer; color: var(--gray-400); transition: all 0.15s;
        }
        .lms-modal-close:hover { background: var(--g100); color: var(--gray-500); }

        .lms-modal-body { padding: 24px; }
        .lms-modal-body .space-y > * + * { margin-top: 18px; }

        .lms-label {
          display: block; font-family: 'Space Mono', monospace;
          font-size: 0.65rem; font-weight: 400;
          color: var(--gray-400); text-transform: uppercase;
          letter-spacing: 0.1em; margin-bottom: 8px;
        }

        .lms-input {
          width: 100%; padding: 11px 14px;
          background: var(--off-white);
          border: 1.5px solid var(--g200);
          border-radius: 10px; color: var(--gray-900);
          font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
          outline: none; transition: all 0.15s;
        }
        .lms-input::placeholder { color: var(--gray-400); }
        .lms-input:focus {
          border-color: var(--g500);
          background: var(--white);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.10);
        }

        .lms-textarea { resize: none; min-height: 80px; }

        .lms-code-input {
          font-family: 'Space Mono', monospace;
          font-size: 1.5rem; text-align: center;
          letter-spacing: 0.3em; text-transform: uppercase; padding: 16px 14px;
        }

        .lms-info-box {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 14px; border-radius: 10px;
          font-size: 0.75rem; line-height: 1.5;
        }

        .lms-modal-footer {
          padding: 16px 24px 20px;
          display: flex; gap: 10px; justify-content: flex-end;
          border-top: 1px solid var(--g50);
        }

        .lms-btn-ghost {
          padding: 9px 18px; border-radius: 100px;
          border: 1.5px solid var(--g200); background: transparent;
          color: var(--gray-500);
          font-family: 'DM Sans', sans-serif; font-size: 0.8125rem; font-weight: 400;
          cursor: pointer; transition: all 0.15s;
        }
        .lms-btn-ghost:hover { background: var(--g50); color: var(--gray-700); }

        .lms-btn-submit {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 20px; border-radius: 100px; border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8125rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .lms-btn-submit.green {
          background: linear-gradient(135deg, var(--g500), var(--g700));
          color: #fff; box-shadow: 0 4px 14px rgba(22,163,74,0.30);
        }
        .lms-btn-submit.green:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(22,163,74,0.40); transform: translateY(-1px);
        }
        .lms-btn-submit.green-outline {
          background: linear-gradient(135deg, var(--g600), var(--g700));
          color: #fff; box-shadow: 0 4px 14px rgba(21,128,61,0.28);
        }
        .lms-btn-submit.green-outline:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(21,128,61,0.38); transform: translateY(-1px);
        }
        .lms-btn-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        /* card fade-in */
        @keyframes cardIn {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* Mobile sidebar */
        .lms-mobile-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.25); z-index: 40;
        }
        .lms-sidebar-mobile {
          position: fixed; top: 64px; left: 0; z-index: 45;
          height: calc(100vh - 64px); overflow-y: auto;
          transition: transform 0.3s ease;
        }
        @media (min-width: 1024px) {
          .lms-sidebar-mobile {
            position: sticky; top: 64px; height: calc(100vh - 64px);
            overflow-y: auto; align-self: flex-start; transform: none !important;
          }
        }

        /* Notification bell dot */
        .notif-dot {
          position: absolute; top: 7px; right: 7px;
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--g500); border: 1.5px solid var(--white);
        }

        /* ── Responsive ── */
        @media (max-width: 1023px) {
          .lms-header-search { display: none !important; }
          .lms-header-new-label { display: none !important; }
        }
        @media (max-width: 767px) {
          .lms-main-pad { padding: 20px 16px !important; }
          .lms-stats { gap: 10px !important; }
          .lms-stat-pill { padding: 12px 14px !important; min-width: 100px !important; }
          .lms-stat-value { font-size: 1.3rem !important; }
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
          /* Aliases para app-header → lms-header */
.app-header { background: rgba(255,255,255,0.90); backdrop-filter: blur(16px); border-bottom: 1px solid var(--g100); position: sticky; top: 0; z-index: 50; height: 64px; box-shadow: 0 1px 3px rgba(34,197,94,0.06); }
.app-header-inner { max-width: 1400px; margin: 0 auto; padding: 0 24px; height: 100%; display: flex; align-items: center; justify-content: space-between; }
.app-header-logo-icon { width: 38px; height: 38px; background: linear-gradient(135deg, var(--g500), var(--g700)); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(34,197,94,0.35); }
.app-header-logo-text { font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 700; letter-spacing: -0.3px; color: var(--gray-900); }
.app-header-logo-text span { color: var(--g500); }
.app-header-search { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--gray-100); border: 1px solid var(--gray-200); border-radius: 100px; color: var(--gray-400); font-size: 0.8rem; cursor: pointer; min-width: 200px; justify-content: space-between; }
.app-header-search-kbd { font-family: 'Space Mono', monospace; font-size: 0.65rem; background: var(--white); border: 1px solid var(--gray-200); border-radius: 5px; padding: 1px 5px; color: var(--gray-400); }
.app-header-btn-primary { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: linear-gradient(135deg, var(--g500), var(--g700)); color: #fff; font-weight: 500; font-size: 0.8125rem; border-radius: 100px; border: none; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 14px rgba(22,163,74,0.30); }
.app-header-btn-primary:hover { box-shadow: 0 6px 20px rgba(22,163,74,0.40); transform: translateY(-1px); }
.app-header-chevron { transition: transform 0.2s; }
.app-header-chevron.open { transform: rotate(180deg); }
.app-header-new-label { }
.app-header-dropdown { position: absolute; right: 0; top: calc(100% + 8px); width: 224px; background: var(--white); border: 1px solid var(--g100); border-radius: 16px; padding: 6px; box-shadow: 0 20px 50px rgba(0,0,0,0.10); z-index: 100; animation: dropIn 0.15s ease-out; }
.app-header-dropdown-item { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; background: transparent; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 0.8125rem; font-weight: 500; color: var(--gray-500); transition: all 0.15s; text-align: left; }
.app-header-dropdown-item:hover { background: var(--g50); color: var(--gray-900); }
.app-header-dropdown-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.app-header-dropdown-divider { height: 1px; background: var(--g100); margin: 4px 0; }
.app-header-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--g600), var(--g700)); border: 2px solid var(--g200); display: flex; align-items: center; justify-content: center; font-family: 'Space Mono', monospace; font-size: 0.65rem; font-weight: 700; color: #fff; letter-spacing: 0.05em; cursor: pointer; }
.app-header-user-dropdown { position: absolute; right: 0; top: calc(100% + 8px); width: 224px; background: var(--white); border: 1px solid var(--g100); border-radius: 16px; padding: 6px; box-shadow: 0 20px 50px rgba(0,0,0,0.10); z-index: 100; animation: dropIn 0.15s ease-out; }
.app-header-user-info { padding: 10px 12px 8px; }
.app-header-user-name { font-size: 0.875rem; font-weight: 500; color: var(--gray-900); }
.app-header-user-email { font-size: 0.75rem; color: var(--gray-400); margin-top: 2px; }
.app-header-menu-btn { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: var(--gray-100); border: 1px solid var(--gray-200); cursor: pointer; color: var(--gray-500); display: none; }
@media (max-width: 1023px) { .app-header-menu-btn { display: flex !important; } .app-header-search { display: none !important; } .app-header-new-label { display: none !important; } }
      `}</style>

      <div className="lms-root">
        {/* ── Header ── */}
        <header className="app-header">
  <div className="app-header-inner">

    {/* Left: Menu button + Logo */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="app-header-menu-btn"
      >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="app-header-logo-icon">
          <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="app-header-logo-text">Volti<span>fy</span></div>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>

      {/* Notifications */}
      <button style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#94a3b8', position: 'relative' }}>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: '#6366f1', border: '1.5px solid #ffffff' }}></span>
      </button>

      {/* Nueva button */}
      <div style={{ position: 'relative' }}>
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

      {/* User Avatar Dropdown */}
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
              onClick={() => {
                logout()
                setShowUserDropdown(false)
              }}
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

        <div style={{ display: 'flex', alignItems: 'flex-start', minHeight: 'calc(100vh - 64px)', position: 'relative', zIndex: 1 }}>
          {showSidebar && (
            <div className="lms-mobile-overlay" onClick={() => setShowSidebar(false)} />
          )}

          {/* ── Sidebar ── */}
          <aside
            className="lms-sidebar-mobile"
            style={{ transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)' }}
          >
            <AppSidebar />
          </aside>

          {/* ── Main ── */}
          <main className="lms-main-pad" style={{ flex: 1, padding: '32px 32px', overflowX: 'hidden' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>

              {fetchingClasses && classes.length === 0 ? (
                <div className="lms-spinner">
                  <div>
                    <div className="lms-spin-ring" style={{ margin: '0 auto 16px' }}></div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', textAlign: 'center', fontWeight: 300 }}>Cargando clases...</p>
                  </div>
                </div>
              ) : classes.length === 0 ? (
                <div className="lms-empty">
                  <div>
                    <div className="lms-empty-icon">
                      <svg width="32" height="32" fill="none" stroke="var(--g500)" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="lms-empty-title">No tienes clases aún</div>
                    <div className="lms-empty-sub">Crea tu primera clase o únete con un código</div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      <button className="lms-btn-ghost" onClick={() => setShowJoinModal(true)}>Unirse a clase</button>
                      <button className="lms-btn-submit green" onClick={() => setShowCreateModal(true)}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <button style={{ padding: '6px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.9)', border: '1.5px solid var(--g200)', color: 'var(--gray-500)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>
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
                          <div
                            className="lms-card-header"
                            style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
                          >
                            <div className="lms-card-pattern"></div>
                            <div className="lms-card-badge">Activa</div>
                            <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: palette.accent, opacity: 0.15 }}></div>
                            <div style={{ position: 'absolute', top: -10, left: -10, width: 50, height: 50, borderRadius: '50%', background: '#fff', opacity: 0.05 }}></div>
                            <div className="lms-card-title">{classItem.name}</div>
                            <div className="lms-card-desc">{classItem.description || 'Sin descripción'}</div>
                            <div className="lms-card-accent-bar" style={{ background: `linear-gradient(90deg, ${palette.accent}, transparent)` }}></div>
                          </div>

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

                            {classItem.my_role === 'student' && (
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', color: 'var(--gray-400)', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.07em' }}>progreso</span>
                                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: 'var(--g600)', fontWeight: 700 }}>
                                    {classItem.progress ?? 0}%
                                  </span>
                                </div>
                                <div style={{ height: 3, background: 'var(--g100)', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${classItem.progress ?? 0}%`,
                                    background: 'linear-gradient(90deg, var(--g500), var(--g700))',
                                    borderRadius: 99,
                                    transition: 'width 0.6s ease'
                                  }}></div>
                                </div>
                              </div>
                            )}

                            <div className="lms-card-footer">
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  className="lms-card-action"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Miembros"
                                >
                                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                </button>
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
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 100, background: 'var(--g50)', border: '1px solid var(--g200)', color: 'var(--g600)', fontSize: '0.7rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}
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
                  <div className="lms-modal-icon" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)' }}>
                    <svg width="18" height="18" fill="none" stroke="var(--g500)" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <div className="lms-modal-title">Crear clase</div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: 'var(--gray-400)', marginTop: 2 }}>// como instructor</div>
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
                    <label className="lms-label">// nombre de la clase *</label>
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
                    <label className="lms-label">// descripción</label>
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
                <button className="lms-btn-submit green" onClick={createClass} disabled={loading || !name.trim()}>
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
                  <div className="lms-modal-icon" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <svg width="18" height="18" fill="none" stroke="var(--g600)" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="lms-modal-title">Unirse a una clase</div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: 'var(--gray-400)', marginTop: 2 }}>// con código de invitación</div>
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
                  <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', lineHeight: 1.6, fontWeight: 300 }}>
                    Solicita el código de clase a tu instructor e ingrésalo a continuación.
                  </p>
                  <div>
                    <label className="lms-label">// código de clase *</label>
                    <input
                      className="lms-input lms-code-input"
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
                  <div className="lms-info-box" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', color: 'var(--g700)' }}>
                    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span style={{ fontSize: '0.75rem', lineHeight: 1.5, fontWeight: 300 }}>El código distingue mayúsculas y minúsculas. Ingrésalo exactamente como te lo compartió tu instructor.</span>
                  </div>
                </div>
              </div>

              <div className="lms-modal-footer">
                <button className="lms-btn-ghost" onClick={() => { setShowJoinModal(false); setJoinCode('') }} disabled={joinLoading}>Cancelar</button>
                <button className="lms-btn-submit green-outline" onClick={joinClass} disabled={joinLoading || !joinCode.trim()}>
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