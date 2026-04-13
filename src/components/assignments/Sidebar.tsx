'use client'

import { Assignment } from '@/types/assignments'
import { formatDate } from '@/utils/dateFormat'
import { getSimulatorModuleById } from '@/lib/simulatorModules'
import { useRouter } from 'next/navigation'

interface Props {
  assignment: Assignment
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid #dcfce7',
  borderRadius: 14,
  overflow: 'hidden',
  boxShadow: '0 2px 10px rgba(34,197,94,0.05)',
}

const sectionLabel: React.CSSProperties = {
  fontFamily: "'Space Mono', monospace",
  fontSize: '0.6rem', fontWeight: 400,
  color: '#94a3b8', letterSpacing: '0.12em',
  textTransform: 'uppercase', marginBottom: 12,
}

const infoRow: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10,
}

const infoIconWrap: React.CSSProperties = {
  width: 28, height: 28, flexShrink: 0,
  background: '#f0fdf4', border: '1px solid #dcfce7',
  borderRadius: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  marginTop: 1,
}

export default function Sidebar({ assignment }: Props) {
  const router = useRouter()
  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date()
  const isSubmitted = assignment.status === 'submitted'
  const moduleInfo = getSimulatorModuleById(assignment.simulator_module)
  const isTeacher = assignment.my_role === 'teacher'
  const submissionsCount = assignment.submissions?.length ?? 0
  const returnTo = `/classes/${assignment.class_id}/assignment/${assignment.id}`
  const moduleUrl = moduleInfo
    ? `${moduleInfo.route}?assignmentId=${assignment.id}&returnTo=${encodeURIComponent(returnTo)}`
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Due date card */}
      {assignment.due_date && (
        <div style={card}>
          <div style={{ padding: '16px 18px' }}>
            <p style={sectionLabel}>// fecha de entrega</p>
            <div style={infoRow}>
              <div style={infoIconWrap}>
                <svg width="13" height="13" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.875rem', fontWeight: 500,
                  color: isOverdue ? '#ef4444' : '#0f172a',
                }}>
                  {formatDate(assignment.due_date)}
                </p>
                {isOverdue && (
                  <span style={{
                    display: 'inline-block', marginTop: 6,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.6rem', letterSpacing: '0.08em',
                    padding: '2px 8px', borderRadius: 6,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#ef4444',
                  }}>
                    vencido
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Work / Submissions card */}
      <div style={card}>
        <div style={{ padding: '16px 18px' }}>
          <p style={sectionLabel}>
            {isTeacher ? '// entregas' : '// tu trabajo'}
          </p>

          {isTeacher ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 10,
              }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.06em' }}>entregadas</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>{submissionsCount}</span>
              </div>
              <a
                href="#entregas"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #22c55e, #15803d)',
                  border: 'none', borderRadius: 100,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.8125rem', fontWeight: 500,
                  color: '#fff', textDecoration: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(22,163,74,0.28)',
                  transition: 'all 0.2s',
                }}
              >
                Ver entregas
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Status pill */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 10,
              }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.06em' }}>estado</span>
                {isSubmitted ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em',
                    color: '#15803d',
                    background: 'rgba(34,197,94,0.08)', border: '1px solid #bbf7d0',
                    padding: '3px 8px', borderRadius: 6,
                  }}>
                    <svg width="10" height="10" fill="#15803d" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    entregado
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em',
                    color: '#92400e',
                    background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)',
                    padding: '3px 8px', borderRadius: 6,
                  }}>
                    pendiente
                  </span>
                )}
              </div>

              {/* CTA button */}
              {moduleUrl ? (
                <button
                  onClick={() => router.push(moduleUrl)}
                  style={{
                    width: '100%', padding: '11px 16px',
                    background: 'linear-gradient(135deg, #22c55e, #15803d)',
                    border: 'none', borderRadius: 100,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8125rem', fontWeight: 500,
                    color: '#fff', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(22,163,74,0.30)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Realizar asignación
                </button>
              ) : (
                <button
                  disabled
                  style={{
                    width: '100%', padding: '11px 16px',
                    background: '#f0fdf4', border: '1px solid #dcfce7',
                    borderRadius: 100,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8125rem', fontWeight: 400,
                    color: '#94a3b8', cursor: 'not-allowed',
                  }}
                >
                  Sin módulo asignado
                </button>
              )}

              {isSubmitted && (
                <button style={{
                  width: '100%', padding: '9px 16px',
                  background: '#fff', border: '1.5px solid #dcfce7',
                  borderRadius: 100,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.8125rem', fontWeight: 400,
                  color: '#64748b', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                  Ver entrega
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info card */}
      <div style={card}>
        <div style={{ padding: '16px 18px' }}>
          <p style={sectionLabel}>// información</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {assignment.points && (
              <div style={infoRow}>
                <div style={infoIconWrap}>
                  <svg width="13" height="13" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 2 }}>puntos</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>{assignment.points}</p>
                </div>
              </div>
            )}

            {moduleInfo && (
              <div style={infoRow}>
                <div style={infoIconWrap}>
                  <svg width="13" height="13" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 2 }}>módulo</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>{moduleInfo.label}</p>
                </div>
              </div>
            )}

            <div style={infoRow}>
              <div style={infoIconWrap}>
                <svg width="13" height="13" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 2 }}>publicado</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 400, color: '#334155' }}>{formatDate(assignment.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}