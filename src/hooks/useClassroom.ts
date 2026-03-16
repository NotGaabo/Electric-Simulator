import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ClassItem {
  id: string
  name: string
  description: string | null
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
    'from-slate-600 to-slate-700',
    'from-blue-600 to-blue-700',
    'from-sky-500 to-sky-600',
    'from-emerald-600 to-emerald-700',
    'from-orange-600 to-orange-700',
    'from-rose-600 to-rose-700',
    'from-purple-600 to-purple-700',
    'from-indigo-600 to-indigo-700',
    'from-pink-600 to-pink-700',
    'from-teal-600 to-teal-700'
  ]

  const getColorForClass = (classId: string) => {
    const index = parseInt(classId.replace(/\D/g, ''), 10) || 0
    return colors[index % colors.length]
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