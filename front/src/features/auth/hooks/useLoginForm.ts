import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router'
import { ApiError } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import { login } from '../api/authApi'
import { loginFormSchema, type LoginFormValues } from '../model/loginFormSchema'

interface LoginLocationState {
  from?: {
    pathname?: string
    search?: string
    hash?: string
  }
}

const resolveRedirectPath = (state: LoginLocationState | null): string => {
  if (!state?.from) {
    return '/dashboard'
  }

  return `${state.from.pathname ?? '/dashboard'}${state.from.search ?? ''}${state.from.hash ?? ''}`
}

/**
 * Owns the login form state, validation and submission so `loginPage` stays
 * presentational. Errors surface only through the global toast channel.
 */
export const useLoginForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const setLoginResponse = useAuthStore((state) => state.setLoginResponse)
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })

  const applyServerFieldErrors = (message: string) => {
    for (const detail of message.split(';')) {
      const normalizedDetail = detail.trim()
      const fieldName = (['email', 'password'] as const).find((field) =>
        normalizedDetail.toLowerCase().startsWith(`${field}:`),
      )

      if (!fieldName) continue

      loginForm.setError(fieldName, {
        type: 'server',
        message: normalizedDetail.slice(normalizedDetail.indexOf(':') + 1).trim(),
      })
    }
  }

  const submitLogin = async (values: LoginFormValues) => {
    try {
      const loginResponse = await login(values)

      queryClient.clear()
      setLoginResponse(loginResponse)
      navigate(resolveRedirectPath(location.state as LoginLocationState | null), {
        replace: true,
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const message = 'Correo o contraseña incorrectos.'
        loginForm.setError('email', { type: 'server', message })
        loginForm.setError('password', { type: 'server', message })
        toast.error(
          'No se pudo iniciar sesión',
          'Verifica el correo y la contraseña e inténtalo de nuevo.',
        )
        return
      }

      if (error instanceof ApiError) {
        applyServerFieldErrors(error.message)
      }

      const description =
        error instanceof ApiError
          ? error.message
          : 'Comprueba tu conexión e inténtalo de nuevo.'
      toast.error('No se pudo iniciar sesión', description)
    }
  }

  return {
    loginForm,
    onSubmit: loginForm.handleSubmit(submitLogin),
  }
}
