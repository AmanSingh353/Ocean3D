import * as THREE from 'three'

/** Normalized palette: 0 = low chlorophyll, 1 = high chlorophyll (oceanographic) */
const PALETTE_STOPS: readonly { t: number; hex: number }[] = [
  { t: 0.0, hex: 0x0a1a3a },
  { t: 0.2, hex: 0x1a5276 },
  { t: 0.35, hex: 0x1e8449 },
  { t: 0.5, hex: 0x52be80 },
  { t: 0.65, hex: 0xf4d03f },
  { t: 0.8, hex: 0xe67e22 },
  { t: 1.0, hex: 0xc0392b },
]

const _scratch = new THREE.Color()

export interface ChlorophyllRange {
  min: number
  max: number
}

function paletteGradientStops(): string {
  return PALETTE_STOPS.map(
    ({ t, hex }) => `#${hex.toString(16).padStart(6, '0')} ${t * 100}%`,
  ).join(', ')
}

export function getChlorophyllGradientCss(
  direction: 'horizontal' | 'vertical' = 'horizontal',
): string {
  const stops = paletteGradientStops()
  return direction === 'vertical'
    ? `linear-gradient(to top, ${stops})`
    : `linear-gradient(90deg, ${stops})`
}

export function normalizeChlorophyll(
  value: number,
  minVal: number,
  maxVal: number,
): number {
  const span = maxVal - minVal
  if (span <= 0) return 0.5
  return Math.max(0, Math.min(1, (value - minVal) / span))
}

export function normalizedChlorophyllToColor(
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

export function chlorophyllToColor(
  value: number,
  minVal: number,
  maxVal: number,
  target = new THREE.Color(),
): THREE.Color {
  return normalizedChlorophyllToColor(
    normalizeChlorophyll(value, minVal, maxVal),
    target,
  )
}

export function getChlorophyllLegendTicks(
  minVal: number,
  maxVal: number,
  count = 5,
): number[] {
  if (count < 2) return [maxVal, minVal]
  const ticks: number[] = []
  for (let i = 0; i < count; i++) {
    ticks.push(minVal + ((maxVal - minVal) * i) / (count - 1))
  }
  return ticks.reverse()
}

export function formatChlorophyllTick(value: number): string {
  if (value >= 1) return value.toFixed(1)
  if (value >= 0.1) return value.toFixed(2)
  return value.toFixed(3)
}
