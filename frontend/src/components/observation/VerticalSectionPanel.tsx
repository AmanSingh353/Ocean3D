import type { OceanVariable } from '../../types/ocean'
import { DEMO_DATA_SHORT } from '../../data/validationData'
import { DemoDataBanner } from '../common/DemoDataBanner'
import { getVariableMeta } from '../../data/variableMeta'
import { formatDisplayDate } from '../../utils/dateFormat'
import type { TransectSpec } from '../../utils/verticalSectionData'
import type { VerticalSectionDisplayMode } from '../../utils/verticalSectionData'

interface VerticalSectionPanelProps {
  variable: OceanVariable
  date: string
  transect: TransectSpec
  selectedDepth: number
  sectionDisplayMode: VerticalSectionDisplayMode
}

const SECTION_MODE_LABELS: Record<VerticalSectionDisplayMode, string> = {
  model: 'Model',
  observation: 'Observation',
  difference: 'Difference (Model − Observation)',
  absoluteError: 'Absolute Error',
}

export function VerticalSectionPanel({
  variable,
  date,
  transect,
  selectedDepth,
  sectionDisplayMode,
}: VerticalSectionPanelProps) {
  const meta = getVariableMeta(variable)

  return (
    <div className="vertical-section-panel vertical-section-panel--sidebar">
      <h4 className="subsection-title">VERTICAL SECTION</h4>
      <DemoDataBanner compact />
      <p className="control-hint">
        Cross-section in the central panel: depth ↓ vs distance →. Color = {meta.label} (
        {meta.unit}).
      </p>
      <div className="vertical-section-panel__meta">
        <div className="vertical-section-panel__meta-row">
          <span className="vertical-section-panel__meta-label">Variable</span>
          <span>{meta.label} ({meta.unit})</span>
        </div>
        <div className="vertical-section-panel__meta-row">
          <span className="vertical-section-panel__meta-label">Display</span>
          <span>{SECTION_MODE_LABELS[sectionDisplayMode]}</span>
        </div>
        <div className="vertical-section-panel__meta-row">
          <span className="vertical-section-panel__meta-label">Depth highlight</span>
          <span>{selectedDepth} m</span>
        </div>
        <div className="vertical-section-panel__meta-row">
          <span className="vertical-section-panel__meta-label">Date</span>
          <span>{formatDisplayDate(date)}</span>
        </div>
        <div className="vertical-section-panel__meta-row">
          <span className="vertical-section-panel__meta-label">Start</span>
          <span>
            {transect.start.lat.toFixed(2)}°N, {transect.start.lon.toFixed(2)}°E
          </span>
        </div>
        <div className="vertical-section-panel__meta-row">
          <span className="vertical-section-panel__meta-label">End</span>
          <span>
            {transect.end.lat.toFixed(2)}°N, {transect.end.lon.toFixed(2)}°E
          </span>
        </div>
      </div>
      <p className="control-hint control-hint--demo">{DEMO_DATA_SHORT}</p>
    </div>
  )
}

export { DEFAULT_TRANSECT } from '../../utils/verticalSectionData'
