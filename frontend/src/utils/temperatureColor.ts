import * as THREE from 'three'

/** Fixed visualization range — do not auto-rescale per API response. */
export const MIN_TEMP = 8
export const MAX_TEMP = 31

export const TEMP_LEGEND_TICKS = [8, 12, 16, 20, 24, 28, 31] as const

const TEMP_COLOR_STOPS: readonly { temp: number; hex: number }[] = [
  { temp: 8, hex: 0x0a1a4a }, // dark/cool blue
  { temp: 12, hex: 0x1565a0 }, // blue
  { temp: 16, hex: 0x19bcd6 }, // cyan
  { temp: 20, hex: 0x3d9970 }, // green
  { temp: 24, hex: 0xf5c842 }, // yellow
  { temp: 28, hex: 0xe85d3a }, // orange
  { temp: 31, hex: 0xc62828 }, // red
]

const _scratch = new THREE.Color()

/**
 * Map a temperature (°C) to a deterministic Three.js color using the fixed palette.
 */
export function temperatureToColor(
  temp: number,
  target = new THREE.Color(),
): THREE.Color {
  const clamped = Math.max(MIN_TEMP, Math.min(MAX_TEMP, temp))

  if (clamped <= TEMP_COLOR_STOPS[0].temp) {
    return target.setHex(TEMP_COLOR_STOPS[0].hex)
  }

  for (let i = 0; i < TEMP_COLOR_STOPS.length - 1; i++) {
    const lower = TEMP_COLOR_STOPS[i]
    const upper = TEMP_COLOR_STOPS[i + 1]
    if (clamped <= upper.temp) {
      const t = (clamped - lower.temp) / (upper.temp - lower.temp)
      _scratch.setHex(lower.hex)
      target.setHex(upper.hex)
      return target.lerp(_scratch, 1 - t)
    }
  }

  return target.setHex(TEMP_COLOR_STOPS[TEMP_COLOR_STOPS.length - 1].hex)
}

/** CSS linear-gradient stops aligned with TEMP_COLOR_STOPS (for the control-panel legend). */
export const TEMP_GRADIENT_CSS = `linear-gradient(90deg, ${TEMP_COLOR_STOPS.map(
  ({ temp, hex }) => `#${hex.toString(16).padStart(6, '0')} ${((temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * 100}%`,
).join(', ')})`
