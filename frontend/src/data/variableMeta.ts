import type { OceanVariable } from '../types/ocean'
import { formatChlorophyllTick } from '../utils/chlorophyllColor'
import { formatCurrentTick } from '../utils/currentColor'
import { formatSalinityTick } from '../utils/salinityColor'
import { formatTemperatureTick } from '../utils/temperatureColor'

/** Single source of truth for ocean variable labels and units across the app. */
export interface VariableMeta {
  value: OceanVariable
  label: string
  /** Used in profile chart titles, e.g. "Current Speed Profile" */
  profileLabel: string
  unit: string
  decimals: number
}

export const VARIABLE_META: Record<OceanVariable, VariableMeta> = {
  temperature: {
    value: 'temperature',
    label: 'Temperature',
    profileLabel: 'Temperature',
    unit: '°C',
    decimals: 1,
  },
  salinity: {
    value: 'salinity',
    label: 'Salinity',
    profileLabel: 'Salinity',
    unit: 'PSU',
    decimals: 2,
  },
  chlorophyll: {
    value: 'chlorophyll',
    label: 'Chlorophyll',
    profileLabel: 'Chlorophyll',
    unit: 'mg/m³',
    decimals: 3,
  },
  current: {
    value: 'current',
    label: 'Current',
    profileLabel: 'Current Speed',
    unit: 'm/s',
    decimals: 3,
  },
}

export const VARIABLE_OPTIONS = Object.values(VARIABLE_META).map((meta) => ({
  value: meta.value,
  label: meta.label,
  unit: meta.unit,
}))

export function getVariableMeta(variable: OceanVariable): VariableMeta {
  return VARIABLE_META[variable]
}

export function formatVariableValue(value: number, variable: OceanVariable): string {
  const meta = getVariableMeta(variable)
  switch (variable) {
    case 'temperature':
      return `${formatTemperatureTick(value)} ${meta.unit}`
    case 'salinity':
      return `${formatSalinityTick(value)} ${meta.unit}`
    case 'chlorophyll':
      return `${formatChlorophyllTick(value)} ${meta.unit}`
    case 'current':
      return `${formatCurrentTick(value)} ${meta.unit}`
  }
}

export function formatVariableTick(value: number, variable: OceanVariable): string {
  switch (variable) {
    case 'temperature':
      return formatTemperatureTick(value)
    case 'salinity':
      return formatSalinityTick(value)
    case 'chlorophyll':
      return formatChlorophyllTick(value)
    case 'current':
      return formatCurrentTick(value)
  }
}

/** Format a comparison metric after calculation (not before). */
export function formatComparisonMetric(value: number, variable: OceanVariable): string {
  const meta = getVariableMeta(variable)
  return value.toFixed(meta.decimals)
}
