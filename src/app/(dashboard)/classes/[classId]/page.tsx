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
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-[3px] border-indigo-100 border-t-indigo-500 animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <p className="text-center text-slate-400">
            No hay asignaciones aún
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {assignments.map((assignment) => {
              const moduleInfo = getSimulatorModuleById(
                assignment.simulator_module
              )

              return (
                <div
                  key={assignment.id}
                  onClick={() =>
                    router.push(`/classes/${classId}/assignment/${assignment.id}`)
                  }
                  className="bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md"
                >
                  <h3 className="font-semibold">{assignment.title}</h3>

                  {assignment.description && (
                    <p className="text-sm text-slate-500">
                      {assignment.description}
                    </p>
                  )}

                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    {moduleInfo && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                        {moduleInfo.label}
                      </span>
                    )}

                    {assignment.due_date && (
                      <span>
                        {isOverdue(assignment.due_date) ? 'Vencida:' : 'Entrega:'}{' '}
                        {formatDate(assignment.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}