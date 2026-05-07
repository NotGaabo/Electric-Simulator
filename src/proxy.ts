import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAppBaseUrl } from '@/lib/app-url'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  const requestUrl = request.nextUrl
  const canonicalBaseUrl = getAppBaseUrl(requestUrl.origin)

  if (canonicalBaseUrl && request.method === 'GET') {
    const canonicalUrl = new URL(canonicalBaseUrl)
    const isDifferentOrigin = requestUrl.origin !== canonicalUrl.origin
    const isAuthPath =
      requestUrl.pathname === '/login' ||
      requestUrl.pathname === '/register' ||
      requestUrl.pathname === '/auth/callback'
    const hasOAuthParams =
      requestUrl.searchParams.has('code') ||
      requestUrl.searchParams.has('error') ||
      requestUrl.searchParams.has('error_description')

    if (isDifferentOrigin && (isAuthPath || hasOAuthParams)) {
      const redirectUrl = new URL(requestUrl.pathname, canonicalBaseUrl)
      redirectUrl.search = requestUrl.search

      if (hasOAuthParams && requestUrl.pathname !== '/auth/callback') {
        redirectUrl.pathname = '/auth/callback'
      }

      return NextResponse.redirect(redirectUrl)
    }
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
