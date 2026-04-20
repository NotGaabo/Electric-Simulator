const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

export const parseDateString = (dateString: string) => {
  if (DATE_ONLY_RE.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(dateString)
}

export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions) => {
  const date = parseDateString(dateString)
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(DATE_ONLY_RE.test(dateString) ? {} : { hour: '2-digit', minute: '2-digit' }),
    ...options,
  }
  return date.toLocaleDateString('es-ES', defaultOptions)
}

export const formatShortDate = (dateString: string) => {
  const date = parseDateString(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}