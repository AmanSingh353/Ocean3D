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
  /** Profile/model levels used for interpolation (equal when exact match). */
  bracketLower: number
  bracketUpper: number
}

/** Reason code when sampling fails. */
export type DepthSampleFailure =
  | 'no_pairs'
  | 'below_range'
  | 'above_range'
  | 'invalid_span'

export interface DepthSampleOutcome {
  result: DepthSampleResult | null
  failure: DepthSampleFailure | null
}

/** Linear interpolation at depth using matched profile levels only. */
export function sampleAtDepth(
  pairs: DepthSamplePair[],
  depth: number,
): DepthSampleResult | null {
  return sampleAtDepthWithMeta(pairs, depth).result
}

export function sampleAtDepthWithMeta(
  pairs: DepthSamplePair[],
  depth: number,
): DepthSampleOutcome {
  if (pairs.length === 0) return { result: null, failure: 'no_pairs' }

  const sorted = [...pairs].sort((a, b) => a.depth - b.depth)
  const exact = sorted.find((p) => p.depth === depth)
  if (exact) {
    return {
      result: {
        model: exact.model,
        observation: exact.observation,
        depthMatch: 'exact',
        bracketLower: exact.depth,
        bracketUpper: exact.depth,
      },
      failure: null,
    }
  }

  if (depth < sorted[0].depth) return { result: null, failure: 'below_range' }
  if (depth > sorted[sorted.length - 1].depth) return { result: null, failure: 'above_range' }

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
  if (span <= 0) return { result: null, failure: 'invalid_span' }

  const t = (depth - lower.depth) / span
  return {
    result: {
      model: lower.model + t * (upper.model - lower.model),
      observation: lower.observation + t * (upper.observation - lower.observation),
      depthMatch: 'interpolated',
      bracketLower: lower.depth,
      bracketUpper: upper.depth,
    },
    failure: null,
  }
}
