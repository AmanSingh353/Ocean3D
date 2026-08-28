import type { DepthMatchKind } from '../types/ocean'

export interface DepthSamplePair {
  depth: number
  model: number
  observation: number
}

export interface DepthSampleResult {
  model: number
  observation: number
  depthMatch: DepthMatchKind
}

/** Linear interpolation at depth using matched profile levels only. */
export function sampleAtDepth(
  pairs: DepthSamplePair[],
  depth: number,
): DepthSampleResult | null {
  if (pairs.length === 0) return null

  const sorted = [...pairs].sort((a, b) => a.depth - b.depth)
  const exact = sorted.find((p) => p.depth === depth)
  if (exact) {
    return { model: exact.model, observation: exact.observation, depthMatch: 'exact' }
  }

  if (depth < sorted[0].depth || depth > sorted[sorted.length - 1].depth) {
    return null
  }

  let lower = sorted[0]
  let upper = sorted[sorted.length - 1]

  for (let i = 0; i < sorted.length - 1; i++) {
    if (depth >= sorted[i].depth && depth <= sorted[i + 1].depth) {
      lower = sorted[i]
      upper = sorted[i + 1]
      break
    }
  }

  const span = upper.depth - lower.depth
  if (span <= 0) return null

  const t = (depth - lower.depth) / span
  return {
    model: lower.model + t * (upper.model - lower.model),
    observation: lower.observation + t * (upper.observation - lower.observation),
    depthMatch: 'interpolated',
  }
}
