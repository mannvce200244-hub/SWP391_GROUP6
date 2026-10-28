import { useState } from 'react'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import authService from './authService.js'
import EmailOtpField from './EmailOtpField.jsx'
import RegistrationDetailsFields from './RegistrationDetailsFields.jsx'
import Button from '../../components/ui/Button.jsx'
import { CircleX, CircleCheck } from 'lucide-react'
import useToast from '../../components/ui/useToast.js'
import { isValidVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '../../utils/phone.js'

function RegisterPage() {
  const { addToast } = useToast()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' })
  const { fullName, email, phone, password, confirmPassword } = form
  const [challenge, setChallenge] = useState(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('m4n-registration-otp') || 'null')
      return stored?.email && stored?.challengeId ? stored : null
    } catch { return null }
  })
  const [code, setCode] = useState('')

  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const isBusy = isSubmitting || isResending
  const [isSuccess, setIsSuccess] = useState(false)

  const validate = () => {
    const errors = {}
    if (challenge) {
      if (!/^[0-9]{6}$/.test(code)) errors.code = 'Vui lòng nhập mã OTP gồm 6 chữ số.'
      setFieldErrors(errors)
      if (errors.code) document.getElementById('reg-otp')?.focus()
      return Object.keys(errors).length === 0
    }
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
    } else if (trimmedEmail.length > 255) {
      errors.email = 'Email không được vượt quá 255 ký tự.'
    }

    if (trimmedPhone && !isValidVietnameseMobile(trimmedPhone)) {
      errors.phone = VIETNAMESE_MOBILE_ERROR
    }

    if (!password) {
      errors.password = 'Mật khẩu không được để trống.'
    } else if (password.length < 8 || password.length > 72) {
      errors.password = 'Mật khẩu phải từ 8 đến 72 ký tự.'
    } else if (new TextEncoder().encode(password).length > 72) {
      errors.password = 'Mật khẩu quá dài. Vui lòng giảm số ký tự có dấu hoặc ký tự đặc biệt.'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu.'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.'
    }

    setFieldErrors(errors)
    const firstField = Object.keys(errors)[0]
    const ids = { fullName: 'reg-fullname', email: 'reg-email', phone: 'reg-phone', password: 'reg-password', confirmPassword: 'reg-confirm-password' }
    document.getElementById(ids[firstField])?.focus()
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isBusy) return
    setGeneralError('')

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (!challenge) {
        const response = await authService.startRegistration({ fullName, email, phone, password })
        const nextChallenge = { ...response, email: email.trim().toLowerCase() }
        setChallenge(nextChallenge)
        sessionStorage.setItem('m4n-registration-otp', JSON.stringify(nextChallenge))
        setForm((previous) => ({ ...previous, password: '', confirmPassword: '' }))
        addToast({ message: response.message, type: 'success' })
        return
      }
      await authService.verifyRegistration({
        email: challenge.email,
        challengeId: challenge.challengeId,
        code,
      })
      sessionStorage.removeItem('m4n-registration-otp')
      setIsSuccess(true)
      addToast({
        message: 'Xác minh email thành công! Bạn có thể đăng nhập.',
        type: 'success',
      })
    } catch (err) {
      if (err.fieldErrors) setFieldErrors(Object.fromEntries(Object.entries(err.fieldErrors).map(([field, message]) => [field.replace(/^registration\./, ''), message])))
      const message =
        err?.status === 409
          ? 'Email này đã được đăng ký. Vui lòng đăng nhập để tiếp tục hoặc xác minh email.'
          : err?.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.'
      setGeneralError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (isBusy || Date.now() < Date.parse(challenge.resendAt)) return
    setIsResending(true)
    setGeneralError('')
    try {
      const response = await authService.requestEmailOtp({ email: challenge.email, purpose: 'REGISTER' })
      const nextChallenge = { ...response, email: challenge.email }
      setChallenge(nextChallenge)
      sessionStorage.setItem('m4n-registration-otp', JSON.stringify(nextChallenge))
      setCode('')
      setFieldErrors((previous) => ({ ...previous, code: undefined }))
      addToast({ message: 'Đã gửi mã mới. Vui lòng dùng mã trong email mới nhất.', type: 'success' })
    } catch (error) {
      setGeneralError(error.message || 'Chưa thể gửi lại mã. Vui lòng thử lại.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-sans">{challenge && !isSuccess ? 'Xác minh email' : 'Tạo tài khoản'}</h1>
        <p className="text-sm sm:text-base text-muted leading-relaxed">
          {challenge && !isSuccess ? 'Nhập mã OTP trong email để hoàn tất đăng ký. Thông tin của bạn đã được lưu.'
            : 'Tạo tài khoản M4N để theo dõi đơn hàng và quản lý thông tin cá nhân.'}
        </p>
      </header>

      {isSuccess ? (
        <div className="flex flex-col items-center text-center py-6 px-4 gap-3 bg-[#F6F7F8] border border-jade-border rounded-xl" role="status">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-jade mb-2">
            <CircleCheck size={32} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-ink">Đăng ký thành công!</h2>
          <p className="text-sm text-muted leading-relaxed max-w-sm">
            Email <strong>{challenge?.email || email}</strong> đã được xác minh. Bạn có thể đăng nhập ngay để bắt đầu trải nghiệm.
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
              className="flex items-start gap-2.5 p-3.5 rounded-lg border border-danger-border bg-white text-danger text-sm leading-snug"
              aria-live="assertive"
            >
              <CircleX size={18} aria-hidden="true" className="shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            {challenge && <p className="text-sm text-muted break-words">Email xác minh: <strong>{challenge.email}</strong></p>}
            {!challenge && <RegistrationDetailsFields values={form} errors={fieldErrors} disabled={isBusy}
              onEmailBlur={() => {
                if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                  setFieldErrors((previous) => ({ ...previous, email: 'Định dạng email không hợp lệ.' }))
                }
              }}
              onChange={(name, value) => {
                setForm((previous) => ({ ...previous, [name]: value }))
                setFieldErrors((previous) => ({ ...previous, [name]: undefined }))
              }} />}
            {challenge && (
              <EmailOtpField key={challenge.challengeId} id="reg-otp" challenge={challenge}
                code={code} onCodeChange={(value) => {
                  setCode(value)
                  setFieldErrors((previous) => ({ ...previous, code: undefined }))
                }} error={fieldErrors.code} disabled={isBusy} isResending={isResending} onResend={handleResend} />
            )}
            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                className="w-full h-12"
                loading={isSubmitting}
                disabled={isResending}
                loadingLabel={challenge ? 'Đang xác thực…' : 'Đang gửi mã…'}
              >
                {challenge ? 'Xác minh email' : 'Gửi mã xác thực email'}
              </Button>
            </div>
            {challenge && <Button type="button" variant="secondary" disabled={isBusy} onClick={() => {
              sessionStorage.removeItem('m4n-registration-otp')
              setChallenge(null)
              setCode('')
              setFieldErrors({})
              setGeneralError('')
            }}>Đăng ký bằng email khác</Button>}
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
