import { useMemo } from 'react'

import type {

  ApiChlorophyllField,

  ApiCurrentField,

  ApiSalinityField,

  ApiTemperatureField,

} from '../types/api'

import type { ValidationRegionBounds } from '../data/validationRegions'

import type { HazardAssessment, HazardId } from '../types/hazard'

import type { ComparisonStats, OceanVariable } from '../types/ocean'

import type { RegionValidationStats } from '../types/analysis'

import type { Instrument } from '../types/ocean'

import { isPointInValidationRegion } from '../data/validationRegions'

import { runMultiHazardEngine } from '../hazards/engine'

import type { OceanFieldBundle } from '../utils/hazardFieldAccess'



export interface UseHazardAnalysisInput {

  enabled: boolean

  hazardId: HazardId

  selectedVariable: OceanVariable

  selectedDepth: number

  selectedDate: string

  previousDate: string | null

  apiModelDepth: number

  region: ValidationRegionBounds

  temperatureField: ApiTemperatureField | null

  currentField: ApiCurrentField | null

  salinityField: ApiSalinityField | null

  chlorophyllField: ApiChlorophyllField | null

  instruments: Instrument[]

  comparison: ComparisonStats | null

  regionValidation: RegionValidationStats | null

  isModelLoading: boolean

  availableTimestepCount: number

}



function buildFields(input: UseHazardAnalysisInput, dateIso: string): OceanFieldBundle {

  const pick = <T extends { date: string } | null>(field: T): T => {

    if (!field) return null as T

    if (field.date.slice(0, 10) !== dateIso.slice(0, 10)) return null as T

    return field

  }



  return {

    temperature: pick(input.temperatureField),

    current: pick(input.currentField),

    salinity: pick(input.salinityField),

    chlorophyll: pick(input.chlorophyllField),

  }

}



function runForDate(

  input: UseHazardAnalysisInput,

  selectedDate: string,

  fields: OceanFieldBundle,

  previousPeakValue: number | null,

): HazardAssessment {

  const matchedPlatformsInRegion = input.instruments.filter((inst) =>

    isPointInValidationRegion(inst.latitude, inst.longitude, input.region),

  ).length



  return runMultiHazardEngine({

    hazardId: input.hazardId,

    selectedVariable: input.selectedVariable,

    selectedDepth: input.selectedDepth,

    selectedDate,

    apiModelDepth: input.apiModelDepth,

    region: input.region,

    fields,

    comparison: input.comparison,

    regionValidation: input.regionValidation,

    hasObservationsInRegion: matchedPlatformsInRegion > 0,

    matchedPlatformsInRegion,

    isFieldLoading: input.isModelLoading,

    availableTimestepCount: input.availableTimestepCount,

    previousPeakValue,

  })

}



export function useHazardAnalysis(input: UseHazardAnalysisInput): HazardAssessment {

  const {

    enabled,

    hazardId,

    selectedVariable,

    selectedDepth,

    selectedDate,

    previousDate,

    apiModelDepth,

    region,

    temperatureField,

    currentField,

    salinityField,

    chlorophyllField,

    instruments,

    comparison,

    regionValidation,

    isModelLoading,

    availableTimestepCount,

  } = input



  return useMemo(() => {

    const emptyFields: OceanFieldBundle = {

      temperature: null,

      current: null,

      salinity: null,

      chlorophyll: null,

    }



    if (!enabled) {

      return runMultiHazardEngine({

        hazardId,

        selectedVariable,

        selectedDepth,

        selectedDate,

        apiModelDepth,

        region,

        fields: emptyFields,

        comparison: null,

        regionValidation: null,

        hasObservationsInRegion: false,

        matchedPlatformsInRegion: 0,

        isFieldLoading: false,

        availableTimestepCount,

        previousPeakValue: null,

      })

    }



    const fields = buildFields(input, selectedDate)



    let previousPeakValue: number | null = null

    if (previousDate && availableTimestepCount > 1) {

      const previousFields = buildFields(input, previousDate)

      const previousAssessment = runForDate(

        { ...input, isModelLoading: false },

        previousDate,

        previousFields,

        null,

      )

      previousPeakValue = previousAssessment.peakValue

    }



    return runForDate(input, selectedDate, fields, previousPeakValue)

  }, [

    enabled,

    hazardId,

    selectedVariable,

    selectedDepth,

    selectedDate,

    previousDate,

    apiModelDepth,

    region,

    temperatureField,

    currentField,

    salinityField,

    chlorophyllField,

    instruments,

    comparison,

    regionValidation,

    isModelLoading,

    availableTimestepCount,

  ])

}

