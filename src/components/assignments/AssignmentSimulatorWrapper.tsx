'use client'

import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import html2canvas from 'html2canvas'
import type { SimulatorModuleId } from '@/lib/simulatorModules'

interface Props {
  module: SimulatorModuleId
  children: ReactNode
}

export default function AssignmentSimulatorWrapper({ module, children }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const assignmentId = searchParams.get('assignmentId')
  const returnTo = searchParams.get('returnTo')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const handleSubmit = async () => {
    if (!assignmentId || submitting || submitted) return
    if (!containerRef.current) return

    setSubmitting(true)
    setError(null)

    try {
      setIsCapturing(true)
      await new Promise(requestAnimationFrame)

      const canvas = await html2canvas(containerRef.current, {
        useCORS: true, scale: 2, backgroundColor: null
      })

      const dataUrl = canvas.toDataURL('image/png', 0.92)
      setIsCapturing(false)

      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenshotDataUrl: dataUrl, simulatorModule: module })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'No se pudo enviar la entrega')
        return
      }

      setSubmitted(true)
      if (returnTo) router.push(returnTo)
      else router.back()
    } catch (err) {
      console.error('Error submitting assignment:', err)
      setError('Ocurrió un error al enviar la entrega')
    } finally {
      setSubmitting(false)
      setIsCapturing(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {assignmentId && (
        <div style={{
          position: 'fixed', zIndex: 50,
          top: 16, right: 16,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
        }}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fff', borderRadius: 10, padding: '8px 14px',
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.65rem', letterSpacing: '0.06em',
              boxShadow: '0 4px 14px rgba(239,68,68,0.25)',
              maxWidth: 240,
            }}>
              // {error}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || submitted || isCapturing}
            style={{
              padding: '10px 20px',
              background: submitted
                ? 'linear-gradient(135deg, #059669, #047857)'
                : 'linear-gradient(135deg, #22c55e, #15803d)',
              border: 'none', borderRadius: 100,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.875rem', fontWeight: 500,
              color: '#fff', cursor: (submitting || submitted || isCapturing) ? 'not-allowed' : 'pointer',
              opacity: (submitting || isCapturing) ? 0.7 : 1,
              boxShadow: '0 4px 16px rgba(22,163,74,0.35)',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {submitting || isCapturing ? (
              <>
                <svg style={{ animation: 'swSpin 0.7s linear infinite' }} width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                  <path fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Entregando...
              </>
            ) : submitted ? (
              <>
                <svg width="14" height="14" fill="white" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Entregado
              </>
            ) : (
              <>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Entregar clase
              </>
            )}
          </button>
        </div>
      )}

      <div ref={containerRef} style={{ pointerEvents: isCapturing ? 'none' : 'auto' }}>
        {children}
      </div>

      <style jsx global>{`
        @keyframes swSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}