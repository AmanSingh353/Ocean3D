import type { ReactNode } from 'react'

interface MainLayoutProps {
  header: ReactNode
  controls: ReactNode
  viewer: ReactNode
  observation: ReactNode
  timeline: ReactNode
  controlsOpen: boolean
  observationOpen: boolean
  onToggleControls: () => void
  onToggleObservation: () => void
}

export function MainLayout({
  header,
  controls,
  viewer,
  observation,
  timeline,
  controlsOpen,
  observationOpen,
  onToggleControls,
  onToggleObservation,
}: MainLayoutProps) {
  return (
    <div className="app-shell">
      {header}
      <div className="main-grid">
        <aside className={`panel panel--controls ${controlsOpen ? 'panel--open' : ''}`}>
          <button type="button" className="panel__mobile-toggle" onClick={onToggleControls}>
            Controls
          </button>
          {controls}
        </aside>
        <main className="panel panel--viewer">{viewer}</main>
        <aside className={`panel panel--observation ${observationOpen ? 'panel--open' : ''}`}>
          <button type="button" className="panel__mobile-toggle" onClick={onToggleObservation}>
            Observation
          </button>
          {observation}
        </aside>
      </div>
      <footer className="timeline-bar">{timeline}</footer>
    </div>
  )
}
