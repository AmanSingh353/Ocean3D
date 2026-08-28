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
import { resolveApiDepth } from '../utils/depthUtils'
import { DEFAULT_DEPTHS } from '../data/defaults'
import {
  computeValidationStats,
  extractMatchedPairs,
} from '../utils/validationMetrics'

export { computeValidationStats, computeValidationStats as getComparisonAtDepth }

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

/** @deprecated Use availableDepths from API metadata via OceanProvider */
export const API_DEPTHS = DEFAULT_DEPTHS

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
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

export function toDateParam(isoOrDate: string): string {
  return isoOrDate.slice(0, 10)
}

/** @deprecated Use resolveApiDepth from utils/depthUtils */
export function snapDepth(depth: number, depths: number[] = [...DEFAULT_DEPTHS]): number {
  return resolveApiDepth('temperature', depth, depths)
}

export function getModelMetadata(signal?: AbortSignal): Promise<ApiModelMetadata> {
  return request<ApiModelMetadata>('/api/model/metadata', signal)
}

function fieldPath(variable: OceanVariable): string {
  switch (variable) {
    case 'temperature':
      return '/api/model/temperature'
    case 'current':
      return '/api/current'
    case 'salinity':
      return '/api/salinity'
    case 'chlorophyll':
      return '/api/chlorophyll'
  }
}

/** Fetch a model field at an already-resolved API depth. */
export function getOceanFieldAtDepth(
  variable: OceanVariable,
  resolvedDepth: number,
  date: string,
  signal?: AbortSignal,
): Promise<ApiTemperatureField | ApiCurrentField | ApiSalinityField | ApiChlorophyllField> {
  const params = new URLSearchParams({
    depth: String(resolvedDepth),
    date: toDateParam(date),
  })
  return request(`${fieldPath(variable)}?${params}`, signal)
}

/** Resolve depth for variable then fetch the model field. */
export function getOceanField(
  variable: OceanVariable,
  depth: number,
  date: string,
  signal?: AbortSignal,
  availableDepths: number[] = [...DEFAULT_DEPTHS],
): Promise<ApiTemperatureField | ApiCurrentField | ApiSalinityField | ApiChlorophyllField> {
  const resolvedDepth = resolveApiDepth(variable, depth, availableDepths)
  return getOceanFieldAtDepth(variable, resolvedDepth, date, signal)
}

export function getTemperature(
  depth: number,
  date: string,
  signal?: AbortSignal,
  availableDepths?: number[],
): Promise<ApiTemperatureField> {
  return getOceanField('temperature', depth, date, signal, availableDepths) as Promise<ApiTemperatureField>
}

export function getCurrent(
  depth: number,
  date: string,
  signal?: AbortSignal,
  availableDepths?: number[],
): Promise<ApiCurrentField> {
  return getOceanField('current', depth, date, signal, availableDepths) as Promise<ApiCurrentField>
}

export function getSalinity(
  depth: number,
  date: string,
  signal?: AbortSignal,
  availableDepths?: number[],
): Promise<ApiSalinityField> {
  return getOceanField('salinity', depth, date, signal, availableDepths) as Promise<ApiSalinityField>
}

export function getChlorophyll(
  depth: number,
  date: string,
  signal?: AbortSignal,
  availableDepths?: number[],
): Promise<ApiChlorophyllField> {
  return getOceanField('chlorophyll', depth, date, signal, availableDepths) as Promise<ApiChlorophyllField>
}

export function getInstruments(
  date: string,
  signal?: AbortSignal,
): Promise<ApiInstrumentSummary[]> {
  const params = new URLSearchParams({ date: toDateParam(date) })
  return request<ApiInstrumentSummary[]>(`/api/instruments?${params}`, signal)
}

export function getInstrument(
  instrumentId: string,
  date: string,
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
  date: string,
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
