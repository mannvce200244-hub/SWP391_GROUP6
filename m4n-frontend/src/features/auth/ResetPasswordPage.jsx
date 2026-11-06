import { useEffect, useRef, useState } from 'react'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import useAuth from './useAuth.js'
import authService from './authService.js'
import EmailOtpField from './EmailOtpField.jsx'
import ResetPasswordFields from './ResetPasswordFields.jsx'
import Button from '../../components/ui/Button.jsx'
import { CircleX, CircleCheck } from 'lucide-react'
import useToast from '../../components/ui/useToast.js'

function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const { addToast } = useToast()
  const [token] = useState(() => {
    if (typeof window === 'undefined') return ''
    const urlParams = new URLSearchParams(window.location.search)
    return (urlParams.get('token') || '').trim()
  })
  const [challenge, setChallenge] = useState(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('m4n-reset-otp') || 'null')
      return stored?.email && stored?.challengeId ? stored : null
    } catch { return null }
  })
  const [code, setCode] = useState('')
  const [verifiedReset, setVerifiedReset] = useState(null)
  const passwordRef = useRef(null)
  const canSetPassword = Boolean(token || verifiedReset)

  useEffect(() => {
    if (verifiedReset) passwordRef.current?.focus()
  }, [verifiedReset])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState(() => {
    if (typeof window === 'undefined') return ''
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('token')?.trim() || challenge
      ? ''
      : 'Vui lòng yêu cầu mã OTP mới ở trang Quên mật khẩu.'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const isBusy = isSubmitting || isResending
  const [isSuccess, setIsSuccess] = useState(false)

  const validate = () => {
    const errors = {}
    if (!canSetPassword) {
      if (!/^[0-9]{6}$/.test(code)) errors.code = 'Vui lòng nhập mã OTP gồm 6 chữ số.'
      setFieldErrors(errors)
      if (errors.code) document.getElementById('reset-otp')?.focus()
      return Object.keys(errors).length === 0
    }

    if (!newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới.'
    } else if (newPassword.length < 8 || newPassword.length > 72) {
      errors.newPassword = 'Mật khẩu mới phải từ 8 đến 72 ký tự.'
    } else if (new TextEncoder().encode(newPassword).length > 72) {
      errors.newPassword = 'Mật khẩu quá dài. Vui lòng giảm số ký tự có dấu hoặc ký tự đặc biệt.'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu mới.'
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.'
    }

    setFieldErrors(errors)
    if (errors.newPassword) document.getElementById('reset-new-password')?.focus()
    else if (errors.confirmPassword) document.getElementById('reset-confirm-password')?.focus()
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isBusy) return
    setGeneralError('')

    if (!token && !challenge) {
      setGeneralError('Mã xác thực không hợp lệ. Vui lòng yêu cầu mã OTP mới.')
      return
    }

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (!canSetPassword) {
        const response = await authService.verifyResetOtp({
          email: challenge.email, challengeId: challenge.challengeId, code,
        })
        setVerifiedReset(response)
        setCode('')
        setFieldErrors({})
        return
      }
      await resetPassword({ token: token || verifiedReset.token, newPassword, confirmPassword })
      setVerifiedReset(null)
      setNewPassword('')
      setConfirmPassword('')
      sessionStorage.removeItem('m4n-reset-otp')
      setIsSuccess(true)
      addToast({
        message: 'Mật khẩu đã được cập nhật thành công!',
        type: 'success',
      })
    } catch (err) {
      if (err.fieldErrors) setFieldErrors(err.fieldErrors)
      const message =
        (err?.status === 400 && !Object.keys(err.fieldErrors || {}).length) || err?.status === 401 || err?.status === 404
          ? 'Mã xác thực không hợp lệ, đã hết hạn hoặc đã được sử dụng trước đó.'
          : err?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại sau.'
      setGeneralError(message)
      if (verifiedReset && (err?.status === 400 || err?.status === 401) && !Object.keys(err.fieldErrors || {}).length) {
        setVerifiedReset(null)
        setNewPassword('')
        setConfirmPassword('')
        setGeneralError('Quyền đổi mật khẩu đã hết hạn hoặc bị thay thế. Vui lòng gửi lại mã OTP và xác minh lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (isBusy || !challenge || Date.now() < Date.parse(challenge.resendAt)) return
    setIsResending(true)
    setGeneralError('')
    try {
      const response = await authService.requestEmailOtp({ email: challenge.email, purpose: 'RESET_PASSWORD' })
      const nextChallenge = { ...response, email: challenge.email }
      setChallenge(nextChallenge)
      setVerifiedReset(null)
      setCode('')
      setFieldErrors((previous) => ({ ...previous, code: undefined }))
      sessionStorage.setItem('m4n-reset-otp', JSON.stringify(nextChallenge))
      addToast({ message: response.message, type: 'success' })
    } catch (error) {
      setGeneralError(error.message || 'Chưa thể gửi lại mã. Vui lòng thử lại.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">
          {canSetPassword || isSuccess ? 'Tạo mật khẩu mới' : 'Xác minh mã OTP'}
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          {canSetPassword || isSuccess
            ? 'Thiết lập mật khẩu mới an toàn cho tài khoản M4N của bạn.'
            : 'Nhập mã gồm 6 chữ số trong email để tiếp tục đặt lại mật khẩu.'}
        </p>
      </header>

      {isSuccess ? (
        <div className="flex flex-col items-center text-center py-6 px-4 gap-3 bg-[#F6F7F8] border border-jade-border rounded-xl" role="status">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-jade mb-2">
            <CircleCheck size={32} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-ink">Mật khẩu đã được cập nhật!</h2>
          <p className="text-sm text-muted leading-relaxed max-w-sm">
            Tất cả các phiên đăng nhập cũ đã được vô hiệu hóa an toàn. Bạn có thể đăng nhập ngay với mật khẩu mới.
          </p>
          <Button
            type="button"
            variant="primary"
            className="w-full mt-2"
            onClick={() => navigateTo(CUSTOMER_ROUTES.login)}
          >
            Đăng nhập ngay
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

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            {!canSetPassword && challenge && <EmailOtpField key={challenge.challengeId} id="reset-otp" challenge={challenge}
              code={code} onCodeChange={(value) => {
                setCode(value)
                setFieldErrors((previous) => ({ ...previous, code: undefined }))
              }} error={fieldErrors.code} disabled={isBusy} isResending={isResending} onResend={handleResend} />}
            {canSetPassword && <>
              {!token && <p role="status" className="text-sm text-jade">Đã xác minh email. Bạn có thể tạo mật khẩu mới.</p>}
              <ResetPasswordFields inputRef={passwordRef} newPassword={newPassword} confirmPassword={confirmPassword}
                errors={fieldErrors} disabled={isBusy}
                onNewPasswordChange={(value) => {
                  setNewPassword(value)
                  setFieldErrors((previous) => ({ ...previous, newPassword: undefined }))
                }}
                onConfirmPasswordChange={(value) => {
                  setConfirmPassword(value)
                  setFieldErrors((previous) => ({ ...previous, confirmPassword: undefined }))
                }} />
            </>}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={isSubmitting}
                loadingLabel={canSetPassword ? 'Đang cập nhật…' : 'Đang xác minh…'}
                disabled={isResending || (!token && !challenge)}
              >
                {canSetPassword ? 'Cập nhật mật khẩu' : 'Xác minh OTP'}
              </Button>
            </div>
          </form>

          <footer className="pt-4 border-t border-border flex items-center justify-center text-sm text-muted">
            {!token && !challenge && <RouterLink href={CUSTOMER_ROUTES.forgotPassword} className="font-medium text-brand mr-4">Yêu cầu mã mới</RouterLink>}
            <RouterLink
              href={CUSTOMER_ROUTES.login}
              className="font-medium text-muted hover:text-ink transition-colors"
            >
              ← Quay lại trang Đăng nhập
            </RouterLink>
          </footer>
        </>
      )}
    </div>
  )
}

export default ResetPasswordPage
