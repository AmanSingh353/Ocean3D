import { USE_DEMO_DATA } from './config'
import { demoDataProvider } from './DemoDataProvider'
import { apiDataProvider } from './APIDataProvider'
import type { OceanDataProvider } from './types'

export function getOceanDataProvider(): OceanDataProvider {
  return USE_DEMO_DATA ? demoDataProvider : apiDataProvider
}

export { demoDataProvider, apiDataProvider }
export type { OceanDataProvider } from './types'
