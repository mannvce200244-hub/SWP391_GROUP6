import { useState } from 'react'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import useAuth from './useAuth.js'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import { IconAlertCircle } from '../../components/ui/Icons.jsx'
import useToast from '../../components/ui/useToast.js'

function LoginPage() {
  const { login, isAuthenticated, user } = useAuth()
  const { addToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Role-based redirection if already logged in
  if (isAuthenticated && user) {
    switch (user.role) {
      case 'ADMIN':
        navigateTo(CUSTOMER_ROUTES.admin)
        break
      case 'ONLINE_STAFF':
        navigateTo(CUSTOMER_ROUTES.staff)
        break
      case 'POS_STAFF':
        navigateTo(CUSTOMER_ROUTES.pos)
        break
      default:
        navigateTo(CUSTOMER_ROUTES.home)
        break
    }
    return null
  }

  const validate = () => {
    const errors = {}
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      errors.email = 'Vui lòng nhập địa chỉ email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Định dạng email không hợp lệ.'
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.'
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
      const authenticatedUser = await login({
        email: email.trim(),
        password,
      })

      addToast({
        message: 'Đăng nhập thành công! Đang chuyển tiếp…',
        type: 'success',
      })

      switch (authenticatedUser.role) {
        case 'ADMIN':
          navigateTo(CUSTOMER_ROUTES.admin)
          break
        case 'ONLINE_STAFF':
          navigateTo(CUSTOMER_ROUTES.staff)
          break
        case 'POS_STAFF':
          navigateTo(CUSTOMER_ROUTES.pos)
          break
        default:
          navigateTo(CUSTOMER_ROUTES.home)
          break
      }
    } catch (err) {
      const message =
        err?.status === 401
          ? 'Email hoặc mật khẩu không chính xác.'
          : err?.status === 403
            ? 'Tài khoản của bạn đã bị tạm khóa hoặc ngừng hoạt động.'
            : err?.message || 'Đăng nhập không thành công. Vui lòng thử lại.'
      setGeneralError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">Đăng nhập vào M4N</h1>
        <p className="text-sm text-muted leading-relaxed">
          Quản lý đơn hàng, hồ sơ và các hoạt động trên tài khoản của bạn.
        </p>
      </header>

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

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          id="login-email"
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
          id="login-password"
          name="password"
          type="password"
          label="Mật khẩu"
          autoComplete="current-password"
          required
          allowTogglePassword
          placeholder="Nhập mật khẩu của bạn"
          value={password}
          error={fieldErrors.password}
          disabled={isSubmitting}
          labelAction={
            <RouterLink
              href={CUSTOMER_ROUTES.forgotPassword}
              className="text-xs font-medium text-muted hover:text-brand transition-colors"
            >
              Quên mật khẩu?
            </RouterLink>
          }
          onChange={(e) => {
            setPassword(e.target.value)
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }))
            }
          }}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={isSubmitting}
            loadingLabel="Đang đăng nhập…"
          >
            Đăng nhập
          </Button>
        </div>
      </form>

      <footer className="pt-4 border-t border-border flex items-center justify-center text-sm text-muted">
        <p>
          Chưa có tài khoản?{' '}
          <RouterLink
            href={CUSTOMER_ROUTES.register}
            className="font-semibold text-brand hover:underline ml-1"
          >
            Tạo tài khoản
          </RouterLink>
        </p>
      </footer>
    </div>
  )
}

export default LoginPage
