import { DEPTH_TICKS } from '../../data/mockModel'
import { Slider } from '../common/Slider'

interface DepthControlProps {
  depth: number
  onChange: (depth: number) => void
}

export function DepthControl({ depth, onChange }: DepthControlProps) {
  return (
    <div className="control-block">
      <label className="control-label">DEPTH</label>
      <div className="depth-value">{depth} m</div>
      <Slider min={0} max={1000} step={10} value={depth} onChange={onChange} ticks={DEPTH_TICKS} ariaLabel="Depth slider" />
      <div className="slider__range-labels"><span>0</span><span>1000 m</span></div>
    </div>
  )
}
