'use client'

import { AssignmentSubmission } from '@/types/assignments'
import { formatDate } from '@/utils/dateFormat'
import { useState } from 'react'

interface Props {
  submission: AssignmentSubmission
  assignmentId: string
  totalPoints?: number | null
  onClose: () => void
  onGradeSubmit?: (submission_id: string, assignment_id: string, score: number, feedback: string) => Promise<void>
  isTeacher?: boolean
}

export default function SubmissionViewer({
  submission,
  assignmentId,
  totalPoints,
  onClose,
  onGradeSubmit,
  isTeacher = false
}: Props) {
  const [score, setScore] = useState<string>(submission.score?.toString() || '')
  const [feedback, setFeedback] = useState<string>(submission.feedback || '')
  const [submitting, setSubmitting] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGradeSubmit = async () => {
    if (!onGradeSubmit || !score) {
      setError('Debes ingresar una puntuación')
      return
    }
    
    try {
      setSubmitting(true)
      setError(null)
      console.log('Guardando calificación:', { submission_id: submission.id, assignment_id: assignmentId, score: parseInt(score), feedback })
      
      await onGradeSubmit(submission.id, assignmentId, parseInt(score), feedback)
      
      setIsSaved(true)
      setTimeout(() => {
        setIsSaved(false)
        onClose()
      }, 1500)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      console.error('Error al guardar calificación:', errorMsg)
      setError(`Error: ${errorMsg}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        display: 'flex',
        maxHeight: '90vh',
        width: '90vw',
        maxWidth: 1200,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease-out',
      }}>
        {/* Image section */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#f8fffe',
          borderRight: '1px solid #dcfce7',
          overflow: 'auto',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h3 style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.95rem',
                fontWeight: 500,
                color: '#0f172a',
                margin: 0,
              }}>
                Entrega de {submission.student_name}
              </h3>
              <p style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.6rem',
                color: '#94a3b8',
                margin: '4px 0 0 0',
              }}>
                {formatDate(submission.submitted_at)}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          {/* Image display */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflow: 'auto',
          }}>
            {submission.screenshot_url ? (
              <img
                src={submission.screenshot_url}
                alt={`Entrega de ${submission.student_name}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: 12,
                  border: '1px solid #dcfce7',
                }}
              />
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#94a3b8',
              }}>
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p style={{ marginTop: 12 }}>No hay imagen</p>
              </div>
            )}
          </div>
        </div>

        {/* Grading section */}
        {isTeacher && (
          <div style={{
            width: 320,
            background: '#ffffff',
            borderLeft: '1px solid #dcfce7',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
          }}>
            {/* Grading header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #dcfce7',
            }}>
              <h3 style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#0f172a',
                margin: 0,
              }}>
                Calificación
              </h3>
            </div>

            {/* Grading content */}
            <div style={{
              flex: 1,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              {/* Score input */}
              <div>
                <label style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#0f172a',
                  display: 'block',
                  marginBottom: 8,
                }}>
                  Puntuación {score ? `${score} / ${totalPoints}` : `/ ${totalPoints}`}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    min="0"
                    max={totalPoints || 100}
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="0"
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '1.5px solid #dcfce7',
                      borderRadius: 10,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.875rem',
                      color: '#0f172a',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#22c55e'
                      e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.10)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#dcfce7'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              {/* Feedback textarea */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#0f172a',
                  display: 'block',
                  marginBottom: 8,
                }}>
                  Comentarios
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Añade comentarios sobre la entrega..."
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    border: '1.5px solid #dcfce7',
                    borderRadius: 10,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8125rem',
                    color: '#0f172a',
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#22c55e'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.10)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#dcfce7'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Error message */}
              {error && (
                <div style={{
                  padding: '12px 14px',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.8125rem',
                  color: '#991b1b',
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={onClose}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'transparent',
                    border: '1.5px solid #dcfce7',
                    borderRadius: 10,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: '#0f172a',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: submitting ? 0.5 : 1,
                  }}
                >
                  Cerrar
                </button>
                <button
                  onClick={handleGradeSubmit}
                  disabled={submitting || !score}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: isSaved 
                      ? 'linear-gradient(135deg, #86efac, #22c55e)'
                      : 'linear-gradient(135deg, #22c55e, #15803d)',
                    border: 'none',
                    borderRadius: 10,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: submitting || !score ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(34,197,94,0.25)',
                    transition: 'all 0.2s',
                    opacity: submitting || !score ? 0.6 : 1,
                  }}
                >
                  {isSaved ? '✓ Guardado' : submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
