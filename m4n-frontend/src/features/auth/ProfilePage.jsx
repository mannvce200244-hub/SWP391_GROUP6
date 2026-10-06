import { useState } from 'react'
import useAuth from './useAuth.js'
import AccountLayout from '../../layouts/AccountLayout.jsx'
import {
  IconAlertCircle,
  IconCheck,
  IconMail,
  IconShield,
  IconArrowRight,
  IconUser,
  IconPhone,
  IconMapPin,
  IconCamera,
} from '../../components/ui/Icons.jsx'
import useToast from '../../components/ui/useToast.js'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'

function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const { addToast } = useToast()

  const [fullName, setFullName] = useState(() => user?.fullName || '')
  const [phone, setPhone] = useState(() => user?.phone || '')
  const [address, setAddress] = useState(() => user?.address || '')
  const [prevUser, setPrevUser] = useState(user)

  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Synchronize state if user updates externally
  if (user !== prevUser) {
    setPrevUser(user)
    setFullName(user?.fullName || '')
    setPhone(user?.phone || '')
    setAddress(user?.address || '')
  }

  const validate = () => {
    const errors = {}
    const trimmedName = fullName.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedName) {
      errors.fullName = 'Họ và tên không được để trống.'
    } else if (trimmedName.length > 150) {
      errors.fullName = 'Họ và tên không được vượt quá 150 ký tự.'
    }

    if (trimmedPhone && !/^[0-9+() -]{8,20}$/.test(trimmedPhone)) {
      errors.phone = 'Số điện thoại không hợp lệ (từ 8 đến 20 số).'
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
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      })
      addToast({
        message: 'Hồ sơ cá nhân đã được cập nhật thành công.',
        type: 'success',
      })
    } catch (err) {
      const message = err?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại sau.'
      setGeneralError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  const isFormDirty =
    fullName.trim() !== (user?.fullName || '').trim() ||
    phone.trim() !== (user?.phone || '').trim() ||
    address.trim() !== (user?.address || '').trim()

  return (
    <AccountLayout activeTab="profile">
      <div className="space-y-8">
        
        {/* Profile Hero Section */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-border/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            
            {/* Prominent Circular Avatar */}
            <div className="group relative">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center font-black text-3xl sm:text-4xl bg-gradient-to-br from-brand to-brand-hover text-white shadow-xl shadow-brand/20 ring-4 ring-brand-soft select-none transition-transform duration-200 group-hover:scale-[1.02]"
                aria-hidden="true"
              >
                {getInitials(user?.fullName || user?.email)}
              </div>
              <div 
                className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-default"
                title="Avatar hiển thị theo tài khoản"
              >
                <IconCamera size={26} />
              </div>
            </div>

            {/* Name and Badges */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-ink font-sans mb-1.5 truncate">
                {user?.fullName || 'Người dùng M4N'}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-jade-soft px-3 py-1 text-xs font-bold text-jade border border-jade-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-jade animate-pulse" />
                  {user?.role === 'ADMIN'
                    ? 'Quản trị viên'
                    : user?.role === 'ONLINE_STAFF'
                      ? 'Nhân viên Online'
                      : user?.role === 'POS_STAFF'
                        ? 'Nhân viên Showroom POS'
                        : 'Khách hàng thành viên'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-muted border border-border">
                  <IconCheck size={13} className="text-jade" />
                  Đã xác thực
                </span>
              </div>
              <p className="text-xs text-muted flex items-center gap-1.5">
                <IconMail size={14} className="text-subtle" />
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          {/* Quick Security Action Shortcut */}
          <button
            type="button"
            onClick={() => navigateTo(CUSTOMER_ROUTES.security)}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-[16px] text-xs font-bold text-brand bg-brand-soft/70 hover:bg-brand-soft border border-brand-border transition-all cursor-pointer"
          >
            <IconShield size={15} />
            <span>Bảo mật & Đổi mật khẩu</span>
            <IconArrowRight size={13} />
          </button>
        </div>

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

        {/* Profile Update Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Full Name Field with Icon Prefix */}
            <div className="group relative">
              <label 
                htmlFor="profile-fullname"
                className="mb-2 block text-sm font-bold text-ink"
              >
                Họ và tên đầy đủ <span className="text-brand">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-4 text-subtle transition-colors group-focus-within:text-brand">
                  <IconUser size={18} />
                </div>
                <input
                  id="profile-fullname"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Nhập họ và tên của bạn"
                  value={fullName}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    if (fieldErrors.fullName) {
                      setFieldErrors((prev) => ({ ...prev, fullName: undefined }))
                    }
                  }}
                  className={`w-full rounded-2xl border bg-white px-4 py-3.5 pl-11 text-sm text-ink shadow-2xs transition-all duration-200 focus:outline-none focus:ring-4 ${
                    fieldErrors.fullName
                      ? 'border-danger bg-danger-soft/20 focus:border-danger focus:ring-danger/10'
                      : 'border-border/80 focus:border-brand focus:ring-brand/10'
                  }`}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="mt-1.5 text-xs font-semibold text-danger flex items-center gap-1">
                  <IconAlertCircle size={13} />
                  <span>{fieldErrors.fullName}</span>
                </p>
              )}
            </div>

            {/* Phone Field with Icon Prefix */}
            <div className="group relative">
              <label 
                htmlFor="profile-phone"
                className="mb-2 block text-sm font-bold text-ink"
              >
                Số điện thoại liên hệ
              </label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-4 text-subtle transition-colors group-focus-within:text-brand">
                  <IconPhone size={18} />
                </div>
                <input
                  id="profile-phone"
                  name="tel"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Ví dụ: 0912 345 678"
                  value={phone}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (fieldErrors.phone) {
                      setFieldErrors((prev) => ({ ...prev, phone: undefined }))
                    }
                  }}
                  className={`w-full rounded-2xl border bg-white px-4 py-3.5 pl-11 text-sm text-ink shadow-2xs transition-all duration-200 focus:outline-none focus:ring-4 ${
                    fieldErrors.phone
                      ? 'border-danger bg-danger-soft/20 focus:border-danger focus:ring-danger/10'
                      : 'border-border/80 focus:border-brand focus:ring-brand/10'
                  }`}
                />
              </div>
              {fieldErrors.phone ? (
                <p className="mt-1.5 text-xs font-semibold text-danger flex items-center gap-1">
                  <IconAlertCircle size={13} />
                  <span>{fieldErrors.phone}</span>
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-muted">
                  Dùng để xác nhận đơn hàng và điều phối giao nhận nhạc cụ.
                </p>
              )}
            </div>

            {/* Email Field with Icon Prefix (Disabled) */}
            <div className="group relative md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label 
                  htmlFor="profile-email"
                  className="block text-sm font-bold text-ink"
                >
                  Địa chỉ Email
                </label>
                <span className="text-xs text-subtle font-medium">Định danh cố định</span>
              </div>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-4 text-subtle">
                  <IconMail size={18} />
                </div>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  readOnly
                  className="w-full cursor-not-allowed rounded-2xl border border-border/80 bg-surface-secondary/70 px-4 py-3.5 pl-11 text-sm text-muted shadow-inner select-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Email tài khoản được dùng để đăng nhập và gửi thông báo đơn hàng điện tử.
              </p>
            </div>

            {/* Address Field with Icon Prefix */}
            <div className="group relative md:col-span-2">
              <label 
                htmlFor="profile-address"
                className="mb-2 block text-sm font-bold text-ink"
              >
                Địa chỉ giao nhận mặc định
              </label>
              <div className="relative flex">
                <div className="pointer-events-none absolute left-4 top-4 text-subtle transition-colors group-focus-within:text-brand">
                  <IconMapPin size={18} />
                </div>
                <textarea
                  id="profile-address"
                  name="address"
                  rows={3}
                  placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                  value={address}
                  disabled={isSubmitting}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-2xl border border-border/80 bg-white p-4 pl-11 text-sm text-ink shadow-2xs min-h-[105px] resize-y transition-all duration-200 placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Địa chỉ này sẽ được ưu tiên tự động điền khi bạn đặt làm hoặc mua nhạc cụ tại M4N.
              </p>
            </div>

          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="text-xs text-muted">
              {isFormDirty ? (
                <span className="text-brand font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand animate-ping" />
                  Bạn có thay đổi chưa lưu
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-subtle">
                  <IconCheck size={14} className="text-jade" />
                  Dữ liệu hồ sơ đã được đồng bộ
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isFormDirty && !isSubmitting && (
                <button
                  type="button"
                  onClick={() => {
                    setFullName(user?.fullName || '')
                    setPhone(user?.phone || '')
                    setAddress(user?.address || '')
                    setFieldErrors({})
                    setGeneralError('')
                  }}
                  className="px-5 py-3 text-sm font-bold text-muted hover:text-ink transition-colors cursor-pointer rounded-2xl hover:bg-surface-secondary"
                >
                  Hoàn tác
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting || (!isFormDirty && Object.keys(fieldErrors).length === 0)}
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
                    <span>Đang lưu thay đổi...</span>
                  </>
                ) : (
                  <span>Lưu thay đổi hồ sơ</span>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </AccountLayout>
  )
}

export default ProfilePage
