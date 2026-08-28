import type { AnalysisMode, RegionValidationStats } from '../../types/analysis'
import type { Instrument, InstrumentProfile, ValidationStats, OceanVariable } from '../../types/ocean'
import { InstrumentDetails } from './InstrumentDetails'
import { RegionValidationPanel } from './RegionValidationPanel'

interface ObservationPanelProps {
  selectedInstrumentId: string | null
  selectedInstrument: Instrument | null
  selectedVariable: OceanVariable
  profile: InstrumentProfile | null
  comparison: ValidationStats | null
  observationTime: string
  profileLoading: boolean
  profileError: string | null
  onClearSelection?: () => void
  analysisMode: AnalysisMode
  regionValidation: RegionValidationStats | null
  spatialProfilesLoading: boolean
  spatialProfilesError: string | null
}

export function ObservationPanel({
  selectedInstrumentId,
  selectedInstrument,
  selectedVariable,
  profile,
  comparison,
  observationTime,
  profileLoading,
  profileError,
  onClearSelection,
  analysisMode,
  regionValidation,
  spatialProfilesLoading,
  spatialProfilesError,
}: ObservationPanelProps) {
  const showAnalysisSummary = analysisMode !== 'model'
  const showEmpty =
    !selectedInstrumentId && !profileLoading && !profileError && !showAnalysisSummary
  const showDetails =
    !profileLoading &&
    !profileError &&
    selectedInstrument !== null &&
    profile !== null

  return (
    <div className="observation-panel">
      <h2 className="panel-title">OBSERVATION</h2>
      {showAnalysisSummary && regionValidation ? (
        <RegionValidationPanel
          stats={regionValidation}
          loading={spatialProfilesLoading}
          error={spatialProfilesError}
        />
      ) : null}
      {profileLoading && (
        <div className="observation-empty">
          <p className="observation-empty__title">Loading observation...</p>
        </div>
      )}
      {profileError && !profileLoading && (
        <div className="observation-empty">
          <p className="observation-empty__title">Observation data unavailable</p>
          {selectedInstrumentId ? (
            <p className="observation-empty__hint">
              Could not load profile for {selectedInstrumentId}.
            </p>
          ) : null}
          {onClearSelection ? (
            <button type="button" className="btn btn--ghost" onClick={onClearSelection}>
              Clear selection
            </button>
          ) : null}
        </div>
      )}
      {showEmpty ? (
        <div className="observation-empty">
          <p className="observation-empty__title">Select an Argo Float or Glider</p>
          <p className="observation-empty__hint">
            Click a platform in the ocean view to inspect its profile.
          </p>
        </div>
      ) : null}
      {showDetails ? (
        <InstrumentDetails
          instrument={selectedInstrument}
          profile={profile}
          comparison={comparison}
          observationTime={observationTime}
          selectedVariable={selectedVariable}
          onClearSelection={onClearSelection}
        />
      ) : null}
    </div>
  )
}
