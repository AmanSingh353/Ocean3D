import type { AnalysisMode } from '../../types/analysis'
import type { Instrument, InstrumentProfile, ValidationStats, OceanVariable } from '../../types/ocean'
import { getVariableMeta } from '../../data/variableMeta'
import { getProfileSeries } from '../../services/oceanApi'
import { ProfileChart } from './ProfileChart'
import { ComparisonStatsPanel } from './ComparisonStats'

interface InstrumentDetailsProps {
  instrument: Instrument
  profile: InstrumentProfile
  comparison: ValidationStats | null
  observationTime: string
  selectedVariable: OceanVariable
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
      <section className="detail-section detail-section--header">
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
        <div className="detail-row">
          <span className="detail-label">Platform ID:</span>
          <span className="detail-value">{instrument.id}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Variable:</span>
          <span className="detail-value">{variableMeta.label} ({variableMeta.unit})</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className="detail-value detail-value--active">{instrument.status}</span>
        </div>
      </section>
      <section className="detail-section">
        <h4 className="subsection-title">LOCATION</h4>
        <div className="detail-coords">
          {Math.abs(instrument.latitude).toFixed(1)}° {latDir}<br />
          {Math.abs(instrument.longitude).toFixed(1)}° {lonDir}
        </div>
      </section>
      <section className="detail-section">
        <h4 className="subsection-title">DEPTH</h4>
        <div className="detail-row">
          <span className="detail-label">Current depth:</span>
          <span className="detail-value">{instrument.currentDepth} m</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Maximum depth:</span>
          <span className="detail-value">{instrument.maxDepth} m</span>
        </div>
      </section>
      <section className="detail-section">
        <h4 className="subsection-title">TIME</h4>
        <div className="detail-coords">
          {observationTime
            ? observationTime.split('\n').map((line) => <span key={line}>{line}<br /></span>)
            : 'N/A'}
        </div>
      </section>
      {profileSeries ? (
        <section className="detail-section">
          <ProfileChart series={profileSeries} maxDepth={instrument.maxDepth} />
        </section>
      ) : (
        <section className="detail-section">
          <p className="control-hint">
            No {variableMeta.label.toLowerCase()} profile data available for this platform.
          </p>
        </section>
      )}
      {comparison ? (
        <ComparisonStatsPanel
          stats={comparison}
          analysisMode={analysisMode}
          apiModelDepth={apiModelDepth}
          selectedDate={selectedDate}
        />
      ) : (
        <section className="detail-section">
          <p className="control-hint">
            Validation metrics unavailable — no overlapping model and observation samples for{' '}
            {variableMeta.label.toLowerCase()} at this platform.
          </p>
        </section>
      )}
      <section className="detail-section">
        <h4 className="subsection-title">PLATFORM DETAILS</h4>
        <div className="detail-row">
          <span className="detail-label">Type:</span>
          <span className="detail-value">{instrument.platformType}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Data quality:</span>
          <span className="detail-value detail-value--good">{instrument.dataQuality}</span>
        </div>
      </section>
    </div>
  )
}
