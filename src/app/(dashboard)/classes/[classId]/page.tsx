'use client'

import { useState } from 'react'
import { useAssignmentsList } from '@/hooks/useAssignmentsList'
import { SIMULATOR_MODULES, getSimulatorModuleById } from '@/lib/simulatorModules'

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

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [moduleId, setModuleId] = useState(SIMULATOR_MODULES[0]?.id ?? 'circuit')
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
      if (!res.ok) {
        alert(data.error || 'Error al crear la asignación')
        return
      }

      setTitle('')
      setDescription('')
      setDueDate('')
      await fetchAssignments()
    } catch (err) {
      console.error('Error:', err)
      alert('Error al crear la asignación')
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="px-8 py-8 max-sm:px-4">
      <div className="max-w-3xl mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Trabajo de clase</h1>
            <p className="text-sm text-slate-400 font-medium">
              {assignments.length} {assignments.length === 1 ? 'asignación' : 'asignaciones'}
            </p>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="relative w-2 h-2">
              <div className="absolute inset-0 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span className="text-sm font-semibold text-emerald-600">En vivo</span>
          </div>
        </div>

        {/* Teacher form */}
        {!roleLoading && role === 'teacher' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Crear asignación</h2>
            <div className="grid gap-3">
              <input
                type="text"
                placeholder="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                />
                <select
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  {SIMULATOR_MODULES.map((moduleItem) => (
                    <option key={moduleItem.id} value={moduleItem.id}>
                      {moduleItem.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={createAssignment}
                disabled={submitting || !title.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm disabled:opacity-50"
              >
                {submitting ? 'Creando...' : 'Crear asignación'}
              </button>
            </div>
          </div>
        )}

        {/* States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-80 gap-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-indigo-100 border-t-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Cargando asignaciones...</p>
          </div>

        ) : error ? (
          <div className="bg-white border border-slate-200 border-l-4 border-l-indigo-500 rounded-xl p-5 shadow-sm">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Error al cargar</h3>
                <p className="text-sm text-slate-500 mb-3">{error}</p>
                <button
                  onClick={fetchAssignments}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:from-indigo-600 hover:to-cyan-600 transition-all"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>

        ) : assignments.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-20 px-6 text-center">
            <div className="w-18 h-18 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ width: 72, height: 72 }}>
              <svg width="32" height="32" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No hay asignaciones aún</h3>
            <p className="text-sm text-slate-400">Las asignaciones aparecerán aquí cuando el profesor las publique</p>
          </div>

        ) : (
          <div className="flex flex-col gap-2.5">
            {assignments.map((assignment, i) => {
              const moduleInfo = getSimulatorModuleById(assignment.simulator_module)
              return (
              <div
                key={assignment.id}
                onClick={() => router.push(`/classes/${classId}/assignment/${assignment.id}`)}
                className="group bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer transition-all duration-200 relative overflow-hidden flex items-start gap-4 shadow-sm hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
                style={{ animation: `cardIn 0.3s ease-out ${i * 0.05}s backwards` }}
              >
                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-200 transition-transform group-hover:scale-105">
                  <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-[0.9375rem] font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                      {assignment.title}
                    </p>
                    {assignment.points && (
                      <span className="text-[0.6875rem] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                        {assignment.points} pts
                      </span>
                    )}
                  </div>

                  {assignment.description && (
                    <p className="text-[0.8125rem] text-slate-500 leading-relaxed mb-3 line-clamp-2">
                      {assignment.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3.5">
                    {moduleInfo && (
                      <span className="text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {moduleInfo.label}
                      </span>
                    )}
                    {assignment.due_date && (
                      <span className={`flex items-center gap-1 text-xs font-medium ${isOverdue(assignment.due_date) ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {isOverdue(assignment.due_date) ? 'Vencida: ' : 'Entrega: '}{formatDate(assignment.due_date)}
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Publicada {formatDate(assignment.created_at)}
                    </span>

                    {assignment.status === 'submitted' && (
                      <span className="flex items-center gap-1 text-[0.6875rem] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Entregado
                      </span>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <svg className="text-slate-300 shrink-0 self-center transition-all group-hover:text-indigo-400 group-hover:translate-x-0.5" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>

                {/* Accent bar */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-400 scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
              </div>
            )})}
          </div>
        )}
      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
