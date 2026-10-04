function FormField({
  children,
  className = '',
  error,
  helperText,
  id,
  label,
  required = false,
  labelAction = null,
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`.trim()}>
      {label && (
        <div className="flex items-center justify-between text-xs font-semibold text-ink uppercase tracking-wider">
          <label htmlFor={id} className="cursor-pointer">
            {label}
            {required && (
              <span className="text-brand ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {labelAction}
        </div>
      )}
      {children}
      {error ? (
        <span aria-live="polite" className="text-xs text-brand font-medium mt-0.5" id={`${id}-error`}>
          {error}
        </span>
      ) : helperText ? (
        <span className="text-xs text-muted mt-0.5" id={`${id}-helper`}>
          {helperText}
        </span>
      ) : null}
    </div>
  )
}

export default FormField
