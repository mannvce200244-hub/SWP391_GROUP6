const VARIANT_MAP = {
  primary: 'bg-brand text-white hover:bg-brand-hover active:bg-brand-deep shadow-xs',
  secondary: 'bg-surface text-ink border border-control-border hover:bg-surface-secondary hover:border-ink/20 shadow-xs',
  quiet: 'bg-transparent text-ink border border-control-border hover:bg-surface-secondary hover:border-ink/20',
  ghost: 'bg-transparent text-ink hover:bg-surface-secondary',
  danger: 'bg-brand text-white hover:bg-brand-hover active:bg-brand-deep shadow-xs',
}

const SIZE_MAP = {
  sm: 'h-9 px-3.5 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
}

function Button({
  children,
  className = '',
  disabled = false,
  loading = false,
  loadingLabel = 'Đang xử lý…',
  type = 'button',
  variant = 'primary',
  size = 'md',
  ref,
  ...buttonProps
}) {
  const variantClass = VARIANT_MAP[variant] || VARIANT_MAP.primary
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md

  const classes = [
    'inline-flex items-center justify-center gap-2 font-sans font-medium rounded-md transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px',
    variantClass,
    sizeClass,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      ref={ref}
      {...buttonProps}
      aria-busy={loading ? 'true' : undefined}
      className={classes}
      disabled={disabled || loading}
      type={type}
    >
      {loading ? (
        <>
          <svg
            aria-hidden="true"
            className="w-4 h-4 animate-spin text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default Button
