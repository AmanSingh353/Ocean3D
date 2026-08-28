import type { AnalysisMode } from '../../types/analysis'
import type { ValidationStats } from '../../types/ocean'
import { formatVariableValue } from '../../data/variableMeta'

interface ComparisonStatsProps {
  stats: ValidationStats
  analysisMode?: AnalysisMode
}

function formatOptionalValue(
  value: number | null,
  variable: ValidationStats['variable'],
): string {
  if (value == null) return 'N/A'
  return formatVariableValue(value, variable)
}

function depthMatchLabel(match: ValidationStats['depthMatch']): string {
  switch (match) {
    case 'exact':
      return 'exact profile level'
    case 'interpolated':
      return 'interpolated between profile levels'
    default:
      return 'outside profile depth range'
  }
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

function pointDifference(stats: ValidationStats): number | null {
  if (stats.model == null || stats.observation == null) return null
  return stats.model - stats.observation
}

function pointAbsoluteError(stats: ValidationStats): number | null {
  const diff = pointDifference(stats)
  return diff != null ? Math.abs(diff) : null
}

export function ComparisonStatsPanel({
  stats,
  analysisMode = 'model',
}: ComparisonStatsProps) {
  const biasSign = stats.bias != null && stats.bias >= 0 ? '+' : ''
  const difference = pointDifference(stats)
  const absError = pointAbsoluteError(stats)
  const diffSign = difference != null && difference >= 0 ? '+' : ''

  const showDifferenceHighlight = analysisMode === 'difference'
  const showAbsErrorHighlight = analysisMode === 'absoluteError'

  return (
    <div className="comparison-stats">
      <div className="comparison-stats__header">
        <h4 className="subsection-title">VALIDATION</h4>
        <span className={statusClass(stats.validationStatus)}>{stats.validationStatus}</span>
      </div>
      <p className="comparison-depth">
        At {stats.comparedDepth} m ({depthMatchLabel(stats.depthMatch)})
      </p>
      <div className="stat-grid">
        <div className="stat-item">
          <span className="stat-label">MODEL</span>
          <span className="stat-value">{formatOptionalValue(stats.model, stats.variable)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">OBSERVATION</span>
          <span className="stat-value">
            {formatOptionalValue(stats.observation, stats.variable)}
          </span>
        </div>
        {showDifferenceHighlight ? (
          <div className="stat-item stat-item--highlight">
            <span className="stat-label">DIFFERENCE</span>
            <span className="stat-value stat-value--accent">
              {difference != null
                ? `${diffSign}${formatVariableValue(difference, stats.variable)}`
                : 'N/A'}
            </span>
            <span className="stat-hint">Model − Observation</span>
          </div>
        ) : (
          <div className="stat-item">
            <span className="stat-label">BIAS</span>
            <span className="stat-value stat-value--accent">
              {stats.bias != null
                ? `${biasSign}${formatVariableValue(stats.bias, stats.variable)}`
                : 'N/A'}
            </span>
          </div>
        )}
        {showAbsErrorHighlight ? (
          <div className="stat-item stat-item--highlight">
            <span className="stat-label">ABSOLUTE ERROR</span>
            <span className="stat-value stat-value--accent">
              {formatOptionalValue(absError, stats.variable)}
            </span>
          </div>
        ) : null}
        {!showDifferenceHighlight ? (
          <div className="stat-item">
            <span className="stat-label">MEAN BIAS</span>
            <span className="stat-value">{formatVariableValue(stats.meanBias, stats.variable)}</span>
          </div>
        ) : null}
        <div className={`stat-item ${showAbsErrorHighlight ? 'stat-item--highlight' : ''}`}>
          <span className="stat-label">MAE</span>
          <span className="stat-value">{formatVariableValue(stats.mae, stats.variable)}</span>
        </div>
        <div className={`stat-item ${showAbsErrorHighlight ? 'stat-item--highlight' : ''}`}>
          <span className="stat-label">RMSE</span>
          <span className="stat-value">{formatVariableValue(stats.rmse, stats.variable)}</span>
        </div>
        <div className={`stat-item ${showAbsErrorHighlight ? 'stat-item--highlight' : ''}`}>
          <span className="stat-label">MATCHED POINTS</span>
          <span className="stat-value">{stats.matchedPoints}</span>
        </div>
      </div>
    </div>
  )
}
