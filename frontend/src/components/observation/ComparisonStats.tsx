import type { ValidationStats } from '../../types/ocean'
import { formatVariableValue } from '../../data/variableMeta'

interface ComparisonStatsProps {
  stats: ValidationStats
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

export function ComparisonStatsPanel({ stats }: ComparisonStatsProps) {
  const biasSign = stats.bias != null && stats.bias >= 0 ? '+' : ''

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
        <div className="stat-item">
          <span className="stat-label">BIAS</span>
          <span className="stat-value stat-value--accent">
            {stats.bias != null
              ? `${biasSign}${formatVariableValue(stats.bias, stats.variable)}`
              : 'N/A'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">MEAN BIAS</span>
          <span className="stat-value">{formatVariableValue(stats.meanBias, stats.variable)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">MAE</span>
          <span className="stat-value">{formatVariableValue(stats.mae, stats.variable)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">RMSE</span>
          <span className="stat-value">{formatVariableValue(stats.rmse, stats.variable)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">MATCHED POINTS</span>
          <span className="stat-value">{stats.matchedPoints}</span>
        </div>
      </div>
    </div>
  )
}
