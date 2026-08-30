import type {
  ApiChlorophyllField,
  ApiCurrentField,
  ApiSalinityField,
  ApiTemperatureField,
} from '../types/api'
import type { OceanVariable } from '../types/ocean'

export type OceanField =
  | ApiTemperatureField
  | ApiCurrentField
  | ApiSalinityField
  | ApiChlorophyllField

export interface OceanFieldBundle {
  temperature: ApiTemperatureField | null
  current: ApiCurrentField | null
  salinity: ApiSalinityField | null
  chlorophyll: ApiChlorophyllField | null
}

/** Read the same loaded field OceanProvider / OceanViewer use for a variable. */
export function getLoadedFieldForVariable(
  variable: OceanVariable,
  fields: OceanFieldBundle,
): OceanField | null {
  switch (variable) {
    case 'temperature':
      return fields.temperature
    case 'current':
      return fields.current
    case 'salinity':
      return fields.salinity
    case 'chlorophyll':
      return fields.chlorophyll
  }
}

export function getGridValues(
  field: OceanField,
  variable: OceanVariable,
): number[][] | null {
  if (variable === 'current' && 'magnitude' in field) {
    return field.magnitude
  }
  if ('values' in field) {
    return field.values
  }
  return null
}

export function isValidCellValue(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}
