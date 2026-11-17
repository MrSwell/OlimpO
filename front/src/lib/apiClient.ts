import { z } from 'zod'
import { loginResponseSchema } from '@/features/auth/model/authTypes'
import { useAuthStore } from '@/stores/authStore'

const apiErrorSchema = z.object({
  status: z.number(),
  error: z.string(),
  message: z.string(),
})

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '')
const apiBaseUrl =
  !configuredApiUrl || configuredApiUrl.endsWith('/api/v1')
    ? configuredApiUrl || '/api/v1'
    : `${configuredApiUrl}/api/v1`

export const authExpiredEventName = 'olimpo:auth-expired'

export class ApiError extends Error {
  readonly status: number
  readonly errorType: string

  constructor(status: number, errorType: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errorType = errorType
  }
}

let refreshRequest: Promise<void> | null = null

const createRequestUrl = (path: string): string => {
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

const readJsonPayload = async (response: Response): Promise<unknown> => {
  if (response.status === 204 || response.status === 205) {
    return undefined
  }

  const responseText = await response.text()

  if (!responseText) {
    return undefined
  }

  try {
    return JSON.parse(responseText) as unknown
  } catch {
    return undefined
  }
}

const readApiError = async (response: Response): Promise<ApiError> => {
  const parsedError = apiErrorSchema.safeParse(await readJsonPayload(response))

  if (!parsedError.success) {
    return new ApiError(response.status, 'Unexpected API error', 'La solicitud no pudo completarse.')
  }

  return new ApiError(response.status, parsedError.data.error, parsedError.data.message)
}

const expireSession = (): void => {
  useAuthStore.getState().clearSession()

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(authExpiredEventName))
  }
}

const performRefresh = async (): Promise<void> => {
  const { token, tokenType } = useAuthStore.getState()

  if (!token || !tokenType) {
    expireSession()
    throw new ApiError(401, 'Unauthorized', 'La sesión ya no es válida.')
  }

  const response = await fetch(createRequestUrl('/auth/refresh'), {
    method: 'POST',
    headers: {
      Authorization: `${tokenType} ${token}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const apiError = await readApiError(response)

    if (response.status === 401) {
      expireSession()
    }

    throw apiError
  }

  const parsedResponse = loginResponseSchema.safeParse(await readJsonPayload(response))

  if (!parsedResponse.success) {
    expireSession()
    throw new ApiError(500, 'Invalid session response', 'El servidor devolvió una sesión no válida.')
  }

  useAuthStore.getState().setLoginResponse(parsedResponse.data)
}

export const refreshAuthSession = (): Promise<void> => {
  if (!refreshRequest) {
    refreshRequest = performRefresh().finally(() => {
      refreshRequest = null
    })
  }

  return refreshRequest
}

export const apiRequest = async <T>(
  path: string,
  requestOptions: RequestInit = {},
  requiresAuth = true,
  mayRefresh = true,
): Promise<T> => {
  const currentSession = useAuthStore.getState()
  const requestHeaders = new Headers(requestOptions.headers)

  requestHeaders.set('Accept', 'application/json')

  if (requiresAuth && currentSession.token && currentSession.tokenType) {
    requestHeaders.set('Authorization', `${currentSession.tokenType} ${currentSession.token}`)
  }

  if (typeof requestOptions.body === 'string' && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json; charset=utf-8')
  }

  const response = await fetch(createRequestUrl(path), {
    ...requestOptions,
    headers: requestHeaders,
  })

  if (response.status === 401 && requiresAuth && mayRefresh && currentSession.token) {
    const latestSession = useAuthStore.getState()

    if (!latestSession.token) {
      throw await readApiError(response)
    }

    const sessionWasRefreshed =
      latestSession.token !== currentSession.token ||
      (latestSession.expiresAt !== null &&
        currentSession.expiresAt !== null &&
        latestSession.expiresAt > currentSession.expiresAt)

    if (sessionWasRefreshed) {
      return apiRequest<T>(path, requestOptions, requiresAuth, false)
    }

    await refreshAuthSession()
    return apiRequest<T>(path, requestOptions, requiresAuth, false)
  }

  if (!response.ok) {
    throw await readApiError(response)
  }

  return (await readJsonPayload(response)) as T
}
