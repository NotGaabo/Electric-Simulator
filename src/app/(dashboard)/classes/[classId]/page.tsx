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
      console.error(err)
      alert('Error al crear la asignación')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-8 py-8 max-sm:px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
              Trabajo de clase
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              {assignments.length} {assignments.length === 1 ? 'asignación' : 'asignaciones'}
            </p>
          </div>
        </div>

        {/* FORM PROFESOR */}
        {!roleLoading && role === 'teacher' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Crear asignación
            </h2>

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
                  onChange={(e) => setModuleId(e.target.value as SimulatorModuleId)}
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

        {/* ESTADOS */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-80 gap-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-indigo-100 border-t-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Cargando asignaciones...</p>
          </div>

        ) : error ? (
          <div className="bg-white border border-slate-200 border-l-4 border-l-indigo-500 rounded-xl p-5 shadow-sm">
            <p className="text-sm text-slate-500 mb-3">{error}</p>
            <button
              onClick={fetchAssignments}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-sm font-semibold rounded-lg"
            >
              Reintentar
            </button>
          </div>

        ) : assignments.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-20 px-6 text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              No hay asignaciones aún
            </h3>
            <p className="text-sm text-slate-400">
              Las asignaciones aparecerán aquí cuando el profesor las publique
            </p>
          </div>

        ) : (
          <div className="flex flex-col gap-2.5">
            {assignments.map((assignment, i) => {
              const moduleInfo = getSimulatorModuleById(
                assignment.simulator_module
              )

              return (
                <div
                  key={assignment.id}
                  onClick={() =>
                    router.push(`/classes/${classId}/assignment/${assignment.id}`)
                  }
                  className="group bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer transition-all duration-200 relative overflow-hidden flex items-start gap-4 shadow-sm hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
                  style={{ animation: `cardIn 0.3s ease-out ${i * 0.05}s backwards` }}
                >
                  {/* ICON */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                    <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>

                  {/* CONTENIDO */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.9375rem] font-bold text-slate-900 mb-1">
                      {assignment.title}
                    </p>

                    {assignment.description && (
                      <p className="text-[0.8125rem] text-slate-500 mb-2 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3.5">

                      {moduleInfo && (
                        <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                          {moduleInfo.label}
                        </span>
                      )}

                      {assignment.due_date && (
                        <span className={`text-xs font-medium ${isOverdue(assignment.due_date)
                          ? 'text-red-600'
                          : 'text-slate-500'
                          }`}>
                          {isOverdue(assignment.due_date) ? 'Vencida: ' : 'Entrega: '}
                          {formatDate(assignment.due_date)}
                        </span>
                      )}

                      <span className="text-xs text-slate-400">
                        Publicada {formatDate(assignment.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* CHEVRON */}
                  <svg
                    className="text-slate-300 shrink-0 self-center"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>

                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-400 scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}