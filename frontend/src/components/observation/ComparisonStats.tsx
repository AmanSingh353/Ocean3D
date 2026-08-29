import type { AnalysisMode } from '../../types/analysis'
import type { ValidationStats } from '../../types/ocean'
import { DEMO_DATA_DISCLAIMER } from '../../data/validationData'
import { formatVariableValue, getVariableMeta } from '../../data/variableMeta'
import { DemoDataBanner } from '../common/DemoDataBanner'
import { DepthInterpolationPanel } from './DepthInterpolationPanel'

interface ComparisonStatsProps {
  stats: ValidationStats
  analysisMode?: AnalysisMode
  apiModelDepth?: number
  selectedDate?: string
}

function formatMetricValue(
  value: number | null,
  variable: ValidationStats['variable'],
): string {
  if (value == null) return 'N/A'
  return formatVariableValue(value, variable)
}

function statusClass(status: ValidationStats['validationStatus']): string {
  switch (status) {
    case 'GOOD':
      return 'validation-status validation-status--good'
    case 'MODERATE':
      return 'validation-status validation-status--moderate'
    default:
      return 'validation-status validation-status--poor'
  }
}

export function ComparisonStatsPanel({
  stats,
  analysisMode = 'model',
  apiModelDepth,
  selectedDate,
}: ComparisonStatsProps) {
  const meta = getVariableMeta(stats.variable)
  const hasPointComparison = stats.model != null && stats.observation != null
  const biasSign = stats.bias != null && stats.bias >= 0 ? '+' : ''
  const diffSign = stats.difference != null && stats.difference >= 0 ? '+' : ''

  const highlightDifference =
    analysisMode === 'difference' || analysisMode === 'regionalValidation'
  const highlightAbsError = analysisMode === 'absoluteError'

  const statsWithMapDepth: ValidationStats = {
    ...stats,
    mapModelDepth: stats.mapModelDepth ?? apiModelDepth ?? null,
  }

  return (
    <div className="comparison-stats">
      <div className="comparison-stats__header">
        <h4 className="subsection-title">VALIDATION</h4>
        <span className={statusClass(stats.validationStatus)}>{stats.validationStatus}</span>
      </div>
      <DemoDataBanner compact />
      <p className="comparison-depth comparison-depth--formula">
        Difference = Model − Observation · Bias = Observation − Model
      </p>
      {selectedDate ? (
        <p className="comparison-depth">Timestep: {selectedDate}</p>
      ) : null}

      <DepthInterpolationPanel stats={statsWithMapDepth} />

      {!hasPointComparison ? (
        <div className="validation-error-state">
          <p className="validation-error-state__title">Depth comparison unavailable</p>
          <p className="validation-error-state__hint">
            Validation metrics below are computed from the full profile where matched samples exist.
            Point-wise comparison at {stats.comparedDepth} m is not available for {meta.label}.
          </p>
        </div>
      ) : null}

      <div className="stat-grid">
        <div className="stat-item stat-item--highlight">
          <span className="stat-label">OBSERVATION</span>
          <span className="stat-value">{formatMetricValue(stats.observation, stats.variable)}</span>
          <span className="stat-hint">at {stats.comparedDepth} m</span>
        </div>
        <div className="stat-item stat-item--highlight">
          <span className="stat-label">MODEL</span>
          <span className="stat-value">{formatMetricValue(stats.model, stats.variable)}</span>
          <span className="stat-hint">
            {stats.depthMatch === 'interpolated'
              ? 'interpolated to observation depth'
              : 'at profile level'}
          </span>
        </div>
        <div className={`stat-item ${highlightDifference ? 'stat-item--highlight' : ''}`}>
          <span className="stat-label">DIFFERENCE</span>
          <span className="stat-value stat-value--accent">
            {stats.difference != null
              ? `${diffSign}${formatMetricValue(stats.difference, stats.variable)}`
              : 'N/A'}
          </span>
          <span className="stat-hint">Model − Observation</span>
        </div>
        <div className={`stat-item ${highlightAbsError ? 'stat-item--highlight' : ''}`}>
          <span className="stat-label">ABSOLUTE ERROR</span>
          <span className="stat-value stat-value--accent">
            {stats.difference != null
              ? formatMetricValue(Math.abs(stats.difference), stats.variable)
              : 'N/A'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">BIAS</span>
          <span className="stat-value stat-value--accent">
            {stats.bias != null
              ? `${biasSign}${formatMetricValue(stats.bias, stats.variable)}`
              : 'N/A'}
          </span>
          <span className="stat-hint">Observation − Model (mean profile)</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">MEAN BIAS</span>
          <span className="stat-value">{formatMetricValue(stats.meanBias, stats.variable)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">MAE</span>
          <span className="stat-value">{formatMetricValue(stats.mae, stats.variable)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">RMSE</span>
          <span className="stat-value">{formatMetricValue(stats.rmse, stats.variable)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">CORRELATION</span>
          <span className="stat-value">
            {stats.correlation != null ? stats.correlation.toFixed(3) : 'N/A'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">MATCHED POINTS</span>
          <span className="stat-value">{stats.matchedPoints}</span>
        </div>
      </div>
      <p className="comparison-depth comparison-depth--demo">{DEMO_DATA_DISCLAIMER}</p>
    </div>
  )
}
