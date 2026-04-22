import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useGradeSubmission() {
  const supabase = createClient()

  const gradeSubmission = useCallback(
    async (submission_id: string, assignment_id: string, score: number, feedback: string) => {
      try {
        console.log('[GRADE] Iniciando calificación:', { submission_id, assignment_id, score, feedback })

        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('[GRADE] Usuario autenticado:', user?.id)
        if (userError || !user?.id) {
          throw new Error(`No authenticated user: ${userError?.message}`)
        }

        // First, check if a grade already exists
        console.log('[GRADE] Verificando si existe calificación anterior...')
        const { data: existingGrade, error: fetchError } = await supabase
          .from('assignment_submissions_grades')
          .select('id')
          .eq('submission_id', submission_id)
          .maybeSingle()

        if (fetchError) {
          console.error('[GRADE] Error al buscar calificación anterior:', fetchError)
          throw fetchError
        }

        if (existingGrade) {
          // Update existing grade
          console.log('[GRADE] Actualizando calificación existente...')
          const { data, error } = await supabase
            .from('assignment_submissions_grades')
            .update({
              score,
              feedback,
              graded_at: new Date().toISOString(),
            })
            .eq('submission_id', submission_id)
            .select()
            .single()

          if (error) {
            console.error('[GRADE] Error al actualizar:', error)
            throw error
          }
          console.log('[GRADE] Calificación actualizada exitosamente:', data)
          return data
        } else {
          // Create new grade
          console.log('[GRADE] Creando nueva calificación...')
          const { data, error } = await supabase
            .from('assignment_submissions_grades')
            .insert({
              submission_id,
              assignment_id,
              teacher_id: user.id,
              score,
              feedback,
              graded_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (error) {
            console.error('[GRADE] Error al insertar:', error)
            throw error
          }
          console.log('[GRADE] Calificación creada exitosamente:', data)
          return data
        }
      } catch (error) {
        console.error('[GRADE] Error crítico:', error)
        throw error
      }
    },
    [supabase]
  )

  return { gradeSubmission }
}
