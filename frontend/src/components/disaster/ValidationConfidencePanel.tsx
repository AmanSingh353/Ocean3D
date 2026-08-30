import { DEMO_VALIDATION_CONFIDENCE_RULES_DISCLAIMER } from '../../utils/hazardValidationConfidence'
import type { HazardAssessment } from '../../types/hazard'
import type { ValidationStats } from '../../types/ocean'
import type { RegionValidationStats } from '../../types/analysis'

interface ValidationConfidencePanelProps {
  assessment: HazardAssessment | null
  comparison: ValidationStats | null
  regionValidation: RegionValidationStats | null
}

export function ValidationConfidencePanel({
  assessment,
  comparison,
  regionValidation,
}: ValidationConfidencePanelProps) {
  const hasPointValidation = comparison != null && comparison.matchedPoints > 0
  const hasRegionalValidation = regionValidation != null && regionValidation.matchedPlatforms > 0

  if (!hasPointValidation && !hasRegionalValidation && !assessment) return null

  return (
    <div className="hazard-panel hazard-panel--validation">
      <h3 className="hazard-panel__title">Model / Data Confidence</h3>
      <p className="hazard-panel__subtitle">{DEMO_VALIDATION_CONFIDENCE_RULES_DISCLAIMER}</p>

      {assessment?.validationQuality ? (
        <p className="validation-confidence__quality">
          Validation quality:{' '}
          <strong>{assessment.validationQuality}</strong>
        </p>
      ) : (
        <p className="validation-confidence__quality">Validation quality: not assessed</p>
      )}

      <p className="hazard-panel__note">
        Validation quality affects confidence in hazard indicators. RMSE is not converted to an
        arbitrary confidence percentage.
      </p>

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
