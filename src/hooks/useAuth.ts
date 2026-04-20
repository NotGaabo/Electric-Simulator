'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  email?: string
  full_name?: string
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          setUser(null)
          return
        }

        // Get full name from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        setUser({
          id: user.id,
          email: user.email,
          full_name: profile?.full_name || user.email?.split('@')[0]
        })
      } catch (error) {
        console.error('Error fetching user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const getUserInitials = () => {
    if (!user?.full_name) return '?'
    const parts = user.full_name.trim().split(/\s+/)
    return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase()
  }

  const logout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return {
    user,
    loading,
    getUserInitials,
    logout
  }
}
