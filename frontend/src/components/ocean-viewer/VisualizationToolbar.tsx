import type { ReactNode } from 'react'
import { Maximize2, Move, RotateCw, ZoomIn, RefreshCw } from 'lucide-react'

export type ViewMode = 'rotate' | 'pan' | 'zoom'

interface VisualizationToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onReset: () => void
  onFullscreen: () => void
}

export function VisualizationToolbar({
  viewMode,
  onViewModeChange,
  onReset,
  onFullscreen,
}: VisualizationToolbarProps) {
  const tools: { mode: ViewMode; label: string; icon: ReactNode }[] = [
    { mode: 'rotate', label: 'Rotate', icon: <RotateCw size={14} /> },
    { mode: 'pan', label: 'Pan', icon: <Move size={14} /> },
    { mode: 'zoom', label: 'Zoom', icon: <ZoomIn size={14} /> },
  ]

  return (
    <div className="viz-toolbar">
      {tools.map((tool) => (
        <button
          key={tool.mode}
          type="button"
          className={`viz-toolbar__btn ${viewMode === tool.mode ? 'viz-toolbar__btn--active' : ''}`}
          onClick={() => onViewModeChange(tool.mode)}
          title={tool.label}
        >
          {tool.icon}
          <span>{tool.label}</span>
        </button>
      ))}
      <button type="button" className="viz-toolbar__btn" onClick={onReset} title="Reset">
        <RefreshCw size={14} /><span>Reset</span>
      </button>
      <button type="button" className="viz-toolbar__btn" onClick={onFullscreen} title="Fullscreen">
        <Maximize2 size={14} /><span>Fullscreen</span>
      </button>
    </div>
  )
}
