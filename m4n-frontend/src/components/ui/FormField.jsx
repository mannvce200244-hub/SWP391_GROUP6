function FormField({ children, error, helperText, id, label }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {helperText ? (
        <span className="field__helper" id={`${id}-helper`}>
          {helperText}
        </span>
      ) : null}
      {error ? (
        <span aria-live="polite" className="field__error" id={`${id}-error`}>
          {error}
        </span>
      ) : null}
    </div>
  )
}

export default FormField
