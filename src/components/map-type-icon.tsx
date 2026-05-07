import type { MapType } from '@/lib/schema'

interface MapTypeIconProps {
  type: MapType
  className?: string
}

/**
 * Tiny inline glyphs that hint at the layout of each map type. Drawn in
 * currentColor so they pick up text color.
 */
export function MapTypeIcon({ type, className }: MapTypeIconProps) {
  const stroke = 1.4
  const props = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  }
  switch (type) {
    case 'mindmap':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="2.4" />
          <circle cx="4" cy="6" r="1.6" />
          <circle cx="20" cy="6" r="1.6" />
          <circle cx="4" cy="18" r="1.6" />
          <circle cx="20" cy="18" r="1.6" />
          <line x1="9.9" y1="11.1" x2="5.4" y2="6.7" />
          <line x1="14.1" y1="11.1" x2="18.6" y2="6.7" />
          <line x1="9.9" y1="12.9" x2="5.4" y2="17.3" />
          <line x1="14.1" y1="12.9" x2="18.6" y2="17.3" />
        </svg>
      )
    case 'tree':
      return (
        <svg {...props}>
          <rect x="9" y="2" width="6" height="4" rx="1" />
          <rect x="2" y="14" width="6" height="4" rx="1" />
          <rect x="9" y="14" width="6" height="4" rx="1" />
          <rect x="16" y="14" width="6" height="4" rx="1" />
          <line x1="12" y1="6" x2="12" y2="10" />
          <line x1="5" y1="14" x2="5" y2="10" />
          <line x1="19" y1="14" x2="19" y2="10" />
          <line x1="5" y1="10" x2="19" y2="10" />
        </svg>
      )
    case 'flowchart':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="6" height="4" rx="1" />
          <rect x="15" y="3" width="6" height="4" rx="1" />
          <rect x="9" y="10" width="6" height="4" rx="1" />
          <rect x="9" y="17" width="6" height="4" rx="1" />
          <line x1="6" y1="7" x2="11" y2="10" />
          <line x1="18" y1="7" x2="13" y2="10" />
          <line x1="12" y1="14" x2="12" y2="17" />
        </svg>
      )
    case 'graph':
      return (
        <svg {...props}>
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
          <circle cx="12" cy="12" r="2" />
          <line x1="7.4" y1="7.4" x2="10.6" y2="10.6" />
          <line x1="16.6" y1="7.4" x2="13.4" y2="10.6" />
          <line x1="7.4" y1="16.6" x2="10.6" y2="13.4" />
          <line x1="16.6" y1="16.6" x2="13.4" y2="13.4" />
          <line x1="8" y1="6" x2="16" y2="6" />
        </svg>
      )
    case 'concept':
      return (
        <svg {...props}>
          <ellipse cx="6" cy="6" rx="3.2" ry="2" />
          <ellipse cx="18" cy="6" rx="3.2" ry="2" />
          <ellipse cx="12" cy="18" rx="3.2" ry="2" />
          <line x1="9" y1="6.4" x2="15" y2="6.4" />
          <line x1="7" y1="8" x2="10.5" y2="16" />
          <line x1="17" y1="8" x2="13.5" y2="16" />
        </svg>
      )
    case 'timeline':
      return (
        <svg {...props}>
          <line x1="3" y1="12" x2="21" y2="12" />
          <circle cx="6" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="18" cy="12" r="1.8" />
        </svg>
      )
  }
}
