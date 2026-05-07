const DEFAULT_AUTH_REDIRECT_PATH = '/auth/callback'

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, '')
}

export function getAppBaseUrl(fallbackOrigin?: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl)
  }

  if (fallbackOrigin) {
    return normalizeBaseUrl(fallbackOrigin)
  }

  return ''
}

export function getAuthCallbackUrl(next = '/mis-clases', fallbackOrigin?: string) {
  const baseUrl = getAppBaseUrl(fallbackOrigin)

  if (!baseUrl) {
    return ''
  }

  const callbackUrl = new URL(DEFAULT_AUTH_REDIRECT_PATH, `${baseUrl}/`)

  if (next.startsWith('/')) {
    callbackUrl.searchParams.set('next', next)
  }

  return callbackUrl.toString()
}
