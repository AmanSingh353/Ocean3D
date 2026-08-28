import * as THREE from 'three'

/** MVP default range when no API field is loaded yet. */
export const CURRENT_MIN_SPEED = 0
export const CURRENT_MAX_SPEED = 1.5

/** Map current speed to cyan palette (for analysis overlays). */
export function currentToColor(value: number, min: number, max: number): THREE.Color {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return new THREE.Color(0x0a1620)
  }
  const span = max - min
  const t = span <= 0 ? 0.5 : (value - min) / span
  const c0 = new THREE.Color(0x1565a0)
  const c1 = new THREE.Color(0x19bcd6)
  const c2 = new THREE.Color(0x48d5c3)
  if (t <= 0.5) return c0.clone().lerp(c1, t * 2)
  return c1.clone().lerp(c2, (t - 0.5) * 2)
}

/** Cyan/teal gradient matching existing current vector arrows. */
export function getCurrentGradientCss(
  direction: 'horizontal' | 'vertical' = 'vertical',
): string {
  const stops = ' #48d5c3 0%, #19bcd6 50%, #1565a0 100%'
  return direction === 'vertical'
    ? `linear-gradient(to top,${stops})`
    : `linear-gradient(90deg,${stops})`
}

export function formatCurrentTick(value: number): string {
  return value.toFixed(1)
}

export function getCurrentLegendTicks(
  minSpeed = CURRENT_MIN_SPEED,
  maxSpeed = CURRENT_MAX_SPEED,
  count = 5,
): number[] {
  if (count < 2) return [maxSpeed, minSpeed]
  const ticks: number[] = []
  for (let i = 0; i < count; i++) {
    ticks.push(minSpeed + ((maxSpeed - minSpeed) * i) / (count - 1))
  }
  return ticks.reverse()
}
