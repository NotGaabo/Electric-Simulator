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
    <div style={{
      background: 'rgba(255,255,255,0.92)',
      border: '1px solid #dcfce7',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(34,197,94,0.06)',
    }}>
      {/* Header */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #15803d, #14532d)',
        padding: '28px 28px 24px',
        overflow: 'hidden',
      }}>
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px',
        }} />
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, #4ade80, transparent)',
        }} />
        {/* Decorative orb */}
        <div style={{
          position: 'absolute', bottom: -30, right: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: '#22c55e', opacity: 0.08,
        }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 52, height: 52, flexShrink: 0,
            background: 'linear-gradient(135deg, #22c55e, #15803d)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(34,197,94,0.35)',
          }}>
            <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <h1 style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '1.4rem', fontWeight: 300, letterSpacing: '-0.5px',
                color: '#ffffff', lineHeight: 1.3,
              }}>
                {assignment.title}
              </h1>
              {assignment.points && (
                <div style={{
                  flexShrink: 0, padding: '4px 12px',
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 100,
                }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#fff', fontWeight: 700 }}>
                    {assignment.points} pts
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.6)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', fontWeight: 300 }}>Profesor</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{formatShortDate(assignment.created_at)}</span>
              {moduleInfo && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.6rem', letterSpacing: '0.05em',
                    color: '#86efac',
                    background: 'rgba(34,197,94,0.15)',
                    border: '1px solid rgba(74,222,128,0.25)',
                    padding: '3px 8px', borderRadius: 6,
                  }}>
                    {moduleInfo.label}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 28px' }}>
        {assignment.description ? (
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.9rem', fontWeight: 300,
            color: '#334155', lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}>
            {assignment.description}
          </p>
        ) : (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div style={{
              width: 44, height: 44, margin: '0 auto 12px',
              background: '#f0fdf4', border: '1px solid #dcfce7',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" fill="none" stroke="#86efac" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.08em' }}>// sin descripción</p>
          </div>
        )}

        {assignment.due_date && (
          <>
            <div style={{ margin: '20px 0', height: 1, background: '#dcfce7' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 12,
              }}>
                <div style={{
                  width: 32, height: 32, flexShrink: 0,
                  background: 'rgba(34,197,94,0.08)', border: '1px solid #bbf7d0',
                  borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 2 }}>// vence</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: 500, color: '#0f172a' }}>{formatShortDate(assignment.due_date)}</p>
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 12,
              }}>
                <div style={{
                  width: 32, height: 32, flexShrink: 0,
                  background: 'rgba(34,197,94,0.08)', border: '1px solid #bbf7d0',
                  borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" fill="#16a34a" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 2 }}>// estado</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: 500, color: '#15803d' }}>
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