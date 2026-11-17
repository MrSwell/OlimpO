import { LuCalendarDays as luCalendarDays } from 'react-icons/lu'
import * as componentComponents from '@/components'
import { formatDate, formatMoney } from '@/features/clients/model/clientFormatting'
import {
  paymentMethodLabels,
  type PaymentsPageResponse,
} from '@/features/clients/model/clientTypes'
import './paymentFeature.css'

interface PaymentHistoryProps {
  data: PaymentsPageResponse | undefined
  isPending: boolean
  isError: boolean
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onRetry: () => void
}

const paymentDate = (value: string): string => {
  const [date, time] = value.split('T')
  return `${formatDate(date)}${time ? ` · ${time.slice(0, 5)}` : ''}`
}

export const paymentHistory = ({
  data,
  isPending,
  isError,
  page,
  pageSize,
  onPageChange,
  onRetry,
}: PaymentHistoryProps) => {
  if (isPending) {
    return <p className="py-5 text-sm text-muted">Cargando pagos…</p>
  }

  if (isError || !data) {
    return (
      <componentComponents.emptyState
        title="No se pudieron cargar los pagos"
        description="Comprueba tu conexión e inténtalo de nuevo."
        action={
          <componentComponents.button
            variant="quiet"
            size="sm"
            onClick={onRetry}
          >
            Reintentar
          </componentComponents.button>
        }
      />
    )
  }

  if (data.content.length === 0) {
    return (
      <componentComponents.emptyState
        icon={luCalendarDays}
        title="Todavía no hay pagos"
        description="Los pagos aparecerán aquí cuando se registren."
      />
    )
  }

  return (
    <>
      <ul className="mt-2" aria-label="Historial de pagos">
        {data.content.map((payment) => (
          <li key={payment.id} className="paymentHistory__item py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="font-medium tabular-nums">{paymentDate(payment.paymentDate)}</span>
              <span className="tabular-nums">{formatMoney(payment.amount)}</span>
            </div>
            <p className="mt-1.5 text-[12.5px] text-muted">
              {paymentMethodLabels[payment.method]}
              {payment.reference ? ` · ${payment.reference}` : ''}
            </p>
          </li>
        ))}
      </ul>
      {data.totalPages > 1 && (
        <componentComponents.pagination
          page={page + 1}
          pageSize={pageSize}
          totalItems={data.totalElements}
          totalPages={data.totalPages}
          onPageChange={(nextPage) => onPageChange(nextPage - 1)}
        />
      )}
    </>
  )
}
