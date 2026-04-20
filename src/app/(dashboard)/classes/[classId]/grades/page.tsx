'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formatDate } from '@/utils/dateFormat'

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

interface AssignmentSummary {
  id: string
  title: string
  description: string | null
  points: number | null
  due_date: string | null
  created_at: string
  simulator_module?: string | null
  status?: string
}

export default function GradesPage() {
  const params = useParams()
  const classId = params.classId as string
  const [classInfo, setClassInfo] = useState<ClassDetails | null>(null)
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!classId) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [classRes, assignmentsRes] = await Promise.all([
          fetch(`/api/classes/${classId}`),
          fetch(`/api/assignments?class_id=${classId}`)
        ])

        if (!classRes.ok) throw new Error('No se pudo cargar la clase')
        if (!assignmentsRes.ok) throw new Error('No se pudieron cargar las asignaciones')

        const classData = await classRes.json()
        const assignmentsData = await assignmentsRes.json()

        setClassInfo(classData)
        setAssignments(assignmentsData)
        setError(null)
      } catch (err) {
        console.error(err)
        setError((err as Error)?.message || 'Error al cargar las calificaciones')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [classId])

  const formatDateValue = (value: string | null) => {
    if (!value) return 'Sin fecha'
    return formatDate(value)
  }

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

        .grades-grid { display: grid; gap: 16px; }
        @media (min-width: 768px) { .grades-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

        .grade-card {
          background: rgba(255,255,255,0.92);
          border: 1px solid #dcfce7;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(34,197,94,0.05);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .grade-card:hover { transform: translateY(-2px); border-color: #86efac; }

        .grade-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
        .grade-card-title { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0; }
        .grade-card-meta { display: flex; flex-wrap: wrap; gap: 10px; color: #64748b; font-size: 0.85rem; }
        .grade-card-meta span { font-family: 'Space Mono', monospace; }

        .grade-stat { display: flex; flex-direction: column; gap: 4px; }
        .grade-stat-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
        .grade-stat-value { font-size: 1.15rem; font-weight: 600; color: #0f172a; }

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
              <p className="info-pill">// calificaciones</p>
              <h1 className="section-title">Resumen de <strong>notas</strong></h1>
            </div>
            <p className="section-sub">
              {classInfo
                ? `Revisa todas las asignaciones de ${classInfo.name} y observa el estado de entrega, puntaje y fechas de vencimiento.`
                : 'Carga la información de la clase y sus asignaciones.'}
            </p>
          </div>

          {loading ? (
            <div className="empty-state">
              <p className="empty-title">Cargando calificaciones...</p>
            </div>
          ) : error ? (
            <div className="error-box">{error}</div>
          ) : assignments.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">Aún no hay asignaciones.</p>
              <p className="empty-sub">Las calificaciones se mostrarán aquí cuando el profesor publique tareas con puntaje.</p>
            </div>
          ) : (
            <div className="grades-grid">
              {assignments.map((assignment) => (
                <article key={assignment.id} className="grade-card">
                  <div className="grade-card-header">
                    <div>
                      <h2 className="grade-card-title">{assignment.title}</h2>
                      <div className="grade-card-meta">
                        <span>{assignment.simulator_module ?? 'Simulador desconocido'}</span>
                        <span>{formatDateValue(assignment.due_date)}</span>
                      </div>
                    </div>
                    <div className="grade-stat">
                      <span className="grade-stat-label">Puntos</span>
                      <span className="grade-stat-value">{assignment.points ?? '—'}</span>
                    </div>
                  </div>

                  <p className="grade-card-meta" style={{ margin: 0, color: '#4b5563' }}>
                    {assignment.description || 'Sin descripción adicional.'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
