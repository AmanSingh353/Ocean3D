import * as THREE from 'three'

const DIFFERENCE_STOPS = ['#2166ac', '#67a9cf', '#d1e5f0', '#f7f7f7', '#fddbc7', '#ef8a62', '#b2182b']
const ABS_ERROR_STOPS = ['#f7fbff', '#c6dbef', '#6baed6', '#2171b5', '#08306b']

function hexToRgb(hex: string): THREE.Color {
  return new THREE.Color(hex)
}

function interpolateStops(stops: string[], t: number): THREE.Color {
  const clamped = Math.max(0, Math.min(1, t))
  const scaled = clamped * (stops.length - 1)
  const lower = Math.floor(scaled)
  const upper = Math.min(stops.length - 1, lower + 1)
  const localT = scaled - lower
  const c0 = hexToRgb(stops[lower])
  const c1 = hexToRgb(stops[upper])
  return c0.clone().lerp(c1, localT)
}

export const MISSING_VERTEX_COLOR = new THREE.Color(0x0a1620)

/** Diverging palette for model − observation (negative → positive). */
export function differenceToColor(
  value: number,
  min: number,
  max: number,
): THREE.Color {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return MISSING_VERTEX_COLOR.clone()
  }
  const span = Math.max(Math.abs(min), Math.abs(max))
  if (span <= 0) return interpolateStops(DIFFERENCE_STOPS, 0.5)
  const normalized = (value + span) / (2 * span)
  return interpolateStops(DIFFERENCE_STOPS, normalized)
}

/** Sequential palette for |model − observation|. */
export function absoluteErrorToColor(
  value: number,
  min: number,
  max: number,
): THREE.Color {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return MISSING_VERTEX_COLOR.clone()
  }
  if (min === max) return interpolateStops(ABS_ERROR_STOPS, 0.5)
  const normalized = (value - min) / (max - min)
  return interpolateStops(ABS_ERROR_STOPS, normalized)
}

export function getDifferenceGradientCss(direction: 'vertical' | 'horizontal' = 'vertical'): string {
  const dir = direction === 'vertical' ? 'to top' : 'to right'
  return `linear-gradient(${dir}, ${DIFFERENCE_STOPS.join(', ')})`
}

export function getAbsoluteErrorGradientCss(
  direction: 'vertical' | 'horizontal' = 'vertical',
): string {
  const dir = direction === 'vertical' ? 'to top' : 'to right'
  return `linear-gradient(${dir}, ${ABS_ERROR_STOPS.join(', ')})`
}

export function formatAnalysisTick(value: number, variable: import('../types/ocean').OceanVariable): string {
  switch (variable) {
    case 'temperature':
      return value.toFixed(2)
    case 'salinity':
      return value.toFixed(3)
    case 'chlorophyll':
      return value.toFixed(4)
    case 'current':
      return value.toFixed(4)
  }
}

export function getLegendTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return []
  if (min === max) return [min]
  const ticks: number[] = []
  for (let i = 0; i < count; i++) {
    ticks.push(min + ((max - min) * i) / (count - 1))
  }
  return ticks
}

/** Symmetric ticks for diverging difference scale — always includes zero when range spans it. */
export function getDifferenceLegendTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return []
  if (min >= 0 || max <= 0) return getLegendTicks(min, max, count)
  const ticks = getLegendTicks(min, max, count)
  const mid = Math.floor(count / 2)
  ticks[mid] = 0
  return ticks
}

/** Map normalized error magnitude (0–1) to marker accent intensity. */
export function errorMagnitudeToCss(error: number, maxError: number): string {
  if (!Number.isFinite(error) || !Number.isFinite(maxError) || maxError <= 0) {
    return 'rgba(25, 188, 214, 0.35)'
  }
  const t = Math.min(1, Math.abs(error) / maxError)
  const r = Math.round(240 * t + 25 * (1 - t))
  const g = Math.round(122 * (1 - t) + 188 * (1 - t) * 0.5)
  const b = Math.round(122 * (1 - t) + 214 * (1 - t))
  return `rgba(${r}, ${g}, ${b}, ${0.35 + t * 0.45})`
}
