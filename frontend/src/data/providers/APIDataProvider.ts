/**
 * Future API-backed provider using scientific endpoints (/api/model/field, /api/datasets).
 * Not wired into OceanProvider yet — demo mode remains the default.
 */

import type {
  ApiChlorophyllField,
  ApiCurrentField,
  ApiModelMetadata,
  ApiSalinityField,
  ApiTemperatureField,
} from '../../types/api'
import {
  getInstrument,
  getInstrumentProfile,
  getInstruments,
  mapInstrument,
  mapInstrumentProfile,
  API_BASE_URL,
} from '../../services/oceanApi'
import type { OceanDataProvider } from './types'

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(body.detail ?? `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

interface ScientificFieldResponse {
  variable: string
  unit: string
  time: string
  depth: number
  bounds: { lat_min: number; lat_max: number; lon_min: number; lon_max: number }
  grid: { latitudes: number[]; longitudes: number[] }
  values: (number | null)[][]
  u?: (number | null)[][]
  v?: (number | null)[][]
  magnitude?: (number | null)[][]
  provenance: { is_demo: boolean }
}

function nullsToNumbers(grid: (number | null)[][]): number[][] {
  return grid.map((row) => row.map((v) => (v == null ? NaN : v)))
}

function toTemperatureField(res: ScientificFieldResponse): ApiTemperatureField {
  return {
    variable: 'temperature',
    unit: '°C',
    date: res.time,
    depth: res.depth,
    bounds: res.bounds,
    grid: res.grid,
    values: nullsToNumbers(res.values),
  }
}

function toSalinityField(res: ScientificFieldResponse): ApiSalinityField {
  return {
    variable: 'salinity',
    unit: 'PSU',
    date: res.time,
    depth: res.depth,
    bounds: res.bounds,
    grid: res.grid,
    values: nullsToNumbers(res.values),
  }
}

function toChlorophyllField(res: ScientificFieldResponse): ApiChlorophyllField {
  return {
    variable: 'chlorophyll',
    unit: 'mg/m³',
    date: res.time,
    depth: res.depth,
    bounds: res.bounds,
    grid: res.grid,
    values: nullsToNumbers(res.values),
  }
}

function toCurrentField(res: ScientificFieldResponse): ApiCurrentField {
  return {
    variable: 'current',
    unit: 'm/s',
    date: res.time,
    depth: res.depth,
    bounds: res.bounds,
    grid: res.grid,
    u: nullsToNumbers(res.u ?? res.values),
    v: nullsToNumbers(res.v ?? res.values),
    magnitude: nullsToNumbers(res.magnitude ?? res.values),
  }
}

export const apiDataProvider: OceanDataProvider = {
  mode: 'api',

  getModelMetadata: (signal) => fetchJson<ApiModelMetadata>('/api/model/metadata', signal),

  async getOceanFieldAtDepth(variable, depth, date, signal) {
    const q = new URLSearchParams({
      variable,
      depth: String(depth),
      time: date,
    })
    const res = await fetchJson<ScientificFieldResponse>(`/api/model/field?${q}`, signal)
    switch (variable) {
      case 'temperature':
        return toTemperatureField(res)
      case 'salinity':
        return toSalinityField(res)
      case 'chlorophyll':
        return toChlorophyllField(res)
      case 'current':
        return toCurrentField(res)
    }
  },

  getInstruments,
  getInstrument,
  getInstrumentProfile,
  mapInstrument,
  mapInstrumentProfile,
}
