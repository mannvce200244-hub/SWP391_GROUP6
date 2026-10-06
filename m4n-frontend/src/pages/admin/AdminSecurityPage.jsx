import { useState } from 'react'
import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'
import useToast from '../../components/ui/useToast.js'
import {
  IconLock,
  IconShield,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconLogOut,
} from '../../components/ui/Icons.jsx'

function AdminSecurityPage() {
  const { addToast } = useToast()

  // Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)

  // Active Sessions
  const [sessions, setSessions] = useState([
    {
      id: 'sess-1',
      device: 'Windows 11 · Trình duyệt Chrome 128',
      ip: '192.168.1.10 (Hà Nội, Việt Nam)',
      lastActive: 'Đang hoạt động hiện tại',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      device: 'macOS Sonoma · Trình duyệt Safari 17',
      ip: '14.232.18.99 (TP. Hồ Chí Minh)',
      lastActive: 'Hoạt động 3 giờ trước',
      isCurrent: false,
    },
  ])

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'Chưa nhập', color: 'bg-border' }
    let score = 0
    if (pwd.length >= 8) score += 1
    if (/[A-Z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd)) score += 1
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1

    if (score <= 1) return { score: 25, label: 'Yếu', color: 'bg-rose-500' }
    if (score === 2) return { score: 50, label: 'Trung bình', color: 'bg-amber-500' }
    if (score === 3) return { score: 75, label: 'Khá mạnh', color: 'bg-emerald-500' }
    return { score: 100, label: 'Rất an toàn', color: 'bg-brand' }
  }

  const pwdStrength = getPasswordStrength(newPassword)

  const handlePasswordSubmit = (e) => {
    e.preventDefault()

    if (!currentPassword) {
      addToast({ message: 'Vui lòng nhập mật khẩu quản trị hiện tại.', type: 'error' })
      return
    }

    if (newPassword.length < 8) {
      addToast({ message: 'Mật khẩu mới phải có tối thiểu 8 ký tự.', type: 'error' })
      return
    }

    if (newPassword !== confirmPassword) {
      addToast({ message: 'Mật khẩu xác nhận không khớp với mật khẩu mới.', type: 'error' })
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      addToast({
        message: 'Đã cập nhật mật khẩu quản trị thành công. Vui lòng ghi nhớ mật khẩu mới.',
        type: 'success',
      })
    }, 400)
  }

  const handleToggle2FA = () => {
    const next = !twoFactorEnabled
    setTwoFactorEnabled(next)
    addToast({
      message: next
        ? 'Đã kích hoạt xác thực 2 bước (2FA) bảo vệ tài khoản quản trị.'
        : 'Đã tạm tắt xác thực 2 bước.',
      type: next ? 'success' : 'warning',
    })
  }

  const handleRevokeSession = (sessionId) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    addToast({
      message: 'Đã đăng xuất phiên hoạt động được chọn.',
      type: 'info',
    })
  }

  const handleRevokeAllOther = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent))
    addToast({
      message: 'Đã đăng xuất khỏi tất cả các thiết bị khác thành công.',
      type: 'success',
    })
  }

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-5xl">
      {/* Header Section */}
      <div className="flex flex-col gap-1.5 bg-surface rounded-2xl border border-border p-6 shadow-xs">
        <EditorialEyebrow label="An toàn & Kiểm soát truy cập" />
        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-sans">
          Bảo mật Tài khoản Quản trị
        </h2>
        <p className="text-sm text-muted">
          Cập nhật mật khẩu phân quyền cao cấp, thiết lập xác thực 2 yếu tố và quản lý phiên máy trạm.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Change Password Form */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-surface rounded-2xl border border-border p-6 sm:p-7 shadow-xs">
            <h3 className="text-base font-bold text-ink mb-5 pb-3 border-b border-border flex items-center gap-2">
              <IconLock size={18} className="text-brand" />
              <span>Đổi mật khẩu tài khoản quản trị</span>
            </h3>

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 text-sm">
              {/* Current Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  Mật khẩu hiện tại <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    placeholder="Nhập mật khẩu quản trị hiện tại"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-border text-ink focus:outline-hidden focus:border-brand focus:ring-1 focus:ring-brand font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                  >
                    {showCurrent ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    placeholder="Tối thiểu 8 ký tự bao gồm chữ hoa, số & ký tự đặc biệt"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-border text-ink focus:outline-hidden focus:border-brand focus:ring-1 focus:ring-brand font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                  >
                    {showNew ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>

                {/* Password strength bar */}
                {newPassword && (
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted">Độ an toàn mật khẩu:</span>
                      <span className="font-bold text-ink">{pwdStrength.label}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${pwdStrength.color}`}
                        style={{ width: `${pwdStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  Xác nhận lại mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    placeholder="Nhập lại chính xác mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-border text-ink focus:outline-hidden focus:border-brand focus:ring-1 focus:ring-brand font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                  >
                    {showConfirm ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <IconCheck size={16} />
                  <span>{isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Sessions Management */}
          <div className="bg-surface rounded-2xl border border-border p-6 sm:p-7 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <span>Phiên đăng nhập & Máy trạm đang hoạt động</span>
              </h3>

              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={handleRevokeAllOther}
                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Đăng xuất thiết bị khác
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-4 rounded-xl bg-canvas border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center text-ink shrink-0 mt-0.5">
                      💻
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink">{sess.device}</span>
                        {sess.isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Thiết bị này
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted font-mono mt-0.5">{sess.ip}</span>
                      <span className="text-[11px] text-muted/80">{sess.lastActive}</span>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(sess.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-rose-600 hover:bg-rose-50 text-xs font-semibold self-start sm:self-center cursor-pointer"
                    >
                      <IconLogOut size={14} />
                      <span>Đăng xuất</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: 2FA & Security Standards */}
        <div className="flex flex-col gap-6">
          {/* Two-Factor Authentication Box */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col gap-4">
            <h3 className="text-base font-bold text-ink pb-2 border-b border-border flex items-center gap-2">
              <IconShield size={18} className="text-brand" />
              <span>Xác thực 2 bước (2FA)</span>
            </h3>

            <p className="text-xs text-muted leading-relaxed">
              Bắt buộc mã OTP từ ứng dụng bảo mật (Google Authenticator) mỗi khi đăng nhập vào hệ thống quản trị M4N.
            </p>

            <div className="p-3.5 rounded-xl bg-canvas border border-border flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-ink">Bảo vệ 2 lớp</span>
                <span
                  className={`text-[11px] font-semibold mt-0.5 ${
                    twoFactorEnabled ? 'text-emerald-600' : 'text-muted'
                  }`}
                >
                  {twoFactorEnabled ? 'Đang kích hoạt' : 'Chưa bật'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggle2FA}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  twoFactorEnabled ? 'bg-brand' : 'bg-border'
                }`}
                aria-label="Bật tắt xác thực 2 bước"
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    twoFactorEnabled ? 'left-6.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {twoFactorEnabled && (
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-800 flex flex-col gap-1">
                <span className="font-bold flex items-center gap-1">
                  <IconCheck size={14} />
                  Tài khoản đang được bảo vệ an toàn
                </span>
                <span className="text-[11px] text-emerald-700 leading-snug">
                  Mã xác thực 6 số sẽ được yêu cầu ở các lần đăng nhập mới hoặc thiết bị lạ.
                </span>
              </div>
            )}
          </div>

          {/* Security Audit Checklist */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              Quy chuẩn An ninh Vận hành
            </h4>
            <div className="flex flex-col gap-2 text-xs text-muted">
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Mật khẩu mã hóa BCrypt chuẩn cấp quân sự.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Token JWT tự động hết hạn và thu hồi khi đăng xuất.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Giao dịch kho và thanh toán được ghi log bất biến.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSecurityPage
