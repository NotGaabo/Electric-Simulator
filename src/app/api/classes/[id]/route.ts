import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        description,
        code,
        created_at,
        class_members!inner (
          role,
          user_id,
          profiles (
            full_name,
            email
          )
        )
      `)
      .eq('id', classId)
      .single()

    if (classError || !classData) {
      console.error('Error fetching class details:', classError)
      return NextResponse.json(
        { error: 'Clase no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(classData)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id: classId }= await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { data: membership, error: membershipError } = await supabase
      .from('class_members')
      .select('role')
      .eq('class_id', classId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta clase' },
        { status: 403 }
      )
    }

    if (membership.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Solo los profesores pueden eliminar clases' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)

    if (deleteError) {
      console.error('Error deleting class:', deleteError)
    }

  } catch (error) {
    console.error('Server error:', error)
  }
}