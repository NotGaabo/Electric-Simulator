'use client'

import { useRouter } from 'next/navigation'

interface Props {
  isOnline: boolean
}

export default function AssignmentHeader({ isOnline }: Props) {
  const router = useRouter()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingBottom: 20,
    }}>
      <button
        onClick={() => router.back()}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid #dcfce7',
          borderRadius: 100,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.8125rem', fontWeight: 400,
          color: '#334155', cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(34,197,94,0.06)',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#86efac'
          ;(e.currentTarget as HTMLButtonElement).style.color = '#15803d'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#dcfce7'
          ;(e.currentTarget as HTMLButtonElement).style.color = '#334155'
        }}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Trabajo de clase</span>
      </button>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 14px',
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid #dcfce7',
        borderRadius: 100,
        boxShadow: '0 1px 4px rgba(34,197,94,0.06)',
      }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isOnline ? '#22c55e' : '#94a3b8',
          }} />
          {isOnline && (
            <div style={{
              position: 'absolute',
              width: 8, height: 8, borderRadius: '50%',
              background: '#22c55e',
              animation: 'hdrPing 1.5s ease-out infinite',
            }} />
          )}
        </div>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.65rem', letterSpacing: '0.08em',
          color: isOnline ? '#15803d' : '#64748b',
        }}>
          {isOnline ? 'en_vivo' : 'sin_conexión'}
        </span>
      </div>

      <style jsx>{`
        @keyframes hdrPing {
          0%   { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}