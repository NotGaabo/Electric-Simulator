import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_NEXT_PATH = '/mis-clases'

function buildLoginRedirect(origin: string, message: string) {
  const url = new URL('/login', origin)
  url.searchParams.set('error', message)
  return NextResponse.redirect(url)
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  let next = requestUrl.searchParams.get('next') ?? DEFAULT_NEXT_PATH

  if (!next.startsWith('/')) {
    next = DEFAULT_NEXT_PATH
  }

  if (!code) {
    return buildLoginRedirect(requestUrl.origin, 'No se recibio el codigo de Google OAuth.')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return buildLoginRedirect(requestUrl.origin, 'No se pudo completar el inicio de sesion con Google.')
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
