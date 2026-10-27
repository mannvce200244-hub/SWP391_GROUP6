import { CircleAlert, X } from 'lucide-react'
import CustomerOrderHistory from './CustomerOrderHistory.jsx'
import useDialogFocus from '../../hooks/useDialogFocus.js'

export default function AdminUserDetailModal({
  selectedUser,
  editForm,
  setEditForm,
  editFieldErrors,
  setEditFieldErrors,
  isActionLoading,
  ROLE_DEFINITIONS,
  isSuperAdmin,
  isSelf,
  canActorManageTargetRole,
  closeDetailModal,
  handleSaveProfile,
  handleChangeRole,
  setStatusConfirmOpen
}) {
  const detailDialogRef = useDialogFocus(true, closeDetailModal, isActionLoading)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl border border-[#E5E8EB] shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto overscroll-contain"
        ref={detailDialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
      >
        <div className="flex justify-between items-center pb-3 border-b border-[#E5E8EB] mb-4">
          <div>
            <h2 id="user-detail-title" className="text-lg font-bold text-[#17191B]">Chi tiết tài khoản</h2>
            <span className="text-xs text-secondary font-mono">ID: #{selectedUser.id}</span>
          </div>
          <button
            type="button"
            className="text-secondary hover:text-[#17191B] cursor-pointer p-1 rounded-lg hover:bg-zinc-100 transition-colors"
            onClick={closeDetailModal}
            aria-label="Đóng"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Profile editing form */}
        <form noValidate onSubmit={handleSaveProfile} className="flex flex-col gap-4 text-sm">
                  <fieldset disabled={isActionLoading} className="contents">
          <div>
            <label htmlFor="user-detail-email" className="block text-sm font-semibold text-[#17191B] mb-1.5">
              Email tài khoản (Bất biến)
            </label>
            <input
              id="user-detail-email"
              name="email"
              type="text"
              disabled
              value={selectedUser.email}
              className="w-full px-3.5 py-2 bg-[#F6F7F8] border border-[#E5E8EB] rounded-xl text-secondary font-mono text-sm"
            />
          </div>

          <div>
            <label htmlFor="user-detail-full-name" className="block text-sm font-semibold text-[#17191B] mb-1.5">
              Họ và tên
            </label>
            <input
              id="user-detail-full-name"
              name="fullName"
              type="text"
              required
              maxLength={150}
              autoComplete="name"
              disabled={!canActorManageTargetRole(selectedUser.role)}
              value={editForm.fullName}
              onChange={(e) => {
                setEditForm({ ...editForm, fullName: e.target.value })
                setEditFieldErrors((current) => ({ ...current, fullName: undefined }))
              }}
              aria-invalid={editFieldErrors.fullName ? 'true' : undefined}
              aria-describedby={editFieldErrors.fullName ? 'user-detail-full-name-error' : undefined}
              className={`w-full px-3.5 py-2 text-sm border rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/15 ${editFieldErrors.fullName ? 'border-danger' : 'border-[#E5E8EB] focus-visible:border-[#0D9488]'}`}
            />
            {editFieldErrors.fullName && <p id="user-detail-full-name-error" className="mt-1.5 text-xs text-danger" role="alert">{editFieldErrors.fullName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="user-detail-phone" className="block text-sm font-semibold text-[#17191B] mb-1.5">
                Số điện thoại
              </label>
              <input
                id="user-detail-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel"
                disabled={!canActorManageTargetRole(selectedUser.role)}
                value={editForm.phone}
                onChange={(e) => {
                  setEditForm({ ...editForm, phone: e.target.value })
                  setEditFieldErrors((current) => ({ ...current, phone: undefined }))
                }}
                aria-invalid={editFieldErrors.phone ? 'true' : undefined}
                aria-describedby={editFieldErrors.phone ? 'user-detail-phone-error' : undefined}
                className={`w-full px-3.5 py-2 text-sm border rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/15 ${editFieldErrors.phone ? 'border-danger' : 'border-[#E5E8EB] focus-visible:border-[#0D9488]'}`}
              />
              {editFieldErrors.phone && <p id="user-detail-phone-error" className="mt-1.5 text-xs text-danger" role="alert">{editFieldErrors.phone}</p>}
            </div>
            <div>
              <label htmlFor="user-detail-address" className="block text-sm font-semibold text-[#17191B] mb-1.5">
                Địa chỉ
              </label>
              <input
                id="user-detail-address"
                name="address"
                type="text"
                maxLength={255}
                autoComplete="street-address"
                disabled={!canActorManageTargetRole(selectedUser.role)}
                value={editForm.address}
                onChange={(e) => {
                  setEditForm({ ...editForm, address: e.target.value })
                  setEditFieldErrors((current) => ({ ...current, address: undefined }))
                }}
                aria-invalid={editFieldErrors.address ? 'true' : undefined}
                aria-describedby={editFieldErrors.address ? 'user-detail-address-error' : undefined}
                className={`w-full px-3.5 py-2 text-sm border rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/15 ${editFieldErrors.address ? 'border-danger' : 'border-[#E5E8EB] focus-visible:border-[#0D9488]'}`}
              />
              {editFieldErrors.address && <p id="user-detail-address-error" className="mt-1.5 text-xs text-danger" role="alert">{editFieldErrors.address}</p>}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isActionLoading || !canActorManageTargetRole(selectedUser.role)}
              className="px-4 py-2 rounded-xl bg-[#0D9488] text-white font-semibold text-sm hover:bg-[#0F766E] disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {isActionLoading ? 'Đang lưu…' : 'Lưu thông tin liên hệ'}
            </button>
          </div>
          {!canActorManageTargetRole(selectedUser.role) && (
            <p className="text-xs text-secondary">
              Chỉ Super Admin mới có quyền chỉnh sửa thông tin tài khoản quản trị viên.
            </p>
          )}
        </fieldset>
                </form>

        {selectedUser.role === 'CUSTOMER' && (
          <CustomerOrderHistory customerId={selectedUser.id} />
        )}

        {/* Privileged Role & Status Section */}
        <div className="mt-6 pt-5 border-t border-[#E5E8EB] flex flex-col gap-4 text-sm">
          <h3 className="font-bold text-xs uppercase tracking-wider text-secondary">
            Phân quyền & Kiểm soát truy cập
          </h3>

          {/* Role Change Control */}
          <div className="p-4 rounded-xl bg-[#F6F7F8] border border-[#E5E8EB] flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-zinc-700">Vai trò hiện tại:</span>
              <span className="font-bold text-[#0D9488]">
                {ROLE_DEFINITIONS[selectedUser.role]?.label || selectedUser.role}
              </span>
            </div>

            {canActorManageTargetRole(selectedUser.role) ? (
              <div className="flex items-center gap-2">
                <select
                  className="flex-1 px-3.5 py-2 border border-[#E5E8EB] rounded-xl bg-white text-sm font-medium focus:border-[#0D9488] focus:outline-none cursor-pointer"
                  name="newRole" aria-label="Vai trò mới" disabled={isActionLoading}
                          value={editForm.newRole}
                  onChange={(e) => setEditForm({ ...editForm, newRole: e.target.value })}
                >
                  {Object.keys(ROLE_DEFINITIONS)
                    .filter((r) => isSuperAdmin || (r !== 'ADMIN' && r !== 'SUPER_ADMIN'))
                    .map((r) => (
                      <option key={r} value={r}>
                        {ROLE_DEFINITIONS[r]?.label}
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  disabled={isActionLoading || editForm.newRole === selectedUser.role}
                  onClick={handleChangeRole}
                  className="px-4 py-2 rounded-xl bg-[#17191B] text-white font-semibold text-sm hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                >
                  Đổi vai trò
                </button>
              </div>
            ) : (
              <div className="text-xs text-amber-800 bg-[#F6F7F8] p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                <CircleAlert size={15} className="shrink-0 text-amber-700" />
                <span>Chỉ Super Admin mới có thẩm quyền sửa đổi vai trò của tài khoản Quản trị viên.</span>
              </div>
            )}
          </div>

          {/* Account Status Control */}
          <div className="p-4 rounded-xl bg-[#F6F7F8] border border-[#E5E8EB] flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex flex-col">
              <span className="font-semibold text-zinc-700">Trạng thái tài khoản:</span>
              <span className="text-xs text-secondary">
                {selectedUser.isActive
                  ? 'Tài khoản có quyền truy cập hệ thống bình thường.'
                  : 'Đã khóa truy cập và thu hồi mọi phiên làm việc.'}
              </span>
            </div>

            {isSelf ? (
              <span className="text-xs text-muted font-semibold px-2.5 py-1 bg-zinc-200 rounded-lg">
                Không thể tự khóa
              </span>
            ) : !canActorManageTargetRole(selectedUser.role) ? (
              <span className="text-xs text-amber-700 font-semibold">
                Cần quyền Super Admin
              </span>
            ) : (
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => { if (!isActionLoading) setStatusConfirmOpen(true) }}
                className={`px-4 py-2 rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-2xs ${
                  selectedUser.isActive
                    ? 'bg-surface-secondary text-red-700 border border-red-200 hover:bg-surface-secondary'
                    : 'bg-surface-secondary text-emerald-700 border border-emerald-200 hover:bg-surface-secondary'
                }`}
              >
                {selectedUser.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt lại'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
