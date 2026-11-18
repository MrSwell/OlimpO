/* oxlint-disable react/rules-of-hooks */
import {
  LuArrowLeft as luArrowLeft,
  LuUserPlus as luUserPlus,
} from 'react-icons/lu'
import { Link } from 'react-router'
import * as componentComponents from '@/components'
import { useCreateClientForm } from '../hooks/useCreateClientForm'
import type { ClientFormValues, MembershipType, PaymentMethod } from '../model/clientTypes'
import { membershipTypeLabels, paymentMethodLabels } from '../model/clientTypes'
import './clientFeature.css'

const clientFields: Array<{ name: keyof Pick<ClientFormValues, 'firstName' | 'lastName' | 'email' | 'password' | 'phone' | 'documentNumber' | 'birthDate' | 'sex' | 'fitnessGoal'>; label: string; type?: string; maxLength?: number }> = [
  { name: 'firstName', label: 'Nombre', maxLength: 100 },
  { name: 'lastName', label: 'Apellido', maxLength: 100 },
  { name: 'email', label: 'Correo', type: 'email', maxLength: 255 },
  { name: 'password', label: 'Contraseña inicial', type: 'password', maxLength: 72 },
  { name: 'documentNumber', label: 'Documento', maxLength: 20 },
  { name: 'phone', label: 'Teléfono', type: 'tel', maxLength: 20 },
  { name: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
  { name: 'fitnessGoal', label: 'Objetivo de entrenamiento', maxLength: 100 },
]

const membershipTypes: MembershipType[] = ['DAILY', 'QUARTERLY', 'MONTHLY']
const paymentMethods: PaymentMethod[] = ['CASH', 'CARD', 'TRANSFER', 'NEQUI']

export const clientCreatePage = () => {
  const { form, submit } = useCreateClientForm()
  const errors = form.formState.errors
  const addMembership = form.watch('addMembership')

  return (
    <>
      <componentComponents.pageHead
        title="Nuevo cliente"
        lede="Crea la cuenta y el perfil del cliente. La membresía inicial es opcional."
        actions={
          <Link to="/clients" className="clientFeature__actionLink">
            <componentComponents.icon icon={luArrowLeft} size="sm" />
            Volver al directorio
          </Link>
        }
      />

      <section className="clientFeature__card">
        <form onSubmit={submit} noValidate>
          <section aria-labelledby="client-account-title">
            <h2
              id="client-account-title"
              className="border-b border-line pb-3 text-[15px] font-semibold"
            >
              Cuenta y datos personales
            </h2>
            <div className="mt-5 grid gap-x-5 gap-y-4 min-[700px]:grid-cols-2">
              {clientFields.map(({ name, label, type = 'text', maxLength }) => {
                const error = errors[name]?.message
                const fieldId = `client-${name}`
                return (
                  <componentComponents.field
                    key={name}
                    label={label}
                    htmlFor={fieldId}
                    error={error}
                    className={name === 'fitnessGoal' ? 'min-[700px]:col-span-2' : undefined}
                  >
                    <componentComponents.input
                      id={fieldId}
                      type={type}
                      maxLength={maxLength}
                      autoComplete={
                        name === 'password'
                          ? 'new-password'
                          : name === 'email'
                            ? 'email'
                            : name === 'phone'
                              ? 'tel'
                              : undefined
                      }
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? `${fieldId}-error` : undefined}
                      {...form.register(name)}
                    />
                  </componentComponents.field>
                )
              })}

              <componentComponents.field
                label="Sexo (opcional)"
                htmlFor="client-sex"
                error={errors.sex?.message}
              >
                <componentComponents.select
                  id="client-sex"
                  aria-invalid={Boolean(errors.sex)}
                  aria-describedby={errors.sex ? 'client-sex-error' : undefined}
                  {...form.register('sex')}
                >
                  <option value="">Sin especificar</option>
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                </componentComponents.select>
              </componentComponents.field>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-faint">
              La contraseña inicial debe compartirse de forma segura con el cliente. No se guarda
              en el navegador.
            </p>
          </section>

          <section aria-labelledby="client-membership-title" className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3">
              <h2 id="client-membership-title" className="text-[15px] font-semibold">
                Membresía inicial
              </h2>
              <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-muted">
                <input
                  type="checkbox"
                  className="clientFeature__checkbox focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  {...form.register('addMembership')}
                />
                Registrar ahora
              </label>
            </div>

            {addMembership ? (
              <div className="mt-5 grid gap-x-5 gap-y-4 min-[700px]:grid-cols-2">
                <componentComponents.field
                  label="Tipo"
                  htmlFor="client-membership-type"
                  error={errors.membershipType?.message}
                >
                  <componentComponents.select
                    id="client-membership-type"
                    aria-invalid={Boolean(errors.membershipType)}
                    aria-describedby={
                      errors.membershipType ? 'client-membership-type-error' : undefined
                    }
                    {...form.register('membershipType')}
                  >
                    {membershipTypes.map((type) => (
                      <option key={type} value={type}>
                        {membershipTypeLabels[type]}
                      </option>
                    ))}
                  </componentComponents.select>
                </componentComponents.field>

                <componentComponents.field
                  label="Precio (COP)"
                  htmlFor="client-membership-price"
                  error={errors.membershipPrice?.message}
                >
                  <componentComponents.input
                    id="client-membership-price"
                    type="number"
                    min="0.01"
                    max="99999999.99"
                    step="0.01"
                    inputMode="decimal"
                    aria-invalid={Boolean(errors.membershipPrice)}
                    aria-describedby={
                      errors.membershipPrice ? 'client-membership-price-error' : undefined
                    }
                    {...form.register('membershipPrice')}
                  />
                </componentComponents.field>

                <componentComponents.field
                  label="Método de pago"
                  htmlFor="client-membership-method"
                  error={errors.paymentMethod?.message}
                >
                  <componentComponents.select
                    id="client-membership-method"
                    aria-invalid={Boolean(errors.paymentMethod)}
                    aria-describedby={
                      errors.paymentMethod ? 'client-membership-method-error' : undefined
                    }
                    {...form.register('paymentMethod')}
                  >
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {paymentMethodLabels[method]}
                      </option>
                    ))}
                  </componentComponents.select>
                </componentComponents.field>

                <componentComponents.field
                  label="Referencia de pago (opcional)"
                  htmlFor="client-membership-reference"
                  error={errors.reference?.message}
                >
                  <componentComponents.input
                    id="client-membership-reference"
                    maxLength={100}
                    aria-invalid={Boolean(errors.reference)}
                    aria-describedby={
                      errors.reference ? 'client-membership-reference-error' : undefined
                    }
                    {...form.register('reference')}
                  />
                </componentComponents.field>

                <componentComponents.field
                  label="Inicio (opcional)"
                  htmlFor="client-membership-start-date"
                  hint="Si se deja vacío, el backend usa la fecha de hoy."
                  error={errors.startDate?.message}
                >
                  <componentComponents.input
                    id="client-membership-start-date"
                    type="date"
                    aria-invalid={Boolean(errors.startDate)}
                    aria-describedby={
                      errors.startDate ? 'client-membership-start-date-error' : undefined
                    }
                    {...form.register('startDate')}
                  />
                </componentComponents.field>
              </div>
            ) : (
              <p className="pt-4 text-[13px] text-muted">
                Puedes activar una membresía más tarde desde la ficha del cliente.
              </p>
            )}
          </section>

          <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-line pt-5">
            <Link to="/clients" className="clientFeature__actionLink">
              Cancelar
            </Link>
            <componentComponents.button
              type="submit"
              variant="default"
              size="sm"
              className="clientFeature__button"
              disabled={form.formState.isSubmitting}
              icon={luUserPlus}
            >
              {form.formState.isSubmitting ? 'Guardando…' : 'Crear cliente'}
            </componentComponents.button>
          </div>
        </form>
      </section>
    </>
  )
}
