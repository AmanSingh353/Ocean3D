/** Geographic validation region for regional statistics filtering. */
export interface ValidationRegionBounds {
  id: string
  label: string
  latMin: number
  latMax: number
  lonMin: number
  lonMax: number
}

/** Preset sub-regions within the Indian Ocean model domain. */
export const VALIDATION_REGION_PRESETS: readonly ValidationRegionBounds[] = [
  {
    id: 'full-domain',
    label: 'Full Model Domain',
    latMin: 5,
    latMax: 20,
    lonMin: 65,
    lonMax: 85,
  },
  {
    id: 'arabian-sea',
    label: 'Arabian Sea',
    latMin: 8,
    latMax: 20,
    lonMin: 65,
    lonMax: 74,
  },
  {
    id: 'bay-of-bengal',
    label: 'Bay of Bengal',
    latMin: 5,
    latMax: 18,
    lonMin: 78,
    lonMax: 85,
  },
  {
    id: 'central-basin',
    label: 'Central Basin',
    latMin: 8,
    latMax: 16,
    lonMin: 72,
    lonMax: 80,
  },
] as const

export const DEFAULT_VALIDATION_REGION = VALIDATION_REGION_PRESETS[0]

export function isPointInValidationRegion(
  lat: number,
  lon: number,
  region: ValidationRegionBounds,
): boolean {
  return (
    lat >= region.latMin &&
    lat <= region.latMax &&
    lon >= region.lonMin &&
    lon <= region.lonMax
  )
}
