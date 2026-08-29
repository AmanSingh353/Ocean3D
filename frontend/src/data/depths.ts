/** Supported model depth levels (m). Mirrors backend DEPTHS. */
export const OCEAN_DEPTHS = [0, 50, 100, 200, 500, 1000] as const

export type OceanDepth = (typeof OCEAN_DEPTHS)[number]

/** Snap a UI depth to the nearest discrete model level. */
export function snapToNearestModelDepth(
  depth: number,
  depths: readonly number[] = OCEAN_DEPTHS,
): number {
  if (depths.length === 0) return depth
  return depths.reduce((closest, candidate) =>
    Math.abs(candidate - depth) < Math.abs(closest - depth) ? candidate : closest,
  )
}

/** Sorted depth ticks for sliders and scale overlays. */
export function oceanDepthTicks(depths: readonly number[] = OCEAN_DEPTHS): number[] {
  return [...depths].sort((a, b) => a - b)
}
