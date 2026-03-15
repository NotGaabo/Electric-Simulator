// app/api/classes/join/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { code } = await req.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
    }

    // Find the class by invite code
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq(' code', code.trim().toUpperCase())
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: 'Código inválido o clase no encontrada' }, { status: 404 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('class_members')
      .select('id')
      .eq('class_id', classData.id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'Ya eres miembro de esta clase' }, { status: 409 })
    }

    // Add user as student
    const { error: joinError } = await supabase
      .from('class_members')
      .insert({
        class_id: classData.id,
        user_id: user.id,
        role: 'student'
      })

    if (joinError) {
      console.error('Join error:', joinError)
      return NextResponse.json({ error: 'Error al unirse a la clase' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Te has unido exitosamente',
      class: { id: classData.id, name: classData.name }
    }, { status: 200 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}