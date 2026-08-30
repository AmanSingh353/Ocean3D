import type { HazardAssessment } from '../../types/hazard'

interface HazardExplanationProps {
  assessment: HazardAssessment | null
}

export function HazardExplanation({ assessment }: HazardExplanationProps) {
  if (!assessment || assessment.whyFlagged.length === 0) return null

  return (
    <div className="hazard-panel hazard-panel--explanation">
      <h3 className="hazard-panel__title">Why is this area flagged?</h3>
      <ul className="hazard-explanation-list">
        {assessment.whyFlagged.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  )
}
