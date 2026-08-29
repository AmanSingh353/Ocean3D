import { useMemo } from 'react'
import type { InstrumentProfile, OceanVariable } from '../../types/ocean'
import { getVariableMeta, formatVariableValue } from '../../data/variableMeta'
import { extractMatchedPairs } from '../../utils/validationMetrics'
import { sampleAtDepthWithMeta } from '../../utils/sampleAtDepth'

const PROFILE_VARIABLES: OceanVariable[] = [
  'temperature',
  'salinity',
  'current',
  'chlorophyll',
]

interface ProfileVariableSummaryProps {
  profile: InstrumentProfile
  selectedDepth: number
  selectedVariable: OceanVariable
}

export function ProfileVariableSummary({
  profile,
  selectedDepth,
  selectedVariable,
}: ProfileVariableSummaryProps) {
  const rows = useMemo(
    () =>
      PROFILE_VARIABLES.map((variable) => {
        const pairs = extractMatchedPairs(profile, variable)
        const outcome = sampleAtDepthWithMeta(pairs, selectedDepth)
        const sample = outcome.result
        const meta = getVariableMeta(variable)
        return {
          variable,
          label: meta.label,
          unit: meta.unit,
          model: sample?.model ?? null,
          observation: sample?.observation ?? null,
          depthMatch: sample?.depthMatch ?? null,
          error: outcome.failure,
          active: variable === selectedVariable,
        }
      }),
    [profile, selectedDepth, selectedVariable],
  )

  return (
    <div className="profile-var-summary">
      <h4 className="subsection-title subsection-title--compact">
        VARIABLES AT {selectedDepth} m
      </h4>
      <div className="profile-var-summary__grid">
        {rows.map((row) => (
          <div
            key={row.variable}
            className={`profile-var-summary__item ${row.active ? 'profile-var-summary__item--active' : ''}`}
          >
            <span className="profile-var-summary__label">
              {row.label} ({row.unit})
            </span>
            <span className="profile-var-summary__value">
              {row.model != null && row.observation != null ? (
                <>
                  <span className="profile-var-summary__line profile-var-summary__line--model">
                    Model {formatVariableValue(row.model, row.variable)}
                  </span>
                  <span className="profile-var-summary__line profile-var-summary__line--obs">
                    Obs {formatVariableValue(row.observation, row.variable)}
                  </span>
                  {row.depthMatch === 'interpolated' ? (
                    <span className="profile-var-summary__interp">interpolated</span>
                  ) : null}
                </>
              ) : row.error === 'below_range' || row.error === 'above_range' ? (
                <span className="profile-var-summary__na">Outside profile range</span>
              ) : (
                <span className="profile-var-summary__na">No matched data</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
