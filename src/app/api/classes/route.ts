import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateClassCode } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        description,
        created_at,
        class_members!inner (
          role,
          user_id,
          profiles (
            full_name
          )
        )
      `)
      .eq('class_members.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching classes:', error)
    }

    return NextResponse.json(classes || [])
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
    const { name, description } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre de la clase es requerido' },
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

    const { data: newClass, error: classError } = await supabase
      .from('classes')
      .insert([
        {
          name: name.trim(),
          description: description?.trim() || null,
          code:  generateClassCode()
        }
      ])
      .select()
      .single()

    if (classError) {
      console.error('Error creating class:', classError)
      return NextResponse.json(
        { error: 'Error al crear la clase' },
        { status: 500 }
      )
    }

    const { error: memberError } = await supabase
      .from('class_members')
      .insert([
        {
          class_id: newClass.id,
          user_id: user.id,
          role: 'teacher'
        }
      ])

    if (memberError) {
      console.error('Error adding teacher:', memberError)
      await supabase.from('classes').delete().eq('id', newClass.id)
      return NextResponse.json(
        { error: 'Error al configurar la clase' },
        { status: 500 }
      )
    }

    return NextResponse.json(newClass, { status: 201 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}