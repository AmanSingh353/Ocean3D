import type { ApiChlorophyllField, ApiCurrentField, ApiSalinityField, ApiTemperatureField } from '../types/api'
import type { OceanVariable } from '../types/ocean'

export type CachedOceanField =
  | ApiTemperatureField
  | ApiCurrentField
  | ApiSalinityField
  | ApiChlorophyllField

function normalizeDate(date: string): string {
  return date.slice(0, 10)
}

export function fieldCacheKey(
  variable: OceanVariable,
  depth: number,
  date: string,
): string {
  return `${variable}:${depth}:${normalizeDate(date)}`
}

export class OceanFieldCache {
  private store = new Map<string, CachedOceanField>()

  get(key: string): CachedOceanField | undefined {
    return this.store.get(key)
  }

  set(key: string, field: CachedOceanField): void {
    this.store.set(key, field)
  }

  clear(): void {
    this.store.clear()
  }
}
