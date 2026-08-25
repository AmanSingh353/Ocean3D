import { HelpCircle, Maximize2, Settings, Waves } from 'lucide-react'
import { formatHeaderDate } from '../../data/mockModel'

interface HeaderProps {
  currentDate: string
  onFullscreen: () => void
}

export function Header({ currentDate, onFullscreen }: HeaderProps) {
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
        <div className="header__status">
          <span className="status-dot" />
          SYSTEM READY
        </div>
        <span className="header__meta">INDIAN OCEAN</span>
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
