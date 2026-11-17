import { ApiError } from '@/lib/apiClient'

export const parseBackendFieldErrors = <T extends string>(
  error: unknown,
  allowedFields: readonly T[],
): { fieldErrors: Partial<Record<T, string>>; hasUnmappedErrors: boolean } => {
  if (!(error instanceof ApiError) || error.status !== 400) {
    return { fieldErrors: {}, hasUnmappedErrors: false }
  }

  const fieldErrors: Partial<Record<T, string>> = {}
  let hasUnmappedErrors = false

  for (const detail of error.message.split(';')) {
    const separatorIndex = detail.indexOf(':')

    if (separatorIndex < 1) {
      hasUnmappedErrors = true
      continue
    }

    const rawField = detail.slice(0, separatorIndex).trim().toLowerCase()
    const field = allowedFields.find((candidate) => candidate.toLowerCase() === rawField)
    const message = detail.slice(separatorIndex + 1).trim()

    if (!field || !message) {
      hasUnmappedErrors = true
      continue
    }

    fieldErrors[field] = message
  }

  return { fieldErrors, hasUnmappedErrors }
}
