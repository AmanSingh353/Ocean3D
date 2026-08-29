import * as THREE from 'three'
import type { AnalysisMode, SpatialValidationPoint } from '../types/analysis'
import type { ApiBounds, ApiChlorophyllField, ApiCurrentField, ApiSalinityField, ApiTemperatureField } from '../types/api'
import type { OceanVariable } from '../types/ocean'
import {
  absoluteErrorToColor,
  differenceToColor,
  MISSING_VERTEX_COLOR,
} from './analysisColor'
import { chlorophyllToColor } from './chlorophyllColor'
import { getChlorophyllRange, sampleChlorophyllField } from './chlorophyllField'
import { currentToColor } from './currentColor'
import { getCurrentMagnitudeRange, sampleCurrentField } from './currentField'
import { getSalinityRange, sampleSalinityField } from './salinityField'
import { salinityToColor } from './salinityColor'
import { getTemperatureRange, sampleTemperatureField, sceneToLatLon } from './temperatureField'
import { temperatureToColor } from './temperatureColor'
import { findNearestSpatialPoint, getAnalysisValueFromPoint } from './spatialValidation'
import { isInsideModelBounds } from './fieldSampling'
import { getModelGridMeta, getCellAlphaAttribute, clearModelFieldVisibility } from './modelGridGeometry'
import { isOnLand } from './landMask'

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
  currentField: ApiCurrentField | null,
): number | null {
  switch (variable) {
    case 'temperature':
      return temperatureField ? sampleTemperatureField(temperatureField, lat, lon) : null
    case 'salinity':
      return salinityField ? sampleSalinityField(salinityField, lat, lon) : null
    case 'chlorophyll':
      return chlorophyllField ? sampleChlorophyllField(chlorophyllField, lat, lon) : null
    case 'current':
      return currentField ? sampleCurrentField(currentField, lat, lon).magnitude : null
  }
}

function getModelRange(
  variable: OceanVariable,
  temperatureField: ApiTemperatureField | null,
  salinityField: ApiSalinityField | null,
  chlorophyllField: ApiChlorophyllField | null,
  currentField: ApiCurrentField | null,
): { min: number; max: number } | null {
  switch (variable) {
    case 'temperature':
      return temperatureField ? getTemperatureRange(temperatureField) : null
    case 'salinity':
      return salinityField ? getSalinityRange(salinityField) : null
    case 'chlorophyll':
      return chlorophyllField ? getChlorophyllRange(chlorophyllField) : null
    case 'current':
      return currentField ? getCurrentMagnitudeRange(currentField) : null
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
  currentField: ApiCurrentField | null
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
    currentField,
  } = input

  const positions = geometry.attributes.position
  const colors = geometry.attributes.color as THREE.BufferAttribute
  const alphas = getCellAlphaAttribute(geometry)
  const geoLat = geometry.getAttribute('geoLat') as THREE.BufferAttribute | undefined
  const geoLon = geometry.getAttribute('geoLon') as THREE.BufferAttribute | undefined
  const modelRange = getModelRange(
    variable,
    temperatureField,
    salinityField,
    chlorophyllField,
    currentField,
  )
  const meta = getModelGridMeta(geometry)

  const hideVertex = (index: number): void => {
    alphas?.setX(index, 0)
  }

  const paintVertex = (index: number, lat: number, lon: number): void => {
    if (isOnLand(lat, lon) || !isInsideModelBounds(lat, lon, bounds)) {
      hideVertex(index)
      return
    }

    const nearest = findNearestSpatialPoint(lat, lon, points)
    let color: THREE.Color
    let visible = true

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
        visible = mode !== 'observation'
      }
    } else if (mode === 'observation') {
      hideVertex(index)
      return
    } else if (modelRange) {
      const modelValue = sampleModelAtLatLon(
        variable,
        lat,
        lon,
        temperatureField,
        salinityField,
        chlorophyllField,
        currentField,
      )
      if (modelValue != null) {
        color = dimColor(colorScalarValue(variable, modelValue, modelRange.min, modelRange.max))
      } else {
        hideVertex(index)
        return
      }
    } else {
      hideVertex(index)
      return
    }

    colors.setXYZ(index, color.r, color.g, color.b)
    if (visible) alphas?.setX(index, 1)
  }

  if (meta?.cellVertexRanges && geoLat && geoLon) {
    const { cellVertexRanges } = meta
    for (const cell of cellVertexRanges) {
      for (let v = cell.start; v < cell.start + cell.count; v++) {
        paintVertex(v, geoLat.getX(v), geoLon.getX(v))
      }
    }
    colors.needsUpdate = true
    if (alphas) alphas.needsUpdate = true
    return
  }

  if (meta) {
    const { grid } = meta
    const cols = grid.longitudes.length
    for (let j = 0; j < grid.latitudes.length; j++) {
      for (let i = 0; i < grid.longitudes.length; i++) {
        paintVertex(j * cols + i, grid.latitudes[j], grid.longitudes[i])
      }
    }
    colors.needsUpdate = true
    return
  }

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const z = positions.getZ(i)
    const { lat, lon } = sceneToLatLon(x, z, bounds)
    paintVertex(i, lat, lon)
  }

  colors.needsUpdate = true
  if (alphas) alphas.needsUpdate = true
}

/** Reset ocean mesh — fully transparent until field data is painted. */
export function applyNeutralOceanGeometry(geometry: THREE.BufferGeometry): void {
  clearModelFieldVisibility(geometry)
}
