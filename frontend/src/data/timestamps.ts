/** Available model timesteps for the MVP demo. Mirrors backend DATES. */
export const OCEAN_TIMESTAMPS = [
  '2026-08-20',
  '2026-08-21',
  '2026-08-22',
  '2026-08-23',
  '2026-08-24',
] as const

export type OceanTimestamp = (typeof OCEAN_TIMESTAMPS)[number]

export const DEFAULT_OCEAN_DATE = OCEAN_TIMESTAMPS[OCEAN_TIMESTAMPS.length - 1]
