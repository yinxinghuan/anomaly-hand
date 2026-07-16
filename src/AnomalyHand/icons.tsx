import type { CardKind, IntentKind } from './types'

type IconName = CardKind | IntentKind | 'health' | 'sequence' | 'rules' | 'sound' | 'close'

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'square' as const,
    strokeLinejoin: 'miter' as const,
    'aria-hidden': true,
  }

  if (name === 'breach' || name === 'attack') {
    return <svg {...common}><path d="M4 18 18 4M8 4h10v10M4 13l7 7" /></svg>
  }
  if (name === 'guard') {
    return <svg {...common}><path d="M12 3 19 6v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6l7-3Z" /><path d="M12 7v9M8.5 11.5h7" /></svg>
  }
  if (name === 'tech') {
    return <svg {...common}><circle cx="12" cy="12" r="7" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4M8.5 8.5l7 7M15.5 8.5l-7 7" /></svg>
  }
  if (name === 'signature') {
    return <svg {...common}><path d="m12 2 2.2 6.2L21 10l-5 4.2.8 6.8-4.8-3.2L7.2 21 8 14.2 3 10l6.8-1.8L12 2Z" /></svg>
  }
  if (name === 'charge') {
    return <svg {...common}><path d="M13 2 5 14h6l-1 8 9-13h-6V2Z" /></svg>
  }
  if (name === 'health') {
    return <svg {...common}><path d="M12 20S4 15.4 4 9.5C4 6.5 5.8 4 8.7 4c1.5 0 2.7.7 3.3 1.8C12.6 4.7 13.8 4 15.3 4 18.2 4 20 6.5 20 9.5 20 15.4 12 20 12 20Z" /></svg>
  }
  if (name === 'sequence') {
    return <svg {...common}><circle cx="6" cy="12" r="2.5" /><circle cx="12" cy="12" r="2.5" /><circle cx="18" cy="12" r="2.5" /><path d="M8.5 12h1M14.5 12h1" /></svg>
  }
  if (name === 'rules') {
    return <svg {...common}><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></svg>
  }
  if (name === 'sound') {
    return <svg {...common}><path d="M4 10v4h4l5 4V6l-5 4H4ZM17 9c1.3 1.7 1.3 4.3 0 6M19.5 6.5c3 3.2 3 7.8 0 11" /></svg>
  }
  return <svg {...common}><path d="m5 5 14 14M19 5 5 19" /></svg>
}
