'use client'

import { Comment } from '@/types/assignments'
import { formatShortDate } from '@/utils/dateFormat'
import { RefObject } from 'react'

interface Props {
  comments: Comment[]
  newComment: string
  setNewComment: (value: string) => void
  submitting: boolean
  handleSubmitComment: () => void
  commentsEndRef: RefObject<HTMLDivElement | null>
}

export default function CommentsSection({
  comments,
  newComment,
  setNewComment,
  submitting,
  handleSubmitComment,
  commentsEndRef
}: Props) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.92)',
      border: '1px solid #dcfce7',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(34,197,94,0.06)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #f0fdf4',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'rgba(34,197,94,0.08)', border: '1px solid #dcfce7',
          borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="15" height="15" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.9rem', fontWeight: 500, color: '#0f172a', flex: 1,
        }}>
          Comentarios de la clase
        </h2>
        {comments.length > 0 && (
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.08em',
          }}>
            // {comments.length}
          </span>
        )}
      </div>

      {/* Comments list */}
      <div style={{ maxHeight: 480, overflowY: 'auto' }}>
        {comments.length > 0 ? (
          <div>
            {comments.map((comment, index) => (
              <div
                key={comment.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f0fdf4',
                  animation: `cmtFadeIn 0.3s ease-out ${index * 0.05}s backwards`,
                }}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, flexShrink: 0,
                    background: 'linear-gradient(135deg, #22c55e, #15803d)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(34,197,94,0.25)',
                  }}>
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                    }}>
                      {comment.user_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.8125rem', fontWeight: 500, color: '#0f172a',
                      }}>
                        {comment.user_name || 'Usuario'}
                      </span>
                      <span style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '0.05em',
                      }}>
                        {formatShortDate(comment.created_at)}
                      </span>
                    </div>
                    <p style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.8125rem', fontWeight: 300,
                      color: '#334155', lineHeight: 1.6,
                    }}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
        ) : (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, margin: '0 auto 14px',
              background: '#f0fdf4', border: '1px solid #dcfce7',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" fill="none" stroke="#86efac" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: 4 }}>
              No hay comentarios aún
            </p>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.06em' }}>
              // sé el primero en comentar
            </p>
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{
        padding: '14px 20px',
        background: '#f8fffe',
        borderTop: '1px solid #dcfce7',
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{
            width: 32, height: 32, flexShrink: 0, marginTop: 4,
            background: '#dcfce7', border: '1px solid #bbf7d0',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !submitting && newComment.trim()) handleSubmitComment()
              }}
              placeholder="Añade un comentario..."
              disabled={submitting}
              style={{
                width: '100%',
                padding: '9px 14px',
                background: '#ffffff',
                border: '1.5px solid #bbf7d0',
                borderRadius: 10,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.875rem', fontWeight: 300,
                color: '#0f172a',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#22c55e'
                e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.10)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#bbf7d0'
                e.target.style.boxShadow = 'none'
              }}
            />

            {newComment.trim() && (
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => setNewComment('')}
                  disabled={submitting}
                  style={{
                    padding: '7px 14px',
                    background: 'transparent',
                    border: '1.5px solid #dcfce7',
                    borderRadius: 100,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8rem', fontWeight: 400,
                    color: '#64748b', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitComment}
                  disabled={submitting}
                  style={{
                    padding: '7px 18px',
                    background: 'linear-gradient(135deg, #22c55e, #15803d)',
                    border: 'none', borderRadius: 100,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8rem', fontWeight: 500,
                    color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                    boxShadow: '0 3px 10px rgba(22,163,74,0.25)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  {submitting ? (
                    <>
                      <svg style={{ animation: 'cmtSpin 0.7s linear infinite' }} width="12" height="12" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                        <path fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando...
                    </>
                  ) : 'Comentar →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes cmtFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cmtSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}