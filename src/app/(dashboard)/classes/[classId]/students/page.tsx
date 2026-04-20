'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface ClassMember {
  role: string
  user_id: string
  profiles?: {
    full_name?: string | null
    email?: string | null
  }
}

interface ClassDetails {
  id: string
  name: string
  description?: string | null
  created_at: string
  class_members?: ClassMember[]
}

export default function StudentsPage() {
  const params = useParams()
  const classId = params.classId as string
  const [classInfo, setClassInfo] = useState<ClassDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!classId) return

    const fetchClass = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/classes/${classId}`)
        if (!res.ok) throw new Error('No se pudo cargar la clase')

        const data = await res.json()
        setClassInfo(data)
        setError(null)
      } catch (err) {
        console.error(err)
        setError((err as Error)?.message || 'Error al cargar los estudiantes')
      } finally {
        setLoading(false)
      }
    }

    fetchClass()
  }, [classId])

  const formatName = (member: ClassMember) => {
    return member.profiles?.full_name || member.profiles?.email || 'Usuario'
  }

  const students = classInfo?.class_members?.filter((member) => member.role !== 'teacher') ?? []
  const teacher = classInfo?.class_members?.find((member) => member.role === 'teacher')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }

        .page-root {
          min-height: 100vh;
          padding: 32px 24px;
          background: #f2fbf5;
          background-image:
            linear-gradient(rgba(34,197,94,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          color: #0f172a;
          font-family: 'DM Sans', sans-serif;
        }

        .page-inner { max-width: 1024px; margin: 0 auto; }

        .section-header { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
        .section-title { font-size: clamp(28px, 3vw, 40px); font-weight: 300; letter-spacing: -0.8px; }
        .section-title strong { font-weight: 500; color: #16a34a; }
        .section-sub { color: #64748b; max-width: 760px; line-height: 1.7; }

        .info-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(34,197,94,0.08);
          color: #166534;
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          border: 1px solid rgba(34,197,94,0.14);
        }

        .members-grid { display: grid; gap: 16px; }
        @media (min-width: 768px) { .members-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

        .member-card {
          background: rgba(255,255,255,0.92);
          border: 1px solid #dcfce7;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(34,197,94,0.05);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .member-card:hover { transform: translateY(-2px); border-color: #86efac; }

        .member-avatar {
          width: 48px; height: 48px;
          border-radius: 14px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #22c55e, #15803d);
          color: white; font-weight: 700;
          margin-bottom: 18px;
        }

        .member-name { font-size: 1rem; font-weight: 600; margin-bottom: 4px; }
        .member-role { color: #64748b; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.08em; }
        .member-extra { color: #4b5563; font-size: 0.9rem; margin-top: 12px; }

        .empty-state {
          background: rgba(255,255,255,0.92);
          border: 1px dashed #bbf7d0;
          border-radius: 18px;
          padding: 48px 28px;
          text-align: center;
        }
        .empty-title { font-size: 1rem; font-weight: 600; margin-bottom: 8px; }
        .empty-sub { color: #64748b; font-size: 0.94rem; line-height: 1.7; }

        .error-box {
          background: rgba(255,255,255,0.92);
          border: 1px solid #fca5a5;
          border-left: 4px solid #f87171;
          border-radius: 16px;
          padding: 22px;
          color: #b91c1c;
          max-width: 760px;
        }
      `}</style>

      <div className="page-root">
        <div className="page-inner">
          <div className="section-header">
            <div>
              <p className="info-pill">// estudiantes</p>
              <h1 className="section-title">Equipo de <strong>clase</strong></h1>
            </div>
            <p className="section-sub">
              {classInfo
                ? `Revisa el profesorado y la lista de alumnos registrados en ${classInfo.name}.`
                : 'Carga la información de la clase y sus integrantes.'}
            </p>
          </div>

          {loading ? (
            <div className="empty-state">
              <p className="empty-title">Cargando estudiantes...</p>
            </div>
          ) : error ? (
            <div className="error-box">{error}</div>
          ) : !classInfo ? (
            <div className="empty-state">
              <p className="empty-title">Clase no encontrada</p>
            </div>
          ) : (
            <div className="members-grid">
              <div className="member-card">
                <div className="member-avatar">T</div>
                <p className="member-name">{formatName(teacher ?? { role: 'teacher', user_id: '', profiles: { full_name: 'Profesor' } })}</p>
                <p className="member-role">Profesor</p>
                <p className="member-extra">Encargado de la clase y creador de tareas.</p>
              </div>

              {students.length === 0 ? (
                <div className="member-card">
                  <p className="member-name">Aún no hay estudiantes</p>
                  <p className="member-extra">Los alumnos aparecerán aquí cuando se unan a la clase.</p>
                </div>
              ) : (
                students.map((member) => {
                  const name = member.profiles?.full_name || member.profiles?.email || 'Alumno'
                  const initials = name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()

                  return (
                    <div key={member.user_id} className="member-card">
                      <div className="member-avatar">{initials || 'AL'}</div>
                      <p className="member-name">{name}</p>
                      <p className="member-role">Alumno</p>
                      <p className="member-extra">Usuario ID: {member.user_id}</p>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
