import { useEffect, useRef, useState } from 'react'
import { loginRoleGuides, type LoginRoleId } from '../model/loginRoleGuides'

export type LoginStep = 'role' | 'credentials'

/**
 * Owns the two-step login slider: the role step and the credentials step.
 * Selecting a role advances the slider; `returnToRoles` brings it back.
 * Focus follows the slide so keyboard users never land on an inert panel.
 */
export const useLoginRoleSlider = () => {
  const [selectedRole, setSelectedRole] = useState<LoginRoleId>('CLIENT')
  const [step, setStep] = useState<LoginStep>('role')
  const emailInputRef = useRef<HTMLInputElement>(null)
  const previousStepRef = useRef<LoginStep>('role')

  const activeRole =
    loginRoleGuides.find((guide) => guide.role === selectedRole) ?? loginRoleGuides[0]

  const selectRole = (role: LoginRoleId) => {
    setSelectedRole(role)
    setStep('credentials')
  }

  const returnToRoles = () => setStep('role')

  useEffect(() => {
    const previousStep = previousStepRef.current

    if (previousStep === step) {
      return
    }

    previousStepRef.current = step

    if (step === 'credentials') {
      emailInputRef.current?.focus({ preventScroll: true })
      return
    }

    document
      .getElementById(`login-role-${selectedRole}`)
      ?.focus({ preventScroll: true })
  }, [selectedRole, step])

  return {
    activeRole,
    emailInputRef,
    returnToRoles,
    selectRole,
    selectedRole,
    step,
  }
}
