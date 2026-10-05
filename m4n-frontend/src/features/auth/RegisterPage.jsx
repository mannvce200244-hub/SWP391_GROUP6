import { useState } from 'react'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import useAuth from './useAuth.js'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import { IconAlertCircle, IconCheckCircle } from '../../components/ui/Icons.jsx'
import useToast from '../../components/ui/useToast.js'

function RegisterPage() {
  const { register } = useAuth()
  const { addToast } = useToast()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validate = () => {
    const errors = {}
    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedName) {
      errors.fullName = 'Họ và tên không được để trống.'
    } else if (trimmedName.length > 150) {
      errors.fullName = 'Họ và tên không được vượt quá 150 ký tự.'
    }

    if (!trimmedEmail) {
      errors.email = 'Email không được để trống.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Định dạng email không hợp lệ.'
    }

    if (trimmedPhone && !/^[0-9+() -]{8,20}$/.test(trimmedPhone)) {
      errors.phone = 'Số điện thoại không hợp lệ (8 - 20 số).'
    }

    if (!password) {
      errors.password = 'Mật khẩu không được để trống.'
    } else if (password.length < 8 || password.length > 72) {
      errors.password = 'Mật khẩu phải từ 8 đến 72 ký tự.'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu.'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      })
      setIsSuccess(true)
      addToast({
        message: 'Tài khoản đã được tạo thành công!',
        type: 'success',
      })
    } catch (err) {
      const message =
        err?.status === 409
          ? 'Địa chỉ email này đã được đăng ký trên hệ thống.'
          : err?.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.'
      setGeneralError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-sans">Tạo tài khoản</h1>
        <p className="text-sm sm:text-base text-muted leading-relaxed">
          Tạo tài khoản M4N để theo dõi đơn hàng và quản lý thông tin cá nhân.
        </p>
      </header>

      {isSuccess ? (
        <div className="flex flex-col items-center text-center py-6 px-4 gap-3 bg-jade-soft/30 border border-jade-border rounded-xl" role="status">
          <div className="w-14 h-14 rounded-full bg-jade-soft flex items-center justify-center text-jade mb-2">
            <IconCheckCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-ink">Đăng ký thành công!</h2>
          <p className="text-sm text-muted leading-relaxed max-w-sm">
            Tài khoản cho <strong>{email}</strong> đã được khởi tạo an toàn. Bạn có thể đăng nhập ngay để bắt đầu trải nghiệm.
          </p>
          <Button
            type="button"
            variant="primary"
            className="w-full mt-2"
            onClick={() => navigateTo(CUSTOMER_ROUTES.login)}
          >
            Chuyển đến Đăng nhập
          </Button>
        </div>
      ) : (
        <>
          {generalError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-lg border border-brand-border bg-brand-soft text-brand text-sm leading-snug"
              aria-live="assertive"
            >
              <IconAlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            <Input
              id="reg-fullname"
              name="name"
              type="text"
              label="Họ và tên"
              autoComplete="name"
              required
              placeholder="Ví dụ: Nguyễn Văn An"
              value={fullName}
              error={fieldErrors.fullName}
              disabled={isSubmitting}
              onChange={(e) => {
                setFullName(e.target.value)
                if (fieldErrors.fullName) {
                  setFieldErrors((prev) => ({ ...prev, fullName: undefined }))
                }
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="reg-email"
                name="email"
                type="email"
                label="Địa chỉ Email"
                autoComplete="email"
                required
                placeholder="tenban@m4n.vn"
                value={email}
                error={fieldErrors.email}
                disabled={isSubmitting}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }))
                  }
                }}
                onBlur={() => {
                  if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                    setFieldErrors((prev) => ({ ...prev, email: 'Định dạng email không hợp lệ.' }))
                  }
                }}
              />

              <Input
                id="reg-phone"
                name="tel"
                type="tel"
                label="Số điện thoại"
                autoComplete="tel"
                placeholder="0901234567"
                value={phone}
                error={fieldErrors.phone}
                disabled={isSubmitting}
                onChange={(e) => {
                  setPhone(e.target.value)
                  if (fieldErrors.phone) {
                    setFieldErrors((prev) => ({ ...prev, phone: undefined }))
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="reg-password"
                name="new-password"
                type="password"
                label="Mật khẩu"
                autoComplete="new-password"
                required
                allowTogglePassword
                helperText="Tối thiểu 8 ký tự."
                placeholder="Ít nhất 8 ký tự"
                value={password}
                error={fieldErrors.password}
                disabled={isSubmitting}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }))
                  }
                }}
              />

              <Input
                id="reg-confirm-password"
                name="confirm-password"
                type="password"
                label="Xác nhận mật khẩu"
                autoComplete="new-password"
                required
                allowTogglePassword
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                error={fieldErrors.confirmPassword}
                disabled={isSubmitting}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                  }
                }}
              />
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                className="w-full h-12"
                loading={isSubmitting}
                loadingLabel="Đang tạo tài khoản…"
              >
                Tạo tài khoản
              </Button>
            </div>
          </form>

          <footer className="pt-4 border-t border-border flex items-center justify-center text-sm text-muted">
            <p>
              Đã có tài khoản?{' '}
              <RouterLink
                href={CUSTOMER_ROUTES.login}
                className="font-semibold text-brand hover:underline ml-1"
              >
                Đăng nhập
              </RouterLink>
            </p>
          </footer>
        </>
      )}
    </div>
  )
}

export default RegisterPage
