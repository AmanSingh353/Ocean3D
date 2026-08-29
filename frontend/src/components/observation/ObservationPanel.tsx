import type { AnalysisMode, RegionValidationStats, SpatialAnalysisSnapshot } from '../../types/analysis'
import type { Instrument, InstrumentProfile, ValidationStats, OceanVariable } from '../../types/ocean'
import { InstrumentDetails } from './InstrumentDetails'
import { DemoDataBanner } from '../common/DemoDataBanner'
import { RegionValidationPanel } from './RegionValidationPanel'
import { VerticalSectionPanel } from './VerticalSectionPanel'
import type { TransectEndpoints } from '../../types/analysis'

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
  transect?: TransectEndpoints
  validationRegion?: import('../../data/validationRegions').ValidationRegionBounds
  verticalSectionSourceMode?: import('../../utils/verticalSectionData').VerticalSectionDisplayMode
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
  transect,
  validationRegion,
  verticalSectionSourceMode = 'model',
}: ObservationPanelProps) {
  const isRegionalValidation = analysisMode === 'regionalValidation'
  const isVerticalSection = analysisMode === 'verticalSection'
  const showAnalysisSummary = analysisMode !== 'model' && !isVerticalSection
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
      <DemoDataBanner compact />
      {isVerticalSection && transect ? (
        <VerticalSectionPanel
          variable={selectedVariable}
          date={selectedDate}
          transect={transect}
          selectedDepth={selectedDepth}
          sectionDisplayMode={verticalSectionSourceMode}
        />
      ) : null}
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
          apiModelDepth={apiModelDepth}
          spatialPoints={spatialAnalysis?.points}
          validationRegion={validationRegion}
        />
      ) : null}
      {profileLoading && (
        <div className="observation-empty">
          <p className="observation-empty__title">Loading observation...</p>
        </div>
      )}
      {profileError && !profileLoading && (
        <div className="observation-empty validation-error-state">
          <p className="observation-empty__title validation-error-state__title">
            Observation data unavailable
          </p>
          {selectedInstrumentId ? (
            <p className="observation-empty__hint validation-error-state__hint">
              Could not load demo profile for {selectedInstrumentId}. This is not a live INCOIS
              feed — check API connectivity or select another platform.
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
          selectedDepth={selectedDepth}
          apiModelDepth={apiModelDepth}
          selectedDate={selectedDate}
          onClearSelection={onClearSelection}
          analysisMode={analysisMode}
        />
      ) : null}
    </div>
  )
}
