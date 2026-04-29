// app/api/assignments/[assignmentId]/submissions/[submissionId]/grade/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string; submissionId: string }> }
) {
  try {
    const { assignmentId, submissionId } = await params
    const { score, feedback } = await request.json()

    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json(
        { error: 'La puntuación debe ser un número no negativo' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verify that user is a teacher in this assignment's class
    const { data: assignment } = await supabase
      .from('assignments')
      .select('class_id, points')
      .eq('id', assignmentId)
      .single()

    if (!assignment) {
      return NextResponse.json(
        { error: 'Asignación no encontrada' },
        { status: 404 }
      )
    }

    const { data: membership } = await supabase
      .from('class_members')
      .select('role')
      .eq('class_id', assignment.class_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'teacher') {
      return NextResponse.json(
        { error: 'No tienes permiso para calificar' },
        { status: 403 }
      )
    }

    if (typeof assignment.points === 'number' && score > assignment.points) {
      return NextResponse.json(
        { error: `La puntuación no puede ser mayor que ${assignment.points}` },
        { status: 400 }
      )
    }

    // Verify submission exists
    const { data: submission } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('id', submissionId)
      .eq('assignment_id', assignmentId)
      .single()

    if (!submission) {
      return NextResponse.json(
        { error: 'Entrega no encontrada' },
        { status: 404 }
      )
    }

    // Save grade in the dedicated grades table
    const { data: existingGrade, error: gradeFetchError } = await supabase
      .from('assignment_submissions_grades')
      .select('id')
      .eq('submission_id', submissionId)
      .maybeSingle()

    if (gradeFetchError) {
      console.error('Error fetching existing grade:', gradeFetchError)
      return NextResponse.json(
        { error: 'No se pudo verificar la calificación' },
        { status: 500 }
      )
    }

    if (existingGrade) {
      return NextResponse.json(
        { error: 'Esta entrega ya fue calificada y no se puede modificar' },
        { status: 409 }
      )
    }

    const gradedAt = new Date().toISOString()
    const { data: insertedGrade, error: insertError } = await supabase
      .from('assignment_submissions_grades')
        .insert({
          submission_id: submissionId,
          assignment_id: assignmentId,
          teacher_id: user.id,
          score,
          feedback: feedback || null,
          graded_at: gradedAt,
        })
        .select('score, feedback, graded_at')
        .single()

    if (insertError || !insertedGrade) {
      console.error('Error inserting grade:', insertError)
      return NextResponse.json(
        { error: 'No se pudo guardar la calificación' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      grade: insertedGrade
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
