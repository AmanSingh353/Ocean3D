import type { OceanVariable } from '../types/ocean'
import { DEFAULT_DEPTHS } from '../data/defaults'

/** Snap UI depth to the nearest available discrete model depth level. */
export function snapToNearestDepth(depth: number, depths: number[] = [...DEFAULT_DEPTHS]): number {
  if (depths.length === 0) return depth
  return depths.reduce((closest, candidate) =>
    Math.abs(candidate - depth) < Math.abs(closest - depth) ? candidate : closest,
  )
}

/**
 * Resolve the depth parameter sent to the model field API.
 * Temperature requires discrete levels; other variables accept any integer in range.
 */
export function resolveApiDepth(
  variable: OceanVariable,
  depth: number,
  availableDepths: number[] = [...DEFAULT_DEPTHS],
): number {
  const maxDepth = availableDepths.length > 0 ? Math.max(...availableDepths) : 1000
  if (variable === 'temperature') {
    return snapToNearestDepth(depth, availableDepths)
  }
  return Math.max(0, Math.min(maxDepth, Math.round(depth)))
}

/** Sorted depth ticks for UI controls from API metadata. */
export function depthTicksFromMetadata(depths: number[]): number[] {
  return [...depths].sort((a, b) => a - b)
}

/** Whether the UI-selected depth differs from the API model depth for this variable. */
export function isDepthSnapped(
  variable: OceanVariable,
  selectedDepth: number,
  apiDepth: number,
): boolean {
  return variable === 'temperature' && selectedDepth !== apiDepth
}
