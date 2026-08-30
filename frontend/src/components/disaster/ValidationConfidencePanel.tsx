import { DEMO_VALIDATION_CONFIDENCE_RULES_DISCLAIMER } from '../../data/hazardThresholds'
import type { HazardAssessment } from '../../types/hazard'
import type { ValidationStats } from '../../types/ocean'
import type { RegionValidationStats } from '../../types/analysis'

interface ValidationConfidencePanelProps {
  assessment: HazardAssessment | null
  comparison: ValidationStats | null
  regionValidation: RegionValidationStats | null
  hazardVariableMatch: boolean
}

export function ValidationConfidencePanel({
  assessment,
  comparison,
  regionValidation,
  hazardVariableMatch,
}: ValidationConfidencePanelProps) {
  const hasPointValidation = comparison != null && comparison.matchedPoints > 0
  const hasRegionalValidation = regionValidation != null && regionValidation.matchedPlatforms > 0

  if (!hasPointValidation && !hasRegionalValidation && !assessment) return null

  return (
    <div className="hazard-panel hazard-panel--validation">
      <h3 className="hazard-panel__title">Model / Data Confidence</h3>
      <p className="hazard-panel__subtitle">{DEMO_VALIDATION_CONFIDENCE_RULES_DISCLAIMER}</p>

      {assessment ? (
        <p className="validation-confidence__quality">
          Confidence:{' '}
          <strong>
            {assessment.confidence === 'NOT_ASSESSED'
              ? 'Not available'
              : assessment.confidence}
          </strong>
        </p>
      ) : (
        <p className="validation-confidence__quality">Confidence: not available</p>
      )}

      {assessment?.validationStatus ? (
        <p className="hazard-panel__note">
          Validation quality: {assessment.validationStatus}
        </p>
      ) : null}

      <p className="hazard-panel__note">{assessment?.confidenceNote}</p>

      {!hazardVariableMatch && comparison ? (
        <p className="hazard-panel__note">
          Selected platform validation is for a different variable than the active hazard
          indicator — regional hazard confidence is limited.
        </p>
      ) : null}

      {hasPointValidation && comparison ? (
        <dl className="validation-confidence__metrics">
          <div>
            <dt>Platform validation</dt>
            <dd>{comparison.validationStatus}</dd>
          </div>
          <div>
            <dt>RMSE</dt>
            <dd>
              {comparison.rmse} {comparison.unit}
            </dd>
          </div>
          <div>
            <dt>MAE</dt>
            <dd>
              {comparison.mae} {comparison.unit}
            </dd>
          </div>
          {comparison.bias != null ? (
            <div>
              <dt>Bias</dt>
              <dd>
                {comparison.bias} {comparison.unit}
              </dd>
            </div>
          ) : null}
          {comparison.correlation != null ? (
            <div>
              <dt>Correlation</dt>
              <dd>{comparison.correlation}</dd>
            </div>
          ) : null}
          <div>
            <dt>Matched points</dt>
            <dd>{comparison.matchedPoints}</dd>
          </div>
        </dl>
      ) : null}

      {hasRegionalValidation && regionValidation ? (
        <dl className="validation-confidence__metrics">
          <div>
            <dt>Regional validation</dt>
            <dd>{regionValidation.validationStatus}</dd>
          </div>
          <div>
            <dt>RMSE</dt>
            <dd>
              {regionValidation.rmse} {regionValidation.unit}
            </dd>
          </div>
          <div>
            <dt>Matched platforms</dt>
            <dd>{regionValidation.matchedPlatforms}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  )
}
