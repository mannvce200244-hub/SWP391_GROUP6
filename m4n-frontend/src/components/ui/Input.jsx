import { useState } from 'react'
import FormField from './FormField.jsx'
import getFieldDescription from './fieldDescription.js'
import { IconEye, IconEyeOff } from './Icons.jsx'

function Input({
  'aria-describedby': describedBy,
  className = '',
  error,
  helperText,
  id,
  label,
  required = false,
  labelAction = null,
  type = 'text',
  allowTogglePassword = false,
  ...inputProps
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password' || allowTogglePassword
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type

  const classes = [
    'w-full h-11 px-3.5 bg-surface text-ink text-sm rounded-md border border-control-border transition-all duration-150 placeholder:text-subtle focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 disabled:bg-surface-secondary disabled:cursor-not-allowed',
    isPassword ? 'pr-11' : '',
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
    <FormField
      error={error}
      helperText={helperText}
      id={id}
      label={label}
      required={required}
      labelAction={labelAction}
    >
      <div className="relative w-full">
        <input
          {...inputProps}
          aria-describedby={fieldDescription}
          aria-invalid={error ? 'true' : undefined}
          className={classes}
          id={id}
          type={effectiveType}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-0 top-0 bottom-0 px-3.5 flex items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
            tabIndex={0}
          >
            {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          </button>
        )}
      </div>
    </FormField>
  )
}

export default Input
