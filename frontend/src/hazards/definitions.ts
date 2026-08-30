import type { OceanVariable } from '../types/ocean'
import type { ThresholdBands } from '../data/hazardThresholds'
import { DEMO_HAZARD_THRESHOLDS } from '../data/hazardThresholds'
import type { HazardId } from '../types/hazard'

/** Dataset requirement — ocean model variable or external (not yet available). */
export type HazardDataRequirement =
  | { kind: 'oceanVariable'; variable: OceanVariable; label: string }
  | { kind: 'external'; datasetId: ExternalDatasetId; label: string; unit: string }

export type ExternalDatasetId =
  | 'waveHeight'
  | 'wavePeriod'
  | 'seaSurfaceHeight'
  | 'tsunamiGauge'
  | 'seismic'

export type ThresholdMode = 'absolute' | 'anomaly'

export interface HazardThresholdRule {
  mode: ThresholdMode
  bands: ThresholdBands
  demoDisclaimer: string
}

export interface HazardAnomalyRule {
  enabled: boolean
  usesDemoReference: boolean
  description: string
}

export interface HazardConfidenceRequirements {
  minMatchedObservations: number
  prefersRegionalValidation: boolean
  description: string
}

export interface HazardDefinition {
  id: HazardId
  name: string
  description: string
  primaryRequirement: HazardDataRequirement
  secondaryRequirements: HazardDataRequirement[]
  /** Whether depth selection applies (false for surface-only external datasets). */
  supportsDepth: boolean
  thresholdRule: HazardThresholdRule
  anomalyRule: HazardAnomalyRule
  confidenceRequirements: HazardConfidenceRequirements
  /** False when required datasets are not present in the current demo stack. */
  dataAvailableInDemo: boolean
  /** Architecture placeholder — no analysis performed. */
  architectureOnly: boolean
  unavailableMessage?: string
}

export const HAZARD_DEFINITIONS: Record<HazardId, HazardDefinition> = {
  strongCurrent: {
    id: 'strongCurrent',
    name: 'Strong / Hazardous Current',
    description:
      'Current-speed and direction hazard indicator using existing model current vectors.',
    primaryRequirement: { kind: 'oceanVariable', variable: 'current', label: 'Current Speed' },
    secondaryRequirements: [
      { kind: 'oceanVariable', variable: 'current', label: 'Current Direction' },
    ],
    supportsDepth: true,
    thresholdRule: {
      mode: 'absolute',
      bands: DEMO_HAZARD_THRESHOLDS.currentSpeed,
      demoDisclaimer: 'Demo thresholds — require scientific/operational validation.',
    },
    anomalyRule: { enabled: false, usesDemoReference: false, description: 'Absolute speed thresholds.' },
    confidenceRequirements: {
      minMatchedObservations: 3,
      prefersRegionalValidation: true,
      description: 'Benefits from matched current observations where available.',
    },
    dataAvailableInDemo: true,
    architectureOnly: false,
  },

  marineHeatAnomaly: {
    id: 'marineHeatAnomaly',
    name: 'Marine Heat Anomaly',
    description:
      'Elevated temperature regions using a deterministic demo reference — not operational SST climatology.',
    primaryRequirement: { kind: 'oceanVariable', variable: 'temperature', label: 'Temperature' },
    secondaryRequirements: [
      {
        kind: 'oceanVariable',
        variable: 'temperature',
        label: 'Demo reference temperature',
      },
    ],
    supportsDepth: true,
    thresholdRule: {
      mode: 'anomaly',
      bands: DEMO_HAZARD_THRESHOLDS.anomaly.temperature,
      demoDisclaimer: 'Demo thresholds — require scientific/operational validation.',
    },
    anomalyRule: {
      enabled: true,
      usesDemoReference: true,
      description: 'Anomaly = model value − demo reference at each grid cell.',
    },
    confidenceRequirements: {
      minMatchedObservations: 3,
      prefersRegionalValidation: true,
      description: 'Benefits from temperature profile validation.',
    },
    dataAvailableInDemo: true,
    architectureOnly: false,
  },

  salinityAnomaly: {
    id: 'salinityAnomaly',
    name: 'Salinity Anomaly',
    description:
      'Salinity variation relative to a deterministic demo reference — not operational climatology.',
    primaryRequirement: { kind: 'oceanVariable', variable: 'salinity', label: 'Salinity' },
    secondaryRequirements: [
      {
        kind: 'oceanVariable',
        variable: 'salinity',
        label: 'Demo reference salinity',
      },
    ],
    supportsDepth: true,
    thresholdRule: {
      mode: 'anomaly',
      bands: DEMO_HAZARD_THRESHOLDS.anomaly.salinity,
      demoDisclaimer: 'Demo thresholds — require scientific/operational validation.',
    },
    anomalyRule: {
      enabled: true,
      usesDemoReference: true,
      description: 'Anomaly = model value − demo reference at each grid cell.',
    },
    confidenceRequirements: {
      minMatchedObservations: 3,
      prefersRegionalValidation: true,
      description: 'Benefits from salinity profile validation.',
    },
    dataAvailableInDemo: true,
    architectureOnly: false,
  },

  extremeWaveStormSurge: {
    id: 'extremeWaveStormSurge',
    name: 'Extreme Wave / Storm-Surge Support',
    description:
      'Wave and sea-level hazard support — requires wave height/period or sea surface height datasets.',
    primaryRequirement: {
      kind: 'external',
      datasetId: 'waveHeight',
      label: 'Wave Height',
      unit: 'm',
    },
    secondaryRequirements: [
      { kind: 'external', datasetId: 'wavePeriod', label: 'Wave Period', unit: 's' },
      {
        kind: 'external',
        datasetId: 'seaSurfaceHeight',
        label: 'Sea Surface Height',
        unit: 'm',
      },
    ],
    supportsDepth: false,
    thresholdRule: {
      mode: 'absolute',
      bands: { low: 1.5, moderate: 2.5, high: 4.0 },
      demoDisclaimer: 'Placeholder thresholds — not active until wave/SSH data is connected.',
    },
    anomalyRule: { enabled: false, usesDemoReference: false, description: 'Not applicable without wave/SSH data.' },
    confidenceRequirements: {
      minMatchedObservations: 0,
      prefersRegionalValidation: false,
      description: 'Requires wave or tide gauge observations.',
    },
    dataAvailableInDemo: false,
    architectureOnly: true,
    unavailableMessage:
      'Required ocean data unavailable for this hazard — wave height, wave period, and sea surface height not in demo dataset.',
  },

  tsunamiSupport: {
    id: 'tsunamiSupport',
    name: 'Tsunami Support',
    description:
      'Architecture for tsunami ocean assessment — not tsunami detection or prediction from temperature/current/salinity alone.',
    primaryRequirement: {
      kind: 'external',
      datasetId: 'tsunamiGauge',
      label: 'Tsunami / Sea-level Anomaly',
      unit: 'm',
    },
    secondaryRequirements: [
      { kind: 'external', datasetId: 'seismic', label: 'Seismic / External Warning Feed', unit: '' },
    ],
    supportsDepth: false,
    thresholdRule: {
      mode: 'anomaly',
      bands: { low: 0.05, moderate: 0.15, high: 0.3 },
      demoDisclaimer: 'Placeholder — tsunami assessment requires dedicated monitoring data.',
    },
    anomalyRule: {
      enabled: true,
      usesDemoReference: false,
      description: 'Requires tsunami-capable sea-level or external warning data.',
    },
    confidenceRequirements: {
      minMatchedObservations: 0,
      prefersRegionalValidation: false,
      description: 'Requires dedicated tsunami monitoring or warning network.',
    },
    dataAvailableInDemo: false,
    architectureOnly: true,
    unavailableMessage:
      'Required ocean data unavailable for this hazard — tsunami assessment requires sea-level, seismic, or external warning data.',
  },
}

export const HAZARD_DEFINITION_LIST = Object.values(HAZARD_DEFINITIONS)

/** Public alias for hazard configuration registry. */
export const hazardDefinitions = HAZARD_DEFINITIONS
