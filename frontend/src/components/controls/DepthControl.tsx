import { Slider } from '../common/Slider'
import { isDepthSnapped } from '../../utils/depthUtils'

interface DepthControlProps {
  depth: number
  apiModelDepth: number
  availableDepths: number[]
  depthTicks: number[]
  onChange: (depth: number) => void
}

export function DepthControl({
  depth,
  apiModelDepth,
  availableDepths,
  depthTicks,
  onChange,
}: DepthControlProps) {
  const maxDepth = availableDepths.length > 0 ? Math.max(...availableDepths) : 1000
  const snapped = isDepthSnapped(depth, apiModelDepth)

  return (
    <div className="control-block">
      <label className="control-label">DEPTH</label>
      <div className="depth-value">{depth} m</div>
      {snapped ? (
        <p className="control-hint">Model field at nearest level: {apiModelDepth} m</p>
      ) : null}
      <Slider
        min={0}
        max={maxDepth}
        step={10}
        value={depth}
        onChange={onChange}
        ticks={depthTicks}
        ariaLabel="Depth slider"
      />
      <div className="slider__range-labels">
        <span>0</span>
        <span>{maxDepth} m</span>
      </div>
    </div>
  )
}
