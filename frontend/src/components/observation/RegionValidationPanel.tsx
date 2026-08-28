import type { AnalysisMode, RegionValidationStats } from '../../types/analysis'
import { formatVariableValue } from '../../data/variableMeta'

interface RegionValidationPanelProps {
  stats: RegionValidationStats
  loading: boolean
  error: string | null
  analysisMode: AnalysisMode
  selectedDepth: number
}

function formatOptional(
  value: number | null,
  variable: RegionValidationStats['variable'],
): string {
  if (value == null) return 'N/A'
  return formatVariableValue(value, variable)
}

function emptyMessage(
  analysisMode: AnalysisMode,
  variable: RegionValidationStats['variable'],
  depth: number,
): string {
  if (analysisMode === 'observation') {
    return `No observation data available at ${depth} m for ${variable}.`
  }
  if (analysisMode === 'absoluteError') {
    return `No absolute error data available at ${depth} m for ${variable}.`
  }
  return `No matched model and observation samples at ${depth} m for ${variable}.`
}

export function RegionValidationPanel({
  stats,
  loading,
  error,
  analysisMode,
  selectedDepth,
}: RegionValidationPanelProps) {
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
          {emptyMessage(analysisMode, stats.variable, selectedDepth)}
        </p>
      </div>
    )
  }

  const biasSign = stats.meanBias != null && stats.meanBias >= 0 ? '+' : ''
  const meanDifference =
    stats.meanBias != null ? -stats.meanBias : null
  const meanDiffSign = meanDifference != null && meanDifference >= 0 ? '+' : ''

  return (
    <div className="region-validation">
      <h4 className="subsection-title">REGION VALIDATION</h4>
      <div className="stat-grid">
        <div className="stat-item">
          <span className="stat-label">MATCHED PLATFORMS</span>
          <span className="stat-value">{stats.matchedPlatforms}</span>
        </div>
        {analysisMode === 'difference' ? (
          <div className="stat-item stat-item--highlight">
            <span className="stat-label">MEAN DIFFERENCE</span>
            <span className="stat-value stat-value--accent">
              {meanDifference != null
                ? `${meanDiffSign}${formatVariableValue(meanDifference, stats.variable)}`
                : 'N/A'}
            </span>
            <span className="stat-hint">Model − Observation</span>
          </div>
        ) : (
          <div className="stat-item">
            <span className="stat-label">MEAN BIAS</span>
            <span className="stat-value stat-value--accent">
              {stats.meanBias != null
                ? `${biasSign}${formatVariableValue(stats.meanBias, stats.variable)}`
                : 'N/A'}
            </span>
          </div>
        )}
        <div className={`stat-item ${analysisMode === 'absoluteError' ? 'stat-item--highlight' : ''}`}>
          <span className="stat-label">MAE</span>
          <span className="stat-value">{formatOptional(stats.mae, stats.variable)}</span>
        </div>
        <div className={`stat-item ${analysisMode === 'absoluteError' ? 'stat-item--highlight' : ''}`}>
          <span className="stat-label">RMSE</span>
          <span className="stat-value">{formatOptional(stats.rmse, stats.variable)}</span>
        </div>
        <div className={`stat-item stat-item--wide ${analysisMode === 'absoluteError' ? 'stat-item--highlight' : ''}`}>
          <span className="stat-label">MAX ABSOLUTE ERROR</span>
          <span className="stat-value">
            {formatOptional(stats.maxAbsoluteError, stats.variable)}
          </span>
        </div>
      </div>
    </div>
  )
}
