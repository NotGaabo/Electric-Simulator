const FALLBACK_RESET_PATH = '/reset-password'

export function getPasswordRecoveryRedirectUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_PASSWORD_RECOVERY_URL

  if (configuredUrl) {
    return configuredUrl
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!siteUrl) {
    return ''
  }

  return `${siteUrl.replace(/\/$/, '')}${FALLBACK_RESET_PATH}`
}
