import type { AnalysisMode } from '../../types/analysis'
import type { Instrument, InstrumentProfile, ValidationStats, OceanVariable } from '../../types/ocean'
import { DEMO_DATA_SHORT } from '../../data/validationData'
import { getVariableMeta, formatVariableValue } from '../../data/variableMeta'
import { getProfileSeries } from '../../services/oceanApi'
import { DemoDataBanner } from '../common/DemoDataBanner'
import { ProfileChart } from './ProfileChart'
import { ProfileVariableSummary } from './ProfileVariableSummary'
import { ComparisonStatsPanel } from './ComparisonStats'

interface InstrumentDetailsProps {
  instrument: Instrument
  profile: InstrumentProfile
  comparison: ValidationStats | null
  observationTime: string
  selectedVariable: OceanVariable
  selectedDepth: number
  apiModelDepth?: number
  selectedDate?: string
  onClearSelection?: () => void
  analysisMode: AnalysisMode
}

export function InstrumentDetails({
  instrument,
  profile,
  comparison,
  observationTime,
  selectedVariable,
  selectedDepth,
  onClearSelection,
  analysisMode,
  apiModelDepth,
  selectedDate,
}: InstrumentDetailsProps) {
  const typeLabel = instrument.type === 'argo' ? 'ARGO FLOAT' : 'GLIDER'
  const latDir = instrument.latitude >= 0 ? 'N' : 'S'
  const lonDir = instrument.longitude >= 0 ? 'E' : 'W'
  const profileSeries = getProfileSeries(profile, selectedVariable)
  const variableMeta = getVariableMeta(selectedVariable)

  return (
    <div className="instrument-details">
      <DemoDataBanner compact />

      <section className="detail-section detail-section--header detail-section--selected">
        <div className="detail-section__row">
          <div>
            <div className="platform-badge">{typeLabel}</div>
            <div className="platform-name">{instrument.id}</div>
          </div>
          {onClearSelection ? (
            <button
              type="button"
              className="btn btn--ghost btn--compact"
              onClick={onClearSelection}
              aria-label="Clear platform selection"
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className="selected-platform-summary">
          <div className="selected-platform-summary__row">
            <span className="selected-platform-summary__label">Platform type</span>
            <span>{instrument.platformType}</span>
          </div>
          <div className="selected-platform-summary__row">
            <span className="selected-platform-summary__label">Position</span>
            <span>
              {Math.abs(instrument.latitude).toFixed(2)}° {latDir} ·{' '}
              {Math.abs(instrument.longitude).toFixed(2)}° {lonDir}
            </span>
          </div>
          <div className="selected-platform-summary__row">
            <span className="selected-platform-summary__label">Variable</span>
            <span>
              {variableMeta.label} ({variableMeta.unit})
            </span>
          </div>
          <div className="selected-platform-summary__row">
            <span className="selected-platform-summary__label">Selected depth</span>
            <span>{selectedDepth} m</span>
          </div>
          {comparison?.observation != null ? (
            <div className="selected-platform-summary__row selected-platform-summary__row--highlight">
              <span className="selected-platform-summary__label">Observation</span>
              <span>
                {formatVariableValue(comparison.observation, selectedVariable)}
              </span>
            </div>
          ) : (
            <div className="selected-platform-summary__row">
              <span className="selected-platform-summary__label">Observation</span>
              <span className="selected-platform-summary__na">
                Unavailable at {selectedDepth} m
              </span>
            </div>
          )}
          <div className="selected-platform-summary__row">
            <span className="selected-platform-summary__label">Data quality</span>
            <span className="detail-value detail-value--good">{instrument.dataQuality}</span>
          </div>
        </div>
      </section>

      {profileSeries ? (
        <section className="detail-section">
          <ProfileChart
            series={profileSeries}
            maxDepth={instrument.maxDepth}
            selectedDepth={selectedDepth}
          />
          <ProfileVariableSummary
            profile={profile}
            selectedDepth={selectedDepth}
            selectedVariable={selectedVariable}
          />
        </section>
      ) : (
        <section className="detail-section">
          <div className="validation-error-state">
            <h4 className="subsection-title">VERTICAL PROFILE</h4>
            <p className="validation-error-state__title">Missing variable data</p>
            <p className="validation-error-state__hint">
              No {variableMeta.label.toLowerCase()} ({variableMeta.unit}) profile samples are
              available for this demo platform.
            </p>
          </div>
        </section>
      )}

      {comparison ? (
        <section className="detail-section">
          <ComparisonStatsPanel
            stats={comparison}
            analysisMode={analysisMode}
            apiModelDepth={apiModelDepth}
            selectedDate={selectedDate}
          />
        </section>
      ) : profileSeries ? (
        <section className="detail-section">
          <div className="validation-error-state">
            <h4 className="subsection-title">VALIDATION</h4>
            <p className="validation-error-state__title">Validation unavailable</p>
            <p className="validation-error-state__hint">
              No overlapping model and observation {variableMeta.label.toLowerCase()} samples
              exist for this platform. Metrics cannot be computed.
            </p>
          </div>
        </section>
      ) : null}

      <section className="detail-section">
        <h4 className="subsection-title">PLATFORM DETAILS</h4>
        <p className="control-hint control-hint--demo">{DEMO_DATA_SHORT}</p>
        <div className="detail-row">
          <span className="detail-label">Platform ID:</span>
          <span className="detail-value">{instrument.id}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className="detail-value detail-value--active">{instrument.status}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Maximum depth:</span>
          <span className="detail-value">{instrument.maxDepth} m</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Last observation:</span>
          <span className="detail-value detail-value--wrap">
            {observationTime
              ? observationTime.split('\n').map((line) => <span key={line}>{line}<br /></span>)
              : 'N/A'}
          </span>
        </div>
      </section>
    </div>
  )
}
