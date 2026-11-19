/**
 * Stable color identity: derives a deterministic accent color from a seed
 * string (client name, category name…) so the same entity always gets the
 * same color without storing anything.
 */
const identityPalette = [
  '--accent-blue',
  '--accent-teal',
  '--accent-violet',
  '--accent-pink',
] as const

const hashSeed = (seed: string): number => {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash
}

/** Returns a CSS `var(...)` reference usable in `color`, `border-color`, etc. */
export const identityColorVar = (seed: string): string => {
  const palette = identityPalette[hashSeed(seed) % identityPalette.length]
  return `var(${palette})`
}
