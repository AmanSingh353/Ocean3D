import type {
  ApiChlorophyllField,
  ApiCurrentField,
  ApiInstrument,
  ApiInstrumentProfile,
  ApiInstrumentSummary,
  ApiModelMetadata,
  ApiSalinityField,
  ApiTemperatureField,
} from '../types/api'
import type {
  Instrument,
  InstrumentProfile,
  OceanVariable,
  ProfileSeries,
} from '../types/ocean'
import { getVariableMeta } from '../data/variableMeta'
import {
  computeValidationStats,
  extractMatchedPairs,
} from '../utils/validationMetrics'

export { computeValidationStats, computeValidationStats as getComparisonAtDepth }

export const API_BASE_URL = 'http://127.0.0.1:8000'

export const API_DEPTHS = [0, 50, 100, 200, 500, 1000] as const

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === 'AbortError'
  )
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { signal })
  } catch (error) {
    if (isAbortError(error)) throw error
    console.error('[Ocean3D] API connection error:', error)
    throw new ApiError('Unable to connect to Ocean3D API', 0)
  }

  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = (await response.json()) as { detail?: string | { msg: string }[] }
      if (typeof body.detail === 'string') {
        detail = body.detail
      } else if (Array.isArray(body.detail) && body.detail[0]?.msg) {
        detail = body.detail[0].msg
      }
    } catch {
      // keep statusText
    }
    console.error('[Ocean3D] API error:', response.status, path, detail)
    throw new ApiError(detail || `Request failed (${response.status})`, response.status)
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    console.error('[Ocean3D] Invalid JSON response:', path, error)
    throw new ApiError('Invalid JSON response from API', response.status)
  }
}

export function snapDepth(depth: number): number {
  return API_DEPTHS.reduce((closest, candidate) =>
    Math.abs(candidate - depth) < Math.abs(closest - depth) ? candidate : closest,
  )
}

export function toDateParam(isoOrDate: string): string {
  return isoOrDate.slice(0, 10)
}

export function getModelMetadata(signal?: AbortSignal): Promise<ApiModelMetadata> {
  return request<ApiModelMetadata>('/api/model/metadata', signal)
}

export function getTemperatureField(
  depth: number,
  date: string,
  signal?: AbortSignal,
): Promise<ApiTemperatureField> {
  const params = new URLSearchParams({
    depth: String(snapDepth(depth)),
    date: toDateParam(date),
  })
  return request<ApiTemperatureField>(`/api/model/temperature?${params}`, signal)
}

/** Alias for getTemperatureField — fetches the ocean temperature grid. */
export function getTemperature(
  depth: number,
  date: string,
  signal?: AbortSignal,
): Promise<ApiTemperatureField> {
  return getTemperatureField(depth, date, signal)
}

export function getCurrentField(
  depth: number,
  date: string,
  signal?: AbortSignal,
): Promise<ApiCurrentField> {
  const clampedDepth = Math.max(0, Math.min(1000, Math.round(depth)))
  const params = new URLSearchParams({
    depth: String(clampedDepth),
    date: toDateParam(date),
  })
  return request<ApiCurrentField>(`/api/current?${params}`, signal)
}

/** Alias for getCurrentField. */
export function getCurrent(
  depth: number,
  date: string,
  signal?: AbortSignal,
): Promise<ApiCurrentField> {
  return getCurrentField(depth, date, signal)
}

export function getSalinityField(
  depth: number,
  date: string,
  signal?: AbortSignal,
): Promise<ApiSalinityField> {
  const clampedDepth = Math.max(0, Math.min(1000, Math.round(depth)))
  const params = new URLSearchParams({
    depth: String(clampedDepth),
    date: toDateParam(date),
  })
  return request<ApiSalinityField>(`/api/salinity?${params}`, signal)
}

/** Alias for getSalinityField. */
export function getSalinity(
  depth: number,
  date: string,
  signal?: AbortSignal,
): Promise<ApiSalinityField> {
  return getSalinityField(depth, date, signal)
}

export function getChlorophyllField(
  depth: number,
  date: string,
  signal?: AbortSignal,
): Promise<ApiChlorophyllField> {
  const clampedDepth = Math.max(0, Math.min(1000, Math.round(depth)))
  const params = new URLSearchParams({
    depth: String(clampedDepth),
    date: toDateParam(date),
  })
  return request<ApiChlorophyllField>(`/api/chlorophyll?${params}`, signal)
}

/** Alias for getChlorophyllField. */
export function getChlorophyll(
  depth: number,
  date: string,
  signal?: AbortSignal,
): Promise<ApiChlorophyllField> {
  return getChlorophyllField(depth, date, signal)
}

/** Route ocean field requests to the correct backend endpoint by variable. */
export function getOceanField(
  variable: OceanVariable,
  depth: number,
  date: string,
  signal?: AbortSignal,
): Promise<ApiTemperatureField | ApiCurrentField | ApiSalinityField | ApiChlorophyllField> {
  switch (variable) {
    case 'temperature':
      return getTemperature(depth, date, signal)
    case 'current':
      return getCurrent(depth, date, signal)
    case 'salinity':
      return getSalinity(depth, date, signal)
    case 'chlorophyll':
      return getChlorophyll(depth, date, signal)
  }
}

export function getInstruments(
  date = '2026-08-24',
  signal?: AbortSignal,
): Promise<ApiInstrumentSummary[]> {
  const params = new URLSearchParams({ date: toDateParam(date) })
  return request<ApiInstrumentSummary[]>(`/api/instruments?${params}`, signal)
}

export function getInstrument(
  instrumentId: string,
  date = '2026-08-24',
  signal?: AbortSignal,
): Promise<ApiInstrument> {
  const params = new URLSearchParams({ date: toDateParam(date) })
  return request<ApiInstrument>(
    `/api/instruments/${encodeURIComponent(instrumentId)}?${params}`,
    signal,
  )
}

export function getInstrumentProfile(
  instrumentId: string,
  date = '2026-08-24',
  signal?: AbortSignal,
): Promise<ApiInstrumentProfile> {
  const params = new URLSearchParams({ date: toDateParam(date) })
  return request<ApiInstrumentProfile>(
    `/api/instruments/${encodeURIComponent(instrumentId)}/profile?${params}`,
    signal,
  )
}

export function mapInstrumentSummary(
  api: ApiInstrumentSummary,
  currentDepth: number,
): Instrument {
  return {
    id: api.id,
    type: api.type,
    name: api.id,
    latitude: api.latitude,
    longitude: api.longitude,
    maxDepth: api.max_depth,
    currentDepth,
    status: api.status,
    dataQuality: 'GOOD',
    instrumentLabel: api.id,
    platformType: api.type === 'argo' ? 'Profiling Float' : 'Underwater Glider',
  }
}

export function mapInstrument(api: ApiInstrument, currentDepth: number): Instrument {
  return {
    id: api.id,
    type: api.type,
    name: api.id,
    latitude: api.latitude,
    longitude: api.longitude,
    maxDepth: api.max_depth,
    currentDepth,
    status: api.status,
    dataQuality: api.data_quality,
    instrumentLabel: api.id,
    platformType: api.platform_type,
  }
}

export function mapInstrumentProfile(api: ApiInstrumentProfile): InstrumentProfile {
  const points = api.comparison.map((point) => ({
    depth: point.depth,
    model: point.model,
    observation: point.observation,
    salinityModel: point.salinity_model ?? undefined,
    salinityObservation: point.salinity_observation ?? undefined,
    chlorophyllModel: point.chlorophyll_model ?? undefined,
    chlorophyllObservation: point.chlorophyll_observation ?? undefined,
    currentModel: point.current_model ?? undefined,
    currentObservation: point.current_observation ?? undefined,
  }))

  return {
    instrumentId: api.instrument_id,
    variable: 'temperature',
    date: toDateParam(api.date),
    points,
  }
}

/** Build profile series for charting from matched API profile levels only. */
export function getProfileSeries(
  profile: InstrumentProfile,
  variable: OceanVariable,
): ProfileSeries | null {
  const meta = getVariableMeta(variable)
  const pairs = extractMatchedPairs(profile, variable)

  if (pairs.length === 0) return null

  return {
    variable,
    label: meta.profileLabel,
    unit: meta.unit,
    points: pairs.map((p) => ({
      depth: p.depth,
      model: p.model,
      observation: p.observation,
    })),
  }
}

export function formatObservationTime(lastUpdated: string): string {
  const d = new Date(lastUpdated)
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  const day = d.getUTCDate().toString().padStart(2, '0')
  const hours = d.getUTCHours().toString().padStart(2, '0')
  const minutes = d.getUTCMinutes().toString().padStart(2, '0')
  return `${day} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}\n${hours}:${minutes} UTC`
}

export { ApiError, isAbortError }
