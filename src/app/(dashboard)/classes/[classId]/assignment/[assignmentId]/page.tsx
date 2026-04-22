'use client'

import { useParams } from 'next/navigation'
import { useAssignment } from '@/hooks/useAssignments'
import { useComments } from '@/hooks/useComments'
import { useGradeSubmission } from '@/hooks/useGradeSubmission'
import AssignmentHeader from '@/components/assignments/AssignmentHeader'
import AssignmentCard from '@/components/assignments/AssignmentCard'
import CommentsSection from '@/components/assignments/CommentsSection'
import Sidebar from '@/components/assignments/Sidebar'
import SubmissionsPanel from '@/components/assignments/SubmissionsPanel'

export default function AssignmentDetailPage() {
  const params = useParams()
  const assignmentId = params.assignmentId as string

  const { assignment, loading, error, isOnline } = useAssignment(assignmentId)
  const commentsData = useComments(assignmentId)
  const { gradeSubmission } = useGradeSubmission()

  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap');
          .assign-loading {
            font-family: 'DM Sans', sans-serif;
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh;
            background: #f2fbf5;
            background-image:
              linear-gradient(rgba(34,197,94,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,197,94,0.06) 1px, transparent 1px);
            background-size: 48px 48px;
          }
          .assign-spin-wrap { text-align: center; }
          .assign-spin-ring {
            width: 44px; height: 44px; margin: 0 auto 20px;
            border: 3px solid rgba(34,197,94,0.15);
            border-top-color: #22c55e;
            border-radius: 50%;
            animation: assignSpin 0.8s linear infinite;
          }
          @keyframes assignSpin { to { transform: rotate(360deg); } }
          .assign-spin-label {
            font-family: 'Space Mono', monospace;
            font-size: 0.75rem; color: #94a3b8; letter-spacing: 0.08em;
          }
        `}</style>
        <div className="assign-loading">
          <div className="assign-spin-wrap">
            <div className="assign-spin-ring" />
            <p className="assign-spin-label">// cargando asignación...</p>
          </div>
        </div>
      </>
    )
  }

  if (error || !assignment) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap');
          .assign-error-root {
            font-family: 'DM Sans', sans-serif;
            min-height: 100vh; padding: 48px 16px;
            background: #f2fbf5;
            background-image:
              linear-gradient(rgba(34,197,94,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,197,94,0.06) 1px, transparent 1px);
            background-size: 48px 48px;
          }
          .assign-error-box {
            max-width: 520px; margin: 0 auto;
            background: rgba(255,255,255,0.92);
            border: 1px solid #bbf7d0;
            border-left: 4px solid #22c55e;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(34,197,94,0.08);
            padding: 24px;
            display: flex; align-items: flex-start; gap: 16px;
          }
          .assign-error-icon {
            width: 40px; height: 40px; flex-shrink: 0;
            background: rgba(34,197,94,0.08);
            border: 1px solid rgba(34,197,94,0.2);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
          }
          .assign-error-title {
            font-size: 0.95rem; font-weight: 500;
            color: #0f172a; margin-bottom: 4px;
          }
          .assign-error-msg {
            font-size: 0.8125rem; color: #64748b; font-weight: 300; line-height: 1.6;
          }
          .assign-error-code {
            font-family: 'Space Mono', monospace;
            font-size: 0.65rem; color: #94a3b8;
            text-transform: uppercase; letter-spacing: 0.1em;
            margin-top: 12px;
          }
        `}</style>
        <div className="assign-error-root">
          <div className="assign-error-box">
            <div className="assign-error-icon">
              <svg width="18" height="18" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="assign-error-title">Error al cargar</p>
              <p className="assign-error-msg">{error || 'Asignación no encontrada'}</p>
              <p className="assign-error-code">// assignment_not_found</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap');
        .assign-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #f2fbf5;
          background-image:
            linear-gradient(rgba(34,197,94,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .assign-inner {
          max-width: 1280px; margin: 0 auto;
          padding: 24px 16px;
        }
        @media (min-width: 640px)  { .assign-inner { padding: 24px; } }
        @media (min-width: 1024px) { .assign-inner { padding: 32px; } }

        .assign-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-top: 24px;
        }
        @media (min-width: 1024px) {
          .assign-grid { grid-template-columns: 1fr 1fr 1fr; }
          .assign-main  { grid-column: span 2; }
          .assign-side  { grid-column: span 1; }
        }
        .assign-main-stack { display: flex; flex-direction: column; gap: 20px; }
      `}</style>

      <div className="assign-root">
        <div className="assign-inner">
          <AssignmentHeader isOnline={isOnline} />

          <div className="assign-grid">
            <div className="assign-main assign-main-stack">
              <AssignmentCard assignment={assignment} />
              <CommentsSection {...commentsData} />
              {assignment.my_role === 'teacher' && (
                <SubmissionsPanel 
                  submissions={assignment.submissions ?? []} 
                  assignmentId={assignmentId}
                  totalPoints={assignment.points}
                  isTeacher={true}
                  onGradeSubmit={gradeSubmission}
                />
              )}
            </div>

            <div className="assign-side">
              <Sidebar assignment={assignment} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}