import { useMemo } from 'react'
import type {
  ApiChlorophyllField,
  ApiCurrentField,
  ApiSalinityField,
  ApiTemperatureField,
} from '../types/api'
import type { ValidationRegionBounds } from '../data/validationRegions'
import type { HazardAssessment, HazardCategoryId } from '../types/hazard'
import type { ComparisonStats, OceanVariable } from '../types/ocean'
import type { RegionValidationStats } from '../types/analysis'
import type { Instrument } from '../types/ocean'
import { isPointInValidationRegion } from '../data/validationRegions'
import { computeHazardAssessment } from '../utils/hazardEngine'
import { resolveHazardDataConfidence } from '../utils/hazardValidationConfidence'

export interface UseHazardAnalysisInput {
  enabled: boolean
  category: HazardCategoryId
  selectedVariable: OceanVariable
  selectedDepth: number
  selectedDate: string
  region: ValidationRegionBounds
  temperatureField: ApiTemperatureField | null
  currentField: ApiCurrentField | null
  salinityField: ApiSalinityField | null
  chlorophyllField: ApiChlorophyllField | null
  instruments: Instrument[]
  comparison: ComparisonStats | null
  regionValidation: RegionValidationStats | null
}

export function useHazardAnalysis(input: UseHazardAnalysisInput): HazardAssessment | null {
  const {
    enabled,
    category,
    selectedVariable,
    selectedDepth,
    selectedDate,
    region,
    temperatureField,
    currentField,
    salinityField,
    chlorophyllField,
    instruments,
    comparison,
    regionValidation,
  } = input

  return useMemo(() => {
    if (!enabled) return null

    const validationQuality = resolveHazardDataConfidence(comparison, regionValidation)
    const hasObservationsInRegion = instruments.some((inst) =>
      isPointInValidationRegion(inst.latitude, inst.longitude, region),
    )

    return computeHazardAssessment({
      category,
      selectedVariable,
      selectedDepth,
      selectedDate,
      region,
      fields: {
        temperature: temperatureField,
        current: currentField,
        salinity: salinityField,
        chlorophyll: chlorophyllField,
      },
      validationQuality,
      hasObservationsInRegion,
    })
  }, [
    enabled,
    category,
    selectedVariable,
    selectedDepth,
    selectedDate,
    region,
    temperatureField,
    currentField,
    salinityField,
    chlorophyllField,
    instruments,
    comparison,
    regionValidation,
  ])
}
