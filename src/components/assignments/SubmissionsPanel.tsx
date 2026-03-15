'use client'

import { AssignmentSubmission } from '@/types/assignments'
import { formatDate } from '@/utils/dateFormat'

interface Props {
  submissions: AssignmentSubmission[]
}

export default function SubmissionsPanel({ submissions }: Props) {
  return (
    <div id="entregas" className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Entregas</h3>
            <p className="text-xs text-gray-500">Estudiantes que entregaron esta asignación</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {submissions.length}
          </span>
        </div>
      </div>

      <div className="p-5">
        {submissions.length === 0 ? (
          <div className="text-sm text-gray-500">Aún no hay entregas.</div>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div key={submission.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200">
                <div className="w-24 h-16 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center text-xs text-gray-400">
                  {submission.screenshot_url ? (
                    <img
                      src={submission.screenshot_url}
                      alt={`Entrega de ${submission.student_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    'Sin preview'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {submission.student_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Entregado: {formatDate(submission.submitted_at)}
                  </div>
                </div>
                {submission.screenshot_url && (
                  <a
                    href={submission.screenshot_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 text-xs font-semibold rounded-md bg-gray-900 text-white hover:bg-gray-800"
                  >
                    Ver
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
