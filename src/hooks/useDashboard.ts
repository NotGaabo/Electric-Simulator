import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Class {
  id: string
  name: string
  description: string
  code?: string
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
    // Hash de Fowler–Noll–Vo simplificado — muy buena dispersión con UUIDs
    let hash = 2166136261
    for (let i = 0; i < classId.length; i++) {
      hash ^= classId.charCodeAt(i)
      hash = (hash * 16777619) >>> 0  // >>> 0 mantiene uint32
    }
    return cardPalettes[hash % cardPalettes.length]
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