import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_NEXT_PATH = '/mis-clases'

function getErrorRedirectPath(next: string) {
  return next === '/reset-password' ? '/forgot-password' : '/login'
}

function buildErrorRedirect(origin: string, next: string, message: string) {
  const url = new URL(getErrorRedirectPath(next), origin)
  url.searchParams.set('error', message)
  return NextResponse.redirect(url)
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const authError =
    requestUrl.searchParams.get('error_description') ??
    requestUrl.searchParams.get('error')
  let next = requestUrl.searchParams.get('next') ?? DEFAULT_NEXT_PATH

  if (!next.startsWith('/')) {
    next = DEFAULT_NEXT_PATH
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const origin = siteUrl
    ? siteUrl.replace(/\/$/, '')
    : requestUrl.origin

  // 👇 Debug temporal
  console.log('📍 origin resuelto:', origin)
  console.log('🔑 code recibido:', code)
  console.log('🍪 cookies:', request.headers.get('cookie'))

  if (authError) {
    return buildErrorRedirect(origin, next, 'El enlace de autenticacion no es valido o ya vencio.')
  }

  if (!code) {
    return buildErrorRedirect(origin, next, 'No se pudo validar el enlace de autenticacion.')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  // 👇 Debug temporal
  console.log('❌ exchange error:', JSON.stringify(error))

  if (error) {
    return buildErrorRedirect(origin, next, 'No se pudo completar la autenticacion. Pide un enlace nuevo.')
  }

  return NextResponse.redirect(new URL(next, origin))
}