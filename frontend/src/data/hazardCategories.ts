import type { HazardCategoryId, HazardCategoryMeta } from '../types/hazard'

export const HAZARD_CATEGORIES: readonly HazardCategoryMeta[] = [
  {
    id: 'cycloneOceanConditions',
    label: 'Cyclone / Severe-Weather Ocean Conditions',
    description:
      'Ocean-condition monitoring support — not cyclone detection or track forecasting.',
  },
  {
    id: 'stormSurgeSupport',
    label: 'Storm Surge / Coastal Flooding Support',
    description:
      'Coastal ocean-condition indicators — not storm-surge prediction without coastal model data.',
  },
  {
    id: 'marineAnomaly',
    label: 'Marine / Ocean Anomaly',
    description: 'Anomaly-based ocean state monitoring against demo reference values.',
  },
  {
    id: 'strongCurrent',
    label: 'Strong / Hazardous Current Conditions',
    description: 'Current-speed hazard indicator using existing model current data.',
  },
] as const

export function getHazardCategoryMeta(id: HazardCategoryId): HazardCategoryMeta {
  return HAZARD_CATEGORIES.find((c) => c.id === id) ?? HAZARD_CATEGORIES[0]
}

/** Honest event labels — no false disaster claims. */
export const HAZARD_EVENT_LABELS: Record<HazardCategoryId, string> = {
  cycloneOceanConditions: 'Elevated ocean-condition indicator',
  stormSurgeSupport: 'Potential hazard-support region (coastal ocean)',
  marineAnomaly: 'Demo ocean anomaly detected',
  strongCurrent: 'Elevated current-speed indicator',
}
