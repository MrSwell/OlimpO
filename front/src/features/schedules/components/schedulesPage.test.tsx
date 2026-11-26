import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { schedulesPage as SchedulesPage } from './schedulesPage'

describe('schedulesPage', () => {
  it('renders a plain trainer week as read-only, Monday first', async () => {
    const { container } = renderWithProviders(<SchedulesPage />, { roles: ['TRAINER'] })

    expect(await screen.findByText('Mi malla semanal')).toBeInTheDocument()
    expect(screen.getAllByText(/Solo lectura/).length).toBeGreaterThan(0)
    expect(await screen.findByText('Lunes')).toBeInTheDocument()
    expect(screen.getByText('Domingo')).toBeInTheDocument()

    await waitFor(() =>
      expect(container.querySelector('.scheduleFeature__blockTime')?.textContent).toBe(
        '06:00–10:00',
      ),
    )

    expect(screen.queryByRole('button', { name: /Guardar semana/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Añadir bloque/ })).toBeNull()
    expect(container.querySelector('input[type="time"]')).toBeNull()
  })

  it('orders the days from Monday to Sunday', async () => {
    const { container } = renderWithProviders(<SchedulesPage />, { roles: ['TRAINER'] })

    await screen.findByText('Lunes')

    const dayNames = [...container.querySelectorAll('.scheduleFeature__dayName')].map(
      (element) => element.textContent,
    )
    expect(dayNames).toEqual([
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ])
  })
})
