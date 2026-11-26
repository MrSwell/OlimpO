import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/msw/server'
import { routinesPage as RoutinesPage } from './routinesPage'

describe('routinesPage', () => {
  it('shows the catalog totals and the type breakdown', async () => {
    renderWithProviders(<RoutinesPage />, { roles: ['ADMIN'] })

    expect(await screen.findByText('Full body principiantes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Todas/ })).toHaveTextContent('Todas3')
    expect(screen.getByRole('button', { name: /Generales/ })).toHaveTextContent('Generales2')
    expect(screen.getByRole('button', { name: /Personalizadas/ })).toHaveTextContent(
      'Personalizadas1',
    )
    expect(screen.getByText('Hipertrofia brazo')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tipos de rutina' })).toBeInTheDocument()
  })

  it('filters by routine type through the segmented tabs', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RoutinesPage />, { roles: ['ADMIN'] })

    await screen.findByText('Full body principiantes')
    await user.click(screen.getByRole('button', { name: /Personalizadas/ }))

    await waitFor(() => expect(screen.queryByText('Full body principiantes')).not.toBeInTheDocument())
    expect(screen.getByText('Hipertrofia brazo')).toBeInTheDocument()
  })

  it('gives a client only their assignments and no create action', async () => {
    server.use(
      http.get('http://localhost/api/v1/clients/lookup', () =>
        HttpResponse.json({
          content: [{ id: 1, firstName: 'Andrés', lastName: 'Gutiérrez' }],
          page: 0,
          size: 1,
          totalElements: 1,
          totalPages: 1,
        }),
      ),
      http.get('http://localhost/api/v1/clients/:clientId/routines', () =>
        HttpResponse.json({
          content: [
            {
              id: 5,
              routineId: 2,
              routineName: 'Hipertrofia brazo',
              clientId: 1,
              clientName: 'Andrés Gutiérrez',
              assignmentDate: '2026-10-29',
              status: 'ACTIVE',
            },
          ],
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        }),
      ),
    )

    renderWithProviders(<RoutinesPage />, { roles: ['CLIENT'] })

    expect(await screen.findByText('Mis rutinas')).toBeInTheDocument()
    expect(await screen.findByText('Hipertrofia brazo')).toBeInTheDocument()
    expect(screen.getByText('Activa')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nueva rutina/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Todas 3' })).toBeNull()
  })
})
