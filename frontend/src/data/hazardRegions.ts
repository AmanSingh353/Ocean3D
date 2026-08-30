import type { ValidationRegionBounds } from './validationRegions'
import { VALIDATION_REGION_PRESETS } from './validationRegions'

/** Default risk region for disaster-management demo — Bay of Bengal. */
export const DEFAULT_HAZARD_REGION: ValidationRegionBounds =
  VALIDATION_REGION_PRESETS.find((r) => r.id === 'bay-of-bengal') ??
  VALIDATION_REGION_PRESETS[0]

export const HAZARD_REGION_PRESETS: readonly ValidationRegionBounds[] =
  VALIDATION_REGION_PRESETS
