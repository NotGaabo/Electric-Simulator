import { useCallback } from 'react'
import { SavedAssignmentGrade } from '@/types/assignments'

export function useGradeSubmission() {
  const gradeSubmission = useCallback(
    async (
      submission_id: string,
      assignment_id: string,
      score: number,
      feedback: string
    ): Promise<SavedAssignmentGrade> => {
      const response = await fetch(
        `/api/assignments/${assignment_id}/submissions/${submission_id}/grade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ score, feedback }),
        }
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error ?? 'No se pudo guardar la calificación')
      }

      return payload.grade as SavedAssignmentGrade
    },
    []
  )

  return { gradeSubmission }
}
