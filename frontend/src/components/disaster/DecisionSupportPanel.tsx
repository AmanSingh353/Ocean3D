import type { HazardAssessment } from '../../types/hazard'

interface DecisionSupportPanelProps {
  assessment: HazardAssessment | null
}

export function DecisionSupportPanel({ assessment }: DecisionSupportPanelProps) {
  if (!assessment) return null

  const hasGuidance =
    assessment.monitoringGuidance.length > 0 || assessment.dataLimitations.length > 0
  if (!hasGuidance) return null

  return (
    <div className="hazard-panel hazard-panel--decision">
      <h3 className="hazard-panel__title">Decision Support</h3>

      {assessment.monitoringGuidance.length > 0 ? (
        <>
          <h4 className="hazard-panel__subtitle">Monitoring guidance</h4>
          <ul className="hazard-explanation-list">
            {assessment.monitoringGuidance.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      ) : null}

      {assessment.dataLimitations.length > 0 ? (
        <>
          <h4 className="hazard-panel__subtitle">Data limitations</h4>
          <ul className="hazard-explanation-list hazard-explanation-list--muted">
            {assessment.dataLimitations.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
