function Button({
  children,
  className = '',
  disabled = false,
  loading = false,
  loadingLabel = 'Đang xử lý…',
  type = 'button',
  variant = 'primary',
  ...buttonProps
}) {
  const classes = ['button', `button--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      {...buttonProps}
      aria-busy={loading ? 'true' : undefined}
      className={classes}
      disabled={disabled || loading}
      type={type}
    >
      {loading ? (
        <>
          <span aria-hidden="true" className="button__indicator" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default Button
