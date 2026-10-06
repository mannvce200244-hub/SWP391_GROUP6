import { useState } from 'react'
import useAuth from './useAuth.js'
import AccountLayout from '../../layouts/AccountLayout.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import {
  IconAlertCircle,
  IconComputer,
  IconKey,
  IconLock,
  IconEye,
  IconEyeOff,
} from '../../components/ui/Icons.jsx'
import useToast from '../../components/ui/useToast.js'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'

function AccountSecurityPage() {
  const { changePassword, logoutAll } = useAuth()
  const { addToast } = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
      <div className="space-y-8">
        
        {/* General Error Alert */}
        {generalError && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 rounded-2xl text-sm leading-relaxed bg-danger-soft border border-danger-border text-danger"
            aria-live="assertive"
          >
            <IconAlertCircle size={20} className="shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Change Password Form — Brought Directly to Top */}
        <section className="bg-surface-secondary/40 border border-border/80 rounded-[28px] p-6 sm:p-8">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-brand text-white shadow-md shadow-brand/20">
              <IconKey size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-ink font-sans">
                Đổi mật khẩu tài khoản
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Mật khẩu mới yêu cầu từ 8 đến 72 ký tự để đảm bảo an toàn tối đa.
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5 max-w-[580px]" noValidate>
            
            {/* Current Password */}
            <div className="group relative">
              <label 
                htmlFor="sec-current-pwd"
                className="mb-2 block text-sm font-bold text-ink"
              >
                Mật khẩu hiện tại <span className="text-brand">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-4 text-subtle transition-colors group-focus-within:text-brand">
                  <IconLock size={18} />
                </div>
                <input
                  id="sec-current-pwd"
                  name="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Nhập mật khẩu hiện tại"
                  value={currentPassword}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    if (fieldErrors.currentPassword) {
                      setFieldErrors((prev) => ({ ...prev, currentPassword: undefined }))
                    }
                  }}
                  className={`w-full rounded-2xl border bg-white px-4 py-3.5 pl-11 pr-11 text-sm text-ink shadow-2xs transition-all duration-200 focus:outline-none focus:ring-4 ${
                    fieldErrors.currentPassword
                      ? 'border-danger bg-danger-soft/20 focus:border-danger focus:ring-danger/10'
                      : 'border-border/80 focus:border-brand focus:ring-brand/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-3.5 text-subtle hover:text-ink transition-colors cursor-pointer p-1"
                  aria-label={showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showCurrentPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
              {fieldErrors.currentPassword && (
                <p className="mt-1.5 text-xs font-semibold text-danger flex items-center gap-1">
                  <IconAlertCircle size={13} />
                  <span>{fieldErrors.currentPassword}</span>
                </p>
              )}
            </div>

            {/* New Password */}
            <div className="group relative">
              <label 
                htmlFor="sec-new-pwd"
                className="mb-2 block text-sm font-bold text-ink"
              >
                Mật khẩu mới <span className="text-brand">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-4 text-subtle transition-colors group-focus-within:text-brand">
                  <IconLock size={18} />
                </div>
                <input
                  id="sec-new-pwd"
                  name="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (fieldErrors.newPassword) {
                      setFieldErrors((prev) => ({ ...prev, newPassword: undefined }))
                    }
                  }}
                  className={`w-full rounded-2xl border bg-white px-4 py-3.5 pl-11 pr-11 text-sm text-ink shadow-2xs transition-all duration-200 focus:outline-none focus:ring-4 ${
                    fieldErrors.newPassword
                      ? 'border-danger bg-danger-soft/20 focus:border-danger focus:ring-danger/10'
                      : 'border-border/80 focus:border-brand focus:ring-brand/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3.5 text-subtle hover:text-ink transition-colors cursor-pointer p-1"
                  aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showNewPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
              {fieldErrors.newPassword ? (
                <p className="mt-1.5 text-xs font-semibold text-danger flex items-center gap-1">
                  <IconAlertCircle size={13} />
                  <span>{fieldErrors.newPassword}</span>
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-muted">
                  Tối thiểu 8 ký tự, khuyến khích kết hợp chữ hoa, chữ thường và số.
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="group relative">
              <label 
                htmlFor="sec-confirm-pwd"
                className="mb-2 block text-sm font-bold text-ink"
              >
                Xác nhận lại mật khẩu mới <span className="text-brand">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-4 text-subtle transition-colors group-focus-within:text-brand">
                  <IconLock size={18} />
                </div>
                <input
                  id="sec-confirm-pwd"
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Nhập lại mật khẩu mới vừa nhập"
                  value={confirmPassword}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                    }
                  }}
                  className={`w-full rounded-2xl border bg-white px-4 py-3.5 pl-11 pr-11 text-sm text-ink shadow-2xs transition-all duration-200 focus:outline-none focus:ring-4 ${
                    fieldErrors.confirmPassword
                      ? 'border-danger bg-danger-soft/20 focus:border-danger focus:ring-danger/10'
                      : 'border-border/80 focus:border-brand focus:ring-brand/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3.5 text-subtle hover:text-ink transition-colors cursor-pointer p-1"
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1.5 text-xs font-semibold text-danger flex items-center gap-1">
                  <IconAlertCircle size={13} />
                  <span>{fieldErrors.confirmPassword}</span>
                </p>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
                className="relative inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-brand hover:bg-brand-hover active:scale-[0.98] px-8 font-bold text-white shadow-lg shadow-brand/20 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4 animate-spin text-current"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Đang cập nhật mật khẩu...</span>
                  </>
                ) : (
                  <span>Cập nhật mật khẩu mới</span>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Active Sessions Section */}
        <section className="bg-surface-secondary/40 border border-border/80 rounded-[28px] p-6 sm:p-8">
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-brand/15 text-brand border border-brand-border">
              <IconComputer size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-ink font-sans">
                Phiên đăng nhập hiện tại
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Quản lý thiết bị và trình duyệt bạn đang sử dụng.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-border/80 shadow-2xs">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-brand-soft text-brand border border-brand-border">
              <IconComputer size={24} />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h4 className="text-sm font-bold text-ink">
                  Trình duyệt web hiện tại
                </h4>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full text-brand bg-brand-soft border border-brand-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" aria-hidden="true" />
                  Đang hoạt động
                </span>
              </div>
              <p className="text-xs text-muted">
                Phiên làm việc bảo mật đang hoạt động an toàn trên máy tính này.
              </p>
            </div>
          </div>
        </section>

        {/* Logout All Sessions Section */}
        <section className="bg-danger-soft/30 border border-danger-border/60 rounded-[28px] p-6 sm:p-8">
          <div className="flex items-start gap-3.5 mb-5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-danger text-white shadow-md shadow-danger/20">
              <IconAlertCircle size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-ink font-sans">
                Đăng xuất khỏi tất cả thiết bị
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Thu hồi phiên làm việc trên mọi thiết bị khác. Bạn sẽ cần đăng nhập lại trên các thiết bị đã bị thu hồi.
              </p>
            </div>
          </div>

          <div>
            <button
              type="button"
              disabled={isLoggingOutAll}
              onClick={() => setShowLogoutAllConfirm(true)}
              className="inline-flex items-center justify-center h-11 px-6 rounded-2xl font-bold text-sm text-danger bg-white border border-danger-border hover:bg-danger hover:text-white transition-all cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOutAll ? 'Đang thu hồi phiên...' : 'Đăng xuất tất cả thiết bị'}
            </button>
          </div>
        </section>

      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutAllConfirm}
        title="Đăng xuất khỏi tất cả thiết bị?"
        description="Bạn sẽ cần đăng nhập lại trên các thiết bị đã bị thu hồi phiên làm việc."
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
