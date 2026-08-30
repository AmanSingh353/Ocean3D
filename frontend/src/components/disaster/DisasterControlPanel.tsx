import type { OceanVariable } from '../../types/ocean'
import type { HazardCategoryId } from '../../types/hazard'
import type { ValidationRegionBounds } from '../../data/validationRegions'
import { HAZARD_CATEGORIES } from '../../data/hazardCategories'
import { HAZARD_REGION_PRESETS } from '../../data/hazardRegions'
import { VariableSelector } from '../controls/VariableSelector'
import { DepthControl } from '../controls/DepthControl'
import { LayerControls } from '../controls/LayerControls'
import { VisualizationControls } from '../controls/VisualizationControls'
import { Toggle } from '../common/Toggle'
import { RiskLegend } from './RiskLegend'

interface DisasterControlPanelProps {
  selectedVariable: OceanVariable
  onVariableChange: (v: OceanVariable) => void
  selectedDepth: number
  onDepthChange: (d: number) => void
  apiModelDepth: number
  availableDepths: number[]
  depthTicks: number[]
  hazardCategory: HazardCategoryId
  onHazardCategoryChange: (id: HazardCategoryId) => void
  hazardRegion: ValidationRegionBounds
  onHazardRegionChange: (region: ValidationRegionBounds) => void
  hazardOverlayEnabled: boolean
  onHazardOverlayChange: (enabled: boolean) => void
  modelLayerEnabled: boolean
  onModelLayerChange: (e: boolean) => void
  modelOpacity: number
  onModelOpacityChange: (o: number) => void
  showArgo: boolean
  onShowArgoChange: (s: boolean) => void
  showGliders: boolean
  onShowGlidersChange: (s: boolean) => void
  showCurrents: boolean
  onShowCurrentsChange: (s: boolean) => void
  verticalExaggeration: number
  onVerticalExaggerationChange: (v: number) => void
}

export function DisasterControlPanel({
  selectedVariable,
  onVariableChange,
  selectedDepth,
  onDepthChange,
  apiModelDepth,
  availableDepths,
  depthTicks,
  hazardCategory,
  onHazardCategoryChange,
  hazardRegion,
  onHazardRegionChange,
  hazardOverlayEnabled,
  onHazardOverlayChange,
  modelLayerEnabled,
  onModelLayerChange,
  modelOpacity,
  onModelOpacityChange,
  showArgo,
  onShowArgoChange,
  showGliders,
  onShowGlidersChange,
  showCurrents,
  onShowCurrentsChange,
  verticalExaggeration,
  onVerticalExaggerationChange,
}: DisasterControlPanelProps) {
  return (
    <div className="control-panel control-panel--disaster">
      <h2 className="panel-title">DISASTER MANAGEMENT</h2>
      <p className="control-panel__intro">
        Ocean-condition monitoring and hazard-indicator support — not an operational warning
        system.
      </p>

      <div className="control-block">
        <span className="control-block__label">Hazard category</span>
        <select
          className="hazard-category-select"
          value={hazardCategory}
          onChange={(e) => onHazardCategoryChange(e.target.value as HazardCategoryId)}
          aria-label="Hazard category"
        >
          {HAZARD_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
        <p className="control-block__hint">
          {HAZARD_CATEGORIES.find((c) => c.id === hazardCategory)?.description}
        </p>
      </div>

      <div className="control-divider" />

      <div className="control-block">
        <span className="control-block__label">Risk region</span>
        <select
          className="hazard-category-select"
          value={hazardRegion.id}
          onChange={(e) => {
            const next = HAZARD_REGION_PRESETS.find((r) => r.id === e.target.value)
            if (next) onHazardRegionChange({ ...next })
          }}
          aria-label="Risk region"
        >
          {HAZARD_REGION_PRESETS.map((region) => (
            <option key={region.id} value={region.id}>
              {region.label}
            </option>
          ))}
        </select>
      </div>

      <div className="control-divider" />

      <Toggle
        label="Hazard / risk overlay"
        checked={hazardOverlayEnabled}
        onChange={onHazardOverlayChange}
      />
      {hazardOverlayEnabled ? <RiskLegend compact /> : null}

      <div className="control-divider" />

      <VariableSelector value={selectedVariable} onChange={onVariableChange} />
      <div className="control-divider" />
      <DepthControl
        depth={selectedDepth}
        apiModelDepth={apiModelDepth}
        availableDepths={availableDepths}
        depthTicks={depthTicks}
        onChange={onDepthChange}
      />
      <div className="control-divider" />
      <LayerControls
        modelLayerEnabled={modelLayerEnabled}
        onModelLayerChange={onModelLayerChange}
        modelOpacity={modelOpacity}
        onModelOpacityChange={onModelOpacityChange}
        showArgo={showArgo}
        onShowArgoChange={onShowArgoChange}
        showGliders={showGliders}
        onShowGlidersChange={onShowGlidersChange}
        showCurrents={showCurrents}
        onShowCurrentsChange={onShowCurrentsChange}
      />
      <div className="control-divider" />
      <VisualizationControls
        verticalExaggeration={verticalExaggeration}
        onVerticalExaggerationChange={onVerticalExaggerationChange}
      />
    </div>
  )
}
