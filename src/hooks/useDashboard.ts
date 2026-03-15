import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Class {
  id: string
  name: string
  description: string
  created_at: string
  my_role?: string        // 'teacher' | 'student'
  progress?: number       // 0–100, solo relevante para estudiantes
  class_members?: Array<{
    role: string
    profiles?: {
      full_name?: string
      email?: string
    }
  }>
}

export function useDashboard() {

  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [fetchingClasses, setFetchingClasses] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const cardPalettes = [
    { from: '#312e81', to: '#4338ca', accent: '#6366f1' },    // Índigo profundo
    { from: '#164e63', to: '#0e7490', accent: '#06b6d4' },    // Cian oscuro
    { from: '#065f46', to: '#047857', accent: '#10b981' },    // Esmeralda
    { from: '#1e1b4b', to: '#3730a3', accent: '#818cf8' },    // Violeta
    { from: '#0c4a6e', to: '#0369a1', accent: '#38bdf8' },    // Azul cielo
    { from: '#134e4a', to: '#0f766e', accent: '#2dd4bf' },    // Teal
    { from: '#1e3a5f', to: '#1d4ed8', accent: '#60a5fa' },    // Azul real
    { from: '#3b0764', to: '#6d28d9', accent: '#a78bfa' },    // Púrpura
  ]

  const getPaletteForClass = (classId: string) => {
    const index = parseInt(classId.replace(/\D/g, ''), 10) || 0
    return cardPalettes[index % cardPalettes.length]
  }

  const getTeacherInitials = (classItem: Class) => {
    const teacher = classItem.class_members?.find(m => m.role === 'teacher')
    if (teacher?.profiles?.full_name) {
      const names = teacher.profiles.full_name.split(' ')
      return names.map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }
    return 'PR'
  }

  const getTeacherName = (classItem: Class) => {
    const teacher = classItem.class_members?.find(m => m.role === 'teacher')
    return teacher?.profiles?.full_name || teacher?.profiles?.email || 'Profesor'
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchClasses = async () => {
    setFetchingClasses(true)
    try {
      const res = await fetch('/api/classes')
      if (!res.ok) throw new Error('Error al cargar las clases')
      const data = await res.json()
      setClasses(data)
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setFetchingClasses(false)
    }
  }

  const createClass = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Error al crear la clase'); return }
      await fetchClasses()
      setName(''); setDescription(''); setShowCreateModal(false)
    } catch { alert('Error al crear la clase') }
    finally { setLoading(false) }
  }

  const joinClass = async () => {
    if (!joinCode.trim()) return
    setJoinLoading(true)
    try {
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() })
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Código inválido'); return }
      await fetchClasses()
      setJoinCode(''); setShowJoinModal(false)
    } catch { alert('Error al unirse a la clase') }
    finally { setJoinLoading(false) }
  }

  const goToClass = (classId: string) => router.push(`/classes/${classId}`)

  const deleteClass = async (classId: string, className: string) => {
    if (!window.confirm(`¿Eliminar la clase "${className}"? Esta acción no se puede deshacer.`)) return
    try {
      const res = await fetch(`/api/classes/${classId}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Error'); return }
      setClasses(classes.filter(c => c.id !== classId))
    } catch { alert('Error al eliminar la clase') }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return {
    goToClass,
    deleteClass,
    getTeacherInitials,
    getTeacherName,
    getPaletteForClass,
    dropdownRef,
    createClass,
    joinClass,
    classes,
    showCreateModal,
    setShowCreateModal,
    showJoinModal,
    setShowJoinModal,
    showDropdown,
    setShowDropdown,
    showSidebar,
    setShowSidebar,
    name,
    setName,
    description,
    setDescription,
    joinCode,
    setJoinCode,
    loading,
    joinLoading,
    fetchingClasses,
    formatDate
  }

}
