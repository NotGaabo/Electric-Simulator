import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Assignment, AssignmentRole } from '@/types/assignments'
import { parseDateString } from '@/utils/dateFormat'

export interface ClassInfo {
  id: string
  name: string
  palette: {
    from: string
    to: string
    accent: string
  }
}

export interface AssignmentWithClass extends Assignment {
  class_name: string
  class_id: string
  class_palette: {
    from: string
    to: string
    accent: string
  }
}

export function useAllAssignments() {
  const router = useRouter()

  const [assignments, setAssignments] = useState<AssignmentWithClass[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cardPalettes = [
    { from: '#15803d', to: '#14532d', accent: '#4ade80' },  // 0 - verde bosque
    { from: '#059669', to: '#065f46', accent: '#34d399' },  // 1 - esmeralda
    { from: '#0d9488', to: '#134e4a', accent: '#2dd4bf' },  // 2 - teal
    { from: '#22c55e', to: '#15803d', accent: '#86efac' },  // 3 - verde lima
    { from: '#16a34a', to: '#0d6b31', accent: '#bbf7d0' },  // 4 - verde base
    { from: '#0f766e', to: '#0c4a44', accent: '#5eead4' },  // 5 - teal oscuro
    { from: '#4ade80', to: '#16a34a', accent: '#dcfce7' },  // 6 - verde claro
    { from: '#047857', to: '#064e3b', accent: '#6ee7b7' },  // 7 - esmeralda oscuro
    { from: '#166534', to: '#052e16', accent: '#4ade80' },  // 8 - verde profundo
    { from: '#0e7490', to: '#164e63', accent: '#67e8f9' },  // 9 - cyan-verde
    { from: '#10b981', to: '#047857', accent: '#a7f3d0' },  // 10 - menta
    { from: '#1a6b3c', to: '#0d4a28', accent: '#6ee7b7' },  // 11 - verde medio
  ]

  const getPaletteForClass = (classId: string) => {
    let hash = 2166136261
    for (let i = 0; i < classId.length; i++) {
      hash ^= classId.charCodeAt(i)
      hash = (hash * 16777619) >>> 0
    }
    return cardPalettes[hash % cardPalettes.length]
  }

  useEffect(() => {
    fetchAllAssignments()
  }, [])

  const fetchAllAssignments = async () => {
    setLoading(true)
    setError(null)
    try {
      // Traer todas las clases del usuario
      const classRes = await fetch('/api/classes')
      if (!classRes.ok) throw new Error('Error al cargar clases')
      const classesData: any[] = await classRes.json()

      // Mapear clases con sus paletas
      const classesWithPalettes = classesData.map((c: any) => ({
        id: c.id,
        name: c.name,
        palette: getPaletteForClass(c.id),
      }))
      setClasses(classesWithPalettes)

      // Traer todas las asignaciones de todas las clases
      const allAssignments: AssignmentWithClass[] = []
      for (const classItem of classesWithPalettes) {
        const assignRes = await fetch(`/api/assignments?class_id=${classItem.id}`)
        if (!assignRes.ok) continue

        const classAssignments: Assignment[] = await assignRes.json()
        classAssignments.forEach((assignment) => {
          allAssignments.push({
            ...assignment,
            class_name: classItem.name,
            class_id: classItem.id,
            class_palette: classItem.palette,
          })
        })
      }

      setAssignments(allAssignments)
    } catch (err) {
      console.error('Error fetching all assignments:', err)
      setError('No se pudieron cargar las asignaciones')
    } finally {
      setLoading(false)
    }
  }

  const isOverdue = (dueDate: string | null): boolean => {
    if (!dueDate) return false
    const due = parseDateString(dueDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return due < now
  }

  return {
    assignments,
    classes,
    loading,
    error,
    router,
    isOverdue,
  }
}
