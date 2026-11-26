/* oxlint-disable react/rules-of-hooks */
import { useEffect, useState } from 'react'
import { LuShieldCheck as luShieldCheck } from 'react-icons/lu'
import * as componentComponents from '@/components'
import { useUserRolesAction } from '../hooks/useUserRolesAction'
import {
  staffRoleHints,
  staffRoleLabels,
  staffRoles,
  type StaffRole,
  type UserResponse,
} from '../model/userTypes'
import './userFeature.css'

interface UserRolesDialogProps {
  open: boolean
  user: UserResponse | null
  onClose: () => void
}

const staffRolesOf = (user: UserResponse | null): StaffRole[] =>
  user
    ? user.roles.filter((role): role is StaffRole =>
        staffRoles.includes(role as StaffRole),
      )
    : []

export const userRolesDialog = ({ open, user, onClose }: UserRolesDialogProps) => {
  const [selected, setSelected] = useState<StaffRole[]>(() => staffRolesOf(user))
  const { save, isSaving } = useUserRolesAction({ onSaved: onClose })

  useEffect(() => {
    if (open) setSelected(staffRolesOf(user))
  }, [open, user])

  const toggle = (role: StaffRole) => {
    setSelected((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    )
  }

  const hasChanges =
    selected.length !== staffRolesOf(user).length ||
    selected.some((role) => !staffRolesOf(user).includes(role))

  return (
    <componentComponents.modal
      open={open}
      onClose={onClose}
      title="Editar roles"
      icon={luShieldCheck}
      footer={
        <>
          <componentComponents.button
            variant="quiet"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </componentComponents.button>
          <componentComponents.button
            variant="primary"
            size="sm"
            onClick={() => {
              if (user && selected.length > 0) save(user.id, selected)
            }}
            disabled={isSaving || selected.length === 0 || !hasChanges}
          >
            {isSaving ? 'Guardando…' : 'Guardar roles'}
          </componentComponents.button>
        </>
      }
    >
      <p className="userFeature__dialogLede">
        {user ? (
          <>
            Ajusta los permisos de <strong>{user.firstName} {user.lastName}</strong>{' '}
            <span className="userFeature__dialogEmail">({user.email})</span>.
          </>
        ) : (
          'Selecciona un usuario para editar sus roles.'
        )}
      </p>

      <div className="userFeature__roleOptions" role="group" aria-label="Roles del usuario">
        {staffRoles.map((role) => (
          <label key={role} className="userFeature__roleOption">
            <input
              type="checkbox"
              value={role}
              checked={selected.includes(role)}
              onChange={() => toggle(role)}
              disabled={isSaving}
            />
            <span className="userFeature__roleOptionBody">
              <span className="userFeature__roleOptionName">{staffRoleLabels[role]}</span>
              <span className="userFeature__roleOptionHint">{staffRoleHints[role]}</span>
            </span>
          </label>
        ))}
      </div>

      {selected.length === 0 && (
        <p className="userFeature__fieldError" role="alert">
          Todo usuario debe conservar al menos un rol.
        </p>
      )}

      <p className="userFeature__roleNote">
        El perfil de entrenador se crea automáticamente al asignar el rol Entrenador.
      </p>
    </componentComponents.modal>
  )
}
