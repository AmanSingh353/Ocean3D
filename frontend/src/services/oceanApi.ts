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
  ComparisonStats,
  Instrument,
  InstrumentProfile,
  OceanVariable,
} from '../types/ocean'

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
  return {
    instrumentId: api.instrument_id,
    variable: 'temperature',
    date: toDateParam(api.date),
    points: api.comparison.map((point) => ({
      depth: point.depth,
      model: point.model,
      observation: point.observation,
    })),
  }
}

export function getComparisonAtDepth(
  profile: InstrumentProfile,
  depth: number,
): ComparisonStats {
  const points = profile.points
  let lower = points[0]
  let upper = points[points.length - 1]

  for (let i = 0; i < points.length - 1; i++) {
    if (depth >= points[i].depth && depth <= points[i + 1].depth) {
      lower = points[i]
      upper = points[i + 1]
      break
    }
  }

  const t =
    upper.depth === lower.depth
      ? 0
      : (depth - lower.depth) / (upper.depth - lower.depth)
  const model = lower.model + t * (upper.model - lower.model)
  const observation = lower.observation + t * (upper.observation - lower.observation)
  const difference = observation - model

  const squaredErrors = points.map((p) => Math.pow(p.observation - p.model, 2))
  const rmse = Math.sqrt(
    squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length,
  )

  return {
    model: Number(model.toFixed(1)),
    observation: Number(observation.toFixed(1)),
    difference: Number(difference.toFixed(1)),
    rmse: Number(rmse.toFixed(2)),
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
