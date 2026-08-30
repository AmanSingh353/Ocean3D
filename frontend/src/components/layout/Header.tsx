import { HelpCircle, Maximize2, Settings, Waves } from 'lucide-react'
import type { AppMode } from '../../types/appMode'
import { APP_MODE_LABELS } from '../../types/appMode'
import { formatHeaderDate } from '../../utils/dateFormat'

interface HeaderProps {
  currentDate: string
  regionLabel?: string
  isLoading?: boolean
  hasError?: boolean
  onFullscreen: () => void
  appMode?: AppMode
  onAppModeChange?: (mode: AppMode) => void
}

export function Header({
  currentDate,
  regionLabel = 'INDIAN OCEAN',
  isLoading = false,
  hasError = false,
  onFullscreen,
  appMode = 'oceanAnalysis',
  onAppModeChange,
}: HeaderProps) {
  const statusLabel = hasError ? 'DATA ERROR' : isLoading ? 'LOADING' : 'SYSTEM READY'
  const statusClass = hasError
    ? 'header__status header__status--error'
    : isLoading
      ? 'header__status header__status--loading'
      : 'header__status'
  return (
    <header className="header">
      <div className="header__left">
        <div className="header__logo">
          <Waves size={22} strokeWidth={1.5} />
        </div>
        <div className="header__brand">
          <div className="header__title-row">
            <h1 className="header__title">Ocean3D</h1>
            <span className="badge badge--muted">MVP · DEMO</span>
          </div>
          <p className="header__subtitle">
            Interactive 3D Ocean Data Visualization
          </p>
        </div>
      </div>
      <div className="header__right">
        {onAppModeChange ? (
          <div className="app-mode-switch" role="tablist" aria-label="Application mode">
            {(Object.keys(APP_MODE_LABELS) as AppMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={appMode === mode}
                className={`app-mode-switch__btn ${appMode === mode ? 'app-mode-switch__btn--active' : ''}`}
                onClick={() => onAppModeChange(mode)}
              >
                {APP_MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        ) : null}
        <div className={statusClass}>
          <span className="status-dot" />
          {statusLabel}
        </div>
        <span className="header__meta">{regionLabel}</span>
        <span className="header__meta header__meta--date">
          {formatHeaderDate(currentDate)}
        </span>
        <button type="button" className="icon-btn" onClick={onFullscreen} aria-label="Fullscreen">
          <Maximize2 size={16} />
        </button>
        <button type="button" className="icon-btn" aria-label="Settings">
          <Settings size={16} />
        </button>
        <button type="button" className="icon-btn" aria-label="Help">
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  )
}
