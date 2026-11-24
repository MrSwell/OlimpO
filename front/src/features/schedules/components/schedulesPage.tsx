/* oxlint-disable react/rules-of-hooks */
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LuCalendarDays as luCalendarDays,
  LuClock3 as luClock3,
  LuLock as luLock,
  LuPlus as luPlus,
  LuTrash2 as luTrash2,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import { ApiError } from '@/lib/apiClient'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import { useTrainerDirectory } from '@/features/trainers/hooks/useTrainerDirectory'
import type { TrainerOption } from '@/features/trainers/model/trainerTypes'
import { saveWeeklySchedule } from '../api/scheduleApi'
import {
  scheduleDays,
  scheduleStatusLabels,
  scheduleStatusSchema,
  type ScheduleSlot,
  type ScheduleSlotPayload,
  type ScheduleStatus,
} from '../model/scheduleTypes'
import { useWeeklySchedule } from '../hooks/useWeeklySchedule'
import './scheduleFeature.css'

interface ScheduleDraftSlot extends ScheduleSlotPayload {
  key: string
}

const trainerName = (trainer: TrainerOption) => `${trainer.firstName} ${trainer.lastName}`

const toDraftSlots = (slots: ScheduleSlot[]): ScheduleDraftSlot[] =>
  slots.map((slot) => ({
    key: String(slot.id),
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime.slice(0, 5),
    endTime: slot.endTime.slice(0, 5),
    status: slot.status,
  }))

const getScheduleError = (slots: ScheduleDraftSlot[]): string | null => {
  if (slots.length === 0) return 'La semana debe conservar al menos un bloque horario.'

  for (const slot of slots) {
    if (slot.endTime <= slot.startTime) {
      return 'Cada bloque debe terminar después de su hora de inicio.'
    }
  }

  for (let index = 0; index < slots.length; index += 1) {
    const current = slots[index]
    const overlaps = slots.slice(index + 1).some(
      (next) =>
        current.dayOfWeek === next.dayOfWeek &&
        current.startTime < next.endTime &&
        current.endTime > next.startTime,
    )
    if (overlaps) return 'Hay bloques que se cruzan en el mismo día.'
  }

  return null
}

const statusTone: Record<ScheduleStatus, string> = {
  AVAILABLE: 'ok',
  NOT_AVAILABLE: 'warning',
  RESERVED: 'reserved',
}

const readOnlyStatusTone: Record<ScheduleStatus, 'ok' | 'warn' | 'neutral'> = {
  AVAILABLE: 'ok',
  NOT_AVAILABLE: 'warn',
  RESERVED: 'neutral',
}

const blockCountLabel = (count: number) =>
  count === 0 ? 'Sin bloques' : `${count} ${count === 1 ? 'bloque' : 'bloques'}`

export const schedulesPage = () => {
  const roles = useAuthStore((state) => state.roles)
  const isSupervisor = roles.includes('ADMIN') || roles.includes('TRAINER_MANAGER')
  // A plain TRAINER only consults their own week: scheduling is a supervisor task.
  const isReadOnly = !isSupervisor
  const queryClient = useQueryClient()
  const [trainerSearch, setTrainerSearch] = useState('')
  const [trainerId, setTrainerId] = useState<number | null>(null)
  const [draftSlots, setDraftSlots] = useState<ScheduleDraftSlot[]>([])
  const [dayOfWeek, setDayOfWeek] = useState(2)
  const [startTime, setStartTime] = useState('06:00')
  const [endTime, setEndTime] = useState('07:00')
  const [status, setStatus] = useState<ScheduleStatus>('AVAILABLE')
  const [slotError, setSlotError] = useState<string | null>(null)
  const [confirmSave, setConfirmSave] = useState(false)
  const [nextSlotId, setNextSlotId] = useState(0)
  const addFormRef = useRef<HTMLFormElement>(null)
  const startTimeRef = useRef<HTMLInputElement>(null)
  const trainersQuery = useTrainerDirectory(trainerSearch)
  const trainerOptions = trainersQuery.data?.content
  const scheduleQuery = useWeeklySchedule(trainerId)

  useEffect(() => {
    if (!trainerOptions || trainerOptions.length === 0) {
      setTrainerId(null)
      return
    }
    if (!trainerId || !trainerOptions.some((trainer) => trainer.id === trainerId)) {
      setTrainerId(trainerOptions[0].id)
    }
  }, [trainerId, trainerOptions])

  useEffect(() => {
    if (scheduleQuery.data) setDraftSlots(toDraftSlots(scheduleQuery.data))
  }, [scheduleQuery.data])

  const normalizedDraft = useMemo(
    () => draftSlots.map(({ dayOfWeek: day, startTime: start, endTime: end, status: slotStatus }) => ({
      dayOfWeek: day,
      startTime: start,
      endTime: end,
      status: slotStatus,
    })),
    [draftSlots],
  )
  const normalizedSaved = useMemo(
    () => (scheduleQuery.data ? toDraftSlots(scheduleQuery.data).map(({ key: _key, ...slot }) => slot) : []),
    [scheduleQuery.data],
  )
  const hasChanges = JSON.stringify(normalizedDraft) !== JSON.stringify(normalizedSaved)
  const validationError = getScheduleError(draftSlots)

  const saveMutation = useMutation({
    mutationFn: () => {
      if (trainerId === null) throw new Error('Selecciona un entrenador antes de guardar.')
      return saveWeeklySchedule(trainerId, normalizedDraft)
    },
    onSuccess: async (savedSlots) => {
      await queryClient.invalidateQueries({ queryKey: ['trainer-schedule', trainerId] })
      setDraftSlots(toDraftSlots(savedSlots))
      setConfirmSave(false)
      toast.success('Semana guardada', 'La malla semanal se reemplazó correctamente.')
    },
    onError: (error) => {
      toast.error(
        'No se pudo guardar la semana',
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Comprueba tu conexión e inténtalo de nuevo.',
      )
    },
  })

  const addSlot = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSlotError(null)
    if (endTime <= startTime) {
      setSlotError('La hora final debe ser posterior a la hora inicial.')
      return
    }

    const nextSlot: ScheduleDraftSlot = {
      key: `new-${nextSlotId}`,
      dayOfWeek,
      startTime,
      endTime,
      status,
    }
    const error = getScheduleError([...draftSlots, nextSlot])
    if (error && error !== 'La semana debe conservar al menos un bloque horario.') {
      setSlotError(error)
      return
    }
    setDraftSlots((current) => [...current, nextSlot])
    setNextSlotId((current) => current + 1)
  }

  const updateSlot = (key: string, patch: Partial<ScheduleSlotPayload>) => {
    setDraftSlots((current) =>
      current.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)),
    )
    setSlotError(null)
  }

  const startAddForDay = (dayValue: number) => {
    setDayOfWeek(dayValue)
    setSlotError(null)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    addFormRef.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    })
    startTimeRef.current?.focus({ preventScroll: true })
  }

  const header = (
    <componentComponents.pageHead
      title="Horarios"
      lede={
        isReadOnly
          ? 'Consulta tu disponibilidad semanal. La malla la gestiona administración o tu entrenador manager.'
          : 'Organiza la disponibilidad semanal de los entrenadores.'
      }
    />
  )

  if (trainersQuery.isPending) {
    return (
      <>
        {header}
        <section className="scheduleFeature__panel">
          <p className="py-12 text-center text-sm text-muted">Cargando entrenadores…</p>
        </section>
      </>
    )
  }

  if (trainersQuery.isError) {
    return (
      <>
        {header}
        <section className="scheduleFeature__panel">
          <componentComponents.emptyState
            icon={luCalendarDays}
            title="No se pudieron cargar los entrenadores"
            description="Comprueba tu conexión y vuelve a intentarlo."
            action={
              <componentComponents.button variant="default" onClick={() => void trainersQuery.refetch()}>
                Reintentar
              </componentComponents.button>
            }
          />
        </section>
      </>
    )
  }

  const trainers = trainerOptions ?? []
  const selectedTrainer = trainers.find((trainer) => trainer.id === trainerId)
  const sortedSlots = [...draftSlots].sort(
    (first, second) =>
      first.dayOfWeek - second.dayOfWeek || first.startTime.localeCompare(second.startTime),
  )

  return (
    <>
      {header}

      <section className="scheduleFeature__panel" aria-labelledby="schedule-owner-heading">
        <div className="scheduleFeature__toolbar">
          {isSupervisor ? (
            <>
              <label className="scheduleFeature__toolbarField">
                <span>Buscar entrenador</span>
                <componentComponents.searchInput
                  id="schedule-trainer-search"
                  aria-label="Buscar entrenador por nombre o especialidad"
                  autoComplete="off"
                  value={trainerSearch}
                  onChange={(event) => setTrainerSearch(event.currentTarget.value)}
                  placeholder="Nombre o especialidad"
                />
              </label>
              <label className="scheduleFeature__toolbarField">
                <span>Entrenador</span>
                <componentComponents.select
                  id="schedule-trainer"
                  value={trainerId ?? ''}
                  onChange={(event) => setTrainerId(Number(event.currentTarget.value) || null)}
                >
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainerName(trainer)}
                      {trainer.specialty ? ` · ${trainer.specialty}` : ''}
                    </option>
                  ))}
                </componentComponents.select>
              </label>
            </>
          ) : (
            <div>
              <div className="scheduleFeature__ownerTop">
                <h2 id="schedule-owner-heading" className="scheduleFeature__ownerTitle">
                  Mi malla semanal
                </h2>
                <span className="scheduleFeature__readOnlyChip">
                  <componentComponents.icon icon={luLock} size="sm" />
                  Solo lectura
                </span>
              </div>
              {selectedTrainer && (
                <p className="scheduleFeature__ownerMeta">
                  {trainerName(selectedTrainer)}
                  {selectedTrainer.specialty ? ` · ${selectedTrainer.specialty}` : ''}
                </p>
              )}
            </div>
          )}
          {isSupervisor && <h2 id="schedule-owner-heading" className="sr-only">Malla semanal</h2>}
        </div>
      </section>

      {trainers.length === 0 ? (
        <section className="scheduleFeature__panel mt-5">
          <componentComponents.emptyState
            icon={luCalendarDays}
            title="No hay entrenadores disponibles"
            description="Crea primero un perfil de entrenador para gestionar una malla semanal."
          />
        </section>
      ) : scheduleQuery.isPending ? (
        <section className="scheduleFeature__panel mt-5">
          <p className="py-12 text-center text-sm text-muted">Cargando malla semanal…</p>
        </section>
      ) : scheduleQuery.isError ? (
        <section className="scheduleFeature__panel mt-5">
          <componentComponents.emptyState
            icon={luCalendarDays}
            title="No se pudo cargar la malla semanal"
            description="Comprueba tu conexión y vuelve a intentarlo."
            action={
              <componentComponents.button variant="default" onClick={() => void scheduleQuery.refetch()}>
                Reintentar
              </componentComponents.button>
            }
          />
        </section>
      ) : (
        <>
          <section className="scheduleFeature__panel mt-5" aria-labelledby="schedule-week-heading">
            <div className="scheduleFeature__panelHead">
              <div>
                <h2 id="schedule-week-heading" className="scheduleFeature__panelTitle">Semana</h2>
                <p className="scheduleFeature__panelMeta">
                  {blockCountLabel(draftSlots.length)}
                  {isReadOnly
                    ? ' · Solo lectura'
                    : hasChanges
                      ? ' · Cambios sin guardar'
                      : ' · Semana guardada'}
                </p>
              </div>
              {!isReadOnly && (
                <componentComponents.button
                  variant="primary"
                  size="sm"
                  icon={luCalendarDays}
                  onClick={() => setConfirmSave(true)}
                  disabled={!hasChanges || Boolean(validationError) || saveMutation.isPending}
                >
                  Guardar semana
                </componentComponents.button>
              )}
            </div>

            {isReadOnly && (
              <p className="scheduleFeature__readOnlyNote">
                Los cambios de horario los realiza administración o tu entrenador manager.
              </p>
            )}

            {!isReadOnly && hasChanges && validationError && (
              <p className="scheduleFeature__inlineError" role="alert">{validationError}</p>
            )}

            <div className="scheduleFeature__week">
              {scheduleDays.map((day) => {
                const daySlots = sortedSlots.filter((slot) => slot.dayOfWeek === day.value)
                const dayHeadingId = `schedule-day-${day.value}`
                return (
                  <section
                    key={day.value}
                    className="scheduleFeature__day"
                    data-empty={daySlots.length === 0}
                    aria-labelledby={dayHeadingId}
                  >
                    <div className="scheduleFeature__dayRail">
                      <h3 id={dayHeadingId} className="scheduleFeature__dayName">{day.label}</h3>
                      {daySlots.length > 0 && (
                        <p className="scheduleFeature__dayCount">{blockCountLabel(daySlots.length)}</p>
                      )}
                    </div>

                    <div className="scheduleFeature__daySlots">
                      {daySlots.length === 0 ? (
                        <p className="scheduleFeature__emptyDay">
                          <span>Sin bloques</span>
                          {!isReadOnly && (
                            <button
                              type="button"
                              className="scheduleFeature__dayAdd"
                              onClick={() => startAddForDay(day.value)}
                              aria-label={`Añadir bloque el ${day.label}`}
                            >
                              <componentComponents.icon icon={luPlus} size="sm" />
                              Añadir
                            </button>
                          )}
                        </p>
                      ) : (
                        daySlots.map((slot, slotIndex) =>
                          isReadOnly ? (
                            <div key={slot.key} className="scheduleFeature__slotReadOnly">
                              <span className="scheduleFeature__timeRangeStatic">
                                <span className="sr-only">
                                  Bloque {slotIndex + 1} del {day.label}, de{' '}
                                </span>
                                {slot.startTime}
                                <span className="scheduleFeature__timeDash" aria-hidden="true">–</span>
                                {slot.endTime}
                              </span>
                              <componentComponents.status tone={readOnlyStatusTone[slot.status]}>
                                {scheduleStatusLabels[slot.status]}
                              </componentComponents.status>
                            </div>
                          ) : (
                            <div key={slot.key} className="scheduleFeature__slot">
                            <div className="scheduleFeature__timeRange">
                              <label className="scheduleFeature__timeField">
                                <span className="sr-only">
                                  Inicio del bloque {slotIndex + 1} del {day.label}
                                </span>
                                <componentComponents.input
                                  type="time"
                                  className="scheduleFeature__timeInput"
                                  value={slot.startTime}
                                  onChange={(event) => updateSlot(slot.key, { startTime: event.currentTarget.value })}
                                />
                              </label>
                              <span className="scheduleFeature__timeDash" aria-hidden="true">–</span>
                              <label className="scheduleFeature__timeField">
                                <span className="sr-only">
                                  Fin del bloque {slotIndex + 1} del {day.label}
                                </span>
                                <componentComponents.input
                                  type="time"
                                  className="scheduleFeature__timeInput"
                                  value={slot.endTime}
                                  onChange={(event) => updateSlot(slot.key, { endTime: event.currentTarget.value })}
                                />
                              </label>
                            </div>

                            <span className="scheduleFeature__status" data-tone={statusTone[slot.status]}>
                              <span className="sr-only">Estado del bloque {slotIndex + 1} del {day.label}</span>
                              <span className="scheduleFeature__statusDot" aria-hidden="true" />
                              <componentComponents.select
                                className="scheduleFeature__statusSelect"
                                aria-label={`Estado del bloque ${slotIndex + 1} del ${day.label}`}
                                value={slot.status}
                                onChange={(event) =>
                                  updateSlot(slot.key, {
                                    status: scheduleStatusSchema.parse(event.currentTarget.value),
                                  })
                                }
                              >
                                {Object.entries(scheduleStatusLabels).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </componentComponents.select>
                            </span>

                            <componentComponents.iconButton
                              icon={luTrash2}
                              label={`Quitar bloque ${slotIndex + 1} del ${day.label}`}
                              onClick={() => setDraftSlots((current) => current.filter((entry) => entry.key !== slot.key))}
                            />
                            </div>
                          ),
                        )
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          </section>

          {!isReadOnly && (
            <section className="scheduleFeature__panel mt-5" aria-labelledby="schedule-add-heading">
            <div className="scheduleFeature__panelHead">
              <div>
                <h2 id="schedule-add-heading" className="scheduleFeature__panelTitle">Añadir bloque</h2>
                <p className="scheduleFeature__panelMeta">
                  Define un horario y un estado para un día de la semana.
                </p>
              </div>
            </div>
            <form ref={addFormRef} className="scheduleFeature__addForm" onSubmit={addSlot}>
              <componentComponents.field label="Día" htmlFor="schedule-day">
                <componentComponents.select
                  id="schedule-day"
                  value={dayOfWeek}
                  onChange={(event) => setDayOfWeek(Number(event.currentTarget.value))}
                >
                  {scheduleDays.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                </componentComponents.select>
              </componentComponents.field>
              <componentComponents.field label="Inicio" htmlFor="schedule-start">
                <componentComponents.input
                  id="schedule-start"
                  ref={startTimeRef}
                  type="time"
                  className="scheduleFeature__timeInput"
                  value={startTime}
                  onChange={(event) => setStartTime(event.currentTarget.value)}
                />
              </componentComponents.field>
              <componentComponents.field label="Fin" htmlFor="schedule-end">
                <componentComponents.input
                  id="schedule-end"
                  type="time"
                  className="scheduleFeature__timeInput"
                  value={endTime}
                  onChange={(event) => setEndTime(event.currentTarget.value)}
                />
              </componentComponents.field>
              <componentComponents.field label="Estado" htmlFor="schedule-status">
                <componentComponents.select
                  id="schedule-status"
                  value={status}
                  onChange={(event) => setStatus(scheduleStatusSchema.parse(event.currentTarget.value))}
                >
                  {Object.entries(scheduleStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </componentComponents.select>
              </componentComponents.field>
              <div className="scheduleFeature__addAction">
                <componentComponents.button type="submit" variant="default" icon={luPlus}>
                  Añadir bloque
                </componentComponents.button>
              </div>
            </form>
            {slotError && <p className="scheduleFeature__inlineError" role="alert">{slotError}</p>}
            </section>
          )}
        </>
      )}

      {!isReadOnly && (
        <componentComponents.modal
        open={confirmSave}
        onClose={() => {
          if (!saveMutation.isPending) setConfirmSave(false)
        }}
        title="Reemplazar la semana"
        icon={luClock3}
        footer={
          <>
            <componentComponents.button
              variant="quiet"
              size="sm"
              onClick={() => setConfirmSave(false)}
              disabled={saveMutation.isPending}
            >
              Revisar
            </componentComponents.button>
            <componentComponents.button
              variant="primary"
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || Boolean(validationError)}
            >
              {saveMutation.isPending ? 'Guardando…' : 'Reemplazar semana'}
            </componentComponents.button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-muted">
          El backend reemplazará la malla semanal completa de <strong className="text-ink">
            {selectedTrainer ? trainerName(selectedTrainer) : 'este entrenador'}
          </strong> con los {draftSlots.length} bloques visibles. Revisa los días, horas y estados antes de continuar.
        </p>
      </componentComponents.modal>
      )}
    </>
  )
}
