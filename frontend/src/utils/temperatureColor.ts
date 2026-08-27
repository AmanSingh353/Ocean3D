import * as THREE from 'three'

/** Normalized palette: 0 = cold, 1 = hot */
const PALETTE_STOPS: readonly { t: number; hex: number }[] = [
  { t: 0.0, hex: 0x0a1a4a },
  { t: 0.2, hex: 0x1565a0 },
  { t: 0.35, hex: 0x19bcd6 },
  { t: 0.5, hex: 0x3d9970 },
  { t: 0.65, hex: 0xf5c842 },
  { t: 0.8, hex: 0xe85d3a },
  { t: 1.0, hex: 0xc62828 },
]

const _scratch = new THREE.Color()

export interface TemperatureRange {
  min: number
  max: number
}

function paletteGradientStops(): string {
  return PALETTE_STOPS.map(
    ({ t, hex }) => `#${hex.toString(16).padStart(6, '0')} ${t * 100}%`,
  ).join(', ')
}

/** Horizontal gradient for the control-panel legend. */
export function getTemperatureGradientCss(
  direction: 'horizontal' | 'vertical' = 'horizontal',
): string {
  const stops = paletteGradientStops()
  return direction === 'vertical'
    ? `linear-gradient(to top, ${stops})`
    : `linear-gradient(90deg, ${stops})`
}

/** Normalize a temperature to 0 (min) … 1 (max). */
export function normalizeTemperature(
  temp: number,
  minTemp: number,
  maxTemp: number,
): number {
  const span = maxTemp - minTemp
  if (span <= 0) return 0.5
  return Math.max(0, Math.min(1, (temp - minTemp) / span))
}

/** Map a normalized value (0–1) through the oceanographic palette. */
export function normalizedToColor(
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

/** Map a temperature (°C) to a Three.js color using the given range. */
export function temperatureToColor(
  temp: number,
  minTemp: number,
  maxTemp: number,
  target = new THREE.Color(),
): THREE.Color {
  return normalizedToColor(
    normalizeTemperature(temp, minTemp, maxTemp),
    target,
  )
}

/** Legend tick values between min and max (warm → cold, top → bottom). */
export function getTemperatureLegendTicks(
  minTemp: number,
  maxTemp: number,
  count = 5,
): number[] {
  if (count < 2) return [maxTemp, minTemp]
  const ticks: number[] = []
  for (let i = 0; i < count; i++) {
    ticks.push(minTemp + ((maxTemp - minTemp) * i) / (count - 1))
  }
  return ticks.reverse()
}

export function formatTemperatureTick(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
