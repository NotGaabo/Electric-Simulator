// src/app/api/assignments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // 1. Leer el class_id del query param
    const classId = request.nextUrl.searchParams.get('class_id')

    if (!classId) {
      return NextResponse.json(
        { error: 'class_id es requerido' },
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

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        description,
        due_date,
        created_at
      `)
      // 2. Filtrar solo las de esta clase
      .eq('class_id', classId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assignments:', error)
    }

    return NextResponse.json(assignments || [])
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
    const { class_id, title, description, due_date } = await request.json()

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'El título de la asignación es requerido' },
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

    console.log('class_id recibido:', class_id)
    console.log('due_date recibido:', due_date)

    const { data: newAssignment, error: AssignmentsError } = await supabase
      .from('assignments')
      .insert([
        {
          class_id: class_id,
          title: title.trim(),
          description: description?.trim() || null,
          due_date: due_date || null
        }
      ])
      .select()
      .single()

    if (AssignmentsError) {
      console.error('Error creating assignment:', AssignmentsError)
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