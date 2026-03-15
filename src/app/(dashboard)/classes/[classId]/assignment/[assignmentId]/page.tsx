'use client'

import { useParams } from 'next/navigation'
import { useAssignment } from '@/hooks/useAssignments'
import { useComments } from '@/hooks/useComments'
import AssignmentHeader from '@/components/assignments/AssignmentHeader'
import AssignmentCard from '@/components/assignments/AssignmentCard'
import CommentsSection from '@/components/assignments/CommentsSection'
import Sidebar from '@/components/assignments/Sidebar'

export default function AssignmentDetailPage() {
  const params = useParams()
  const assignmentId = params.assignmentId as string

  const { assignment, loading, error, isOnline } = useAssignment(assignmentId)
  const commentsData = useComments(assignmentId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-700 font-medium">Cargando asignación...</p>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border-l-4 border-red-600 rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Error al cargar</h3>
                <p className="text-gray-600 text-sm">
                  {error || 'Asignación no encontrada'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AssignmentHeader isOnline={isOnline} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-5">
            <AssignmentCard assignment={assignment} />
            <CommentsSection {...commentsData} />
          </div>

          <Sidebar assignment={assignment} />
        </div>
      </div>
    </div>
  )
}