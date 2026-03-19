// app/api/assignments/[assignmentId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await context.params

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { data: assignment, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()

    if (error || !assignment) {
      console.error('Error fetching assignment:', error)
      return NextResponse.json(
        { error: 'Asignación no encontrada' },
        { status: 404 }
      )
    }

    const { data: membership, error: membershipError } = await supabase
      .from('class_members')
      .select('role')
      .eq('class_id', assignment.class_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError) {
      console.error('Error fetching membership:', membershipError)
    }

    const { data: submission, error: submissionError } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .maybeSingle()

    if (submissionError) {
      console.error('Error fetching submission:', submissionError)
    }

    let submissions: Array<{
      id: string
      student_id: string
      student_name: string
      simulator_module: string | null
      screenshot_path: string
      screenshot_url?: string | null
      submitted_at: string
    }> = []

    if (membership?.role === 'teacher') {
      const { data: rows, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select('id, student_id, student_name, simulator_module, screenshot_path, submitted_at')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false })

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError)
      } else if (rows) {
        const studentIds = rows.map((row) => row.student_id)
        const profilesMap = new Map<string, { full_name?: string | null; email?: string | null }>()

        if (studentIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', studentIds)

          if (profilesError) {
            console.error('Profiles lookup error:', profilesError)
          } else if (profiles) {
            profiles.forEach((profile) => {
              profilesMap.set(profile.id, { full_name: profile.full_name, email: profile.email })
            })
          }
        }

        const normalizeName = (value: string) => {
          const clean = value
            .replace(/[@].*$/, '')
            .replace(/[._-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
          if (!clean) return ''
          return clean
            .split(' ')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ')
        }

        submissions = await Promise.all(
          rows.map(async (row) => {
            let signedUrl: string | null = null
            if (row.screenshot_path) {
              const { data: signed, error: signedError } = await supabase
                .storage
                .from('assignment-submissions')
                .createSignedUrl(row.screenshot_path, 60 * 60)
              if (signedError) {
                console.error('Signed URL error:', signedError)
              }
              signedUrl = signed?.signedUrl ?? null
            }
            const profile = profilesMap.get(row.student_id)
            const rawName =
              profile?.full_name?.trim() ||
              row.student_name?.trim() ||
              profile?.email?.trim() ||
              'Estudiante'
            const displayName = rawName.includes('@') ? normalizeName(rawName) || 'Estudiante' : rawName
            return {
              ...row,
              student_name: displayName,
              screenshot_url: signedUrl
            }
          })
        )
      }
    }

    return NextResponse.json({
      ...assignment,
      status: submission ? 'submitted' : 'not_submitted',
      my_role: membership?.role ?? null,
      submissions
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
