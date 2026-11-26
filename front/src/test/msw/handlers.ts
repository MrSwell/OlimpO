import { http, HttpResponse } from 'msw'

const apiBase = 'http://localhost/api/v1'

const routinePage = (
  content: unknown[],
  totalElements: number,
  size = 10,
) => ({
  content,
  page: 0,
  size,
  totalElements,
  totalPages: Math.ceil(totalElements / size),
})

const generalRoutines = [
  {
    id: 1,
    trainerId: null,
    trainerName: null,
    name: 'Full body principiantes',
    type: 'GENERAL',
    description: 'Tres días de fuerza y cardio.',
    price: null,
  },
  {
    id: 3,
    trainerId: null,
    trainerName: null,
    name: 'Movilidad matinal',
    type: 'GENERAL',
    description: 'Rutina corta para empezar el día.',
    price: null,
  },
]

const customRoutines = [
  {
    id: 2,
    trainerId: 2,
    trainerName: 'Carlos Trainer',
    name: 'Hipertrofia brazo',
    type: 'CUSTOM',
    description: 'Plan personalizado de bíceps y tríceps.',
    price: 80000,
  },
]

export const handlers = [
  http.get(`${apiBase}/routines`, ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')

    if (type === 'GENERAL') return HttpResponse.json(routinePage(generalRoutines, 2, 1))
    if (type === 'CUSTOM') return HttpResponse.json(routinePage(customRoutines, 1, 1))

    return HttpResponse.json(
      routinePage([...generalRoutines, ...customRoutines], 3),
    )
  }),

  http.get(`${apiBase}/trainers`, () =>
    HttpResponse.json({
      content: [
        {
          id: 1,
          firstName: 'Ana',
          lastName: 'Díaz',
          specialty: 'Fuerza',
        },
      ],
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
    }),
  ),

  http.get(`${apiBase}/trainers/:trainerId/schedules`, () =>
    HttpResponse.json([
      {
        id: 10,
        trainerId: 1,
        dayOfWeek: 2,
        dayName: 'Monday',
        startTime: '06:00:00',
        endTime: '10:00:00',
        status: 'AVAILABLE',
      },
    ]),
  ),
]
