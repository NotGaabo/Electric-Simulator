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
      .select('class_id')
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

    // Update submission with grade
    const { error: updateError } = await supabase
      .from('assignment_submissions')
      .update({
        score,
        feedback: feedback || null,
        graded_at: new Date().toISOString(),
        graded_by: user.id
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('Error updating grade:', updateError)
      return NextResponse.json(
        { error: 'No se pudo guaard la calificación' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
