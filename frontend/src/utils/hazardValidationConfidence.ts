import type { DataConfidenceQuality } from '../types/hazard'
import type { ValidationStats } from '../types/ocean'
import type { RegionValidationStats } from '../types/analysis'
import { DEMO_VALIDATION_CONFIDENCE_RULES_DISCLAIMER } from '../data/hazardThresholds'

/** Map point-level validation status to qualitative data confidence. */
export function validationStatusToConfidence(
  status: ValidationStats['validationStatus'] | undefined,
): DataConfidenceQuality | null {
  if (!status) return null
  switch (status) {
    case 'GOOD':
      return 'GOOD'
    case 'MODERATE':
      return 'MODERATE'
    case 'POOR':
      return 'LIMITED'
  }
}

/** Map regional validation status to qualitative data confidence. */
export function regionalValidationToConfidence(
  stats: RegionValidationStats | null,
): DataConfidenceQuality | null {
  if (!stats || !stats.validationStatus) return null
  switch (stats.validationStatus) {
    case 'GOOD':
      return 'GOOD'
    case 'MODERATE':
      return 'MODERATE'
    case 'POOR':
      return 'LIMITED'
    default:
      return null
  }
}

export function resolveHazardDataConfidence(
  comparison: ValidationStats | null,
  regionValidation: RegionValidationStats | null,
): DataConfidenceQuality | null {
  return (
    validationStatusToConfidence(comparison?.validationStatus) ??
    regionalValidationToConfidence(regionValidation)
  )
}

export { DEMO_VALIDATION_CONFIDENCE_RULES_DISCLAIMER }
