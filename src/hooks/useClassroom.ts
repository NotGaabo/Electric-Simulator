import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ClassItem {
  id: string
  name: string
  description: string | null
  code?: string
  created_at: string
  class_members?: Array<{
    role: string
    profiles?: {
      full_name?: string
      email?: string
    }
  }>
}

export function useClassroom() {
  const router = useRouter()

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [fetchingClasses, setFetchingClasses] = useState(true)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    setFetchingClasses(true)
    try {
      const res = await fetch('/api/classes')
      if (!res.ok) throw new Error('Error al cargar las clases')
      const data = await res.json()
      setClasses(data)
    } catch (err) {
      console.error(err)
      alert('No se pudieron cargar las clases. Recarga la página.')
    } finally {
      setFetchingClasses(false)
    }
  }

  const deleteClass = async (classId: string, className: string) => {
    const ok = window.confirm(`¿Eliminar "${className}"? Esta acción no se puede deshacer.`)
    if (!ok) return

    try {
      const res = await fetch(`/api/classes/${classId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        alert(data.error || 'Error al eliminar la clase')
        return
      }

      setClasses(prev => prev.filter(c => c.id !== classId))
      alert('Clase eliminada')
    } catch (err) {
      console.error(err)
      alert('Error al eliminar la clase')
    }
  }

  const colors = [
    'from-green-700 to-green-900',        // verde bosque
    'from-emerald-600 to-emerald-900',    // esmeralda
    'from-teal-600 to-teal-900',          // teal
    'from-green-500 to-green-700',        // verde lima
    'from-green-600 to-green-800',        // verde base
    'from-teal-700 to-teal-900',          // teal oscuro
    'from-emerald-500 to-emerald-700',    // esmeralda claro
    'from-emerald-700 to-emerald-900',    // esmeralda oscuro
    'from-green-800 to-green-950',        // verde profundo
    'from-cyan-600 to-teal-800',          // cyan-verde
    'from-emerald-500 to-teal-700',       // menta-teal
    'from-green-600 to-teal-800',         // verde-teal
  ]

  const getColorForClass = (classId: string): string => {
    // Hash FNV-1a — buena dispersión con UUIDs
    let hash = 2166136261
    for (let i = 0; i < classId.length; i++) {
      hash ^= classId.charCodeAt(i)
      hash = (hash * 16777619) >>> 0
    }
    return colors[hash % colors.length]
  }

  const getTeacherInitials = (classItem: ClassItem) => {
    const teacher = classItem.class_members?.find(m => m.role === 'teacher')
    const full = teacher?.profiles?.full_name
    if (full) {
      const parts = full.trim().split(/\s+/)
      return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase()
    }
    return '👤'
  }

  const getTeacherName = (classItem: ClassItem) => {
    const teacher = classItem.class_members?.find(m => m.role === 'teacher')
    return teacher?.profiles?.full_name || teacher?.profiles?.email || 'Profesor'
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return {
    classes,
    router,
    fetchingClasses,
    getColorForClass,
    getTeacherInitials,
    getTeacherName,
    formatDate,
    deleteClass,
    fetchClasses
  }
}