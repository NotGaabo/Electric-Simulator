import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidSimulatorModule } from '@/lib/simulatorModules'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    console.log('------ NUEVA ENTREGA ------')

    const { assignmentId } = await params
    console.log('Assignment ID:', assignmentId)

    const body = await request.json()
    const { screenshotDataUrl, simulatorModule } = body

    console.log('Simulator module recibido:', simulatorModule)

    if (!screenshotDataUrl || typeof screenshotDataUrl !== 'string') {
      console.log('❌ Screenshot inválido')
      return NextResponse.json(
        { error: 'La captura es requerida' },
        { status: 400 }
      )
    }

    if (!isValidSimulatorModule(simulatorModule)) {
      console.log('❌ Módulo inválido:', simulatorModule)
      return NextResponse.json(
        { error: 'Módulo de simulador inválido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    console.log('Supabase client creado')

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ Error autenticación:', authError)
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    console.log('Usuario autenticado:', user.id)

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, class_id, simulator_module')
      .eq('id', assignmentId)
      .single()

    if (assignmentError || !assignment) {
      console.log('❌ Assignment error:', assignmentError)
      return NextResponse.json(
        { error: 'Asignación no encontrada' },
        { status: 404 }
      )
    }

    console.log('Asignación encontrada:', assignment)

    if (assignment.simulator_module !== simulatorModule) {
      console.log('❌ Módulo no coincide:', assignment.simulator_module)
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
      console.log('❌ Membership inválido:', membershipError, membership)
      return NextResponse.json(
        { error: 'Solo estudiantes pueden entregar asignaciones' },
        { status: 403 }
      )
    }

    console.log('Membership válido')

    const { data: existing } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .maybeSingle()

    console.log('Submission existente:', existing)

    if (existing) {
      console.log('❌ Ya existe una entrega previa')
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

    console.log('Nombre del estudiante:', studentName)

    const base64Data = screenshotDataUrl.split(',')[1]

    if (!base64Data) {
      console.log('❌ Base64 inválido')
      return NextResponse.json(
        { error: 'Formato de captura inválido' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(base64Data, 'base64')

    const fileName = `${crypto.randomUUID()}.png`
    const filePath = `submissions/${fileName}`

    console.log('Intentando subir archivo:', filePath)

    const { error: uploadError } = await supabase
      .storage
      .from('assignment-submissions')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Upload error completo:', uploadError)
      return NextResponse.json(
        { error: 'No se pudo subir la captura' },
        { status: 500 }
      )
    }

    console.log('✅ Imagen subida correctamente')

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
      console.error('❌ Insert error:', insertError)
      return NextResponse.json(
        { error: 'No se pudo registrar la entrega' },
        { status: 500 }
      )
    }

    console.log('✅ Submission guardada en DB')

    console.log('------ ENTREGA COMPLETADA ------')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Server error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}