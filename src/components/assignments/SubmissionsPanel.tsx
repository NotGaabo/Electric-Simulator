'use client'

import { AssignmentSubmission } from '@/types/assignments'
import { formatDate } from '@/utils/dateFormat'
import SubmissionViewer from './SubmissionViewer'
import { useState } from 'react'

interface Props {
  submissions: AssignmentSubmission[]
  assignmentId: string
  totalPoints?: number | null
  onGradeSubmit?: (submission_id: string, assignment_id: string, score: number, feedback: string) => Promise<void>
  isTeacher?: boolean
}

export default function SubmissionsPanel({ submissions, assignmentId, totalPoints, onGradeSubmit, isTeacher = false }: Props) {
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null)

  return (
    <div id="entregas" style={{
      background: 'rgba(255,255,255,0.92)',
      border: '1px solid #dcfce7',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(34,197,94,0.06)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #f0fdf4',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.9rem', fontWeight: 500, color: '#0f172a', marginBottom: 2,
          }}>Entregas</p>
          <p style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '0.08em',
          }}>// estudiantes que entregaron</p>
        </div>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.7rem', fontWeight: 700,
          color: '#15803d',
          background: 'rgba(34,197,94,0.08)', border: '1px solid #bbf7d0',
          padding: '4px 10px', borderRadius: 100,
        }}>
          {submissions.length}
        </span>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {submissions.length === 0 ? (
          <div style={{
            padding: '32px 0', textAlign: 'center',
          }}>
            <div style={{
              width: 44, height: 44, margin: '0 auto 12px',
              background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" fill="none" stroke="#86efac" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.08em' }}>// sin entregas aún</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {submissions.map((submission) => (
              <div key={submission.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px',
                background: '#f8fffe',
                border: '1px solid #dcfce7', borderRadius: 12,
              }}>
                {/* Preview */}
                <div style={{
                  width: 80, height: 52, flexShrink: 0,
                  background: '#f0fdf4', border: '1px solid #dcfce7',
                  borderRadius: 8, overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {submission.screenshot_url ? (
                    <img
                      src={submission.screenshot_url}
                      alt={`Entrega de ${submission.student_name}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <svg width="16" height="16" fill="none" stroke="#86efac" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8125rem', fontWeight: 500,
                    color: '#0f172a', marginBottom: 3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {submission.student_name}
                  </p>
                  <p style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '0.06em',
                  }}>
                    {formatDate(submission.submitted_at)}
                  </p>
                </div>

                {/* Action */}
                {submission.screenshot_url && (
                  <button
                    onClick={() => setSelectedSubmission(submission)}
                    style={{
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, #22c55e, #15803d)',
                      border: 'none', borderRadius: 100,
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em',
                      color: '#fff', cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(22,163,74,0.35)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(22,163,74,0.25)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    Ver →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Viewer Modal */}
      {selectedSubmission && (
        <SubmissionViewer
          submission={selectedSubmission}
          assignmentId={assignmentId}
          totalPoints={totalPoints}
          isTeacher={isTeacher}
          onClose={() => setSelectedSubmission(null)}
          onGradeSubmit={onGradeSubmit}
        />
      )}
    </div>
  )
}