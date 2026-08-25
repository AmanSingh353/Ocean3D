import type { Instrument } from '../types/ocean'

export const MOCK_INSTRUMENTS: Instrument[] = [
  {
    id: 'argo-001',
    type: 'argo',
    name: 'ARGO-001',
    latitude: 12.4,
    longitude: 72.6,
    maxDepth: 1000,
    currentDepth: 100,
    status: 'ACTIVE',
    dataQuality: 'GOOD',
    instrumentLabel: 'ARGO-001',
    platformType: 'Profiling Float',
  },
  {
    id: 'argo-014',
    type: 'argo',
    name: 'ARGO-014',
    latitude: 15.8,
    longitude: 76.1,
    maxDepth: 700,
    currentDepth: 100,
    status: 'ACTIVE',
    dataQuality: 'GOOD',
    instrumentLabel: 'ARGO-014',
    platformType: 'Profiling Float',
  },
  {
    id: 'argo-021',
    type: 'argo',
    name: 'ARGO-021',
    latitude: 9.8,
    longitude: 70.4,
    maxDepth: 1000,
    currentDepth: 100,
    status: 'ACTIVE',
    dataQuality: 'GOOD',
    instrumentLabel: 'ARGO-021',
    platformType: 'Profiling Float',
  },
  {
    id: 'glider-007',
    type: 'glider',
    name: 'GLIDER-007',
    latitude: 10.9,
    longitude: 79.2,
    maxDepth: 500,
    currentDepth: 100,
    status: 'ACTIVE',
    dataQuality: 'GOOD',
    instrumentLabel: 'GLIDER-007',
    platformType: 'Underwater Glider',
  },
]

export function getInstrumentById(id: string): Instrument | undefined {
  return MOCK_INSTRUMENTS.find((inst) => inst.id === id)
}

export function latLonToScenePercent(
  lat: number,
  lon: number,
): { x: number; y: number } {
  const x = ((lon - 65) / 20) * 100
  const y = ((20 - lat) / 15) * 100
  return {
    x: Math.max(8, Math.min(92, x)),
    y: Math.max(12, Math.min(88, y)),
  }
}
