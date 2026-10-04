import { useState } from 'react'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import useAuth from './useAuth.js'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import { IconAlertCircle, IconCheckCircle } from '../../components/ui/Icons.jsx'
import useToast from '../../components/ui/useToast.js'

function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const { addToast } = useToast()
  const [token] = useState(() => {
    if (typeof window === 'undefined') return ''
    const urlParams = new URLSearchParams(window.location.search)
    return (urlParams.get('token') || '').trim()
  })

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState(() => {
    if (typeof window === 'undefined') return ''
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('token')
      ? ''
      : 'Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác thực (token).'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validate = () => {
    const errors = {}

    if (!newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới.'
    } else if (newPassword.length < 8 || newPassword.length > 72) {
      errors.newPassword = 'Mật khẩu mới phải từ 8 đến 72 ký tự.'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu mới.'
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')

    if (!token) {
      setGeneralError('Mã xác thực không hợp lệ. Vui lòng yêu cầu cấp lại liên kết mới.')
      return
    }

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      await resetPassword({
        token,
        newPassword,
        confirmPassword,
      })
      setIsSuccess(true)
      addToast({
        message: 'Mật khẩu đã được cập nhật thành công!',
        type: 'success',
      })
    } catch (err) {
      const message =
        err?.status === 400 || err?.status === 404
          ? 'Mã xác thực không hợp lệ, đã hết hạn hoặc đã được sử dụng trước đó.'
          : err?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại sau.'
      setGeneralError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">Tạo mật khẩu mới</h1>
        <p className="text-sm text-muted leading-relaxed">
          Thiết lập mật khẩu mới an toàn cho tài khoản M4N của bạn.
        </p>
      </header>

      {isSuccess ? (
        <div className="flex flex-col items-center text-center py-6 px-4 gap-3 bg-jade-soft/30 border border-jade-border rounded-xl" role="status">
          <div className="w-14 h-14 rounded-full bg-jade-soft flex items-center justify-center text-jade mb-2">
            <IconCheckCircle size={32} />
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
              className="flex items-start gap-2.5 p-3.5 rounded-lg border border-brand-border bg-brand-soft text-brand text-sm leading-snug"
              aria-live="assertive"
            >
              <IconAlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <Input
              id="reset-new-password"
              name="new-password"
              type="password"
              label="Mật khẩu mới"
              autoComplete="new-password"
              required
              allowTogglePassword
              helperText="Tối thiểu 8 ký tự."
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              error={fieldErrors.newPassword}
              disabled={isSubmitting || !token}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (fieldErrors.newPassword) {
                  setFieldErrors((prev) => ({ ...prev, newPassword: undefined }))
                }
              }}
            />

            <Input
              id="reset-confirm-password"
              name="confirm-password"
              type="password"
              label="Xác nhận mật khẩu mới"
              autoComplete="new-password"
              required
              allowTogglePassword
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              error={fieldErrors.confirmPassword}
              disabled={isSubmitting || !token}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                }
              }}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={isSubmitting}
                loadingLabel="Đang cập nhật…"
                disabled={!token}
              >
                Cập nhật mật khẩu
              </Button>
            </div>
          </form>

          <footer className="pt-4 border-t border-border flex items-center justify-center text-sm text-muted">
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
