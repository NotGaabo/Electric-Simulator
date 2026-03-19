// src/hooks/useAssignment.ts

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Assignment } from '@/types/assignments'

export function useAssignment(assignmentId: string) {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (!assignmentId) return

    fetchAssignment()

    const supabase = createClient()

    const channel = supabase
      .channel('assignment-detail')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'assignments',
          filter: `id=eq.${assignmentId}`
        },
        (payload) => {
          setAssignment((prev) => ({
            ...(payload.new as Assignment),
            status: prev?.status ?? (payload.new as Assignment).status ?? 'not_submitted',
            my_role: prev?.my_role ?? (payload.new as Assignment).my_role ?? null
          }))
        }
      )
      .subscribe((status) => {
        setIsOnline(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [assignmentId])

  const fetchAssignment = async () => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`)
      if (!res.ok) {
        const text = await res.text()
        console.error('Failed to fetch assignment:', res.status, text)
        throw new Error(`Failed to fetch assignment: ${res.status}`)
      }

      const data = await res.json()
      setAssignment(data)
    } catch {
      setError('No se pudo cargar la asignación')
    } finally {
      setLoading(false)
    }
  }

  return { assignment, loading, error, isOnline }
}
