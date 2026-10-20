/**
 * M4N Custom Brand & Domain Assets
 *
 * Generic application icons are imported directly from 'lucide-react'.
 * This file retains only custom, domain-specific SVG assets for M4N
 * such as the Đàn Nguyệt acoustic resonance mark.
 */

/**
 * Custom Đàn Nguyệt acoustic resonance motif for Vietnamese traditional instruments.
 */
export function IconInstrument({ size = 20, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      width={size}
    >
      <circle cx="12" cy="15" r="6" />
      <line x1="12" x2="12" y1="2" y2="9" />
      <line x1="9.5" x2="14.5" y1="4" y2="4" />
      <line x1="9.5" x2="14.5" y1="6.5" y2="6.5" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
    </svg>
  )
}
