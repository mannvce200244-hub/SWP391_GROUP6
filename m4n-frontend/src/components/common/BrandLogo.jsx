/**
 * BrandLogo - Contemporary M4N Brand Identity (2026)
 * Geometric instrument string resonance mark + modern sans-serif typography
 */
function BrandLogo({ variant = 'default', className = '' }) {
  const isDark = variant === 'dark'

  return (
    <div className={`inline-flex items-center gap-2.5 select-none no-underline ${className}`}>
      {/* Precision 4-line Resonance Mark */}
      <svg
        aria-hidden="true"
        className="shrink-0 w-6 h-6"
        fill="none"
        height="24"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          fill={isDark ? '#E5E5E5' : '#191919'}
          height="14"
          rx="1"
          width="2.5"
          x="3"
          y="5"
        />
        <rect
          fill="#A63F2A"
          height="20"
          rx="1.25"
          width="2.5"
          x="8.5"
          y="2"
        />
        <rect
          fill={isDark ? '#E5E5E5' : '#191919'}
          height="16"
          rx="1"
          width="2.5"
          x="14"
          y="4"
        />
        <rect
          fill={isDark ? '#999999' : '#666666'}
          height="10"
          rx="1"
          width="2.5"
          x="19.5"
          y="7"
        />
      </svg>

      <div className="flex flex-col leading-none">
        <span className={`text-lg font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-ink'}`}>
          M4N
        </span>
        <span className={`text-[9px] font-semibold tracking-wider font-sans uppercase mt-0.5 ${isDark ? 'text-white/60' : 'text-muted'}`}>
          NHẠC CỤ TRUYỀN THỐNG
        </span>
      </div>
    </div>
  )
}

export default BrandLogo
