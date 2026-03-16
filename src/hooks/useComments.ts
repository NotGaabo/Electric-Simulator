'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Comment } from '@/types/assignments'

export function useComments(assignmentId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement | null>(null)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    if (!assignmentId) return

    const supabase = supabaseRef.current

    const fetchComments = async () => {
      const res = await fetch(
        `/api/assignments/${assignmentId}/comments`
      )

      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    }

    fetchComments()

    const channel = supabase
      .channel(`assignment-comments-${assignmentId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assignment_comments',
          filter: `assignment_id=eq.${assignmentId}`
        },
        async (payload) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.user_id)
            .single()

          const newComment: Comment = {
            id: payload.new.id,
            assignment_id: payload.new.assignment_id,
            user_id: payload.new.user_id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            user_name: userData?.full_name || 'Usuario'
          }

          setComments(prev => {
            if (prev.some(c => c.id === newComment.id)) {
              return prev
            }
            return [...prev, newComment]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'assignment_comments',
          filter: `assignment_id=eq.${assignmentId}`
        },
        (payload) => {
          setComments(prev =>
            prev.filter(c => c.id !== payload.old.id)
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'assignment_comments',
          filter: `assignment_id=eq.${assignmentId}`
        },
        async (payload) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.user_id)
            .single()

          const updated: Comment = {
            id: payload.new.id,
            assignment_id: payload.new.assignment_id,
            user_id: payload.new.user_id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            user_name: userData?.full_name || 'Usuario'
          }

          setComments(prev =>
            prev.map(c =>
              c.id === updated.id ? updated : c
            )
          )
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('SUBSCRIPTION ERROR:', err)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }

  }, [assignmentId])

  useEffect(() => {
    if (comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments])

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setSubmitting(true)

    try {
      const res = await fetch(
        `/api/assignments/${assignmentId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newComment })
        }
      )

      if (res.ok) {
        setNewComment('')
      } else {
        console.error('Error al enviar comentario')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    comments,
    newComment,
    setNewComment,
    submitting,
    handleSubmitComment,
    commentsEndRef
  }
}