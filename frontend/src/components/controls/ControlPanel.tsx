import type { OceanVariable } from '../../types/ocean'
import type { AnalysisMode } from '../../types/analysis'
import { VariableSelector } from './VariableSelector'
import { DepthControl } from './DepthControl'
import { LayerControls } from './LayerControls'
import { VisualizationControls } from './VisualizationControls'
import { ColorScaleControl } from './ColorScaleControl'
import { CurrentScaleControl } from './CurrentScaleControl'
import { SalinityScaleControl } from './SalinityScaleControl'
import { ChlorophyllScaleControl } from './ChlorophyllScaleControl'
import { AnalysisModeControl } from './AnalysisModeControl'

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
  salinityScaleMin?: number
  salinityScaleMax?: number
  chlorophyllScaleMin?: number
  chlorophyllScaleMax?: number
  analysisMode: AnalysisMode
  onAnalysisModeChange: (mode: AnalysisMode) => void
  apiModelDepth: number
  availableDepths: number[]
  depthTicks: number[]
}

export function ControlPanel(props: ControlPanelProps) {
  return (
    <div className="control-panel">
      <h2 className="panel-title">OCEAN CONTROLS</h2>
      <VariableSelector value={props.selectedVariable} onChange={props.onVariableChange} />
      <div className="control-divider" />
      <DepthControl
        depth={props.selectedDepth}
        apiModelDepth={props.apiModelDepth}
        selectedVariable={props.selectedVariable}
        availableDepths={props.availableDepths}
        depthTicks={props.depthTicks}
        onChange={props.onDepthChange}
      />
      <div className="control-divider" />
      <AnalysisModeControl value={props.analysisMode} onChange={props.onAnalysisModeChange} />
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
      ) : props.selectedVariable === 'current' ? (
        <CurrentScaleControl
          minSpeed={props.currentScaleMin}
          maxSpeed={props.currentScaleMax}
        />
      ) : props.selectedVariable === 'salinity' ? (
        <SalinityScaleControl
          minPsu={props.salinityScaleMin}
          maxPsu={props.salinityScaleMax}
        />
      ) : (
        <ChlorophyllScaleControl
          minChl={props.chlorophyllScaleMin}
          maxChl={props.chlorophyllScaleMax}
        />
      )}
    </div>
  )
}
