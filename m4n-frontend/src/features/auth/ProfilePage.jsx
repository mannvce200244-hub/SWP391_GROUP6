import { useState } from 'react'
import useAuth from './useAuth.js'
import AccountLayout from '../../layouts/AccountLayout.jsx'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import FormField from '../../components/ui/FormField.jsx'
import { IconAlertCircle } from '../../components/ui/Icons.jsx'
import useToast from '../../components/ui/useToast.js'

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
      errors.phone = 'Số điện thoại không hợp lệ (8 - 20 số).'
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
        message: 'Hồ sơ đã được cập nhật thành công.',
        type: 'success',
      })
    } catch (err) {
      const message = err?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại sau.'
      setGeneralError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AccountLayout activeTab="profile">
      <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        <header className="flex flex-col gap-1 pb-4 border-b border-border/60">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink font-sans">Hồ sơ cá nhân</h1>
          <p className="text-sm text-muted">
            Cập nhật thông tin dùng cho tài khoản và đơn hàng.
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            id="profile-email"
            name="email"
            type="email"
            label="Địa chỉ Email"
            value={user?.email || ''}
            readOnly
            disabled
            helperText="Email là định danh tài khoản cố định và không thể thay đổi."
          />

          <Input
            id="profile-fullname"
            name="name"
            type="text"
            label="Họ và tên"
            autoComplete="name"
            required
            value={fullName}
            error={fieldErrors.fullName}
            disabled={isSubmitting}
            onChange={(e) => {
              setFullName(e.target.value)
              if (fieldErrors.fullName) {
                setFieldErrors((prev) => ({ ...prev, fullName: undefined }))
              }
            }}
          />

          <Input
            id="profile-phone"
            name="tel"
            type="tel"
            label="Số điện thoại liên hệ"
            autoComplete="tel"
            placeholder="0901234567"
            value={phone}
            error={fieldErrors.phone}
            disabled={isSubmitting}
            onChange={(e) => {
              setPhone(e.target.value)
              if (fieldErrors.phone) {
                setFieldErrors((prev) => ({ ...prev, phone: undefined }))
              }
            }}
          />

          <FormField
            id="profile-address"
            label="Địa chỉ giao hàng mặc định"
          >
            <textarea
              id="profile-address"
              name="address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-control-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors min-h-[90px]"
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố…"
              disabled={isSubmitting}
            />
          </FormField>

          <div className="pt-2 flex items-center justify-start">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              loadingLabel="Đang lưu thay đổi…"
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </AccountLayout>
  )
}

export default ProfilePage
