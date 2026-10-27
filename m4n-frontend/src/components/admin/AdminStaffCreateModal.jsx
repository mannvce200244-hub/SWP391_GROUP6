import { Copy, RefreshCw, X } from 'lucide-react'
import useDialogFocus from '../../hooks/useDialogFocus.js'

export default function AdminStaffCreateModal({
  createdStaffCredentials,
  createForm,
  setCreateForm,
  createFieldErrors,
  setCreateFieldErrors,
  isActionLoading,
  allowedCreateRoles,
  ROLE_DEFINITIONS,
  closeCreateModal,
  copyToClipboard,
  regenerateTemporaryPassword,
  handleCreateStaff
}) {
  const createDialogRef = useDialogFocus(true, closeCreateModal, isActionLoading)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl border border-[#E5E8EB] shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 overscroll-contain"
        ref={createDialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-staff-title"
      >
        <div className="flex justify-between items-center pb-3 border-b border-[#E5E8EB] mb-4">
          <h2 id="create-staff-title" className="text-lg font-bold text-[#17191B]">
            {createdStaffCredentials ? 'Tạo nhân sự thành công' : 'Thêm nhân sự mới'}
          </h2>
          <button
            type="button"
            className="text-secondary hover:text-[#17191B] cursor-pointer p-1 rounded-lg hover:bg-zinc-100 transition-colors"
            onClick={closeCreateModal}
            aria-label="Đóng"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {createdStaffCredentials ? (
          <div className="flex flex-col gap-4" role="status" aria-live="polite">
            <div className="rounded-xl border border-success-border bg-white p-4">
              <p className="font-semibold text-success">Tài khoản đã sẵn sàng</p>
              <p className="mt-1 text-sm leading-relaxed text-secondary">
                Sao chép thông tin đăng nhập tạm thời trước khi đóng. Mật khẩu này không thể xem lại sau.
              </p>
            </div>

            <dl className="overflow-hidden rounded-xl border border-[#E5E8EB] bg-[#F6F7F8]">
              <div className="border-b border-[#E5E8EB] px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-secondary">Email đăng nhập</dt>
                <dd className="mt-1 break-all font-mono text-sm font-semibold text-[#17191B]">{createdStaffCredentials.email}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-secondary">Mật khẩu tạm thời</dt>
                <dd className="mt-1 break-all font-mono text-base font-bold tracking-wide text-[#17191B]">{createdStaffCredentials.password}</dd>
              </div>
            </dl>

            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border border-[#E5E8EB] text-zinc-700 hover:bg-[#F6F7F8] font-semibold text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/15"
                onClick={closeCreateModal}
              >
                Đóng
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D9488] text-white hover:bg-[#0F766E] font-semibold text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/20"
                onClick={() => copyToClipboard(
                  `Email: ${createdStaffCredentials.email}\nMật khẩu tạm thời: ${createdStaffCredentials.password}`,
                  'Đã sao chép thông tin đăng nhập tạm thời.'
                )}
              >
                <Copy size={16} aria-hidden="true" />
                Sao chép thông tin đăng nhập
              </button>
            </div>
          </div>
        ) : (
        <form noValidate onSubmit={handleCreateStaff} className="flex flex-col gap-4 text-sm">
                  <fieldset disabled={isActionLoading} className="contents">
          <div>
            <label htmlFor="create-staff-full-name" className="block text-sm font-semibold text-[#17191B] mb-1.5">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              id="create-staff-full-name"
              name="fullName"
              type="text"
              required
              maxLength={150}
              autoComplete="name"
              aria-invalid={createFieldErrors.fullName ? 'true' : undefined}
              aria-describedby={createFieldErrors.fullName ? 'create-staff-full-name-error' : undefined}
              className={`w-full px-3.5 py-2 text-sm border rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/15 ${createFieldErrors.fullName ? 'border-danger' : 'border-[#E5E8EB] focus-visible:border-[#0D9488]'}`}
              placeholder="Ví dụ: Nguyễn Văn A…"
              value={createForm.fullName}
              onChange={(e) => {
                setCreateForm({ ...createForm, fullName: e.target.value })
                setCreateFieldErrors((current) => ({ ...current, fullName: undefined }))
              }}
            />
            {createFieldErrors.fullName && <p id="create-staff-full-name-error" className="mt-1.5 text-xs text-danger" role="alert">{createFieldErrors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="create-staff-email" className="block text-sm font-semibold text-[#17191B] mb-1.5">
              Email đăng nhập <span className="text-rose-500">*</span>
            </label>
            <input
              id="create-staff-email"
              name="email"
              type="email"
              required
              autoComplete="email"
                      maxLength={255}
              spellCheck={false}
              aria-invalid={createFieldErrors.email ? 'true' : undefined}
              aria-describedby={createFieldErrors.email ? 'create-staff-email-error' : undefined}
              className={`w-full px-3.5 py-2 text-sm border rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/15 ${createFieldErrors.email ? 'border-danger' : 'border-[#E5E8EB] focus-visible:border-[#0D9488]'}`}
              placeholder="staff@m4n.vn"
              value={createForm.email}
              onChange={(e) => {
                setCreateForm({ ...createForm, email: e.target.value })
                setCreateFieldErrors((current) => ({ ...current, email: undefined }))
              }}
            />
            {createFieldErrors.email && <p id="create-staff-email-error" className="mt-1.5 text-xs text-danger" role="alert">{createFieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="create-staff-password" className="block text-sm font-semibold text-[#17191B] mb-1.5">
              Mật khẩu tạm thời <span className="font-normal text-secondary">(tự động)</span>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="create-staff-password"
                name="initialPassword"
                type="text"
                readOnly
                autoComplete="off"
                aria-invalid={createFieldErrors.password ? 'true' : undefined}
                aria-describedby={`create-staff-password-help${createFieldErrors.password ? ' create-staff-password-error' : ''}`}
                className={`min-w-0 flex-1 px-3.5 py-2 font-mono text-sm font-semibold tracking-wide border rounded-xl bg-[#F6F7F8] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/15 ${createFieldErrors.password ? 'border-danger' : 'border-[#E5E8EB] focus-visible:border-[#0D9488]'}`}
                value={createForm.password}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-[#F6F7F8] cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/15 sm:flex-none"
                  onClick={() => copyToClipboard(createForm.password, 'Đã sao chép mật khẩu tạm thời.')}
                >
                  <Copy size={14} aria-hidden="true" />
                  Sao chép
                </button>
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-[#F6F7F8] cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/15 sm:flex-none"
                  onClick={regenerateTemporaryPassword}
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  Tạo lại
                </button>
              </div>
            </div>
            <p id="create-staff-password-help" className="mt-1.5 text-xs leading-relaxed text-secondary">
              Mật khẩu gồm 16 ký tự ngẫu nhiên. Hãy gửi qua kênh an toàn và yêu cầu nhân viên đổi sau lần đăng nhập đầu tiên.
            </p>
            {createFieldErrors.password && <p id="create-staff-password-error" className="mt-1.5 text-xs text-danger" role="alert">{createFieldErrors.password}</p>}
          </div>

          <div>
            <label htmlFor="create-staff-role" className="block text-sm font-semibold text-[#17191B] mb-1.5">
              Vai trò phân công <span className="text-rose-500">*</span>
            </label>
            <select
              id="create-staff-role"
              name="role"
              aria-invalid={createFieldErrors.role ? 'true' : undefined}
              aria-describedby={createFieldErrors.role ? 'create-staff-role-error' : undefined}
              className={`w-full px-3.5 py-2 text-sm border rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/15 bg-white text-[#17191B] font-medium cursor-pointer ${createFieldErrors.role ? 'border-danger' : 'border-[#E5E8EB] focus-visible:border-[#0D9488]'}`}
              value={createForm.role}
              onChange={(e) => {
                setCreateForm({ ...createForm, role: e.target.value })
                setCreateFieldErrors((current) => ({ ...current, role: undefined }))
              }}
            >
              {allowedCreateRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_DEFINITIONS[r]?.label || r}
                </option>
              ))}
            </select>
            {createFieldErrors.role && <p id="create-staff-role-error" className="mt-1.5 text-xs text-danger" role="alert">{createFieldErrors.role}</p>}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E8EB] mt-2">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border border-[#E5E8EB] text-zinc-700 hover:bg-[#F6F7F8] font-semibold text-sm cursor-pointer"
              onClick={closeCreateModal}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="px-5 py-2.5 rounded-xl bg-[#0D9488] text-white font-semibold text-sm hover:bg-[#0F766E] disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {isActionLoading ? 'Đang tạo…' : 'Tạo tài khoản'}
            </button>
          </div>
        </fieldset>
                </form>
        )}
      </div>
    </div>
  )
}
