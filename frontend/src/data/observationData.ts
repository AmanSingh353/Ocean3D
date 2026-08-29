/**
 * Static observation platform registry for the MVP demo.
 * Positions and IDs mirror `backend/app/services/instrument_data.py`.
 * Live values are fetched from the API and keyed by date / depth / variable.
 */
export interface ObservationPlatformRef {
  id: string
  type: 'argo' | 'glider'
  latitude: number
  longitude: number
  maxDepth: number
}

export const OBSERVATION_PLATFORMS: readonly ObservationPlatformRef[] = [
  { id: 'ARGO-001', type: 'argo', latitude: 12.4, longitude: 72.6, maxDepth: 1000 },
  { id: 'ARGO-014', type: 'argo', latitude: 15.8, longitude: 76.1, maxDepth: 1000 },
  { id: 'ARGO-021', type: 'argo', latitude: 9.8, longitude: 70.4, maxDepth: 1000 },
  { id: 'GLIDER-007', type: 'glider', latitude: 10.9, longitude: 79.2, maxDepth: 500 },
] as const
