import { useContext } from 'react'
import { OceanContext } from '../context/OceanProvider'
import type { OceanContextValue } from '../types/oceanState'

export function useOcean(): OceanContextValue {
  const ctx = useContext(OceanContext)
  if (!ctx) {
    throw new Error('useOcean must be used within an OceanProvider')
  }
  return ctx
}
