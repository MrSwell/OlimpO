/* oxlint-disable react/rules-of-hooks */
import { LuUserPlus as luUserPlus } from 'react-icons/lu'
import * as componentComponents from '@/components'
import { useUserForm } from '../hooks/useUserForm'
import {
  staffRoleHints,
  staffRoleLabels,
  staffRoles,
} from '../model/userTypes'
import './userFeature.css'

interface UserFormDialogProps {
  open: boolean
  onClose: () => void
}

export const userFormDialog = ({ open, onClose }: UserFormDialogProps) => {
  const { form, submit, isSubmitting } = useUserForm({ open, onSaved: onClose })
  const errors = form.formState.errors

  return (
    <componentComponents.modal
      open={open}
      onClose={onClose}
      title="Nuevo usuario"
      icon={luUserPlus}
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
            form="user-form"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando…' : 'Crear usuario'}
          </componentComponents.button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} noValidate className="userFeature__formGrid">
        <componentComponents.field
          label="Nombre"
          htmlFor="user-first-name"
          error={errors.firstName?.message}
        >
          <componentComponents.input
            id="user-first-name"
            autoComplete="given-name"
            maxLength={100}
            autoFocus
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? 'user-first-name-error' : undefined}
            {...form.register('firstName')}
            disabled={isSubmitting}
          />
        </componentComponents.field>

        <componentComponents.field
          label="Apellido"
          htmlFor="user-last-name"
          error={errors.lastName?.message}
        >
          <componentComponents.input
            id="user-last-name"
            autoComplete="family-name"
            maxLength={100}
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={errors.lastName ? 'user-last-name-error' : undefined}
            {...form.register('lastName')}
            disabled={isSubmitting}
          />
        </componentComponents.field>

        <componentComponents.field
          label="Correo"
          htmlFor="user-email"
          error={errors.email?.message}
        >
          <componentComponents.input
            id="user-email"
            type="email"
            autoComplete="email"
            maxLength={255}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'user-email-error' : undefined}
            {...form.register('email')}
            disabled={isSubmitting}
          />
        </componentComponents.field>

        <componentComponents.field
          label="Contraseña inicial"
          htmlFor="user-password"
          hint="Mínimo 6 caracteres."
          error={errors.password?.message}
        >
          <componentComponents.input
            id="user-password"
            type="password"
            autoComplete="new-password"
            maxLength={72}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'user-password-error' : undefined}
            {...form.register('password')}
            disabled={isSubmitting}
          />
        </componentComponents.field>

        <componentComponents.field
          label="Celular (opcional)"
          htmlFor="user-phone"
          error={errors.phone?.message}
          className="userFeature__formFullWidth"
        >
          <componentComponents.input
            id="user-phone"
            type="tel"
            autoComplete="tel"
            maxLength={20}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'user-phone-error' : undefined}
            {...form.register('phone')}
            disabled={isSubmitting}
          />
        </componentComponents.field>

        <fieldset className="userFeature__roleField userFeature__formFullWidth">
          <legend className="userFeature__roleLegend">Roles</legend>
          <div className="userFeature__roleOptions">
            {staffRoles.map((role) => (
              <label key={role} className="userFeature__roleOption">
                <input
                  type="checkbox"
                  value={role}
                  {...form.register('roles')}
                  disabled={isSubmitting}
                />
                <span className="userFeature__roleOptionBody">
                  <span className="userFeature__roleOptionName">{staffRoleLabels[role]}</span>
                  <span className="userFeature__roleOptionHint">{staffRoleHints[role]}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.roles?.message && (
            <p className="userFeature__fieldError" role="alert">
              {errors.roles.message}
            </p>
          )}
          <p className="userFeature__roleNote">
            Los clientes no se crean aquí: se registran desde Clientes con su membresía.
          </p>
        </fieldset>
      </form>
    </componentComponents.modal>
  )
}
