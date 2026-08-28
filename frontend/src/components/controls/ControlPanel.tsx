import type { OceanVariable } from '../../types/ocean'
import { VariableSelector } from './VariableSelector'
import { DepthControl } from './DepthControl'
import { LayerControls } from './LayerControls'
import { VisualizationControls } from './VisualizationControls'
import { ColorScaleControl } from './ColorScaleControl'
import { CurrentScaleControl } from './CurrentScaleControl'

interface ControlPanelProps {
  selectedVariable: OceanVariable
  onVariableChange: (v: OceanVariable) => void
  selectedDepth: number
  onDepthChange: (d: number) => void
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
  colorScaleMin: number
  colorScaleMax: number
  onColorScaleApply: (min: number, max: number) => void
  currentScaleMin?: number
  currentScaleMax?: number
}

export function ControlPanel(props: ControlPanelProps) {
  return (
    <div className="control-panel">
      <h2 className="panel-title">OCEAN CONTROLS</h2>
      <VariableSelector value={props.selectedVariable} onChange={props.onVariableChange} />
      <div className="control-divider" />
      <DepthControl depth={props.selectedDepth} onChange={props.onDepthChange} />
      <div className="control-divider" />
      <LayerControls
        modelLayerEnabled={props.modelLayerEnabled}
        onModelLayerChange={props.onModelLayerChange}
        modelOpacity={props.modelOpacity}
        onModelOpacityChange={props.onModelOpacityChange}
        showArgo={props.showArgo}
        onShowArgoChange={props.onShowArgoChange}
        showGliders={props.showGliders}
        onShowGlidersChange={props.onShowGlidersChange}
        showCurrents={props.showCurrents}
        onShowCurrentsChange={props.onShowCurrentsChange}
      />
      <div className="control-divider" />
      <VisualizationControls
        verticalExaggeration={props.verticalExaggeration}
        onVerticalExaggerationChange={props.onVerticalExaggerationChange}
      />
      <div className="control-divider" />
      {props.selectedVariable === 'temperature' ? (
        <ColorScaleControl min={props.colorScaleMin} max={props.colorScaleMax} onApply={props.onColorScaleApply} />
      ) : (
        <CurrentScaleControl
          minSpeed={props.currentScaleMin}
          maxSpeed={props.currentScaleMax}
        />
      )}
    </div>
  )
}
