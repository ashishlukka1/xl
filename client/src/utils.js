export function formatDate(value, withTime = false) {
  if (!value) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(new Date(value))
}

export function confidenceLabel(value) {
  return `${Math.round((value || 0) * 100)}%`
}

export function stageLabel(value) {
  return String(value || 'unknown').replaceAll('_', ' ')
}

export function titleCase(value) {
  return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}
