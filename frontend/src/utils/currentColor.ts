/** MVP default range when no API field is loaded yet. */
export const CURRENT_MIN_SPEED = 0
export const CURRENT_MAX_SPEED = 1.5

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
