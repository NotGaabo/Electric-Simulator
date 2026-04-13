// types/assignments.ts

export type AssignmentStatus = 'not_submitted' | 'submitted' | 'graded'
export type AssignmentRole = 'teacher' | 'student'

export interface AssignmentSubmission {
  id: string
  student_id: string
  student_name: string
  simulator_module: string | null
  screenshot_path: string
  screenshot_url?: string | null
  submitted_at: string
}

export interface Assignment {
  id: string
  class_id: string
  title: string
  description: string | null
  points: number | null
  status: AssignmentStatus
  due_date: string | null
  created_at: string
  simulator_module?: string | null
  my_role?: AssignmentRole | null
  submissions?: AssignmentSubmission[]
}

export interface AssignmentPage {
  id: string
  class_id: string
  title: string
  description: string
  due_date: string
  created_at: string
  simulator_module?: string | null
}

export interface Comment {
  id: string
  assignment_id: string
  user_id: string
  user_name?: string
  content: string
  created_at: string
}

export interface AssignmentWithComments extends Assignment {
  comments?: Comment[]
  comment_count?: number
}
