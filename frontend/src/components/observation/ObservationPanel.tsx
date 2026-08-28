import type { AnalysisMode, RegionValidationStats, SpatialAnalysisSnapshot } from '../../types/analysis'
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
  apiModelDepth: number
  selectedDate: string
  onClearSelection?: () => void
  analysisMode: AnalysisMode
  regionValidation: RegionValidationStats | null
  spatialProfilesLoading: boolean
  spatialProfilesError: string | null
  selectedDepth: number
  spatialAnalysis: SpatialAnalysisSnapshot | null
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
  apiModelDepth,
  selectedDate,
  onClearSelection,
  analysisMode,
  regionValidation,
  spatialProfilesLoading,
  spatialProfilesError,
  selectedDepth,
  spatialAnalysis,
}: ObservationPanelProps) {
  const isRegionalValidation = analysisMode === 'regionalValidation'
  const showAnalysisSummary = analysisMode !== 'model'
  const showEmpty =
    !selectedInstrumentId &&
    !profileLoading &&
    !profileError &&
    !showAnalysisSummary
  const showDetails =
    !profileLoading &&
    !profileError &&
    selectedInstrument !== null &&
    profile !== null

  const selectedSpatialPoint =
    selectedInstrumentId && spatialAnalysis
      ? spatialAnalysis.points.find((p) => p.instrumentId === selectedInstrumentId) ?? null
      : null

  return (
    <div className="observation-panel">
      <h2 className="panel-title">OBSERVATION</h2>
      {showAnalysisSummary && regionValidation ? (
        <RegionValidationPanel
          stats={regionValidation}
          loading={spatialProfilesLoading}
          error={spatialProfilesError}
          analysisMode={analysisMode}
          selectedDepth={selectedDepth}
          selectedDate={selectedDate}
          selectedVariable={selectedVariable}
          selectedPoint={selectedSpatialPoint}
          selectedPlatformLabel={selectedInstrument?.id ?? selectedInstrumentId}
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
          <p className="observation-empty__title">
            {isRegionalValidation
              ? 'Regional validation active'
              : 'Select an Argo Float or Glider'}
          </p>
          <p className="observation-empty__hint">
            {isRegionalValidation
              ? 'Click a platform marker to inspect its individual validation result.'
              : 'Click a platform in the ocean view to inspect its profile.'}
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
          analysisMode={analysisMode}
          apiModelDepth={apiModelDepth}
          selectedDate={selectedDate}
        />
      ) : null}
    </div>
  )
}
