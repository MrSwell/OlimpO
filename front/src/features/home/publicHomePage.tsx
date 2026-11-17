// The frontend naming contract requires lower camelCase for React components.
/* oxlint-disable react/rules-of-hooks */
import { memo, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { useLocation } from 'react-router'
import {
  LuActivity as luActivity,
  LuArrowDown as luArrowDown,
  LuArrowRight as luArrowRight,
  LuColumns3 as luColumns3,
  LuDumbbell as luDumbbell,
  LuUsersRound as luUsersRound,
  LuWandSparkles as luWandSparkles,
} from 'react-icons/lu'
import * as publicHeaderComponents from '@/components/layout/publicHeader'
import * as iconComponents from '@/components/ui/icon'
import * as meanderComponents from '@/components/ui/meander'
import './publicHomePage.css'

const serviceSamples = [
  {
    serviceIcon: luDumbbell,
    serviceTitle: 'Entrenamiento libre',
    serviceDescription: 'Ejemplo de servicio; confirmar acceso y disponibilidad con Olimpo.',
  },
  {
    serviceIcon: luUsersRound,
    serviceTitle: 'Acompañamiento profesional',
    serviceDescription: 'Ejemplo de servicio; validar el alcance antes de publicarlo.',
  },
  {
    serviceIcon: luWandSparkles,
    serviceTitle: 'Rutinas de entrenamiento',
    serviceDescription: 'Ejemplo de servicio; confirmar condiciones y disponibilidad.',
  },
]

const samplePlans = [
  {
    planIcon: luColumns3,
    planName: 'Esencial',
    planTerm: 'Mensual · muestra',
    planPrice: '$ 99.000 COP',
  },
  {
    planIcon: luDumbbell,
    planName: 'Continuo',
    planTerm: 'Trimestral · muestra',
    planPrice: '$ 259.000 COP',
  },
  {
    planIcon: luActivity,
    planName: 'Flexible',
    planTerm: 'Mensual · muestra',
    planPrice: '$ 39.000 COP',
  },
  {
    planIcon: luUsersRound,
    planName: 'Integral',
    planTerm: 'Semestral · muestra',
    planPrice: '$ 499.000 COP',
  },
]

type CardTiltPrefix = 'serviceCard' | 'membershipCard'

const updateCardTilt = (
  event: ReactPointerEvent<HTMLElement>,
  cardTiltPrefix: CardTiltPrefix,
  rotationStrength: number,
) => {
  if (event.pointerType !== 'mouse') {
    return
  }

  const cardBounds = event.currentTarget.getBoundingClientRect()
  const horizontalOffset =
    (cardBounds.left + cardBounds.width / 2 - event.clientX) / cardBounds.width
  const verticalOffset =
    (event.clientY - cardBounds.top - cardBounds.height / 2) / cardBounds.height

  event.currentTarget.style.setProperty(
    `--${cardTiltPrefix}RotateX`,
    `${(verticalOffset * rotationStrength).toFixed(2)}deg`,
  )
  event.currentTarget.style.setProperty(
    `--${cardTiltPrefix}RotateY`,
    `${(horizontalOffset * rotationStrength).toFixed(2)}deg`,
  )
}

const resetCardTilt = (event: ReactPointerEvent<HTMLElement>, cardTiltPrefix: CardTiltPrefix) => {
  event.currentTarget.style.setProperty(`--${cardTiltPrefix}RotateX`, '0deg')
  event.currentTarget.style.setProperty(`--${cardTiltPrefix}RotateY`, '0deg')
}

const trainingRoute = () => {
  return (
    <ol
      className="homePage__route relative grid min-h-[356px] content-between py-2 pl-[38px] max-[900px]:min-h-[320px] max-[640px]:min-h-[270px]"
      aria-label="Recorrido sugerido por la página"
    >
      <li className="homePage__routeStop relative grid grid-cols-[30px_1fr] items-start gap-3">
        <span className="relative grid h-4 w-4 place-items-center rounded-full border border-gold bg-bg text-[9px] leading-none text-gold-strong tabular-nums">
          01
        </span>
        <div>
          <a className="inline-block font-serif text-[clamp(20px,2.2vw,25px)] leading-[1.25] hover:text-gold-strong" href="#about">
            Conocer Olimpo
          </a>
          <p className="mt-1 text-xs text-faint">La propuesta y sus principios</p>
        </div>
      </li>
      <li className="homePage__routeStop relative grid grid-cols-[30px_1fr] items-start gap-3">
        <span className="relative grid h-4 w-4 place-items-center rounded-full border border-gold bg-bg text-[9px] leading-none text-gold-strong tabular-nums">
          02
        </span>
        <div>
          <a className="inline-block font-serif text-[clamp(20px,2.2vw,25px)] leading-[1.25] hover:text-gold-strong" href="#services">
            Explorar servicios
          </a>
          <p className="mt-1 text-xs text-faint">Opciones de muestra por validar</p>
        </div>
      </li>
      <li className="homePage__routeStop relative grid grid-cols-[30px_1fr] items-start gap-3">
        <span className="relative grid h-4 w-4 place-items-center rounded-full border border-gold bg-bg text-[9px] leading-none text-gold-strong tabular-nums">
          03
        </span>
        <div>
          <a className="inline-block font-serif text-[clamp(20px,2.2vw,25px)] leading-[1.25] hover:text-gold-strong" href="#pricing">
            Revisar planes
          </a>
          <p className="mt-1 text-xs text-faint">Tarifas ilustrativas, no vigentes</p>
        </div>
      </li>
    </ol>
  )
}

const homeComponents = { trainingRoute }

export const publicHomePage = memo(() => {
  const homePageRef = useRef<HTMLElement>(null)
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) {
      return
    }

    const target = document.getElementById(location.hash.slice(1))
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    target?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [location.hash])

  useEffect(() => {
    const homePageElement = homePageRef.current
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!homePageElement || prefersReducedMotion || !('IntersectionObserver' in window)) {
      return
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return
          }

          entry.target.classList.add('homePage__reveal--visible')
          revealObserver.unobserve(entry.target)
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -32px 0px' },
    )
    const revealSections = homePageElement.querySelectorAll<HTMLElement>('[data-home-reveal]')

    revealSections.forEach((section) => {
      section.classList.add('homePage__reveal--armed')
      revealObserver.observe(section)
    })

    return () => revealObserver.disconnect()
  }, [])

  return (
    <div className="min-h-screen scroll-smooth bg-bg text-ink motion-reduce:scroll-auto">
      <publicHeaderComponents.publicHeader />

      <main
        className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] sm:w-[calc(100%-4rem)]"
        ref={homePageRef}
      >
        <section
          className="grid min-h-[min(760px,calc(100svh-72px))] grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] items-center gap-[clamp(56px,8vw,116px)] py-[74px] pb-24 max-[900px]:min-h-[680px] max-[900px]:grid-cols-[minmax(0,1fr)_minmax(230px,0.8fr)] max-[900px]:gap-[42px] max-[900px]:py-[62px] max-[900px]:pb-[82px] max-[640px]:min-h-0 max-[640px]:grid-cols-1 max-[640px]:gap-14 max-[640px]:py-[82px] max-[640px]:pb-[76px]"
          aria-labelledby="home-title"
        >
          <div className="homePage__heroCopy">
            <h1
              className="max-w-[720px] font-serif text-[clamp(48px,6.4vw,88px)] font-normal leading-[0.99] tracking-[-0.035em] max-[640px]:text-[clamp(48px,13vw,68px)]"
              id="home-title"
            >
              Entrena en un lugar que te acompaña.
            </h1>
            <p className="mt-[25px] max-w-[54ch] text-[clamp(15px,1.5vw,18px)] leading-[1.7] text-muted">
              Un ambiente familiar, práctico y profesional. Máquinas de alto nivel y apoyo
              profesional para acompañar tu entrenamiento.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 max-[640px]:items-start max-[640px]:flex-col">
              <a
                className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-control border border-gold px-[17px] text-[13px] font-medium leading-[1.3] text-gold-strong transition-colors hover:text-ink"
                href="#services"
              >
                Explorar servicios
                <iconComponents.icon icon={luArrowRight} size="sm" />
              </a>
              <a
                className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-control border border-line-strong px-[17px] text-[13px] font-medium leading-[1.3] text-ink transition-colors hover:border-gold hover:text-gold-strong"
                href="#pricing"
              >
                Ver planes de muestra
                <iconComponents.icon icon={luArrowDown} size="sm" />
              </a>
            </div>
          </div>

          <homeComponents.trainingRoute />
        </section>

        <section
          className="homePage__reveal homePage__reveal--about grid scroll-mt-[92px] grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] items-center gap-[clamp(48px,8vw,120px)] border-t border-line py-[clamp(78px,10vw,128px)] max-[900px]:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)] max-[900px]:gap-10 max-[640px]:grid-cols-1 max-[640px]:gap-9 max-[640px]:py-[78px]"
          id="about"
          data-home-reveal
        >
          <div>
            <h2 className="max-w-[740px] font-serif text-[clamp(36px,4.6vw,60px)] font-normal leading-[1.06] tracking-[-0.025em]">
              Sobre Olimpo
            </h2>
            <p className="mt-6 max-w-[620px] text-[clamp(17px,2vw,22px)] leading-[1.5]">
              Un gimnasio para entrenar a tu ritmo, con un ambiente cercano y apoyo profesional.
            </p>
            <p className="mt-[17px] max-w-[66ch] text-sm leading-[1.75] text-muted">
              La propuesta de Olimpo combina un entorno familiar y práctico, máquinas de alto
              nivel y acompañamiento profesional. Una forma clara y bien gestionada de hacer
              espacio para el entrenamiento.
            </p>
          </div>

          <ul className="m-0 list-none p-0" aria-label="Principios de Olimpo">
            <li className="flex min-h-16 items-center gap-[15px] border-b border-line text-sm first:border-t first:border-line">
              <iconComponents.icon className="text-gold" icon={luUsersRound} size="md" />
              <span>Ambiente familiar</span>
            </li>
            <li className="flex min-h-16 items-center gap-[15px] border-b border-line text-sm">
              <iconComponents.icon className="text-gold" icon={luDumbbell} size="md" />
              <span>Máquinas de alto nivel</span>
            </li>
            <li className="flex min-h-16 items-center gap-[15px] border-b border-line text-sm">
              <iconComponents.icon className="text-gold" icon={luWandSparkles} size="md" />
              <span>Apoyo profesional</span>
            </li>
          </ul>
        </section>

        <section
          className="homePage__reveal homePage__reveal--services scroll-mt-[92px] border-t border-line py-[clamp(78px,10vw,128px)] max-[640px]:py-[78px]"
          id="services"
          aria-labelledby="services-title"
          data-home-reveal
        >
          <div className="flex items-end justify-between gap-9 max-[900px]:items-start max-[900px]:flex-col max-[900px]:gap-5">
            <div>
              <h2
                className="max-w-[740px] font-serif text-[clamp(36px,4.6vw,60px)] font-normal leading-[1.06] tracking-[-0.025em]"
                id="services-title"
              >
                Servicios para construir tu rutina.
              </h2>
              <p className="mt-4 max-w-[66ch] text-sm leading-[1.75] text-muted">
                Una guía inicial para explorar opciones de entrenamiento.
              </p>
            </div>
            <p className="max-w-[270px] border border-line-strong px-3 py-[9px] text-[11px] leading-[1.5] text-muted max-[900px]:max-w-none">
              Muestra de catálogo · confirmar antes de publicar
            </p>
          </div>

          <ul className="mt-10 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3 max-[640px]:mt-[30px]">
            {serviceSamples.map(({ serviceIcon, serviceTitle, serviceDescription }) => (
              <li className="homePage__serviceCardEntrance min-w-0" key={serviceTitle}>
                <article
                  className="homePage__serviceCard relative flex h-full min-h-[280px] flex-col rounded-panel border border-line bg-panel p-6"
                  onPointerMove={(event) => updateCardTilt(event, 'serviceCard', 10)}
                  onPointerLeave={(event) => resetCardTilt(event, 'serviceCard')}
                >
                  <div className="homePage__serviceIcon relative z-10 grid size-14 place-items-center border border-line-strong bg-bg text-gold">
                    <iconComponents.icon icon={serviceIcon} size="lg" />
                  </div>
                  <h3 className="homePage__serviceTitle relative z-10 mt-8 font-serif text-[26px] font-normal leading-tight">
                    {serviceTitle}
                  </h3>
                  <p className="homePage__serviceDescription relative z-10 mt-3 max-w-[42ch] text-[13px] leading-[1.65] text-muted">
                    {serviceDescription}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="homePage__reveal homePage__reveal--pricing scroll-mt-[92px] border-t border-line py-[clamp(78px,10vw,128px)] max-[640px]:py-[78px]"
          id="pricing"
          aria-labelledby="pricing-title"
          data-home-reveal
        >
          <div>
            <h2
              className="max-w-[740px] font-serif text-[clamp(36px,4.6vw,60px)] font-normal leading-[1.06] tracking-[-0.025em]"
              id="pricing-title"
            >
              Encuentra un plan a tu medida.
            </h2>
            <p className="mt-4 max-w-[66ch] text-sm leading-[1.75] text-muted">
              Compara la estructura de planes antes de consultar la oferta real.
            </p>
            <meanderComponents.meander className="homePage__pricingMeander mt-7 w-32" />
          </div>

          <p
            className="mt-[38px] border border-line-strong px-4 py-[14px] text-xs leading-[1.6] text-gold-strong"
            role="note"
          >
            Precios de muestra · No son una oferta vigente. Confirma con Olimpo los valores,
            vigencias y condiciones antes de tomar una decisión.
          </p>

          <ul
            className="mt-6 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4"
            aria-label="Planes de membresía de muestra"
          >
            {samplePlans.map(({ planIcon, planName, planTerm, planPrice }) => (
              <li className="homePage__membershipCardEntrance relative min-w-0" key={planName}>
                <article
                  className="homePage__membershipCard relative flex h-full min-h-[280px] flex-col rounded-panel border border-line bg-panel p-6"
                  onPointerMove={(event) => updateCardTilt(event, 'membershipCard', 9)}
                  onPointerLeave={(event) => resetCardTilt(event, 'membershipCard')}
                >
                  <div className="homePage__membershipHeading relative z-10 flex items-center gap-3">
                    <iconComponents.icon
                      className="homePage__membershipIcon text-gold"
                      icon={planIcon}
                      size="lg"
                    />
                    <h3 className="font-serif text-[26px] font-normal">
                      {planName}
                    </h3>
                  </div>
                  <div className="homePage__membershipPriceBlock relative z-10 mt-9">
                    <p className="text-[10px] tracking-[0.11em] text-faint uppercase">
                      Valor ilustrativo
                    </p>
                    <p className="mt-1 whitespace-nowrap font-serif text-[clamp(22px,2vw,30px)] leading-tight tabular-nums text-gold-strong">
                      {planPrice}
                    </p>
                  </div>
                  <div className="homePage__membershipTerm mt-auto flex items-start justify-between gap-4 border-t border-line pt-4 text-xs">
                    <span className="text-faint">Vigencia ilustrativa</span>
                    <span className="text-right text-ink">{planTerm}</span>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          <div className="mt-[22px] flex items-center justify-between gap-5 text-xs text-faint max-[640px]:items-start max-[640px]:flex-col">
            <p>Los valores son solo una referencia de diseño y deben reemplazarse por tarifas aprobadas.</p>
            <a className="inline-flex flex-none items-center gap-2 text-ink hover:text-gold-strong" href="#services">
              Volver a servicios
              <iconComponents.icon icon={luArrowRight} size="sm" />
            </a>
          </div>
        </section>

        <section
          className="homePage__reveal homePage__reveal--closing flex items-end justify-between gap-8 border-t border-line py-16 pb-[78px] max-[640px]:items-start max-[640px]:flex-col"
          data-home-reveal
          aria-labelledby="closing-title"
        >
          <div>
            <h2
              className="max-w-[620px] font-serif text-[clamp(30px,4vw,46px)] font-normal leading-[1.12] tracking-[-0.02em]"
              id="closing-title"
            >
              Tu próximo paso empieza con información clara.
            </h2>
            <p className="mt-3.5 max-w-[60ch] text-sm leading-[1.65] text-muted">
              Explora la propuesta de Olimpo y revisa los detalles confirmados antes de elegir.
            </p>
          </div>
          <a
            className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-control border border-gold px-[17px] text-[13px] font-medium leading-[1.3] text-gold-strong transition-colors hover:text-ink"
            href="#home-title"
          >
            Volver al inicio
            <iconComponents.icon icon={luArrowRight} size="sm" />
          </a>
        </section>
      </main>

      <footer className="mx-auto flex min-h-[70px] w-[calc(100%-2.5rem)] max-w-[1180px] items-center gap-[18px] border-t border-line text-xs text-faint sm:w-[calc(100%-4rem)] max-[640px]:gap-3">
        <meanderComponents.meander className="w-[84px] max-[640px]:w-12" />
        <span>Olimpo · Entrenamiento y gestión</span>
        <a className="ml-auto transition-colors hover:text-gold-strong" href="#home-title">
          Volver arriba
        </a>
      </footer>
    </div>
  )
})
