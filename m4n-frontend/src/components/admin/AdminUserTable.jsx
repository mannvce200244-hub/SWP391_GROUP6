import { Shield } from 'lucide-react'

export default function AdminUserTable({
  users,
  isLoading,
  isActionLoading,
  listError,
  ROLE_DEFINITIONS,
  totalElements,
  currentPage,
  totalPages,
  setCurrentPage,
  handleOpenDetail
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E8EB] shadow-2xs overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E8EB] bg-[#F6F7F8] text-xs font-semibold text-secondary">
                    <th className="py-3.5 px-4 sm:px-6">Người dùng</th>
                    <th className="py-3.5 px-4">Vai trò</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Ngày tạo</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E8EB] text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-secondary">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-[#0D9488] border-t-transparent animate-spin" />
                          <span>Đang tải danh sách tài khoản...</span>
                        </div>
                      </td>
                    </tr>
                  ) : listError ? (
                    <tr><td colSpan={5} className="py-12 text-center text-secondary">Danh sách chưa tải được.</td></tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-secondary">
                        Không tìm thấy người dùng phù hợp.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const roleStyle = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.CUSTOMER
                      return (
                        <tr key={u.id} className="hover:bg-[#F6F7F8]/50 transition-colors">
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-zinc-100 text-secondary font-bold text-xs flex items-center justify-center border border-zinc-200 shrink-0">
                                {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-[#17191B] truncate max-w-[200px]">
                                  {u.fullName}
                                </span>
                                <span className="text-xs text-secondary truncate max-w-[200px]">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                            >
                              {u.role === 'SUPER_ADMIN' && <Shield size={13} className="shrink-0" />}
                              <span>{roleStyle.label}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>Hoạt động</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                <span>Vô hiệu hóa</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-secondary text-xs">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <button
                              type="button"
                              className="px-3.5 py-1.5 rounded-lg border border-[#E5E8EB] bg-white hover:bg-[#F6F7F8] text-sm font-medium text-[#17191B] hover:text-[#0D9488] transition-colors cursor-pointer shadow-2xs"
                              disabled={isActionLoading} onClick={() => handleOpenDetail(u)}
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="px-4 sm:px-6 py-3 border-t border-[#E5E8EB] bg-[#F6F7F8] flex items-center justify-between text-sm text-secondary">
              <span>
                Hiển thị <strong>{users.length}</strong> / <strong>{totalElements}</strong> tài khoản
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-[#E5E8EB] bg-white hover:bg-[#F6F7F8] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-[#17191B] cursor-pointer"
                  disabled={isLoading || currentPage <= 0}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                >
                  Trang trước
                </button>
                <span className="px-2 font-medium">
                  Trang {currentPage + 1} / {totalPages || 1}
                </span>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-[#E5E8EB] bg-white hover:bg-[#F6F7F8] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-[#17191B] cursor-pointer"
                  disabled={isLoading || currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Trang sau
                </button>
              </div>
            </div>
          </div>
  )
}
