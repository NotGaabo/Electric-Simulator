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

    const normalizedCode = code.trim().toUpperCase()

    // Preferred path: use a SECURITY DEFINER RPC to avoid RLS blocking class lookup
    const { data: rpcData, error: rpcError } = await supabase.rpc('join_class_by_code', {
      p_code: normalizedCode
    })

    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      const classRow = rpcData[0]
      return NextResponse.json({
        message: 'Te has unido exitosamente',
        class: { id: classRow.id, name: classRow.name }
      }, { status: 200 })
    }

    if (rpcError && rpcError.code !== 'PGRST301') {
      if (rpcError.message?.includes('class_not_found')) {
        return NextResponse.json({ error: 'Código inválido o clase no encontrada' }, { status: 404 })
      }
      console.error('Join RPC error:', rpcError)
      return NextResponse.json({ error: 'Error al unirse a la clase' }, { status: 500 })
    }

    // Fallback: direct query (requires RLS to allow selecting by code)
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('code', normalizedCode)
      .single()

    if (classError || !classData) {
      console.error('Class lookup error:', classError)
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
