'use client'

import { useMemo, useState } from 'react'
import { useAssignmentsList } from '@/hooks/useAssignmentsList'
import { getSimulatorModuleById } from '@/lib/simulatorModules'
import { formatDate, parseDateString } from '@/utils/dateFormat'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const pad = (value: number) => String(value).padStart(2, '0')
const getDayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export default function ClassCalendarPage() {
  const { assignments, classId, router, loading, error, isOverdue } = useAssignmentsList()
  const today = new Date()
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState(getDayKey(today))

  const assignmentsByDay = useMemo(() => {
    const map = new Map<string, typeof assignments>()
    assignments.forEach((assignment) => {
      if (!assignment.due_date) return
      const dueDate = parseDateString(assignment.due_date)
      const key = getDayKey(dueDate)
      const list = map.get(key) ?? []
      map.set(key, [...list, assignment])
    })
    return map
  }, [assignments])

  const monthCells = useMemo(() => {
    const firstDay = new Date(current.year, current.month, 1).getDay()
    const daysInMonth = new Date(current.year, current.month + 1, 0).getDate()
    const daysInPrev = new Date(current.year, current.month, 0).getDate()
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

    return Array.from({ length: totalCells }, (_, index) => {
      let day: number
      let month = current.month
      let year = current.year
      let other = false

      if (index < firstDay) {
        day = daysInPrev - firstDay + index + 1
        month = current.month === 0 ? 11 : current.month - 1
        year = current.month === 0 ? current.year - 1 : current.year
        other = true
      } else if (index >= firstDay + daysInMonth) {
        day = index - firstDay - daysInMonth + 1
        month = current.month === 11 ? 0 : current.month + 1
        year = current.month === 11 ? current.year + 1 : current.year
        other = true
      } else {
        day = index - firstDay + 1
      }

      const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`
      const cellDate = new Date(year, month, day)
      const isToday = getDayKey(cellDate) === getDayKey(today)
      const dueList = assignmentsByDay.get(dateKey) ?? []

      return { day, month, year, dateKey, other, isToday, dueCount: dueList.length }
    })
  }, [assignmentsByDay, current, today])

  const selectedAssignments = assignmentsByDay.get(selectedDay) ?? []
  const selectedDateLabel = formatDate(selectedDay)

  const prevMonth = () => {
    setCurrent((prev) => {
      const month = prev.month === 0 ? 11 : prev.month - 1
      return { year: prev.month === 0 ? prev.year - 1 : prev.year, month }
    })
  }

  const nextMonth = () => {
    setCurrent((prev) => {
      const month = prev.month === 11 ? 0 : prev.month + 1
      return { year: prev.month === 11 ? prev.year + 1 : prev.year, month }
    })
  }

  const goToday = () => {
    setCurrent({ year: today.getFullYear(), month: today.getMonth() })
    setSelectedDay(getDayKey(today))
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .cal-root {
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

        .cal-inner { max-width: 1180px; margin: 0 auto; display: grid; gap: 24px; }

        .cal-top {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .cal-title {
          margin: 0;
          font-size: clamp(2rem, 2.8vw, 3.2rem);
          font-weight: 300;
          letter-spacing: -0.8px;
        }
        .cal-title strong { font-weight: 500; color: #16a34a; }

        .cal-subtitle {
          margin: 0;
          max-width: 780px;
          color: #475569;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .cal-panel {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
          gap: 22px;
        }
        @media (max-width: 960px) { .cal-panel { grid-template-columns: 1fr; } }

        .cal-card {
          background: rgba(255,255,255,0.95);
          border: 1px solid #dcfce7;
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 18px 40px rgba(22,163,74,0.10);
        }

        .cal-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .cal-nav {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .cal-nav button {
          border: 1px solid #d1fae5;
          background: #ffffff;
          color: #164e28;
          border-radius: 999px;
          padding: 10px 14px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem;
          transition: all 0.18s ease;
        }
        .cal-nav button:hover { background: #ecfdf5; }
        .cal-nav .cal-today { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; }

        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid #dbe7d6;
        }

        .cal-weekday {
          padding: 14px 10px;
          background: #f8fafc;
          color: #64748b;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-bottom: 1px solid #dbe7d6;
          text-align: center;
        }

        .cal-cell {
          min-height: 108px;
          padding: 12px 12px 10px;
          background: #ffffff;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }
        .cal-cell:hover { transform: translateY(-1px); background: #f0fdf4; }
        .cal-cell.other { background: #f8fafc; color: #94a3b8; }
        .cal-cell.selected { background: rgba(34,197,94,0.12); border-color: rgba(34,197,94,0.22); }

        .cal-day-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
        }
        .cal-day-number.today { background: #22c55e; color: #fff; }

        .cal-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 5px 8px;
          border-radius: 999px;
          font-family: 'Space Mono', monospace;
          font-size: 0.72rem;
          background: rgba(220,252,231,0.9);
          color: #166534;
          border: 1px solid rgba(34,197,94,0.18);
          margin-top: 12px;
          width: fit-content;
        }

        .cal-details {
          display: grid;
          gap: 18px;
        }

        .cal-info {
          background: rgba(255,255,255,0.95);
          border: 1px solid #dcfce7;
          border-radius: 24px;
          padding: 22px;
          box-shadow: 0 14px 30px rgba(22,163,74,0.08);
        }

        .cal-info-title { margin: 0 0 14px; font-size: 1.15rem; font-weight: 600; }
        .cal-info-sub { margin: 0; color: #475569; line-height: 1.7; }

        .cal-task-list { display: grid; gap: 14px; }
        .cal-task-card {
          border-radius: 18px;
          padding: 18px 20px;
          background: #ffffff;
          border: 1px solid #dcfce7;
          box-shadow: 0 8px 24px rgba(34,197,94,0.06);
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .cal-task-card:hover { transform: translateY(-1px); border-color: #86efac; }
        .cal-task-title { margin: 0 0 8px; font-size: 1rem; font-weight: 600; }
        .cal-task-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 0.84rem; color: #475569; }
        .cal-task-chip { padding: 6px 10px; border-radius: 999px; background: rgba(34,197,94,0.08); color: #166534; font-family: 'Space Mono', monospace; }

        .cal-empty {
          padding: 28px 24px;
          border-radius: 18px;
          background: rgba(255,255,255,0.95);
          border: 1px dashed #bbf7d0;
          color: #4b5563;
        }
      `}</style>

      <div className="cal-root">
        <div className="cal-inner">
          <div className="cal-top">
            <div>
              <p className="cal-subtitle">Calendario de entregas de la clase. Cada día muestra las tareas que vencen en esa fecha.</p>
              <h1 className="cal-title">Calendario de <strong>entregas</strong></h1>
            </div>
            <div className="cal-nav">
              <button onClick={prevMonth}>‹ Mes anterior</button>
              <button className="cal-today" onClick={goToday}>Hoy</button>
              <button onClick={nextMonth}>Mes siguiente ›</button>
            </div>
          </div>

          <div className="cal-panel">
            <div className="cal-card">
              <div className="cal-card-header">
                <div>
                  <p className="cal-info-title">{MONTHS[current.month]} {current.year}</p>
                  <p className="cal-info-sub">Pulsa un día para ver las tareas de entrega programadas.</p>
                </div>
              </div>
              <div className="cal-grid">
                {DAYS.map((day) => (
                  <div key={day} className="cal-weekday">{day}</div>
                ))}
                {monthCells.map((cell) => (
                  <button
                    key={`${cell.dateKey}-${cell.day}`}
                    className={`cal-cell ${cell.other ? 'other' : ''} ${cell.dateKey === selectedDay ? 'selected' : ''}`}
                    onClick={() => setSelectedDay(cell.dateKey)}
                  >
                    <div className={`cal-day-number ${cell.isToday ? 'today' : ''}`}>{cell.day}</div>
                    {cell.dueCount > 0 && (
                      <span className="cal-badge">{cell.dueCount} tarea{cell.dueCount > 1 ? 's' : ''}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="cal-info">
              <h2 className="cal-info-title">Entregas para {selectedDateLabel}</h2>
              {loading ? (
                <div className="cal-empty">Cargando tareas...</div>
              ) : error ? (
                <div className="cal-empty">No se pudieron cargar las tareas. Recarga la página.</div>
              ) : selectedAssignments.length === 0 ? (
                <div className="cal-empty">No hay tareas programadas para esta fecha.</div>
              ) : (
                <div className="cal-task-list">
                  {selectedAssignments.map((assignment) => {
                    const moduleInfo = getSimulatorModuleById(assignment.simulator_module)
                    return (
                      <div
                        key={assignment.id}
                        className="cal-task-card"
                        onClick={() => router.push(`/classes/${classId}/assignment/${assignment.id}`)}
                      >
                        <h3 className="cal-task-title">{assignment.title}</h3>
                        <div className="cal-task-meta">
                          {moduleInfo && <span className="cal-task-chip">{moduleInfo.label}</span>}
                          <span>{assignment.description || 'Sin descripción'}</span>
                          {isOverdue(assignment.due_date) && <span className="cal-task-chip">vencida</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
