import type { OceanVariable } from '../types/ocean'

/**
 * Conceptual demo data model — replace backend services with NetCDF/INCOIS ingest
 * without changing UI components.
 */

export interface OceanModelSample {
  variable: OceanVariable
  date: string
  latitude: number
  longitude: number
  depth: number
  value: number
}

export interface ObservationSample {
  platformId: string
  platformType: 'argo' | 'glider'
  latitude: number
  longitude: number
  date: string
  depth: number
  variable: OceanVariable
  value: number
  quality: 'GOOD' | 'FAIR' | 'POOR'
}

export interface DerivedValidationMetrics {
  difference: number
  absoluteError: number
  bias: number
  meanBias: number
  mae: number
  rmse: number
  correlation: number | null
}

/** Demo data disclaimer shown in validation UI. */
export const DEMO_DATA_DISCLAIMER =
  'Demo synthetic data — validation metrics illustrate the workflow, not operational accuracy.'

export const DEMO_DATA_SHORT = 'Demo synthetic data — not real INCOIS observations.'
