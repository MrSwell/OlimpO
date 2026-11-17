import { getMembershipProgress, formatDate } from '../model/clientFormatting'
import type { MembershipResponse } from '../model/clientTypes'

interface MembershipProgressProps {
  membership: MembershipResponse
}

const progressMessage = (progress: ReturnType<typeof getMembershipProgress>): string => {
  if (progress.state === 'upcoming') {
    return progress.daysUntilStart === 1
      ? 'Empieza mañana'
      : `Empieza en ${progress.daysUntilStart} días`
  }
  if (progress.state === 'expired') {
    return progress.daysOverdue === 1
      ? 'Venció hace 1 día'
      : `Venció hace ${progress.daysOverdue} días`
  }
  if (progress.daysRemaining === 0) return 'Vence hoy'
  return progress.daysRemaining === 1
    ? 'Queda 1 día'
    : `Quedan ${progress.daysRemaining} días`
}

export const membershipProgress = ({ membership }: MembershipProgressProps) => {
  const progress = getMembershipProgress(membership.startDate, membership.endDate)

  return (
    <div className="clientFeature__membershipProgress">
      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
        <div>
          <p className="text-[12px] text-muted">Tiempo restante</p>
          <p className="clientFeature__remainingTime mt-1 text-ink">
            {progressMessage(progress)}
          </p>
        </div>
        <div className="text-left min-[520px]:text-right">
          <p className="text-[12px] text-muted">Fecha de vencimiento</p>
          <p className="mt-1 text-[13px] font-medium text-ink">
            {formatDate(membership.endDate)}
          </p>
        </div>
      </div>
      <div
        className="clientFeature__progressTrack mt-3"
        role="progressbar"
        aria-label="Tiempo restante de la membresía"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percentageRemaining}
        aria-valuetext={progressMessage(progress)}
      >
        <span
          className="clientFeature__progressFill"
          data-state={progress.state}
          style={{ width: `${progress.percentageRemaining}%` }}
        />
      </div>
      {progress.state === 'upcoming' && (
        <p className="mt-2 text-[11.5px] text-faint">El periodo aún no comienza.</p>
      )}
    </div>
  )
}
