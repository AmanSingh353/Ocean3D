import { listHazardDefinitions } from '../../hazards/registry'

import { getPrimaryOceanVariable } from '../../hazards/registry'

import { getHazardDefinition } from '../../hazards/registry'

import { getVariableMeta } from '../../data/variableMeta'

import { HAZARD_REGION_PRESETS } from '../../data/hazardRegions'

import type { HazardDataAvailability, HazardId } from '../../types/hazard'

import type { ValidationRegionBounds } from '../../data/validationRegions'

import { DepthControl } from '../controls/DepthControl'

import { LayerControls } from '../controls/LayerControls'

import { VisualizationControls } from '../controls/VisualizationControls'

import { Toggle } from '../common/Toggle'

import { RiskLegend } from './RiskLegend'



interface DisasterControlPanelProps {

  selectedDepth: number

  onDepthChange: (d: number) => void

  apiModelDepth: number

  availableDepths: number[]

  depthTicks: number[]

  hazardId: HazardId

  onHazardIdChange: (id: HazardId) => void

  hazardRegion: ValidationRegionBounds

  onHazardRegionChange: (region: ValidationRegionBounds) => void

  dataAvailability: HazardDataAvailability

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

  selectedDepth,

  onDepthChange,

  apiModelDepth,

  availableDepths,

  depthTicks,

  hazardId,

  onHazardIdChange,

  hazardRegion,

  onHazardRegionChange,

  dataAvailability,

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

  const definitions = listHazardDefinitions()

  const definition = getHazardDefinition(hazardId)

  const primaryVar = getPrimaryOceanVariable(definition)

  const requiredMeta = primaryVar ? getVariableMeta(primaryVar) : null



  return (

    <div className="control-panel control-panel--disaster">

      <h2 className="panel-title">DISASTER MANAGEMENT</h2>

      <p className="control-panel__intro">

        Multi-hazard intelligence — demo thresholds, not operational warnings.

      </p>



      <div className="control-block">

        <span className="control-block__label">Hazard type</span>

        <select

          className="hazard-category-select"

          value={hazardId}

          onChange={(e) => onHazardIdChange(e.target.value as HazardId)}

          aria-label="Hazard type"

        >

          {definitions.map((def) => (

            <option key={def.id} value={def.id}>

              {def.name}

              {def.architectureOnly ? ' (architecture)' : ''}

            </option>

          ))}

        </select>

        <p className="control-block__hint">{definition.description}</p>

      </div>



      <div className="control-divider" />



      <div className="control-block">

        <span className="control-block__label">Required ocean variable</span>

        <p className="hazard-variable-lock">

          {dataAvailability.requiredVariable}

        </p>

      </div>



      <div className="control-block">

        <span className="control-block__label">Data status</span>

        <p

          className={`hazard-variable-lock${dataAvailability.available ? '' : ' control-block__hint--warn'}`}

        >

          <strong>{dataAvailability.statusLabel}</strong>

        </p>

        {!dataAvailability.available && dataAvailability.missingRequirements.length > 0 ? (

          <p className="control-block__hint control-block__hint--warn">

            Missing: {dataAvailability.missingRequirements.join(', ')}

          </p>

        ) : null}

        {!dataAvailability.available ? (

          <p className="control-block__hint">{dataAvailability.message}</p>

        ) : null}

      </div>



      {dataAvailability.available && requiredMeta ? (

        <div className="control-block">

          <span className="control-block__label">Analyzing</span>

          <p className="hazard-variable-lock">

            <strong>{requiredMeta.label}</strong>

          </p>

          <p className="control-block__hint">

            Map and hazard engine use the same loaded {requiredMeta.label} field.

          </p>

        </div>

      ) : null}



      {definition.architectureOnly ? (

        <p className="control-block__hint control-block__hint--warn">

          Architecture only — connect external dataset to enable analysis.

        </p>

      ) : null}



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



      {definition.supportsDepth ? (

        <>

          <div className="control-divider" />

          <DepthControl

            depth={selectedDepth}

            apiModelDepth={apiModelDepth}

            availableDepths={availableDepths}

            depthTicks={depthTicks}

            onChange={onDepthChange}

          />

        </>

      ) : null}



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

