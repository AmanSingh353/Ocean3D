import type { Instrument } from '../types/ocean'

export class InstrumentsCache {
  private store = new Map<string, Instrument[]>()

  get(date: string): Instrument[] | undefined {
    return this.store.get(date)
  }

  set(date: string, instruments: Instrument[]): void {
    this.store.set(date, instruments)
  }

  clear(): void {
    this.store.clear()
  }
}
