'use client'

import { Assignment } from '@/types/assignments'
import { formatDate } from '@/utils/dateFormat'
import { getSimulatorModuleById } from '@/lib/simulatorModules'
import { useRouter } from 'next/navigation'

interface Props {
  assignment: Assignment
}

export default function Sidebar({ assignment }: Props) {
  const router = useRouter()
  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date()
  const isSubmitted = assignment.status === 'submitted'
  const moduleInfo = getSimulatorModuleById(assignment.simulator_module)
  const isTeacher = assignment.my_role === 'teacher'
  const showStudentAction = !isTeacher
  const submissionsCount = assignment.submissions?.length ?? 0
  const returnTo = `/classes/${assignment.class_id}/assignment/${assignment.id}`
  const moduleUrl = moduleInfo
    ? `${moduleInfo.route}?assignmentId=${assignment.id}&returnTo=${encodeURIComponent(returnTo)}`
    : null

  return (
    <div className="space-y-4">
      {assignment.due_date && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Fecha de entrega
              </span>
            </div>
            <p className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
              {formatDate(assignment.due_date)}
            </p>
            {isOverdue && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                Vencido
              </span>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-sm font-semibold text-gray-900">
              {isTeacher ? 'Entregas' : 'Tu trabajo'}
            </h3>
          </div>

          {isTeacher ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-medium text-gray-600">Entregadas</span>
                <span className="text-xs font-semibold text-gray-900">{submissionsCount}</span>
              </div>
              <a
                href="#entregas"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Ver entregas
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-medium text-gray-600">Estado</span>
                {isSubmitted ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Entregado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Pendiente
                  </span>
                )}
              </div>

              {showStudentAction && moduleUrl ? (
                <button
                  onClick={() => router.push(moduleUrl)}
                  className="w-full group relative overflow-hidden px-4 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Realizar asignación ahora
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700"></div>
                </button>
              ) : (
                <button className="w-full group relative overflow-hidden px-4 py-3 bg-gray-200 text-gray-500 rounded-lg font-medium text-sm cursor-not-allowed">
                  Selecciona un módulo para esta asignación
                </button>
              )}

              {isSubmitted && (
                <button className="w-full px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors">
                  Ver entrega
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Información
          </h3>

          <div className="space-y-3 text-sm">
            {assignment.points && (
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="text-gray-600 text-xs">Puntos</p>
                  <p className="font-semibold text-gray-900">{assignment.points}</p>
                </div>
              </div>
            )}

            {moduleInfo && (
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1-1-3 1 1-3-1-1 3-.75M14 2l.72 3.1L18 6l-3 1.1L14 10l-1-2.9L10 6l3.3-.9L14 2z" />
                </svg>
                <div>
                  <p className="text-gray-600 text-xs">Módulo</p>
                  <p className="font-semibold text-gray-900">{moduleInfo.label}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-gray-600 text-xs">Publicado</p>
                <p className="font-medium text-gray-900">{formatDate(assignment.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
