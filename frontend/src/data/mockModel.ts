import type { ModelConfig } from '../types/ocean'

export { VARIABLE_OPTIONS, getVariableMeta, formatVariableValue } from './variableMeta'

export const MODEL_CONFIG: ModelConfig = {
  variable: 'temperature',
  unit: '°C',
  depths: [0, 50, 100, 200, 500, 1000],
  temperatureRange: { min: 8, max: 31 },
  dates: [
    '2026-08-20',
    '2026-08-21',
    '2026-08-22',
    '2026-08-23',
    '2026-08-24',
  ],
}

export const DEPTH_TICKS = [0, 100, 200, 500, 1000]

export function formatDisplayDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  const day = d.getUTCDate().toString().padStart(2, '0')
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${day} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function formatShortDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`
}

export function formatHeaderDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ]
  return `${d.getUTCDate().toString().padStart(2, '0')} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
