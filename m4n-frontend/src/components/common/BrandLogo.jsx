/**
 * BrandLogo - Intentional, modern M4N brand identity
 * Minimal acoustic string-rhythm mark + crafted typography
 */
function BrandLogo({ variant = 'default', className = '' }) {
  const isDark = variant === 'dark'

  return (
    <div className={`brand-mark-group brand-mark-group--${variant} ${className}`}>
      {/* Precision acoustic string & resonance mark */}
      <svg
        aria-hidden="true"
        className="brand-symbol"
        fill="none"
        height="24"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          stroke={isDark ? '#E5E5E5' : '#1A1A1A'}
          strokeLinecap="round"
          strokeWidth="2"
          x1="5"
          x2="5"
          y1="4"
          y2="20"
        />
        <line
          stroke={isDark ? '#E5E5E5' : '#1A1A1A'}
          strokeLinecap="round"
          strokeWidth="2"
          x1="12"
          x2="12"
          y1="2"
          y2="22"
        />
        <line
          stroke={isDark ? '#E5E5E5' : '#1A1A1A'}
          strokeLinecap="round"
          strokeWidth="2"
          x1="19"
          x2="19"
          y1="5"
          y2="19"
        />
        <circle cx="12" cy="9" fill="#8A4028" r="2.25" />
      </svg>

      <div className="brand-copy">
        <span className="brand-copy__name">M4N</span>
        <span className="brand-copy__tagline">Nhạc cụ truyền thống</span>
      </div>
    </div>
  )
}

export default BrandLogo
