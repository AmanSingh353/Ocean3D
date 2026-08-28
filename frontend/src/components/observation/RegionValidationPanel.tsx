import type { AnalysisMode, RegionValidationStats, SpatialValidationPoint } from '../../types/analysis'
import type { OceanVariable } from '../../types/ocean'
import { getVariableMeta } from '../../data/variableMeta'
import { formatDisplayDate } from '../../utils/dateFormat'

interface RegionValidationPanelProps {
  stats: RegionValidationStats
  loading: boolean
  error: string | null
  analysisMode: AnalysisMode
  selectedDepth: number
  selectedDate: string
  selectedVariable: OceanVariable
  selectedPoint?: SpatialValidationPoint | null
  selectedPlatformLabel?: string | null
}

function formatOptional(
  value: number | null,
  variable: RegionValidationStats['variable'],
): string {
  if (value == null) return 'N/A'
  const meta = getVariableMeta(variable)
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(meta.decimals)} ${meta.unit}`
}

function formatUnsigned(
  value: number | null,
  variable: RegionValidationStats['variable'],
): string {
  if (value == null) return 'N/A'
  const meta = getVariableMeta(variable)
  return `${value.toFixed(meta.decimals)} ${meta.unit}`
}

function emptyMessage(depth: number, variable: OceanVariable): string {
  const meta = getVariableMeta(variable)
  return `No matched observations available for this timestep/depth (${meta.label} · ${depth} m).`
}

export function RegionValidationPanel({
  stats,
  loading,
  error,
  analysisMode,
  selectedDepth,
  selectedDate,
  selectedVariable,
  selectedPoint,
  selectedPlatformLabel,
}: RegionValidationPanelProps) {
  const variableMeta = getVariableMeta(selectedVariable)
  const isRegionalMode = analysisMode === 'regionalValidation'

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
        <p className="region-validation__summary">
          {formatDisplayDate(selectedDate)} · {variableMeta.label} · {selectedDepth} m
        </p>
        <p className="control-hint">{emptyMessage(selectedDepth, selectedVariable)}</p>
      </div>
    )
  }

  const meanDifference = stats.meanBias != null ? -stats.meanBias : null

  return (
    <div className="region-validation">
      <h4 className="subsection-title">REGION VALIDATION</h4>
      <p className="region-validation__summary">
        {stats.matchedPlatforms} matched platform{stats.matchedPlatforms === 1 ? '' : 's'}
        <br />
        {formatDisplayDate(selectedDate)} · {variableMeta.label} · {selectedDepth} m
      </p>
      <div className="stat-grid">
        <div className="stat-item">
          <span className="stat-label">MATCHED PLATFORMS</span>
          <span className="stat-value">{stats.matchedPlatforms}</span>
        </div>
        {isRegionalMode || analysisMode === 'difference' ? (
          <div className={`stat-item ${isRegionalMode ? 'stat-item--highlight' : ''}`}>
            <span className="stat-label">MEAN DIFFERENCE</span>
            <span className="stat-value stat-value--accent">
              {formatOptional(meanDifference, stats.variable)}
            </span>
            <span className="stat-hint">Model − Observation</span>
          </div>
        ) : (
          <div className="stat-item">
            <span className="stat-label">MEAN BIAS</span>
            <span className="stat-value stat-value--accent">
              {formatOptional(stats.meanBias, stats.variable)}
            </span>
          </div>
        )}
        <div className={`stat-item ${analysisMode === 'absoluteError' || isRegionalMode ? 'stat-item--highlight' : ''}`}>
          <span className="stat-label">MAE</span>
          <span className="stat-value">{formatUnsigned(stats.mae, stats.variable)}</span>
        </div>
        <div className={`stat-item ${analysisMode === 'absoluteError' || isRegionalMode ? 'stat-item--highlight' : ''}`}>
          <span className="stat-label">RMSE</span>
          <span className="stat-value">{formatUnsigned(stats.rmse, stats.variable)}</span>
        </div>
        <div className={`stat-item stat-item--wide ${analysisMode === 'absoluteError' || isRegionalMode ? 'stat-item--highlight' : ''}`}>
          <span className="stat-label">MAX ABSOLUTE ERROR</span>
          <span className="stat-value">{formatUnsigned(stats.maxAbsoluteError, stats.variable)}</span>
        </div>
        {isRegionalMode && stats.medianAbsoluteError != null ? (
          <div className="stat-item">
            <span className="stat-label">MEDIAN ABS ERROR</span>
            <span className="stat-value">{formatUnsigned(stats.medianAbsoluteError, stats.variable)}</span>
          </div>
        ) : null}
      </div>

      {isRegionalMode && selectedPoint?.hasData && selectedPlatformLabel ? (
        <div className="region-validation__selected">
          <h4 className="subsection-title subsection-title--compact">SELECTED PLATFORM</h4>
          <p className="region-validation__platform-name">{selectedPlatformLabel}</p>
          <div className="stat-grid stat-grid--compact">
            <div className="stat-item">
              <span className="stat-label">MODEL</span>
              <span className="stat-value">{formatUnsigned(selectedPoint.model, stats.variable)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">OBSERVATION</span>
              <span className="stat-value">{formatUnsigned(selectedPoint.observation, stats.variable)}</span>
            </div>
            <div className="stat-item stat-item--highlight">
              <span className="stat-label">DIFFERENCE</span>
              <span className="stat-value stat-value--accent">
                {formatOptional(selectedPoint.difference, stats.variable)}
              </span>
              <span className="stat-hint">Model − Observation</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">ABSOLUTE ERROR</span>
              <span className="stat-value">{formatUnsigned(selectedPoint.absoluteError, stats.variable)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
