import * as THREE from 'three'

/** Normalized palette: 0 = low salinity (fresh), 1 = high salinity (saltier) */
const PALETTE_STOPS: readonly { t: number; hex: number }[] = [
  { t: 0.0, hex: 0x2d1b69 },
  { t: 0.2, hex: 0x4a3f8c },
  { t: 0.35, hex: 0x3d7ab8 },
  { t: 0.5, hex: 0x2a9d8f },
  { t: 0.65, hex: 0x6abf69 },
  { t: 0.8, hex: 0xe9c46a },
  { t: 1.0, hex: 0xd4a017 },
]

const _scratch = new THREE.Color()

export interface SalinityRange {
  min: number
  max: number
}

export const SALINITY_MIN_PSU = 30
export const SALINITY_MAX_PSU = 37

function paletteGradientStops(): string {
  return PALETTE_STOPS.map(
    ({ t, hex }) => `#${hex.toString(16).padStart(6, '0')} ${t * 100}%`,
  ).join(', ')
}

export function getSalinityGradientCss(
  direction: 'horizontal' | 'vertical' = 'horizontal',
): string {
  const stops = paletteGradientStops()
  return direction === 'vertical'
    ? `linear-gradient(to top, ${stops})`
    : `linear-gradient(90deg, ${stops})`
}

export function normalizeSalinity(
  salinity: number,
  minPsu: number,
  maxPsu: number,
): number {
  const span = maxPsu - minPsu
  if (span <= 0) return 0.5
  return Math.max(0, Math.min(1, (salinity - minPsu) / span))
}

export function normalizedSalinityToColor(
  normalized: number,
  target = new THREE.Color(),
): THREE.Color {
  const t = Math.max(0, Math.min(1, normalized))

  if (t <= PALETTE_STOPS[0].t) {
    return target.setHex(PALETTE_STOPS[0].hex)
  }

  for (let i = 0; i < PALETTE_STOPS.length - 1; i++) {
    const lower = PALETTE_STOPS[i]
    const upper = PALETTE_STOPS[i + 1]
    if (t <= upper.t) {
      const localT = (t - lower.t) / (upper.t - lower.t)
      _scratch.setHex(lower.hex)
      target.setHex(upper.hex)
      return target.lerp(_scratch, 1 - localT)
    }
  }

  return target.setHex(PALETTE_STOPS[PALETTE_STOPS.length - 1].hex)
}

export function salinityToColor(
  salinity: number,
  minPsu: number,
  maxPsu: number,
  target = new THREE.Color(),
): THREE.Color {
  return normalizedSalinityToColor(
    normalizeSalinity(salinity, minPsu, maxPsu),
    target,
  )
}

export function getSalinityLegendTicks(
  minPsu: number,
  maxPsu: number,
  count = 5,
): number[] {
  if (count < 2) return [maxPsu, minPsu]
  const ticks: number[] = []
  for (let i = 0; i < count; i++) {
    ticks.push(minPsu + ((maxPsu - minPsu) * i) / (count - 1))
  }
  return ticks.reverse()
}

export function formatSalinityTick(value: number): string {
  return value.toFixed(1)
}
