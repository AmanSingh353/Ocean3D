import * as THREE from 'three'
import type { AnalysisMode, SpatialValidationPoint } from '../types/analysis'
import type { ApiBounds, ApiChlorophyllField, ApiSalinityField, ApiTemperatureField } from '../types/api'
import type { OceanVariable } from '../types/ocean'
import {
  absoluteErrorToColor,
  differenceToColor,
  MISSING_VERTEX_COLOR,
} from './analysisColor'
import { chlorophyllToColor } from './chlorophyllColor'
import { getChlorophyllRange, sampleChlorophyllField } from './chlorophyllField'
import { currentToColor } from './currentColor'
import { getSalinityRange, sampleSalinityField } from './salinityField'
import { salinityToColor } from './salinityColor'
import { getTemperatureRange, sampleTemperatureField, sceneToLatLon } from './temperatureField'
import { temperatureToColor } from './temperatureColor'
import { findNearestSpatialPoint, getAnalysisValueFromPoint } from './spatialValidation'
import { isInsideModelBounds, setOceanBaseVertexColor } from './fieldSampling'

const DIM_FACTOR = 0.28

function dimColor(color: THREE.Color): THREE.Color {
  return color.clone().lerp(MISSING_VERTEX_COLOR, 1 - DIM_FACTOR)
}

function colorScalarValue(
  variable: OceanVariable,
  value: number,
  min: number,
  max: number,
): THREE.Color {
  switch (variable) {
    case 'temperature':
      return temperatureToColor(value, min, max)
    case 'salinity':
      return salinityToColor(value, min, max)
    case 'chlorophyll':
      return chlorophyllToColor(value, min, max)
    case 'current':
      return currentToColor(value, min, max)
  }
}

function sampleModelAtLatLon(
  variable: OceanVariable,
  lat: number,
  lon: number,
  temperatureField: ApiTemperatureField | null,
  salinityField: ApiSalinityField | null,
  chlorophyllField: ApiChlorophyllField | null,
): number | null {
  switch (variable) {
    case 'temperature':
      return temperatureField ? sampleTemperatureField(temperatureField, lat, lon) : null
    case 'salinity':
      return salinityField ? sampleSalinityField(salinityField, lat, lon) : null
    case 'chlorophyll':
      return chlorophyllField ? sampleChlorophyllField(chlorophyllField, lat, lon) : null
    default:
      return null
  }
}

function getModelRange(
  variable: OceanVariable,
  temperatureField: ApiTemperatureField | null,
  salinityField: ApiSalinityField | null,
  chlorophyllField: ApiChlorophyllField | null,
): { min: number; max: number } | null {
  switch (variable) {
    case 'temperature':
      return temperatureField ? getTemperatureRange(temperatureField) : null
    case 'salinity':
      return salinityField ? getSalinityRange(salinityField) : null
    case 'chlorophyll':
      return chlorophyllField ? getChlorophyllRange(chlorophyllField) : null
    default:
      return null
  }
}

export interface SpatialAnalysisFieldInput {
  geometry: THREE.BufferGeometry
  bounds: ApiBounds
  variable: OceanVariable
  mode: AnalysisMode
  points: SpatialValidationPoint[]
  legendMin: number | null
  legendMax: number | null
  temperatureField: ApiTemperatureField | null
  salinityField: ApiSalinityField | null
  chlorophyllField: ApiChlorophyllField | null
}

/** Paint ocean mesh for spatial analysis modes (non-model). */
export function applySpatialAnalysisToGeometry(input: SpatialAnalysisFieldInput): void {
  const {
    geometry,
    bounds,
    variable,
    mode,
    points,
    legendMin,
    legendMax,
    temperatureField,
    salinityField,
    chlorophyllField,
  } = input

  const positions = geometry.attributes.position
  const colors = geometry.attributes.color as THREE.BufferAttribute
  const modelRange = getModelRange(variable, temperatureField, salinityField, chlorophyllField)

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const z = positions.getZ(i)
    const { lat, lon } = sceneToLatLon(x, z, bounds)
    if (!isInsideModelBounds(lat, lon, bounds)) {
      setOceanBaseVertexColor(colors, i)
      continue
    }

    const nearest = findNearestSpatialPoint(lat, lon, points)

    let color: THREE.Color

    if (nearest) {
      const value = getAnalysisValueFromPoint(nearest, mode)
      if (value != null && legendMin != null && legendMax != null) {
        if (mode === 'difference') {
          color = differenceToColor(value, legendMin, legendMax)
        } else if (mode === 'absoluteError') {
          color = absoluteErrorToColor(value, legendMin, legendMax)
        } else {
          color = colorScalarValue(variable, value, legendMin, legendMax)
        }
      } else {
        color = MISSING_VERTEX_COLOR.clone()
      }
    } else if (mode === 'observation') {
      color = MISSING_VERTEX_COLOR.clone()
    } else if (modelRange) {
      const modelValue = sampleModelAtLatLon(
        variable,
        lat,
        lon,
        temperatureField,
        salinityField,
        chlorophyllField,
      )
      color =
        modelValue != null
          ? dimColor(colorScalarValue(variable, modelValue, modelRange.min, modelRange.max))
          : MISSING_VERTEX_COLOR.clone()
    } else {
      color = MISSING_VERTEX_COLOR.clone()
    }

    colors.setXYZ(i, color.r, color.g, color.b)
  }

  colors.needsUpdate = true
}

/** Reset ocean mesh to base ocean color (outside model / neutral state). */
export function applyNeutralOceanGeometry(geometry: THREE.BufferGeometry): void {
  const colors = geometry.attributes.color as THREE.BufferAttribute
  for (let i = 0; i < colors.count; i++) {
    setOceanBaseVertexColor(colors, i)
  }
  colors.needsUpdate = true
}
