import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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