// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import { Navigate as navigate } from 'react-router'
import {
  LuArrowLeft as luArrowLeft,
  LuArrowRight as luArrowRight,
  LuCheck as luCheck,
  LuChevronRight as luChevronRight,
  LuLockKeyhole as luLockKeyhole,
  LuMail as luMail,
} from 'react-icons/lu'
import * as componentComponents from '@/components'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/stores/authStore'
import { useLoginForm } from '../hooks/useLoginForm'
import { useLoginRoleSlider } from '../hooks/useLoginRoleSlider'
import { loginRoleGuides } from '../model/loginRoleGuides'
import './loginPage.css'

const routerComponents = { navigate }

export const loginPage = () => {
  const token = useAuthStore((state) => state.token)
  const { loginForm, onSubmit } = useLoginForm()
  const emailRegistration = loginForm.register('email')
  const passwordRegistration = loginForm.register('password')
  const emailError = loginForm.formState.errors.email?.message
  const passwordError = loginForm.formState.errors.password?.message
  const {
    activeRole,
    emailInputRef,
    returnToRoles,
    selectRole,
    selectedRole,
    step,
  } = useLoginRoleSlider()

  if (token) {
    return <routerComponents.navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <componentComponents.publicHeader variant="inner" />

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 pb-16 sm:px-8">
        <div className="grid gap-10 pt-12 sm:pt-14 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,520px)] min-[900px]:items-start min-[900px]:gap-16 min-[900px]:pt-16">
          <section aria-labelledby="login-title" className="loginPage__enter">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">
              Acceso
            </p>
            <h1
              id="login-title"
              className="mt-3 max-w-[20ch] text-[clamp(30px,4.4vw,44px)] leading-[1.06]"
            >
              Entrar a la sala
            </h1>
            <p className="mt-4 max-w-[46ch] text-[13.5px] leading-[1.6] text-muted">
              Accede con la cuenta que te entregó Olimpo. Elige tu rol y el formulario se adapta
              a lo que verás al entrar; el rol real siempre lo determina tu cuenta.
            </p>
            <componentComponents.meander className="mt-8 w-[140px]" />
          </section>

          <div className="loginPage__enter loginPage__enter--2 overflow-hidden rounded-panel border border-line bg-panel">
            <div className="loginPage__slider flex w-[200%] items-stretch" data-step={step}>
              <section
                aria-hidden={step !== 'role'}
                aria-labelledby="login-role-title"
                className="w-1/2 shrink-0 p-6 sm:p-8"
                inert={step !== 'role'}
              >
                <p className="text-[11px] uppercase tracking-[0.14em] text-gold">Paso 1 de 2</p>
                <h2
                  id="login-role-title"
                  className="mt-2 text-[20px] font-semibold leading-[1.2]"
                >
                  Elige tu rol
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-[1.55] text-muted">
                  La guía ajusta el formulario. Tu cuenta decide los permisos reales.
                </p>

                <div className="mt-5 grid gap-2" role="group" aria-label="Roles de Olimpo">
                  {loginRoleGuides.map((guide) => {
                    const isSelected = guide.role === selectedRole

                    return (
                      <button
                        key={guide.role}
                        id={`login-role-${guide.role}`}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => selectRole(guide.role)}
                        className={cn(
                          'group flex items-center gap-3 rounded-control border px-3.5 py-3 text-left transition-colors',
                          isSelected ? 'border-gold' : 'border-line hover:border-line-strong',
                        )}
                      >
                        <span
                          className={cn(
                            'grid size-9 shrink-0 place-items-center rounded-control border transition-colors',
                            isSelected
                              ? 'border-gold text-gold'
                              : 'border-line text-faint group-hover:text-gold',
                          )}
                        >
                          <componentComponents.icon icon={guide.icon} size="sm" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-ink">
                            {guide.label}
                          </span>
                          <span className="mt-0.5 block text-[11.5px] text-faint">
                            {guide.summary}
                          </span>
                        </span>
                        <componentComponents.icon
                          icon={luChevronRight}
                          size="sm"
                          className="shrink-0 text-faint transition-colors group-hover:text-gold"
                        />
                      </button>
                    )
                  })}
                </div>

                <p className="mt-4 text-[11.5px] leading-[1.5] text-faint">
                  El rol real lo determina tu cuenta.
                </p>
              </section>

              <section
                aria-hidden={step !== 'credentials'}
                aria-labelledby="login-form-title"
                className="w-1/2 shrink-0 p-6 sm:p-8"
                inert={step !== 'credentials'}
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={returnToRoles}
                    className="inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-gold-strong"
                  >
                    <componentComponents.icon icon={luArrowLeft} size="sm" />
                    Cambiar rol
                  </button>
                  <span className="text-[11px] uppercase tracking-[0.12em] text-faint">
                    Paso 2 de 2
                  </span>
                </div>

                <div
                  key={activeRole.role}
                  className="loginPage__roleContext mt-4 flex items-start gap-3"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-control border border-gold text-gold">
                    <componentComponents.icon icon={activeRole.icon} size="md" />
                  </span>
                  <div className="min-w-0">
                    <h2
                      id="login-form-title"
                      className="text-[20px] font-semibold leading-[1.2]"
                    >
                      Acceso de {activeRole.label}
                    </h2>
                    <p className="mt-1 text-[12.5px] text-muted">{activeRole.summary}</p>
                  </div>
                </div>

                <form className="mt-5 grid gap-5" noValidate onSubmit={onSubmit}>
                  <componentComponents.field
                    error={emailError}
                    label="Correo electrónico"
                    htmlFor="login-email"
                  >
                    <componentComponents.input
                      {...emailRegistration}
                      ref={(element) => {
                        emailRegistration.ref(element)
                        emailInputRef.current = element
                      }}
                      aria-describedby={emailError ? 'login-email-error' : undefined}
                      aria-invalid={Boolean(emailError)}
                      autoCapitalize="none"
                      autoComplete="username"
                      icon={luMail}
                      id="login-email"
                      inputMode="email"
                      placeholder="tu@correo.com"
                      onChange={(event) => {
                        if (loginForm.getFieldState('email').error?.type === 'server') {
                          loginForm.clearErrors('email')
                        }
                        void emailRegistration.onChange(event)
                      }}
                    />
                  </componentComponents.field>
                  <componentComponents.field
                    error={passwordError}
                    label="Contraseña"
                    htmlFor="login-password"
                  >
                    <componentComponents.input
                      {...passwordRegistration}
                      aria-describedby={passwordError ? 'login-password-error' : undefined}
                      aria-invalid={Boolean(passwordError)}
                      autoComplete="current-password"
                      icon={luLockKeyhole}
                      id="login-password"
                      placeholder="Tu contraseña"
                      type="password"
                      onChange={(event) => {
                        if (loginForm.getFieldState('password').error?.type === 'server') {
                          loginForm.clearErrors('password')
                        }
                        void passwordRegistration.onChange(event)
                      }}
                    />
                  </componentComponents.field>
                  <componentComponents.button
                    className="mt-1 w-full"
                    disabled={loginForm.formState.isSubmitting}
                    icon={luArrowRight}
                    iconPosition="right"
                    type="submit"
                    variant="primary"
                  >
                    {loginForm.formState.isSubmitting ? 'Entrando…' : 'Entrar'}
                  </componentComponents.button>
                </form>

                <div
                  key={`tips-${activeRole.role}`}
                  className="loginPage__roleContext mt-5 border-t border-line pt-4"
                >
                  <p className="text-[11px] uppercase tracking-[0.1em] text-faint">
                    Al entrar verás
                  </p>
                  <ul className="mt-2 grid gap-1.5">
                    {activeRole.tips.map((tip) => (
                      <li key={tip} className="flex gap-2.5 text-[12.5px] text-muted">
                        <componentComponents.icon
                          icon={luCheck}
                          size="sm"
                          className="mt-[2px] shrink-0 text-gold"
                        />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-4 text-[11.5px] leading-[1.5] text-faint">
                  ¿Sin cuenta? El alta se realiza en recepción.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <componentComponents.siteFooter />
    </div>
  )
}
