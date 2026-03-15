import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidSimulatorModule } from '@/lib/simulatorModules'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params
    const { screenshotDataUrl, simulatorModule } = await request.json()

    if (!screenshotDataUrl || typeof screenshotDataUrl !== 'string') {
      return NextResponse.json(
        { error: 'La captura es requerida' },
        { status: 400 }
      )
    }

    if (!isValidSimulatorModule(simulatorModule)) {
      return NextResponse.json(
        { error: 'Módulo de simulador inválido' },
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

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, class_id, simulator_module')
      .eq('id', assignmentId)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'Asignación no encontrada' },
        { status: 404 }
      )
    }

    if (assignment.simulator_module !== simulatorModule) {
      return NextResponse.json(
        { error: 'Este módulo no corresponde a la asignación' },
        { status: 400 }
      )
    }

    const { data: membership, error: membershipError } = await supabase
      .from('class_members')
      .select('role')
      .eq('class_id', assignment.class_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || membership.role !== 'student') {
      return NextResponse.json(
        { error: 'Solo estudiantes pueden entregar asignaciones' },
        { status: 403 }
      )
    }

    const { data: existing } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Esta asignación ya fue entregada' },
        { status: 409 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const profileName = profile?.full_name?.trim() || ''
    const metaName = (
      (user.user_metadata as { full_name?: string; name?: string; username?: string } | null)?.full_name ||
      (user.user_metadata as { full_name?: string; name?: string; username?: string } | null)?.name ||
      (user.user_metadata as { full_name?: string; name?: string; username?: string } | null)?.username ||
      ''
    ).trim()
    const emailName = user.email ? user.email.split('@')[0] : ''
    const studentName = profileName || metaName || emailName || 'Estudiante'

    const base64Data = screenshotDataUrl.split(',')[1]
    if (!base64Data) {
      return NextResponse.json(
        { error: 'Formato de captura inválido' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(base64Data, 'base64')
    const safeName = studentName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'estudiante'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`
    const filePath = `${safeName}/${fileName}`

    const { error: uploadError } = await supabase
      .storage
      .from('assignment-submissions')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'No se pudo subir la captura' },
        { status: 500 }
      )
    }

    const { error: insertError } = await supabase
      .from('assignment_submissions')
      .insert([
        {
          assignment_id: assignmentId,
          student_id: user.id,
          student_name: studentName,
          simulator_module: simulatorModule,
          screenshot_path: filePath,
          submitted_at: new Date().toISOString()
        }
      ])

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'No se pudo registrar la entrega' },
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
