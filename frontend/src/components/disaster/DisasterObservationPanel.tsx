import type { HazardAssessment } from '../../types/hazard'
import type { ValidationStats, Instrument, OceanVariable, InstrumentProfile } from '../../types/ocean'
import type { RegionValidationStats } from '../../types/analysis'
import { HazardStatusPanel } from './HazardStatusPanel'
import { HazardEventPanel } from './HazardEventPanel'
import { AnomalyPanel } from './AnomalyPanel'
import { HazardExplanation } from './HazardExplanation'
import { ValidationConfidencePanel } from './ValidationConfidencePanel'
import { InstrumentDetails } from '../observation/InstrumentDetails'

interface DisasterObservationPanelProps {
  assessment: HazardAssessment | null
  assessmentLoading?: boolean
  selectedInstrumentId: string | null
  selectedInstrument: Instrument | null
  selectedVariable: OceanVariable
  comparison: ValidationStats | null
  regionValidation: RegionValidationStats | null
  observationTime: string
  apiModelDepth: number
  selectedDate: string
  selectedDepth: number
  profileLoading?: boolean
  profileError?: string | null
  onClearSelection: () => void
  profile: InstrumentProfile | null
}

export function DisasterObservationPanel({
  assessment,
  assessmentLoading = false,
  selectedInstrumentId,
  selectedInstrument,
  selectedVariable,
  comparison,
  regionValidation,
  observationTime,
  apiModelDepth,
  selectedDate,
  selectedDepth,
  onClearSelection,
  profile,
}: DisasterObservationPanelProps) {
  return (
    <div className="observation-panel observation-panel--disaster">
      <h2 className="panel-title">HAZARD INTELLIGENCE</h2>

      <HazardStatusPanel assessment={assessment} loading={assessmentLoading} />
      <HazardEventPanel assessment={assessment} />
      <AnomalyPanel indicators={assessment?.indicators ?? []} />
      <HazardExplanation assessment={assessment} />
      <ValidationConfidencePanel
        assessment={assessment}
        comparison={comparison}
        regionValidation={regionValidation}
      />

      {selectedInstrumentId && selectedInstrument && profile ? (
        <>
          <div className="control-divider" />
          <h3 className="panel-subtitle">Observation validation</h3>
          <InstrumentDetails
            instrument={selectedInstrument}
            selectedVariable={selectedVariable}
            profile={profile}
            comparison={comparison}
            observationTime={observationTime}
            apiModelDepth={apiModelDepth}
            selectedDate={selectedDate}
            selectedDepth={selectedDepth}
            onClearSelection={onClearSelection}
            analysisMode="model"
          />
        </>
      ) : selectedInstrumentId ? (
        <p className="hazard-panel__hint">Loading platform profile...</p>
      ) : (
        <p className="hazard-panel__hint">
          Select an Argo or glider platform on the map to link hazard indicators with
          observation/model validation.
        </p>
      )}
    </div>
  )
}
