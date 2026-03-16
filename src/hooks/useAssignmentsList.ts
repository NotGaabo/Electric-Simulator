import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Assignment, AssignmentRole } from '@/types/assignments'

export function useAssignmentsList() {
  const params = useParams()
  const router = useRouter()
  const classId = params.classId as string

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<AssignmentRole | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    if (!classId) return
    fetchAssignments()
    fetchRole()
    const unsub = setupRealtimeSubscription()
    return () => {
      unsub()
      createClient().channel('assignments-list').unsubscribe()
    }
  }, [classId])

  const fetchRole = async () => {
    setRoleLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setRole(null)
        return
      }

      const { data, error: roleError } = await supabase
        .from('class_members')
        .select('role')
        .eq('class_id', classId)
        .eq('user_id', user.id)
        .single()

      if (roleError) {
        console.error('Error fetching role:', roleError)
        setRole(null)
        return
      }

      setRole((data?.role as AssignmentRole) ?? null)
    } catch (err) {
      console.error('Error fetching role:', err)
      setRole(null)
    } finally {
      setRoleLoading(false)
    }
  }

  const fetchAssignments = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/assignments?class_id=${classId}`)
      if (!res.ok) throw new Error()
      setAssignments(await res.json())
    } catch {
      setError('No se pudieron cargar las asignaciones')
    } finally {
      setLoading(false)
    }
  }

  const normalizeAssignment = (assignment: Assignment) => ({
    ...assignment,
    status: assignment.status ?? 'not_submitted'
  })

  const setupRealtimeSubscription = () => {
    const channel = createClient()
      .channel('assignments-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignments', filter: `class_id=eq.${classId}` },
        ({ eventType, new: n, old: o }) => {
          if (eventType === 'INSERT') setAssignments((p) => [normalizeAssignment(n as Assignment), ...p])
          if (eventType === 'UPDATE') setAssignments((p) =>
            p.map((a) => (a.id === n.id ? { ...normalizeAssignment(n as Assignment), status: a.status } : a))
          )
          if (eventType === 'DELETE') setAssignments((p) => p.filter((a) => a.id !== o.id))
        }
      )
      .subscribe()
    return () => { channel.unsubscribe() }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

  const isOverdue = (d: string) => new Date(d) < new Date()

  return {
    classId,
    assignments,
    router,
    loading,
    error,
    fetchAssignments,
    formatDate,
    isOverdue,
    role,
    roleLoading
  }
}
