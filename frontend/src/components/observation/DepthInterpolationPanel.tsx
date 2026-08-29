import type { ValidationStats, DepthSampleError } from '../../types/ocean'
import { formatVariableValue, getVariableMeta } from '../../data/variableMeta'

function depthSampleErrorMessage(
  error: DepthSampleError | null,
  comparedDepth: number,
  variableLabel: string,
): string | null {
  switch (error) {
    case 'below_range':
      return `Observation depth (${comparedDepth} m) is above the shallowest ${variableLabel} sample in this profile.`
    case 'above_range':
      return `Observation depth (${comparedDepth} m) is below the deepest ${variableLabel} sample in this profile.`
    case 'no_pairs':
      return `No overlapping model and observation ${variableLabel.toLowerCase()} samples for this platform.`
    case 'invalid_span':
      return 'Unable to interpolate — invalid depth span in profile data.'
    default:
      return null
  }
}

interface DepthInterpolationPanelProps {
  stats: ValidationStats
}

export function DepthInterpolationPanel({ stats }: DepthInterpolationPanelProps) {
  const meta = getVariableMeta(stats.variable)
  const bracketLabel =
    stats.modelLevelLower != null && stats.modelLevelUpper != null
      ? stats.modelLevelLower === stats.modelLevelUpper
        ? `${stats.modelLevelLower} m (exact level)`
        : `${stats.modelLevelLower} m / ${stats.modelLevelUpper} m`
      : 'N/A'

  const errorMsg = depthSampleErrorMessage(
    stats.depthSampleError,
    stats.comparedDepth,
    meta.label,
  )

  return (
    <div className="depth-interpolation">
      <h5 className="depth-interpolation__title">DEPTH COMPARISON</h5>
      <div className="depth-interpolation__grid">
        <div className="depth-interpolation__row">
          <span className="depth-interpolation__label">Observation depth</span>
          <span className="depth-interpolation__value">{stats.comparedDepth} m</span>
        </div>
        <div className="depth-interpolation__row">
          <span className="depth-interpolation__label">Model levels</span>
          <span className="depth-interpolation__value">{bracketLabel}</span>
        </div>
        {stats.mapModelDepth != null ? (
          <div className="depth-interpolation__row">
            <span className="depth-interpolation__label">Map model slice</span>
            <span className="depth-interpolation__value">{stats.mapModelDepth} m</span>
          </div>
        ) : null}
        <div className="depth-interpolation__row">
          <span className="depth-interpolation__label">Interpolated model value</span>
          <span className="depth-interpolation__value depth-interpolation__value--accent">
            {stats.model != null
              ? formatVariableValue(stats.model, stats.variable)
              : 'Unavailable'}
          </span>
        </div>
        <div className="depth-interpolation__row">
          <span className="depth-interpolation__label">Observation value</span>
          <span className="depth-interpolation__value">
            {stats.observation != null
              ? formatVariableValue(stats.observation, stats.variable)
              : 'Unavailable'}
          </span>
        </div>
      </div>
      {stats.depthMatch === 'interpolated' ? (
        <p className="depth-interpolation__note depth-interpolation__note--highlight">
          Model value interpolated to observation depth
        </p>
      ) : stats.depthMatch === 'exact' ? (
        <p className="depth-interpolation__note">Compared at exact profile depth level</p>
      ) : null}
      {errorMsg ? (
        <p className="depth-interpolation__note depth-interpolation__note--error">{errorMsg}</p>
      ) : null}
    </div>
  )
}
