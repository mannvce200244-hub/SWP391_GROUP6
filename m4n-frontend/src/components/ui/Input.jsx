import FormField from './FormField.jsx'
import getFieldDescription from './fieldDescription.js'

function Input({
  'aria-describedby': describedBy,
  className = '',
  error,
  helperText,
  id,
  label,
  ...inputProps
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
      <input
        {...inputProps}
        aria-describedby={fieldDescription}
        aria-invalid={error ? 'true' : undefined}
        className={classes}
        id={id}
      />
    </FormField>
  )
}

export default Input
