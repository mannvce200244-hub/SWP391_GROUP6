import { LoaderCircle } from 'lucide-react'

const VARIANT_MAP = {
  primary: 'bg-brand text-white hover:bg-brand-hover active:bg-brand-deep shadow-xs',
  secondary: 'bg-surface text-ink border border-control-border hover:bg-surface-secondary hover:border-ink/20 shadow-xs',
  quiet: 'bg-transparent text-ink border border-control-border hover:bg-surface-secondary hover:border-ink/20',
  ghost: 'bg-transparent text-ink hover:bg-surface-secondary',
  danger: 'bg-brand text-white hover:bg-brand-hover active:bg-brand-deep shadow-xs',
}

const SIZE_MAP = {
  sm: 'h-9 px-3.5 text-[13.5px]',
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
          <LoaderCircle className="w-4 h-4 animate-spin text-current shrink-0" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default Button
