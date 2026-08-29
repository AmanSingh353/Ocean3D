import { DEMO_DATA_DISCLAIMER } from '../../data/validationData'

interface DemoDataBannerProps {
  compact?: boolean
  className?: string
}

export function DemoDataBanner({ compact = false, className = '' }: DemoDataBannerProps) {
  return (
    <p
      className={`demo-data-banner ${compact ? 'demo-data-banner--compact' : ''} ${className}`.trim()}
      role="note"
    >
      {DEMO_DATA_DISCLAIMER}
    </p>
  )
}
