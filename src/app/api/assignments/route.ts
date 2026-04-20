// src/app/api/assignments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidSimulatorModule } from '@/lib/simulatorModules'

export async function GET(request: NextRequest) {
  try {
    const classId = request.nextUrl.searchParams.get('class_id')

    if (!classId) {
      return NextResponse.json(
        { error: 'class_id es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        id,
        class_id,
        title,
        description,
        points,
        due_date,
        created_at,
        simulator_module
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json([], { status: 500 })
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json([])
    }

    const assignmentIds = assignments.map(a => a.id)

    let submittedSet = new Set<string>()
    let gradesMap = new Map<string, number>()

    const { data: submissions, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select('id, assignment_id')
      .eq('student_id', user.id)
      .in('assignment_id', assignmentIds)

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError)
    } else if (submissions) {
      submissions.forEach(s => submittedSet.add(s.assignment_id))
      
      // Obtener calificaciones de las entregas del estudiante
      const submissionIds = submissions.map(s => s.id)
      const { data: grades, error: gradesError } = await supabase
        .from('assignment_submissions_grades')
        .select('submission_id, assignment_id, score')
        .in('submission_id', submissionIds)

      if (gradesError) {
        console.error('Error fetching grades:', gradesError)
      } else if (grades) {
        grades.forEach(g => {
          gradesMap.set(g.assignment_id, g.score)
        })
      }
    }

    const normalized = assignments.map((assignment) => ({
      ...assignment,
      status: submittedSet.has(assignment.id)
        ? 'submitted'
        : 'not_submitted',
      score: gradesMap.get(assignment.id) || null
    }))

    return NextResponse.json(normalized)

  } catch (error) {
    console.error('Server error:', error)

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      class_id,
      title,
      description,
      due_date,
      simulator_module,
      points
    } = await request.json()

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'El título de la asignación es requerido' },
        { status: 400 }
      )
    }

    if (!simulator_module || !isValidSimulatorModule(simulator_module)) {
      return NextResponse.json(
        { error: 'Módulo de simulador inválido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { data: membership, error: membershipError } = await supabase
      .from('class_members')
      .select('role')
      .eq('class_id', class_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'No tienes permiso para crear asignaciones' },
        { status: 403 }
      )
    }

    if (membership.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Solo los profesores pueden crear asignaciones' },
        { status: 403 }
      )
    }

    const { data: newAssignment, error: assignmentsError } = await supabase
      .from('assignments')
      .insert([
        {
          class_id,
          title: title.trim(),
          description: description?.trim() || null,
          due_date: due_date || null,
          simulator_module,
          points: typeof points === 'number' && points >= 0 ? points : null
        }
      ])
      .select()
      .single()

    if (assignmentsError) {
      console.error('Error creating assignment:', assignmentsError)

      return NextResponse.json(
        { error: 'Error al crear la asignación' },
        { status: 500 }
      )
    }

    return NextResponse.json(newAssignment, { status: 201 })

  } catch (error) {
    console.error('Server error:', error)

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}