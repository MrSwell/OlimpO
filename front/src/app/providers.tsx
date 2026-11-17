// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import { memo, useEffect, type ReactNode } from 'react'
import { QueryClientProvider as queryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useThemeStore } from '@/stores/themeStore'

const providerComponents = { queryClientProvider }

interface AppProvidersProps {
  children: ReactNode
}

const themeProviderComponents = {
  themeProvider: memo(({ children }: AppProvidersProps) => {
    const mode = useThemeStore((state) => state.mode)

    useEffect(() => {
      document.documentElement.dataset.theme = mode
    }, [mode])

    return <>{children}</>
  }),
}

export const appProviders = ({ children }: AppProvidersProps) => {
  return (
    <providerComponents.queryClientProvider client={queryClient}>
      <themeProviderComponents.themeProvider>{children}</themeProviderComponents.themeProvider>
    </providerComponents.queryClientProvider>
  )
}
