/* oxlint-disable react/rules-of-hooks */
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LuCalendarDays as luCalendarDays,
  LuCheck as luCheck,
  LuClock3 as luClock3,
  LuLock as luLock,
  LuPlus as luPlus,
  LuTrash2 as luTrash2,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import { useMediaQuery } from '@/hooks/useMediaQuery'
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

const trainerInitials = (trainer: TrainerOption) =>
  `${trainer.firstName.charAt(0)}${trainer.lastName.charAt(0)}`.toUpperCase()

const toDraftSlots = (slots: ScheduleSlot[]): ScheduleDraftSlot[] =>
  slots.map((slot) => ({
    key: String(slot.id),
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime.slice(0, 5),
    endTime: slot.endTime.slice(0, 5),
    status: slot.status,
  }))

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

const fromMinutes = (total: number) => {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const formatHours = (minutes: number) => {
  if (minutes === 0) return '0 h'
  const hours = minutes / 60
  return Number.isInteger(hours) ? `${hours} h` : `${hours.toFixed(1).replace('.', ',')} h`
}

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

const readOnlyStatusTone: Record<ScheduleStatus, 'ok' | 'warn' | 'neutral'> = {
  AVAILABLE: 'ok',
  NOT_AVAILABLE: 'warn',
  RESERVED: 'neutral',
}

const blockCountLabel = (count: number) =>
  count === 0 ? 'Sin bloques' : `${count} ${count === 1 ? 'bloque' : 'bloques'}`

const blockContent = (slot: ScheduleDraftSlot) => (
  <>
    <span className="scheduleFeature__blockDot" aria-hidden="true" />
    <span className="scheduleFeature__blockTime">
      {slot.startTime}
      <span className="scheduleFeature__blockSep" aria-hidden="true">–</span>
      <span className="scheduleFeature__blockEnd">{slot.endTime}</span>
    </span>
    <span className="scheduleFeature__blockStatus">{scheduleStatusLabels[slot.status]}</span>
  </>
)

export const schedulesPage = () => {
  const roles = useAuthStore((state) => state.roles)
  const isSupervisor = roles.includes('ADMIN') || roles.includes('TRAINER_MANAGER')
  // A plain TRAINER only consults their own week: scheduling is a supervisor task.
  const isReadOnly = !isSupervisor
  const isCompact = useMediaQuery('(max-width: 760px)')
  const queryClient = useQueryClient()
  const [trainerSearch, setTrainerSearch] = useState('')
  const [trainerId, setTrainerId] = useState<number | null>(null)
  const [draftSlots, setDraftSlots] = useState<ScheduleDraftSlot[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [confirmSave, setConfirmSave] = useState(false)
  const [nextSlotId, setNextSlotId] = useState(0)
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
    if (scheduleQuery.data) {
      setDraftSlots(toDraftSlots(scheduleQuery.data))
      setSelectedKey(null)
    }
  }, [scheduleQuery.data])

  useEffect(() => {
    setSelectedKey(null)
  }, [trainerId])

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

  const sortedSlots = useMemo(
    () =>
      [...draftSlots].sort(
        (first, second) =>
          first.dayOfWeek - second.dayOfWeek || first.startTime.localeCompare(second.startTime),
      ),
    [draftSlots],
  )

  const selectedSlot = draftSlots.find((slot) => slot.key === selectedKey) ?? null

  const weekSummary = useMemo(() => {
    const totalMinutes = draftSlots.reduce(
      (total, slot) => total + (toMinutes(slot.endTime) - toMinutes(slot.startTime)),
      0,
    )
    const days = new Set(draftSlots.map((slot) => slot.dayOfWeek)).size
    const statusCounts = draftSlots.reduce<Record<ScheduleStatus, number>>(
      (counts, slot) => {
        counts[slot.status] += 1
        return counts
      },
      { AVAILABLE: 0, NOT_AVAILABLE: 0, RESERVED: 0 },
    )
    return { totalMinutes, days, statusCounts }
  }, [draftSlots])

  const timeline = useMemo(() => {
    if (sortedSlots.length === 0) {
      return { start: 6 * 60, end: 22 * 60 }
    }
    const starts = sortedSlots.map((slot) => toMinutes(slot.startTime))
    const ends = sortedSlots.map((slot) => toMinutes(slot.endTime))
    let start = Math.max(0, Math.floor(Math.min(...starts) / 60) * 60 - 60)
    let end = Math.min(24 * 60, Math.ceil(Math.max(...ends) / 60) * 60 + 60)
    if (end - start < 6 * 60) end = Math.min(24 * 60, start + 6 * 60)
    if (end - start < 6 * 60) start = Math.max(0, end - 6 * 60)
    return { start, end }
  }, [sortedSlots])

  const timelineSpan = timeline.end - timeline.start
  const positionOf = (minutes: number) => ((minutes - timeline.start) / timelineSpan) * 100

  const tickStep = timelineSpan > 18 * 60 ? 180 : timelineSpan > 10 * 60 ? 120 : 60
  const gridStep = timelineSpan > 12 * 60 ? 120 : 60
  const ticks = useMemo(() => {
    const values: number[] = []
    for (let minute = timeline.start; minute <= timeline.end; minute += tickStep) {
      values.push(minute)
    }
    // Only add the closing tick when it will not collide with the previous label.
    const last = values[values.length - 1]
    if (timeline.end - last >= tickStep * 0.6) values.push(timeline.end)
    return values
  }, [timeline, tickStep])

  const saveMutation = useMutation({
    mutationFn: () => {
      if (trainerId === null) throw new Error('Selecciona un entrenador antes de guardar.')
      return saveWeeklySchedule(trainerId, normalizedDraft)
    },
    onSuccess: async (savedSlots) => {
      await queryClient.invalidateQueries({ queryKey: ['trainer-schedule', trainerId] })
      setDraftSlots(toDraftSlots(savedSlots))
      setSelectedKey(null)
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

  const updateSlot = (key: string, patch: Partial<ScheduleSlotPayload>) => {
    setDraftSlots((current) =>
      current.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)),
    )
  }

  const addSlot = (dayValue: number) => {
    const daySlots = sortedSlots.filter((slot) => slot.dayOfWeek === dayValue)
    const latestEnd = daySlots.reduce(
      (latest, slot) => Math.max(latest, toMinutes(slot.endTime)),
      0,
    )
    let start = daySlots.length > 0 ? latestEnd : 6 * 60
    if (start >= 23 * 60) start = 6 * 60
    const end = Math.min(start + 60, 24 * 60)
    const key = `new-${nextSlotId}`
    setDraftSlots((current) => [
      ...current,
      {
        key,
        dayOfWeek: dayValue,
        startTime: fromMinutes(start),
        endTime: fromMinutes(end),
        status: 'AVAILABLE',
      },
    ])
    setNextSlotId((current) => current + 1)
    setSelectedKey(key)
  }

  const removeSlot = (key: string) => {
    setDraftSlots((current) => current.filter((slot) => slot.key !== key))
    setSelectedKey((current) => (current === key ? null : current))
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
  const legend = (
    <div className="scheduleFeature__legend" aria-label="Estados de los bloques">
      <span className="scheduleFeature__legendItem" data-status="AVAILABLE">
        <span className="scheduleFeature__legendDot" aria-hidden="true" />
        Disponible
      </span>
      <span className="scheduleFeature__legendItem" data-status="RESERVED">
        <span className="scheduleFeature__legendDot" aria-hidden="true" />
        Reservado
      </span>
      <span className="scheduleFeature__legendItem" data-status="NOT_AVAILABLE">
        <span className="scheduleFeature__legendDot" aria-hidden="true" />
        No disponible
      </span>
    </div>
  )

  return (
    <>
      {header}

      <section className="scheduleFeature__panel" aria-labelledby="schedule-owner-heading">
        {isSupervisor ? (
          <div className="scheduleFeature__toolbar">
            <div className="scheduleFeature__toolbarIntro">
              <p className="scheduleFeature__eyebrow">Entrenador</p>
              <p className="scheduleFeature__toolbarHint">
                Elige a quién pertenece la malla y edita su semana.
              </p>
            </div>
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
            <h2 id="schedule-owner-heading" className="sr-only">Malla semanal</h2>
          </div>
        ) : (
          <div className="scheduleFeature__owner">
            {selectedTrainer && (
              <componentComponents.avatar size="lg" className="scheduleFeature__ownerAvatar">
                {trainerInitials(selectedTrainer)}
              </componentComponents.avatar>
            )}
            <div className="scheduleFeature__ownerBody">
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
          </div>
        )}
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
          <div className="scheduleFeature__stats">
            <article className="scheduleFeature__stat">
              <span className="scheduleFeature__statIcon" aria-hidden="true">
                <componentComponents.icon icon={luCalendarDays} size="md" />
              </span>
              <div>
                <p className="scheduleFeature__statLabel">Bloques</p>
                <p className="scheduleFeature__statValue">{draftSlots.length}</p>
                <p className="scheduleFeature__statHint">en la semana</p>
              </div>
            </article>
            <article className="scheduleFeature__stat">
              <span className="scheduleFeature__statIcon" aria-hidden="true">
                <componentComponents.icon icon={luClock3} size="md" />
              </span>
              <div>
                <p className="scheduleFeature__statLabel">Horas</p>
                <p className="scheduleFeature__statValue">{formatHours(weekSummary.totalMinutes)}</p>
                <p className="scheduleFeature__statHint">programadas</p>
              </div>
            </article>
            <article className="scheduleFeature__stat">
              <span className="scheduleFeature__statIcon" aria-hidden="true">
                <componentComponents.icon icon={luCheck} size="md" />
              </span>
              <div>
                <p className="scheduleFeature__statLabel">Días</p>
                <p className="scheduleFeature__statValue">{weekSummary.days} / 7</p>
                <p className="scheduleFeature__statHint">con bloques</p>
              </div>
            </article>
          </div>

          <section className="scheduleFeature__panel mt-4" aria-labelledby="schedule-week-heading">
            <div className="scheduleFeature__panelHead">
              <div>
                <h2 id="schedule-week-heading" className="scheduleFeature__panelTitle">
                  Vista semanal
                </h2>
                <p className="scheduleFeature__panelMeta">
                  {blockCountLabel(draftSlots.length)}
                  {isReadOnly
                    ? ' · Solo lectura'
                    : hasChanges
                      ? ' · Cambios sin guardar'
                      : ' · Semana guardada'}
                </p>
              </div>
              <div className="scheduleFeature__panelActions">
                {legend}
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
            </div>

            {isReadOnly && (
              <p className="scheduleFeature__readOnlyNote">
                <componentComponents.icon icon={luLock} size="sm" />
                Los cambios de horario los realiza administración o tu entrenador manager.
              </p>
            )}

            {!isReadOnly && hasChanges && validationError && (
              <p className="scheduleFeature__inlineError" role="alert">{validationError}</p>
            )}

            {draftSlots.length === 0 && (
              <p className="scheduleFeature__emptyWeek">
                {isReadOnly
                  ? 'Aún no hay bloques registrados en tu semana. Administración o tu entrenador manager los publicará aquí.'
                  : 'La semana está vacía. Usa el botón + de un día para crear el primer bloque.'}
              </p>
            )}

            <div
              className="scheduleFeature__week"
              style={{ '--hour-step': `${(gridStep / timelineSpan) * 100}%` } as CSSProperties}
            >
              {!isCompact && (
                <div className="scheduleFeature__axis" aria-hidden="true">
                  <span className="scheduleFeature__axisRail">Hora</span>
                  <div className="scheduleFeature__axisTrack">
                    {ticks.map((tick) => (
                      <span
                        key={tick}
                        className="scheduleFeature__tick"
                        style={{ left: `${positionOf(tick)}%` }}
                      >
                        {fromMinutes(tick)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {scheduleDays.map((day) => {
                const daySlots = sortedSlots.filter((slot) => slot.dayOfWeek === day.value)
                const dayMinutes = daySlots.reduce(
                  (total, slot) => total + (toMinutes(slot.endTime) - toMinutes(slot.startTime)),
                  0,
                )
                const dayHeadingId = `schedule-day-${day.value}`
                return (
                  <section
                    key={day.value}
                    className="scheduleFeature__day"
                    data-empty={daySlots.length === 0}
                    aria-labelledby={dayHeadingId}
                  >
                    <div className="scheduleFeature__dayRail">
                      <div className="scheduleFeature__dayIdentity">
                        <h3 id={dayHeadingId} className="scheduleFeature__dayName">{day.label}</h3>
                        <p className="scheduleFeature__dayMeta">
                          {daySlots.length > 0
                            ? `${blockCountLabel(daySlots.length)} · ${formatHours(dayMinutes)}`
                            : 'Sin bloques'}
                        </p>
                      </div>
                      {!isReadOnly && (
                        <componentComponents.iconButton
                          icon={luPlus}
                          label={`Añadir bloque el ${day.label}`}
                          variant="outline"
                          onClick={() => addSlot(day.value)}
                        />
                      )}
                    </div>

                    <div className="scheduleFeature__track" data-compact={isCompact}>
                      {!isCompact && daySlots.length === 0 && (
                        <span className="scheduleFeature__trackEmpty">Sin bloques</span>
                      )}
                      {isCompact ? (
                        <div className="scheduleFeature__blockList">
                          {daySlots.map((slot) => {
                            const label = `${day.label}, de ${slot.startTime} a ${slot.endTime}, ${scheduleStatusLabels[slot.status]}`
                            return isReadOnly ? (
                              <div
                                key={slot.key}
                                className="scheduleFeature__blockRow"
                                data-status={slot.status}
                                title={label}
                              >
                                {blockContent(slot)}
                              </div>
                            ) : (
                              <button
                                key={slot.key}
                                type="button"
                                className="scheduleFeature__blockRow"
                                data-status={slot.status}
                                data-selected={selectedKey === slot.key}
                                onClick={() => setSelectedKey(slot.key)}
                                aria-pressed={selectedKey === slot.key}
                                aria-label={`${label}. Editar bloque`}
                              >
                                {blockContent(slot)}
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        daySlots.map((slot) => {
                          const start = toMinutes(slot.startTime)
                          const end = toMinutes(slot.endTime)
                          const left = positionOf(start)
                          const width = Math.max(positionOf(end) - left, 1)
                          const label = `${day.label}, de ${slot.startTime} a ${slot.endTime}, ${scheduleStatusLabels[slot.status]}`
                          return isReadOnly ? (
                            <div
                              key={slot.key}
                              className="scheduleFeature__block"
                              data-status={slot.status}
                              style={{ left: `${left}%`, width: `${width}%` }}
                              title={label}
                            >
                              {blockContent(slot)}
                            </div>
                          ) : (
                            <button
                              key={slot.key}
                              type="button"
                              className="scheduleFeature__block"
                              data-status={slot.status}
                              data-selected={selectedKey === slot.key}
                              style={{ left: `${left}%`, width: `${width}%` }}
                              onClick={() => setSelectedKey(slot.key)}
                              aria-pressed={selectedKey === slot.key}
                              aria-label={`${label}. Editar bloque`}
                              title={`${label}. Clic para editar`}
                            >
                              {blockContent(slot)}
                            </button>
                          )
                        })
                      )}
                    </div>

                    {!isReadOnly && selectedSlot?.dayOfWeek === day.value && (
                      <div className="scheduleFeature__editor" role="group" aria-label={`Editar bloque del ${day.label}`}>
                        <div className="scheduleFeature__editorHead">
                          <div>
                            <h3 className="scheduleFeature__editorTitle">Editar bloque</h3>
                            <p className="scheduleFeature__editorMeta">
                              {day.label} · {formatHours(toMinutes(selectedSlot.endTime) - toMinutes(selectedSlot.startTime))}
                            </p>
                          </div>
                          <componentComponents.iconButton
                            icon={luCheck}
                            label="Cerrar edición del bloque"
                            variant="outline"
                            onClick={() => setSelectedKey(null)}
                          />
                        </div>
                        <div className="scheduleFeature__editorFields">
                          <componentComponents.field label="Día" htmlFor="schedule-edit-day">
                            <componentComponents.select
                              id="schedule-edit-day"
                              value={selectedSlot.dayOfWeek}
                              onChange={(event) =>
                                updateSlot(selectedSlot.key, { dayOfWeek: Number(event.currentTarget.value) })
                              }
                            >
                              {scheduleDays.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </componentComponents.select>
                          </componentComponents.field>
                          <componentComponents.field label="Inicio" htmlFor="schedule-edit-start">
                            <componentComponents.input
                              id="schedule-edit-start"
                              type="time"
                              className="scheduleFeature__timeInput"
                              value={selectedSlot.startTime}
                              onChange={(event) =>
                                updateSlot(selectedSlot.key, { startTime: event.currentTarget.value })
                              }
                            />
                          </componentComponents.field>
                          <componentComponents.field label="Fin" htmlFor="schedule-edit-end">
                            <componentComponents.input
                              id="schedule-edit-end"
                              type="time"
                              className="scheduleFeature__timeInput"
                              value={selectedSlot.endTime}
                              onChange={(event) =>
                                updateSlot(selectedSlot.key, { endTime: event.currentTarget.value })
                              }
                            />
                          </componentComponents.field>
                          <componentComponents.field label="Estado" htmlFor="schedule-edit-status">
                            <componentComponents.select
                              id="schedule-edit-status"
                              value={selectedSlot.status}
                              onChange={(event) =>
                                updateSlot(selectedSlot.key, {
                                  status: scheduleStatusSchema.parse(event.currentTarget.value),
                                })
                              }
                            >
                              {Object.entries(scheduleStatusLabels).map(([value, text]) => (
                                <option key={value} value={value}>{text}</option>
                              ))}
                            </componentComponents.select>
                          </componentComponents.field>
                        </div>
                        <div className="scheduleFeature__editorActions">
                          <componentComponents.button
                            variant="quiet"
                            size="sm"
                            icon={luTrash2}
                            onClick={() => removeSlot(selectedSlot.key)}
                          >
                            Quitar bloque
                          </componentComponents.button>
                          <componentComponents.button
                            variant="default"
                            size="sm"
                            icon={luCheck}
                            onClick={() => setSelectedKey(null)}
                          >
                            Listo
                          </componentComponents.button>
                        </div>
                      </div>
                    )}
                  </section>
                )
              })}
            </div>

            {isReadOnly && (
              <div className="scheduleFeature__readOnlyStatus" aria-label="Resumen de estados">
                <componentComponents.status tone={readOnlyStatusTone.AVAILABLE}>
                  {weekSummary.statusCounts.AVAILABLE} disponibles
                </componentComponents.status>
                <componentComponents.status tone={readOnlyStatusTone.RESERVED}>
                  {weekSummary.statusCounts.RESERVED} reservados
                </componentComponents.status>
                <componentComponents.status tone={readOnlyStatusTone.NOT_AVAILABLE}>
                  {weekSummary.statusCounts.NOT_AVAILABLE} no disponibles
                </componentComponents.status>
              </div>
            )}
          </section>
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
