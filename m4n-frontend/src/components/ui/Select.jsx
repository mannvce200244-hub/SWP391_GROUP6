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
  ...selectProps
}) {
  const classes = ['field__control', className].filter(Boolean).join(' ')
  const fieldDescription = getFieldDescription({
    describedBy,
    error,
    helperText,
    id,
  })

  return (
    <FormField error={error} helperText={helperText} id={id} label={label}>
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
