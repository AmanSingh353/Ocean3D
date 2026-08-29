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
import { ValidationRegionControl } from './ValidationRegionControl'
import { DatasetInfo } from './DatasetInfo'
import { TransectControl } from './TransectControl'
import type { ValidationRegionBounds, TransectEndpoints } from '../../types/analysis'

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
  validationRegion?: ValidationRegionBounds
  onValidationRegionChange?: (region: ValidationRegionBounds) => void
  regionPickActive?: boolean
  onToggleRegionPick?: () => void
  regionPickHint?: string | null
  transect?: TransectEndpoints
  transectPickActive?: boolean
  transectPickHint?: string | null
  onToggleTransectPick?: () => void
  onResetTransect?: () => void
  onBackToMap?: () => void
  validationLayerEnabled?: boolean
  onValidationLayerChange?: (enabled: boolean) => void
  apiModelDepth: number
  availableDepths: number[]
  depthTicks: number[]
  selectedDate?: string
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
        availableDepths={props.availableDepths}
        depthTicks={props.depthTicks}
        onChange={props.onDepthChange}
      />
      <div className="control-divider" />
      <AnalysisModeControl value={props.analysisMode} onChange={props.onAnalysisModeChange} />
      {props.analysisMode === 'regionalValidation' &&
      props.validationRegion &&
      props.onValidationRegionChange &&
      props.onToggleRegionPick ? (
        <>
          <div className="control-divider" />
          <ValidationRegionControl
            region={props.validationRegion}
            onRegionChange={props.onValidationRegionChange}
            regionPickActive={props.regionPickActive ?? false}
            onToggleRegionPick={props.onToggleRegionPick}
            pickHint={props.regionPickHint}
          />
        </>
      ) : null}
      {props.analysisMode === 'verticalSection' &&
      props.transect &&
      props.onToggleTransectPick &&
      props.onResetTransect ? (
        <>
          <div className="control-divider" />
          <TransectControl
            transect={props.transect}
            transectPickActive={props.transectPickActive ?? false}
            pickHint={props.transectPickHint}
            onTogglePick={props.onToggleTransectPick}
            onReset={props.onResetTransect}
            onBackToMap={props.onBackToMap}
          />
        </>
      ) : null}
      <div className="control-divider" />
      <DatasetInfo
        selectedVariable={props.selectedVariable}
        selectedDepth={props.selectedDepth}
        apiModelDepth={props.apiModelDepth}
        selectedDate={props.selectedDate ?? ''}
        analysisMode={props.analysisMode}
      />
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
        validationLayerEnabled={props.validationLayerEnabled}
        onValidationLayerChange={props.onValidationLayerChange}
        showValidationLayerControl={props.analysisMode === 'regionalValidation'}
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
