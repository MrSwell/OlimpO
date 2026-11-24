/* oxlint-disable react/rules-of-hooks */
import { LuDumbbell as luDumbbell } from 'react-icons/lu'
import * as componentComponents from '@/components'
import { useTrainerDirectory } from '@/features/trainers/hooks/useTrainerDirectory'
import { useRoutineForm } from '../hooks/useRoutineForm'
import './routineFeature.css'

interface RoutineFormDialogProps {
  open: boolean
  isSupervisor: boolean
  onClose: () => void
}

export const routineFormDialog = ({ open, isSupervisor, onClose }: RoutineFormDialogProps) => {
  const { form, submit, isSubmitting } = useRoutineForm({ open, isSupervisor, onSaved: onClose })
  const type = form.watch('type')
  const trainersQuery = useTrainerDirectory('', open && isSupervisor && type === 'CUSTOM')
  const errors = form.formState.errors
  const trainerOptions = trainersQuery.data?.content ?? []

  return (
    <componentComponents.modal
      open={open}
      onClose={onClose}
      title="Nueva rutina"
      icon={luDumbbell}
      footer={
        <>
          <componentComponents.button variant="quiet" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </componentComponents.button>
          <componentComponents.button
            type="submit"
            form="routine-form"
            variant="primary"
            size="sm"
            disabled={isSubmitting || (type === 'CUSTOM' && isSupervisor && trainerOptions.length === 0)}
          >
            {isSubmitting ? 'Guardando…' : 'Crear rutina'}
          </componentComponents.button>
        </>
      }
    >
      <form id="routine-form" onSubmit={submit} noValidate className="routineFeature__formGrid">
        <componentComponents.field
          label="Nombre"
          htmlFor="routine-name"
          error={errors.name?.message}
          className="routineFeature__formFullWidth"
        >
          <componentComponents.input
            id="routine-name"
            maxLength={150}
            autoFocus
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'routine-name-error' : undefined}
            placeholder="Ej. Fuerza para tren superior"
            {...form.register('name')}
            disabled={isSubmitting}
          />
        </componentComponents.field>

        <componentComponents.field label="Tipo" htmlFor="routine-type" error={errors.type?.message}>
          <componentComponents.select
            id="routine-type"
            aria-invalid={Boolean(errors.type)}
            aria-describedby={errors.type ? 'routine-type-error' : undefined}
            {...form.register('type')}
            disabled={isSubmitting}
          >
            <option value="GENERAL">General</option>
            <option value="CUSTOM">Personalizada</option>
          </componentComponents.select>
        </componentComponents.field>

        {type === 'CUSTOM' && (
          <>
            <componentComponents.field
              label="Precio (COP)"
              htmlFor="routine-price"
              error={errors.price?.message}
            >
              <componentComponents.input
                id="routine-price"
                type="number"
                min="1"
                step="100"
                inputMode="decimal"
                aria-invalid={Boolean(errors.price)}
                aria-describedby={errors.price ? 'routine-price-error' : undefined}
                placeholder="Ej. 80000"
                {...form.register('price')}
                disabled={isSubmitting}
              />
            </componentComponents.field>

            {isSupervisor ? (
              <componentComponents.field
                label="Entrenador responsable"
                htmlFor="routine-trainer"
                error={errors.trainerId?.message}
              >
                <componentComponents.select
                  id="routine-trainer"
                  aria-invalid={Boolean(errors.trainerId)}
                  aria-describedby={errors.trainerId ? 'routine-trainer-error' : undefined}
                  {...form.register('trainerId')}
                  disabled={isSubmitting || trainersQuery.isPending || trainersQuery.isError}
                >
                  <option value="">Selecciona un entrenador</option>
                  {trainerOptions.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {[trainer.firstName, trainer.lastName].join(' ')}
                      {trainer.specialty ? ` · ${trainer.specialty}` : ''}
                    </option>
                  ))}
                </componentComponents.select>
                {trainersQuery.isPending && <p className="text-xs text-faint">Cargando entrenadores…</p>}
                {trainersQuery.isError && (
                  <p className="text-xs text-danger" role="alert">
                    No se pudieron cargar los entrenadores. Cierra y vuelve a abrir el formulario.
                  </p>
                )}
                {!trainersQuery.isPending && !trainersQuery.isError && trainerOptions.length === 0 && (
                  <p className="text-xs text-muted">No hay perfiles de entrenador disponibles.</p>
                )}
              </componentComponents.field>
            ) : (
              <p className="self-end text-xs leading-relaxed text-muted">
                La rutina quedará asociada a tu perfil de entrenador.
              </p>
            )}
          </>
        )}

        <componentComponents.field
          label="Descripción (opcional)"
          htmlFor="routine-description"
          error={errors.description?.message}
          className="routineFeature__formFullWidth"
        >
          <textarea
            id="routine-description"
            maxLength={2000}
            rows={4}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? 'routine-description-error' : undefined}
            className="routineFeature__textarea"
            placeholder="Objetivo, estructura y observaciones de la rutina"
            {...form.register('description')}
            disabled={isSubmitting}
          />
        </componentComponents.field>
      </form>
    </componentComponents.modal>
  )
}
