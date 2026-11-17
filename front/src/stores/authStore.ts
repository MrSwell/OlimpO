import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  AuthenticatedUserResponse,
  LoginResponse,
  UserRole,
} from '@/features/auth/model/authTypes'

interface AuthState {
  token: string | null
  tokenType: 'Bearer' | null
  expiresAt: number | null
  email: string | null
  roles: UserRole[]
  firstName: string | null
  lastName: string | null
  setLoginResponse: (response: LoginResponse) => void
  setCurrentUser: (user: AuthenticatedUserResponse) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      tokenType: null,
      expiresAt: null,
      email: null,
      roles: [],
      firstName: null,
      lastName: null,
      setLoginResponse: (response) =>
        set({
          token: response.token,
          tokenType: response.tokenType,
          expiresAt: Date.now() + response.expiresIn * 1000,
          email: response.email,
          roles: response.roles,
          firstName: null,
          lastName: null,
        }),
      setCurrentUser: (user) =>
        set({
          email: user.email,
          roles: user.roles,
          firstName: user.firstName,
          lastName: user.lastName,
        }),
      clearSession: () =>
        set({
          token: null,
          tokenType: null,
          expiresAt: null,
          email: null,
          roles: [],
          firstName: null,
          lastName: null,
        }),
    }),
    {
      name: 'olimpo-auth',
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        token: state.token,
        tokenType: state.tokenType,
        expiresAt: state.expiresAt,
        email: state.email,
        roles: state.roles,
        firstName: state.firstName,
        lastName: state.lastName,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.expiresAt !== null && state?.expiresAt !== undefined && state.expiresAt <= Date.now()) {
          state.clearSession()
        }
      },
    },
  ),
)
