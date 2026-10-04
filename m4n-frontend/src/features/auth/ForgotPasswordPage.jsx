import { useState } from 'react'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import useAuth from './useAuth.js'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import { IconCheckCircle } from '../../components/ui/Icons.jsx'
import useToast from '../../components/ui/useToast.js'

function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const { addToast } = useToast()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setFieldError('Vui lòng nhập địa chỉ email.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFieldError('Định dạng email không hợp lệ.')
      return
    }

    setFieldError('')
    setIsSubmitting(true)

    try {
      await forgotPassword({ email: trimmedEmail })
      setIsSubmitted(true)
      addToast({
        message: 'Đã gửi hướng dẫn nếu email tồn tại trên hệ thống.',
        type: 'success',
      })
    } catch {
      // Always show generic success state to protect user privacy (BR-AUTH-03)
      setIsSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">Quên mật khẩu?</h1>
        <p className="text-sm text-muted leading-relaxed">
          Nhập email đã đăng ký. Nếu tài khoản tồn tại, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
        </p>
      </header>

      {isSubmitted ? (
        <div className="flex flex-col items-center text-center py-6 px-4 gap-3 bg-jade-soft/30 border border-jade-border rounded-xl" role="status">
          <div className="w-14 h-14 rounded-full bg-jade-soft flex items-center justify-center text-jade mb-2">
            <IconCheckCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-ink">Đã gửi hướng dẫn</h2>
          <p className="text-sm text-muted leading-relaxed max-w-sm">
            Nếu địa chỉ <strong>{email}</strong> tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu trong ít phút.
          </p>
          <p className="text-xs text-muted/80 bg-surface-secondary p-2.5 rounded-lg border border-border">
            *Môi trường thử nghiệm (DEV): Đường dẫn xác thực cũng được ghi nhận tại console backend.
          </p>
          <Button
            type="button"
            variant="primary"
            className="w-full mt-2"
            onClick={() => navigateTo(CUSTOMER_ROUTES.login)}
          >
            Quay lại Đăng nhập
          </Button>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Input
            id="forgot-email"
            name="email"
            type="email"
            label="Địa chỉ Email"
            autoComplete="email"
            required
            placeholder="tenban@m4n.vn"
            value={email}
            error={fieldError}
            disabled={isSubmitting}
            onChange={(e) => {
              setEmail(e.target.value)
              if (fieldError) setFieldError('')
            }}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isSubmitting}
              loadingLabel="Đang gửi hướng dẫn…"
            >
              Gửi hướng dẫn
            </Button>
          </div>
        </form>
      )}

      <footer className="pt-4 border-t border-border flex items-center justify-center text-sm text-muted">
        <RouterLink
          href={CUSTOMER_ROUTES.login}
          className="font-medium text-muted hover:text-ink transition-colors"
        >
          ← Quay lại trang Đăng nhập
        </RouterLink>
      </footer>
    </div>
  )
}

export default ForgotPasswordPage
