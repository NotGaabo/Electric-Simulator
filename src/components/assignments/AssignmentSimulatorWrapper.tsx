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
        useCORS: true,
        scale: 2,
        backgroundColor: null
      })

      const dataUrl = canvas.toDataURL('image/png', 0.92)
      setIsCapturing(false)

      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshotDataUrl: dataUrl,
          simulatorModule: module
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'No se pudo enviar la entrega')
        return
      }

      setSubmitted(true)
      if (returnTo) {
        router.push(returnTo)
      } else {
        router.back()
      }
    } catch (err) {
      console.error('Error submitting assignment:', err)
      setError('Ocurrió un error al enviar la entrega')
    } finally {
      setSubmitting(false)
      setIsCapturing(false)
    }
  }

  return (
    <div className="relative">
      {assignmentId && (
        <div className="fixed z-50 top-4 right-4 flex flex-col items-end gap-2">
          {error && (
            <div className="bg-red-600 text-white text-xs px-3 py-2 rounded-lg shadow">
              {error}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || submitted || isCapturing}
            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitted ? 'Entregado' : submitting ? 'Entregando...' : 'Entregar clase'}
          </button>
        </div>
      )}

      <div ref={containerRef} className={isCapturing ? 'pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  )
}
