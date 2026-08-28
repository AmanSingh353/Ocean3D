import { Toggle } from '../common/Toggle'
import { Slider } from '../common/Slider'

interface LayerControlsProps {
  modelLayerEnabled: boolean
  onModelLayerChange: (enabled: boolean) => void
  modelOpacity: number
  onModelOpacityChange: (opacity: number) => void
  showArgo: boolean
  onShowArgoChange: (show: boolean) => void
  showGliders: boolean
  onShowGlidersChange: (show: boolean) => void
  showCurrents: boolean
  onShowCurrentsChange: (show: boolean) => void
  validationLayerEnabled?: boolean
  onValidationLayerChange?: (enabled: boolean) => void
  showValidationLayerControl?: boolean
}

export function LayerControls(props: LayerControlsProps) {
  return (
    <>
      <div className="control-block">
        <label className="control-label">MODEL LAYER</label>
        <div className="control-row">
          <span className="control-row__label">Ocean Model</span>
          <div className="control-row__action">
            <Toggle checked={props.modelLayerEnabled} onChange={props.onModelLayerChange} label="Ocean Model" />
            <span className={`state-label ${props.modelLayerEnabled ? 'state-label--on' : ''}`}>
              {props.modelLayerEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
        <div className="control-row control-row--stack">
          <span className="control-row__label">Opacity</span>
          <Slider min={0} max={100} step={1} value={props.modelOpacity} onChange={props.onModelOpacityChange} ariaLabel="Model opacity" />
          <span className="control-row__value">{props.modelOpacity}%</span>
        </div>
      </div>
      <div className="control-block">
        <label className="control-label">OBSERVATIONS</label>
        <div className="control-row">
          <span className="control-row__label">Argo Floats</span>
          <div className="control-row__action">
            <Toggle checked={props.showArgo} onChange={props.onShowArgoChange} label="Argo Floats" />
            <span className={`state-label ${props.showArgo ? 'state-label--on' : ''}`}>{props.showArgo ? 'ON' : 'OFF'}</span>
          </div>
        </div>
        <div className="control-row">
          <span className="control-row__label">Gliders</span>
          <div className="control-row__action">
            <Toggle checked={props.showGliders} onChange={props.onShowGlidersChange} label="Gliders" />
            <span className={`state-label ${props.showGliders ? 'state-label--on' : ''}`}>{props.showGliders ? 'ON' : 'OFF'}</span>
          </div>
        </div>
        <div className="control-row control-row--disabled">
          <span className="control-row__label">CTD</span>
          <div className="control-row__action">
            <Toggle checked={false} onChange={() => {}} disabled label="CTD" />
            <span className="state-label">OFF</span>
            <span className="coming-soon">Coming Soon</span>
          </div>
        </div>
      </div>
      <div className="control-block">
        <label className="control-label">CURRENT VECTORS</label>
        <div className="control-row">
          <span className="control-row__label">Current Vectors</span>
          <div className="control-row__action">
            <Toggle checked={props.showCurrents} onChange={props.onShowCurrentsChange} label="Current Vectors" />
            <span className={`state-label ${props.showCurrents ? 'state-label--on' : ''}`}>{props.showCurrents ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      </div>
      {props.showValidationLayerControl ? (
        <div className="control-block">
          <label className="control-label">VALIDATION LAYER</label>
          <div className="control-row">
            <span className="control-row__label">Spatial Error</span>
            <div className="control-row__action">
              <Toggle
                checked={props.validationLayerEnabled ?? false}
                onChange={props.onValidationLayerChange ?? (() => {})}
                label="Validation spatial error layer"
              />
              <span className={`state-label ${props.validationLayerEnabled ? 'state-label--on' : ''}`}>
                {props.validationLayerEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
