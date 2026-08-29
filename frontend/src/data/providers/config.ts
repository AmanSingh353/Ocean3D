export type DataMode = 'demo' | 'api'

/**
 * Data mode for Ocean3D — defaults to demo so the MVP continues unchanged.
 * Set VITE_OCEAN3D_DATA_MODE=api to use scientific API endpoints (Phase 2+).
 */
export const DATA_MODE: DataMode =
  (import.meta.env.VITE_OCEAN3D_DATA_MODE as DataMode | undefined) ?? 'demo'

export const USE_DEMO_DATA = DATA_MODE === 'demo'
