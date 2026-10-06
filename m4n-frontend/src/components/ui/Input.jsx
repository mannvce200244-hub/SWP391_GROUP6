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
    'w-full h-12 px-4 text-[15px] rounded-xl border transition-all duration-150 placeholder:text-subtle focus-visible:outline-none disabled:cursor-not-allowed',
    isPassword ? 'pr-11' : '',
    error 
      ? 'border-danger bg-danger-soft text-ink focus-visible:border-danger focus-visible:ring-3 focus-visible:ring-danger/20' 
      : inputProps.disabled 
        ? 'bg-surface-secondary border-border text-subtle'
        : 'bg-white border-border text-ink focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15',
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
            className="absolute right-0 top-0 bottom-0 px-4 flex items-center justify-center transition-colors cursor-pointer"
            style={{ color: '#626970' }}
            onClick={() => setShowPassword((prev) => !prev)}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#17191B' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#626970' }}
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
