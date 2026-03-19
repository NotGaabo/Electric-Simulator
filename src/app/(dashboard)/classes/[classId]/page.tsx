'use client'

import { useState } from 'react'
import { useAssignmentsList } from '@/hooks/useAssignmentsList'
import { SIMULATOR_MODULES, getSimulatorModuleById } from '@/lib/simulatorModules'
import type { SimulatorModuleId } from '@/lib/simulatorModules'

export default function AssignmentsListPage() {
  const {
    assignments,
    classId,
    router,
    loading,
    error,
    fetchAssignments,
    formatDate,
    isOverdue,
    role,
    roleLoading
  } = useAssignmentsList()

  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate]       = useState('')
  const [moduleId, setModuleId]     = useState(SIMULATOR_MODULES[0]?.id ?? 'circuit')
  const [submitting, setSubmitting] = useState(false)

  const createAssignment = async () => {
    if (!title.trim() || !classId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: classId,
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          simulator_module: moduleId
        })
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Error al crear la asignación'); return }
      setTitle(''); setDescription(''); setDueDate('')
      await fetchAssignments()
    } catch (err) {
      console.error(err)
      alert('Error al crear la asignación')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        :root {
          --white:    #ffffff;
          --off-white:#f2fbf5;
          --g50:      #f0fdf4;
          --g100:     #dcfce7;
          --g200:     #bbf7d0;
          --g300:     #86efac;
          --g400:     #4ade80;
          --g500:     #22c55e;
          --g600:     #16a34a;
          --g700:     #15803d;
          --gray-400: #94a3b8;
          --gray-500: #64748b;
          --gray-700: #334155;
          --gray-900: #0f172a;
        }

        .asgn-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: var(--off-white);
          background-image:
            linear-gradient(rgba(34,197,94,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.07) 1px, transparent 1px);
          background-size: 48px 48px;
          padding: 36px 32px;
          position: relative;
        }
        @media (max-width: 640px) { .asgn-root { padding: 24px 16px; } }

        .asgn-inner { max-width: 720px; margin: 0 auto; }

        /* ── Header ── */
        .asgn-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 28px;
        }
        .asgn-title {
          font-size: 1.4rem; font-weight: 300; letter-spacing: -0.8px;
          color: var(--gray-900);
        }
        .asgn-title strong { font-weight: 500; color: var(--g600); }
        .asgn-count {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem; color: var(--gray-400);
          letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px;
        }

        /* ── Create form ── */
        .asgn-form {
          background: rgba(255,255,255,0.92);
          border: 1px solid var(--g100);
          border-radius: 16px;
          padding: 22px;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(34,197,94,0.06);
          position: relative; overflow: hidden;
        }
        .asgn-form::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--g300), transparent);
        }
        .asgn-form-title {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem; font-weight: 400;
          color: var(--gray-400); letter-spacing: 0.12em;
          text-transform: uppercase; margin-bottom: 16px;
        }
        .asgn-form-grid { display: flex; flex-direction: column; gap: 12px; }
        .asgn-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) { .asgn-form-row { grid-template-columns: 1fr; } }

        .asgn-input, .asgn-textarea, .asgn-select {
          width: 100%;
          padding: 10px 14px;
          background: var(--off-white);
          border: 1.5px solid var(--g200);
          border-radius: 10px;
          color: var(--gray-900);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .asgn-input::placeholder, .asgn-textarea::placeholder { color: var(--gray-400); }
        .asgn-input:focus, .asgn-textarea:focus, .asgn-select:focus {
          border-color: var(--g500);
          background: var(--white);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.10);
        }
        .asgn-textarea { resize: none; min-height: 72px; }
        .asgn-select { cursor: pointer; }

        .asgn-btn-create {
          padding: 10px 24px;
          background: linear-gradient(135deg, var(--g500), var(--g700));
          color: white; border: none; border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(22,163,74,0.30);
          align-self: flex-start;
        }
        .asgn-btn-create:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(22,163,74,0.40);
        }
        .asgn-btn-create:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Loading ── */
        .asgn-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 320px; gap: 16px;
        }
        .asgn-spin {
          width: 40px; height: 40px;
          border: 3px solid rgba(34,197,94,0.12);
          border-top-color: var(--g500);
          border-radius: 50%;
          animation: asgnSpin 0.8s linear infinite;
        }
        @keyframes asgnSpin { to { transform: rotate(360deg); } }
        .asgn-loading-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem; color: var(--gray-400); letter-spacing: 0.08em;
        }

        /* ── Error ── */
        .asgn-error {
          background: rgba(255,255,255,0.92);
          border: 1px solid var(--g100);
          border-left: 4px solid var(--g500);
          border-radius: 12px;
          padding: 20px;
          display: flex; align-items: flex-start; gap: 14px;
          box-shadow: 0 2px 12px rgba(34,197,94,0.06);
        }
        .asgn-error-icon {
          width: 36px; height: 36px; flex-shrink: 0;
          background: rgba(34,197,94,0.08); border: 1px solid var(--g200);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
        }
        .asgn-error-msg { font-size: 0.8125rem; color: var(--gray-500); margin-bottom: 12px; font-weight: 300; }
        .asgn-btn-retry {
          padding: 7px 16px;
          background: linear-gradient(135deg, var(--g500), var(--g700));
          color: white; border: none; border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem; font-weight: 500; cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 3px 10px rgba(22,163,74,0.25);
        }
        .asgn-btn-retry:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(22,163,74,0.35); }

        /* ── Empty ── */
        .asgn-empty {
          background: rgba(255,255,255,0.70);
          border: 1.5px dashed var(--g200);
          border-radius: 16px;
          padding: 64px 24px; text-align: center;
        }
        .asgn-empty-icon {
          width: 56px; height: 56px; margin: 0 auto 16px;
          background: rgba(34,197,94,0.06); border: 1px solid var(--g100);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
        }
        .asgn-empty-title {
          font-size: 1rem; font-weight: 500; color: var(--gray-900); margin-bottom: 6px;
        }
        .asgn-empty-sub { font-size: 0.8125rem; color: var(--gray-400); font-weight: 300; }

        /* ── List ── */
        .asgn-list { display: flex; flex-direction: column; gap: 10px; }

        /* ── Card ── */
        .asgn-card {
          background: rgba(255,255,255,0.92);
          border: 1px solid var(--g100);
          border-radius: 14px;
          padding: 18px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex; align-items: flex-start; gap: 16px;
          position: relative; overflow: hidden;
          box-shadow: 0 1px 4px rgba(34,197,94,0.05);
        }
        .asgn-card:hover {
          transform: translateY(-2px);
          border-color: var(--g300);
          box-shadow: 0 8px 24px rgba(34,197,94,0.10);
        }
        .asgn-card-bar {
          position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--g400), var(--g600));
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.3s ease;
        }
        .asgn-card:hover .asgn-card-bar { transform: scaleX(1); }

        .asgn-card-icon {
          width: 42px; height: 42px; flex-shrink: 0;
          background: linear-gradient(135deg, var(--g500), var(--g700));
          border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 3px 10px rgba(22,163,74,0.25);
        }
        .asgn-card-body { flex: 1; min-width: 0; }
        .asgn-card-title {
          font-size: 0.9375rem; font-weight: 500;
          color: var(--gray-900); margin-bottom: 4px; letter-spacing: -0.2px;
        }
        .asgn-card-desc {
          font-size: 0.8125rem; color: var(--gray-500);
          font-weight: 300; margin-bottom: 10px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .asgn-card-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }

        .asgn-tag {
          font-family: 'Space Mono', monospace;
          font-size: 0.6rem; letter-spacing: 0.05em;
          padding: 3px 8px; border-radius: 6px;
          background: rgba(34,197,94,0.08);
          color: var(--g600); border: 1px solid var(--g100);
        }
        .asgn-date {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem; letter-spacing: 0.03em;
          color: var(--gray-400);
        }
        .asgn-date.overdue { color: #ef4444; }

        .asgn-chevron { color: var(--g300); flex-shrink: 0; align-self: center; }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="asgn-root">
        <div className="asgn-inner">

          {/* Header */}
          <div className="asgn-header">
            <div>
              <h1 className="asgn-title">Trabajo de <strong>clase</strong></h1>
              <p className="asgn-count">
                // {assignments.length} {assignments.length === 1 ? 'asignación' : 'asignaciones'}
              </p>
            </div>
          </div>

          {/* Form profesor */}
          {!roleLoading && role === 'teacher' && (
            <div className="asgn-form">
              <p className="asgn-form-title">// crear asignación</p>
              <div className="asgn-form-grid">
                <input
                  className="asgn-input"
                  type="text"
                  placeholder="Título"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  className="asgn-textarea"
                  placeholder="Descripción (opcional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="asgn-form-row">
                  <input
                    className="asgn-input"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <select
                    className="asgn-select"
                    value={moduleId}
                    onChange={(e) => setModuleId(e.target.value as SimulatorModuleId)}
                  >
                    {SIMULATOR_MODULES.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="asgn-btn-create"
                  onClick={createAssignment}
                  disabled={submitting || !title.trim()}
                >
                  {submitting ? 'Creando...' : 'Crear asignación →'}
                </button>
              </div>
            </div>
          )}

          {/* Estados */}
          {loading ? (
            <div className="asgn-loading">
              <div className="asgn-spin" />
              <p className="asgn-loading-label">// cargando asignaciones...</p>
            </div>

          ) : error ? (
            <div className="asgn-error">
              <div className="asgn-error-icon">
                <svg width="16" height="16" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="asgn-error-msg">{error}</p>
                <button className="asgn-btn-retry" onClick={fetchAssignments}>
                  Reintentar →
                </button>
              </div>
            </div>

          ) : assignments.length === 0 ? (
            <div className="asgn-empty">
              <div className="asgn-empty-icon">
                <svg width="24" height="24" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="asgn-empty-title">No hay asignaciones aún</p>
              <p className="asgn-empty-sub">Las asignaciones aparecerán aquí cuando el profesor las publique</p>
            </div>

          ) : (
            <div className="asgn-list">
              {assignments.map((assignment, i) => {
                const moduleInfo = getSimulatorModuleById(assignment.simulator_module)
                const overdue = assignment.due_date && isOverdue(assignment.due_date)

                return (
                  <div
                    key={assignment.id}
                    className="asgn-card"
                    onClick={() => router.push(`/classes/${classId}/assignment/${assignment.id}`)}
                    style={{ animation: `cardIn 0.3s ease-out ${i * 0.05}s backwards` }}
                  >
                    <div className="asgn-card-icon">
                      <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>

                    <div className="asgn-card-body">
                      <p className="asgn-card-title">{assignment.title}</p>
                      {assignment.description && (
                        <p className="asgn-card-desc">{assignment.description}</p>
                      )}
                      <div className="asgn-card-meta">
                        {moduleInfo && (
                          <span className="asgn-tag">{moduleInfo.label}</span>
                        )}
                        {assignment.due_date && (
                          <span className={`asgn-date ${overdue ? 'overdue' : ''}`}>
                            {overdue ? '// vencida: ' : '// entrega: '}
                            {formatDate(assignment.due_date)}
                          </span>
                        )}
                        <span className="asgn-date">
                          publicada {formatDate(assignment.created_at)}
                        </span>
                      </div>
                    </div>

                    <svg className="asgn-chevron" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>

                    <div className="asgn-card-bar" />
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </>
  )
}