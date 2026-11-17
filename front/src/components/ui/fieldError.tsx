import { LuCircleAlert as luCircleAlert } from 'react-icons/lu'
import * as iconComponents from './icon'

interface FieldErrorProps {
  id?: string
  message: string
}

export const fieldError = ({ id, message }: FieldErrorProps) => {
  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-1.5 text-[11.5px] leading-5 text-danger"
    >
      <iconComponents.icon icon={luCircleAlert} size="sm" className="mt-0.5" />
      <span>{message}</span>
    </p>
  )
}
