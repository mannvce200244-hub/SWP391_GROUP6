import FormField from './FormField.jsx'
import getFieldDescription from './fieldDescription.js'

function Select({
  'aria-describedby': describedBy,
  children,
  className = '',
  error,
  helperText,
  id,
  label,
  required = false,
  ...selectProps
}) {
  const classes = [
    'w-full h-11 px-3.5 bg-surface text-ink text-sm rounded-md border border-control-border transition-all duration-150 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 disabled:bg-surface-secondary disabled:cursor-not-allowed cursor-pointer',
    error ? 'border-brand focus-visible:border-brand focus-visible:ring-brand/20' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const fieldDescription = getFieldDescription({
    describedBy,
    error,
    helperText,
    id,
  })

  return (
    <FormField error={error} helperText={helperText} id={id} label={label} required={required}>
      <select
        {...selectProps}
        aria-describedby={fieldDescription}
        aria-invalid={error ? 'true' : undefined}
        className={classes}
        id={id}
      >
        {children}
      </select>
    </FormField>
  )
}

export default Select
