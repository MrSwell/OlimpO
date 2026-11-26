import { describe, expect, it } from 'vitest'
import { buttonClassName } from './button'

describe('buttonClassName', () => {
  it('keeps the 36px medium height and the 28px small height', () => {
    expect(buttonClassName()).toContain('min-h-9')
    expect(buttonClassName('default', 'sm')).toContain('min-h-7')
  })

  it('uses the gold fill only for the primary variant', () => {
    expect(buttonClassName('primary')).toContain('bg-gold')
    expect(buttonClassName('default')).not.toContain('bg-gold ')
    expect(buttonClassName('quiet')).toContain('bg-transparent')
  })

  it('appends caller classes without dropping the base styles', () => {
    const className = buttonClassName('danger', 'sm', 'w-full')

    expect(className).toContain('rounded-control')
    expect(className).toContain('text-danger')
    expect(className).toContain('w-full')
  })
})
