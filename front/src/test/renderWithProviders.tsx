import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { UserRole } from '@/features/auth/model/authTypes'
import { useAuthStore } from '@/stores/authStore'

interface RenderOptions {
  roles?: UserRole[]
  route?: string
}

export const renderWithProviders = (
  ui: ReactElement,
  { roles = ['ADMIN'], route = '/' }: RenderOptions = {},
) => {
  useAuthStore.setState({
    token: 'test-token',
    tokenType: 'Bearer',
    expiresAt: Date.now() + 60 * 60 * 1000,
    email: 'admin@olimpo.com',
    roles,
    firstName: 'Olimpo',
    lastName: 'Admin',
  })

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}
