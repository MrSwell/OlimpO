/* oxlint-disable react/rules-of-hooks */
import { LuCog as luCog } from 'react-icons/lu'
import * as componentComponents from '@/components'
import {
  machineStatusLabels,
  machineStatuses,
  type Machine,
} from '../model/machineTypes'
import { useMachineForm } from '../hooks/useMachineForm'

interface MachineFormDialogProps {
  open: boolean
  machine: Machine | null
  onClose: () => void
}

export const machineFormDialog = ({ open, machine, onClose }: MachineFormDialogProps) => {
  const { form, submit, isSubmitting } = useMachineForm({ machine, onSaved: onClose })
  const errors = form.formState.errors

  return (
    <componentComponents.modal
      open={open}
      onClose={onClose}
      title={machine ? 'Editar máquina' : 'Nueva máquina'}
      icon={luCog}
      footer={
        <>
          <componentComponents.button
            variant="quiet"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </componentComponents.button>
          <componentComponents.button
            type="submit"
            form="machine-form"
            variant="default"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando…' : machine ? 'Guardar cambios' : 'Crear máquina'}
          </componentComponents.button>
        </>
      }
    >
      <form id="machine-form" onSubmit={submit} noValidate className="grid gap-4">
        <componentComponents.field label="Nombre" htmlFor="machine-name" error={errors.name?.message}>
          <componentComponents.input
            id="machine-name"
            maxLength={150}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'machine-name-error' : undefined}
            placeholder="Cinta de correr, prensa de piernas…"
            {...form.register('name')}
            disabled={isSubmitting}
          />
        </componentComponents.field>

        <div className="grid grid-cols-2 gap-4">
          <componentComponents.field
            label="Marca (opcional)"
            htmlFor="machine-brand"
            error={errors.brand?.message}
          >
            <componentComponents.input
              id="machine-brand"
              maxLength={100}
              aria-invalid={Boolean(errors.brand)}
              aria-describedby={errors.brand ? 'machine-brand-error' : undefined}
              {...form.register('brand')}
              disabled={isSubmitting}
            />
          </componentComponents.field>

          <componentComponents.field
            label="Modelo (opcional)"
            htmlFor="machine-model"
            error={errors.model?.message}
          >
            <componentComponents.input
              id="machine-model"
              maxLength={100}
              aria-invalid={Boolean(errors.model)}
              aria-describedby={errors.model ? 'machine-model-error' : undefined}
              {...form.register('model')}
              disabled={isSubmitting}
            />
          </componentComponents.field>
        </div>

        <componentComponents.field
          label="Número de serie (opcional)"
          htmlFor="machine-serial"
          hint="Único: si ya existe, el backend lo rechaza (409)."
          error={errors.serialNumber?.message}
        >
          <componentComponents.input
            id="machine-serial"
            maxLength={100}
            aria-invalid={Boolean(errors.serialNumber)}
            aria-describedby={errors.serialNumber ? 'machine-serial-error' : undefined}
            {...form.register('serialNumber')}
            disabled={isSubmitting}
          />
        </componentComponents.field>

        <componentComponents.field
          label="Estado"
          htmlFor="machine-status"
          error={errors.status?.message}
        >
          <componentComponents.select
            id="machine-status"
            aria-invalid={Boolean(errors.status)}
            aria-describedby={errors.status ? 'machine-status-error' : undefined}
            {...form.register('status')}
            disabled={isSubmitting}
          >
            {machineStatuses.map((status) => (
              <option key={status} value={status}>
                {machineStatusLabels[status]}
              </option>
            ))}
          </componentComponents.select>
        </componentComponents.field>
      </form>
    </componentComponents.modal>
  )
}
