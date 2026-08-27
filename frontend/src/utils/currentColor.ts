/** MVP synthetic current speed range (frontend ArrowHelper field). */
export const CURRENT_MIN_SPEED = 0
export const CURRENT_MAX_SPEED = 1.5

export const CURRENT_LEGEND_TICKS = [0, 0.5, 1.0, 1.5] as const

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
  min = CURRENT_MIN_SPEED,
  max = CURRENT_MAX_SPEED,
): number[] {
  return CURRENT_LEGEND_TICKS.filter((t) => t >= min && t <= max).slice().reverse()
}
