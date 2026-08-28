import type { RegionValidationStats } from '../../types/analysis'
import { formatVariableValue } from '../../data/variableMeta'

interface RegionValidationPanelProps {
  stats: RegionValidationStats
  loading: boolean
  error: string | null
}

function formatOptional(
  value: number | null,
  variable: RegionValidationStats['variable'],
): string {
  if (value == null) return 'N/A'
  return formatVariableValue(value, variable)
}

export function RegionValidationPanel({ stats, loading, error }: RegionValidationPanelProps) {
  if (loading) {
    return (
      <div className="region-validation">
        <h4 className="subsection-title">REGION VALIDATION</h4>
        <p className="control-hint">Loading platform comparisons...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="region-validation">
        <h4 className="subsection-title">REGION VALIDATION</h4>
        <p className="control-hint control-hint--error">{error}</p>
      </div>
    )
  }

  if (stats.matchedPlatforms === 0) {
    return (
      <div className="region-validation">
        <h4 className="subsection-title">REGION VALIDATION</h4>
        <p className="control-hint">
          No matched model and observation samples at this depth for {stats.variable}.
        </p>
      </div>
    )
  }

  const biasSign = stats.meanBias != null && stats.meanBias >= 0 ? '+' : ''

  return (
    <div className="region-validation">
      <h4 className="subsection-title">REGION VALIDATION</h4>
      <div className="stat-grid">
        <div className="stat-item">
          <span className="stat-label">MATCHED PLATFORMS</span>
          <span className="stat-value">{stats.matchedPlatforms}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">MEAN BIAS</span>
          <span className="stat-value stat-value--accent">
            {stats.meanBias != null
              ? `${biasSign}${formatVariableValue(stats.meanBias, stats.variable)}`
              : 'N/A'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">MAE</span>
          <span className="stat-value">{formatOptional(stats.mae, stats.variable)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">RMSE</span>
          <span className="stat-value">{formatOptional(stats.rmse, stats.variable)}</span>
        </div>
        <div className="stat-item stat-item--wide">
          <span className="stat-label">MAX ABSOLUTE ERROR</span>
          <span className="stat-value">
            {formatOptional(stats.maxAbsoluteError, stats.variable)}
          </span>
        </div>
      </div>
    </div>
  )
}
