import { useState } from 'react'
import useAuth from './useAuth.js'
import AccountLayout from '../../layouts/AccountLayout.jsx'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { IconAlertCircle, IconComputer } from '../../components/ui/Icons.jsx'
import useToast from '../../components/ui/useToast.js'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'

function AccountSecurityPage() {
  const { changePassword, logoutAll } = useAuth()
  const { addToast } = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false)
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false)

  const validate = () => {
    const errors = {}

    if (!currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.'
    }

    if (!newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới.'
    } else if (newPassword.length < 8 || newPassword.length > 72) {
      errors.newPassword = 'Mật khẩu mới phải từ 8 đến 72 ký tự.'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.'
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.'
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword = 'Mật khẩu mới không được trùng với mật khẩu hiện tại.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setGeneralError('')

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      addToast({
        message: 'Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.',
        type: 'success',
      })
      setTimeout(() => {
        navigateTo(CUSTOMER_ROUTES.login)
      }, 1200)
    } catch (err) {
      setGeneralError(
        err?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.'
      )
      setIsSubmitting(false)
    }
  }

  const handleConfirmLogoutAll = async () => {
    setIsLoggingOutAll(true)
    try {
      await logoutAll()
      addToast({
        message: 'Đã đăng xuất khỏi tất cả thiết bị thành công.',
        type: 'info',
      })
      navigateTo(CUSTOMER_ROUTES.login)
    } catch (err) {
      setGeneralError(err?.message || 'Có lỗi xảy ra khi đăng xuất khỏi tất cả thiết bị.')
      setIsLoggingOutAll(false)
      setShowLogoutAllConfirm(false)
    }
  }

  return (
    <AccountLayout activeTab="security">
      <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-xs flex flex-col gap-8">
        <header className="flex flex-col gap-1 pb-4 border-b border-border/60">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink font-sans">Bảo mật tài khoản</h1>
          <p className="text-sm text-muted">
            Quản lý mật khẩu và kiểm soát các phiên đăng nhập để giữ an toàn cho tài khoản của bạn.
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

        {/* 1. Change Password Section */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-bold text-ink">Đổi mật khẩu đăng nhập</h2>
            <p className="text-sm text-muted">
              Sử dụng mật khẩu có độ dài tối thiểu 8 ký tự để bảo vệ tài khoản.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-4" noValidate>
            <Input
              id="sec-current-pwd"
              name="current-password"
              type="password"
              label="Mật khẩu hiện tại"
              autoComplete="current-password"
              required
              allowTogglePassword
              placeholder="Nhập mật khẩu hiện tại"
              value={currentPassword}
              error={fieldErrors.currentPassword}
              disabled={isSubmitting}
              onChange={(e) => {
                setCurrentPassword(e.target.value)
                if (fieldErrors.currentPassword) {
                  setFieldErrors((prev) => ({ ...prev, currentPassword: undefined }))
                }
              }}
            />

            <Input
              id="sec-new-pwd"
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
              disabled={isSubmitting}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (fieldErrors.newPassword) {
                  setFieldErrors((prev) => ({ ...prev, newPassword: undefined }))
                }
              }}
            />

            <Input
              id="sec-confirm-pwd"
              name="confirm-password"
              type="password"
              label="Xác nhận mật khẩu mới"
              autoComplete="new-password"
              required
              allowTogglePassword
              placeholder="Nhập lại mật khẩu mới"
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

            <div className="pt-2 flex items-center justify-start">
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                loadingLabel="Đang cập nhật…"
              >
                Cập nhật mật khẩu
              </Button>
            </div>
          </form>
        </section>

        <div className="border-t border-border" role="separator" />

        {/* 2. Active Sessions Section */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-bold text-ink">Phiên đăng nhập & Thiết bị</h2>
            <p className="text-sm text-muted">
              Kiểm soát trạng thái đăng nhập và thu hồi quyền truy cập khi sử dụng máy tính công cộng.
            </p>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-canvas">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-muted shrink-0 border border-border">
              <IconComputer size={24} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-ink">Phiên làm việc hiện tại</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-jade-soft text-jade">Đang hoạt động</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Trình duyệt này được xác thực qua Refresh Token HttpOnly chống rò rỉ XSS.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-brand-border bg-brand-soft/20 mt-2">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-bold text-brand">Đăng xuất khỏi tất cả thiết bị</h3>
              <p className="text-xs text-muted leading-relaxed max-w-md">
                Vô hiệu hóa tất cả các phiên đăng nhập khác của bạn trên mọi trình duyệt và thiết bị khác.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowLogoutAllConfirm(true)}
              disabled={isLoggingOutAll}
            >
              Đăng xuất tất cả thiết bị
            </Button>
          </div>
        </section>
      </div>

      {/* Confirmation Dialog replacing window.confirm() */}
      <ConfirmDialog
        isOpen={showLogoutAllConfirm}
        title="Đăng xuất khỏi tất cả thiết bị?"
        description="Hành động này sẽ vô hiệu hóa tất cả các phiên đăng nhập khác của bạn trên mọi thiết bị và trình duyệt. Bạn sẽ cần đăng nhập lại từ đầu."
        confirmLabel="Đăng xuất tất cả"
        cancelLabel="Hủy"
        variant="danger"
        isLoading={isLoggingOutAll}
        onConfirm={handleConfirmLogoutAll}
        onCancel={() => setShowLogoutAllConfirm(false)}
      />
    </AccountLayout>
  )
}

export default AccountSecurityPage
