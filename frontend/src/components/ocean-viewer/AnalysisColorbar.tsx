import { useMemo } from 'react'
import type { AnalysisMode } from '../../types/analysis'
import type { OceanVariable } from '../../types/ocean'
import { getVariableMeta } from '../../data/variableMeta'
import {
  formatAnalysisTick,
  getAbsoluteErrorGradientCss,
  getAbsoluteErrorLegendTicks,
  getDifferenceGradientCss,
  getDifferenceLegendTicks,
  getLegendTicks,
} from '../../utils/analysisColor'
import { getChlorophyllGradientCss } from '../../utils/chlorophyllColor'
import { getCurrentGradientCss } from '../../utils/currentColor'
import { getSalinityGradientCss } from '../../utils/salinityColor'
import { getTemperatureGradientCss } from '../../utils/temperatureColor'

interface AnalysisColorbarProps {
  mode: AnalysisMode
  variable: OceanVariable
  min: number | null
  max: number | null
}

function getTitle(mode: AnalysisMode, variable: OceanVariable): string {
  switch (mode) {
    case 'model':
      return getVariableMeta(variable).label
    case 'observation':
      return 'Observation'
    case 'difference':
      return 'Difference'
    case 'absoluteError':
      return 'Absolute Error'
    case 'regionalValidation':
      return 'Regional Validation'
  }
}

function getGradient(mode: AnalysisMode, variable: OceanVariable): string {
  if (mode === 'difference' || mode === 'regionalValidation') return getDifferenceGradientCss('vertical')
  if (mode === 'absoluteError') return getAbsoluteErrorGradientCss('vertical')
  switch (variable) {
    case 'temperature':
      return getTemperatureGradientCss('vertical')
    case 'salinity':
      return getSalinityGradientCss('vertical')
    case 'chlorophyll':
      return getChlorophyllGradientCss('vertical')
    case 'current':
      return getCurrentGradientCss('vertical')
  }
}

function getExtremeLabels(mode: AnalysisMode): { low: string; high: string } {
  if (mode === 'difference' || mode === 'regionalValidation') return { low: 'Negative', high: 'Positive' }
  if (mode === 'absoluteError') return { low: '0', high: 'High' }
  return { low: 'Low', high: 'High' }
}

export function AnalysisColorbar({ mode, variable, min, max }: AnalysisColorbarProps) {
  const unit = getVariableMeta(variable).unit
  const title = getTitle(mode, variable)
  const displayTitle =
    mode === 'absoluteError'
      ? 'ABSOLUTE ERROR'
      : mode === 'regionalValidation'
        ? 'REGIONAL VALIDATION'
        : title

  const ticks = useMemo(() => {
    if (min == null || max == null) return []
    if (mode === 'difference' || mode === 'regionalValidation') return getDifferenceLegendTicks(min, max)
    if (mode === 'absoluteError') return getAbsoluteErrorLegendTicks(min, max)
    return getLegendTicks(min, max).reverse()
  }, [min, max, mode])

  const extremes = getExtremeLabels(mode)

  if (min == null || max == null) {
    return (
      <div className="analysis-colorbar analysis-colorbar--empty">
        <span className="analysis-colorbar__title">{displayTitle}</span>
        <span className="analysis-colorbar__empty">No matched data</span>
      </div>
    )
  }

  return (
    <div className="analysis-colorbar">
      <span className="analysis-colorbar__title">
        {displayTitle}{' '}
        <span className="analysis-colorbar__unit">{unit}</span>
      </span>
      <div className="analysis-colorbar__body">
        <div className="analysis-colorbar__labels">
          <span className="analysis-colorbar__extreme">{extremes.high}</span>
          {ticks.map((tick) => (
            <span key={tick} className="analysis-colorbar__tick">
              {formatAnalysisTick(tick, variable)}
            </span>
          ))}
          <span className="analysis-colorbar__extreme">{extremes.low}</span>
        </div>
        <div
          className="analysis-colorbar__gradient"
          style={{ background: getGradient(mode, variable) }}
          aria-hidden
        />
      </div>
    </div>
  )
}
