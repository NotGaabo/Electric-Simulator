'use client'

import { Assignment } from '@/types/assignments'
import { formatShortDate } from '@/utils/dateFormat'
import { getSimulatorModuleById } from '@/lib/simulatorModules'

interface Props {
  assignment: Assignment
}

export default function AssignmentCard({ assignment }: Props) {
  const moduleInfo = getSimulatorModuleById(assignment.simulator_module)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group">
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600"></div>

        <div className="relative flex items-start gap-5">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl font-bold text-white leading-tight tracking-tight">
                {assignment.title}
              </h1>

              {assignment.points && (
                <div className="flex-shrink-0 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                  <span className="text-sm font-bold text-white">
                    {assignment.points} pts
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-gray-300">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium">Profesor</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-sm">{formatShortDate(assignment.created_at)}</span>
              {moduleInfo && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-xs font-semibold text-white/80 bg-white/10 border border-white/15 px-2 py-1 rounded-full">
                    {moduleInfo.label}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {assignment.description ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {assignment.description}
            </p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">Sin descripción</p>
          </div>
        )}

        {assignment.due_date && (
          <>
            <div className="my-6 border-t border-gray-200"></div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Vence</p>
                  <p className="text-sm font-bold text-gray-900">{formatShortDate(assignment.due_date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Estado</p>
                  <p className="text-sm font-bold text-green-700">
                    {assignment.status === 'submitted' ? 'Entregado' : 'Pendiente'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}