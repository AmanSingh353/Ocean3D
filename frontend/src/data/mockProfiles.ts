import { MODEL_CONFIG } from './mockModel'
import type {
  ComparisonStats,
  InstrumentProfile,
  OceanVariable,
  ProfilePoint,
} from '../types/ocean'

const INSTRUMENT_OFFSETS: Record<string, number> = {
  'argo-001': 0.3,
  'argo-014': -0.2,
  'argo-021': 0.5,
  'glider-007': -0.4,
}

function baseTemperatureProfile(depth: number, dateIndex: number): number {
  const thermocline = 1 / (1 + Math.exp(-(depth - 120) / 35))
  const surface = 29.2 - dateIndex * 0.08
  const deep = 8.5 + dateIndex * 0.02
  return surface - (surface - deep) * thermocline - 0.001 * depth
}

function generatePoints(
  instrumentId: string,
  dateIndex: number,
): ProfilePoint[] {
  const offset = INSTRUMENT_OFFSETS[instrumentId] ?? 0.2
  return MODEL_CONFIG.depths.map((depth) => {
    const model = Number(baseTemperatureProfile(depth, dateIndex).toFixed(2))
    const noise = Math.sin(depth * 0.02 + dateIndex) * 0.15
    const observation = Number((model + offset + noise).toFixed(2))
    return { depth, model, observation }
  })
}

const profiles: InstrumentProfile[] = []

for (const date of MODEL_CONFIG.dates) {
  const dateIndex = MODEL_CONFIG.dates.indexOf(date)
  for (const id of Object.keys(INSTRUMENT_OFFSETS)) {
    profiles.push({
      instrumentId: id,
      variable: 'temperature',
      date,
      points: generatePoints(id, dateIndex),
    })
  }
}

export const MOCK_PROFILES = profiles

export function getProfile(
  instrumentId: string,
  date: string,
  variable: OceanVariable = 'temperature',
): InstrumentProfile | undefined {
  return MOCK_PROFILES.find(
    (p) =>
      p.instrumentId === instrumentId &&
      p.date === date &&
      p.variable === variable,
  )
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
  const observation =
    lower.observation + t * (upper.observation - lower.observation)

  const squaredErrors = profile.points.map((p) =>
    Math.pow(p.observation - p.model, 2),
  )
  const rmse = Math.sqrt(
    squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length,
  )

  return {
    model: Number(model.toFixed(1)),
    observation: Number(observation.toFixed(1)),
    difference: Number((observation - model).toFixed(1)),
    rmse: Number(rmse.toFixed(2)),
  }
}

export function getObservationTime(date: string, instrumentId: string): string {
  const hours = 6 + (instrumentId.charCodeAt(instrumentId.length - 1) % 12)
  const d = new Date(`${date}T${hours.toString().padStart(2, '0')}:30:00Z`)
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${d.getUTCDate().toString().padStart(2, '0')} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}\n${hours.toString().padStart(2, '0')}:30 UTC`
}
