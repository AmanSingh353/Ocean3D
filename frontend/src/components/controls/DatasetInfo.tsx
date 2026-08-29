import { DEMO_DATA_SHORT } from '../../data/validationData'
import type { OceanVariable } from '../../types/ocean'
import { getVariableMeta } from '../../data/variableMeta'
import { formatDisplayDate } from '../../utils/dateFormat'

interface DatasetInfoProps {
  selectedVariable: OceanVariable
  selectedDepth: number
  apiModelDepth: number
  selectedDate: string
  observationDate?: string
  analysisMode: string
  regionLabel?: string
}

export function DatasetInfo({
  selectedVariable,
  selectedDepth,
  apiModelDepth,
  selectedDate,
  observationDate,
  analysisMode,
  regionLabel = 'Indian Ocean Model',
}: DatasetInfoProps) {
  const meta = getVariableMeta(selectedVariable)
  const depthNote =
    selectedDepth !== apiModelDepth
      ? `${selectedDepth} m (model slice: ${apiModelDepth} m)`
      : `${selectedDepth} m`

  return (
    <div className="dataset-info">
      <h3 className="control-section-title">DATA INFORMATION</h3>
      <p className="control-hint control-hint--demo dataset-info__disclaimer">{DEMO_DATA_SHORT}</p>
      <div className="dataset-info__grid">
        <div className="dataset-info__row">
          <span className="dataset-info__label">Dataset</span>
          <span className="dataset-info__value">Ocean Model (Demo Synthetic)</span>
        </div>
        <div className="dataset-info__row">
          <span className="dataset-info__label">Region</span>
          <span className="dataset-info__value">{regionLabel}</span>
        </div>
        <div className="dataset-info__row">
          <span className="dataset-info__label">Variable</span>
          <span className="dataset-info__value">{meta.label}</span>
        </div>
        <div className="dataset-info__row">
          <span className="dataset-info__label">Units</span>
          <span className="dataset-info__value">{meta.unit}</span>
        </div>
        <div className="dataset-info__row">
          <span className="dataset-info__label">Depth</span>
          <span className="dataset-info__value">{depthNote}</span>
        </div>
        <div className="dataset-info__row">
          <span className="dataset-info__label">Model date</span>
          <span className="dataset-info__value">{formatDisplayDate(selectedDate)}</span>
        </div>
        <div className="dataset-info__row">
          <span className="dataset-info__label">Observation date</span>
          <span className="dataset-info__value">
            {observationDate ? formatDisplayDate(observationDate) : formatDisplayDate(selectedDate)}
          </span>
        </div>
        <div className="dataset-info__row">
          <span className="dataset-info__label">Spatial resolution</span>
          <span className="dataset-info__value">1° × 1° (demo grid)</span>
        </div>
        <div className="dataset-info__row">
          <span className="dataset-info__label">Temporal resolution</span>
          <span className="dataset-info__value">Daily (5 timesteps)</span>
        </div>
        <div className="dataset-info__row">
          <span className="dataset-info__label">Analysis mode</span>
          <span className="dataset-info__value">{analysisMode}</span>
        </div>
      </div>
    </div>
  )
}
