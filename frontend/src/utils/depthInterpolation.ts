/** Find the pair of discrete model/profile levels that bracket a target depth. */
export function getBracketingLevels(
  depth: number,
  levels: readonly number[],
): { lower: number; upper: number } | null {
  if (levels.length === 0) return null
  const sorted = [...levels].sort((a, b) => a - b)
  if (depth < sorted[0] || depth > sorted[sorted.length - 1]) return null
  const exact = sorted.find((d) => d === depth)
  if (exact != null) return { lower: exact, upper: exact }
  for (let i = 0; i < sorted.length - 1; i++) {
    if (depth >= sorted[i] && depth <= sorted[i + 1]) {
      return { lower: sorted[i], upper: sorted[i + 1] }
    }
  }
  return null
}

/** Map a depth (m) to a 0–100% vertical position between surface (0) and max depth. */
export function depthToVerticalPercent(
  depth: number,
  levels: readonly number[],
): number {
  if (levels.length === 0) return 0
  const sorted = [...levels].sort((a, b) => a - b)
  const maxDepth = sorted[sorted.length - 1]
  if (depth <= sorted[0]) return 0
  if (depth >= maxDepth) return 100

  for (let i = 0; i < sorted.length - 1; i++) {
    const lo = sorted[i]
    const hi = sorted[i + 1]
    if (depth >= lo && depth <= hi) {
      const t = (depth - lo) / (hi - lo)
      const idx = i + t
      return (idx / (sorted.length - 1)) * 100
    }
  }
  return (depth / maxDepth) * 100
}

/** In a depth-down chart, return the Y position % from the top (0 = surface). */
export function depthToChartTopPercent(
  depth: number,
  levels: readonly number[],
): number {
  return 100 - depthToVerticalPercent(depth, levels)
}
