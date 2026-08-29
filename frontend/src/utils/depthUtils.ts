import type { OceanVariable } from '../types/ocean'
import { OCEAN_DEPTHS, snapToNearestModelDepth } from '../data/depths'

/** Snap UI depth to the nearest available discrete model depth level. */
export function snapToNearestDepth(
  depth: number,
  depths: number[] = [...OCEAN_DEPTHS],
): number {
  return snapToNearestModelDepth(depth, depths)
}

/**
 * Resolve the depth parameter sent to the model field API.
 * All variables use the nearest discrete model level.
 */
export function resolveApiDepth(
  _variable: OceanVariable,
  depth: number,
  availableDepths: number[] = [...OCEAN_DEPTHS],
): number {
  return snapToNearestDepth(depth, availableDepths)
}

/** Sorted depth ticks for UI controls from API metadata. */
export function depthTicksFromMetadata(depths: number[]): number[] {
  return [...depths].sort((a, b) => a - b)
}

/** Whether the UI-selected depth differs from the nearest API model depth. */
export function isDepthSnapped(selectedDepth: number, apiDepth: number): boolean {
  return selectedDepth !== apiDepth
}
