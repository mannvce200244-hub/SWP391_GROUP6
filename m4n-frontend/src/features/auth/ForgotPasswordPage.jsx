import { useState } from 'react'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import authService from './authService.js'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import { CircleCheck } from 'lucide-react'
import useToast from '../../components/ui/useToast.js'

function ForgotPasswordPage() {
  const { addToast } = useToast()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [challenge, setChallenge] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setGeneralError('')
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
      const response = await authService.requestEmailOtp({ email: trimmedEmail, purpose: 'RESET_PASSWORD' })
      setChallenge(response)
      sessionStorage.setItem('m4n-reset-otp', JSON.stringify({ ...response, email: trimmedEmail }))
      addToast({
        message: 'Đã tiếp nhận yêu cầu đặt lại mật khẩu.',
        type: 'success',
      })
    } catch (error) {
      setGeneralError(error.message || 'Không thể gửi yêu cầu lúc này. Vui lòng kiểm tra kết nối và thử lại.')
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

      {challenge ? (
        <div className="flex flex-col items-center text-center py-6 px-4 gap-3 bg-[#F6F7F8] border border-jade-border rounded-xl" role="status">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-jade mb-2">
            <CircleCheck size={32} />
          </div>
          <h2 className="text-xl font-bold text-ink">Đã tiếp nhận yêu cầu</h2>
          <p className="text-sm text-muted leading-relaxed max-w-sm">
            {challenge.message} Mã có hiệu lực 10 phút.
          </p>
          <Button
            type="button"
            variant="primary"
            className="w-full mt-2"
            onClick={() => navigateTo(CUSTOMER_ROUTES.resetPassword)}
          >
            Nhập mã OTP
          </Button>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {generalError && <p role="alert" className="text-sm text-danger">{generalError}</p>}
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
              loadingLabel="Đang gửi mã OTP…"
            >
              Gửi mã OTP email
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
