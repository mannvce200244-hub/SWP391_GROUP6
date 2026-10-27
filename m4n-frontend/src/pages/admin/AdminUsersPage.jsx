import { useState, useEffect, useMemo } from 'react'
import adminUserService from '../../services/adminUserService.js'
import { generateTemporaryPassword } from '../../utils/adminStaffPassword.js'
import AdminUserTable from '../../components/admin/AdminUserTable.jsx'
import AdminUserDetailModal from '../../components/admin/AdminUserDetailModal.jsx'
import AdminStaffCreateModal from '../../components/admin/AdminStaffCreateModal.jsx'
import useAuth from '../../features/auth/useAuth.js'
import useToast from '../../components/ui/useToast.js'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { ROUTE_CHANGE_EVENT } from '../../routes/customerRoutes.js'
import { isValidVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '../../utils/phone.js'
import {
  ChevronDown,
  Search,
  CircleAlert,
} from 'lucide-react'

const ROLE_DEFINITIONS = Object.freeze({
  CUSTOMER: { label: 'Khách hàng', bg: 'bg-[#F6F7F8]', text: 'text-slate-700', border: 'border-slate-200' },
  ONLINE_STAFF: { label: 'Nhân viên Online', bg: 'bg-[#F6F7F8]', text: 'text-sky-700', border: 'border-sky-200' },
  POS_STAFF: { label: 'Nhân viên POS', bg: 'bg-[#F6F7F8]', text: 'text-amber-800', border: 'border-amber-200' },
  ADMIN: { label: 'Quản trị viên', bg: 'bg-[#F6F7F8]', text: 'text-indigo-700', border: 'border-indigo-200' },
  SUPER_ADMIN: { label: 'Super Admin', bg: 'bg-[#F6F7F8]', text: 'text-emerald-700', border: 'border-emerald-200' },
})

function mapFieldErrors(error, aliases = {}) {
  const source = error?.fieldErrors || error?.data?.fieldErrors
  if (!source || typeof source !== 'object') return {}

  return Object.entries(source).reduce((mapped, [field, message]) => {
    const targetField = aliases[field] || field
    if (typeof message === 'string' && message.trim()) {
      mapped[targetField] = message.trim()
    }
    return mapped
  }, {})
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const { addToast } = useToast()

  const [users, setUsers] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modals & Active state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [conflictMessage, setConflictMessage] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [createdStaffCredentials, setCreatedStaffCredentials] = useState(null)

  // Forms
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'ONLINE_STAFF',
  })
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    newRole: '',
  })
  const [createFieldErrors, setCreateFieldErrors] = useState({})
  const [editFieldErrors, setEditFieldErrors] = useState({})

  const closeDetailModal = () => { if (!isActionLoading) setDetailModalOpen(false) }
  const closeConflictModal = () => { if (!isActionLoading) setConflictModalOpen(false) }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(0)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Listen for query params e.g. ?tab=customers or ?tab=staff
  useEffect(() => {
    const handleUrlTab = () => {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab === 'customers') {
        setRoleFilter('CUSTOMER')
        setCurrentPage(0)
      } else if (tab === 'staff') {
        setRoleFilter((prev) =>
          ['ONLINE_STAFF', 'POS_STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(prev)
            ? prev
            : 'ONLINE_STAFF'
        )
        setCurrentPage(0)
      } else if (tab === 'all') {
        setRoleFilter('ALL')
        setCurrentPage(0)
      }
    }
    handleUrlTab()
    window.addEventListener('popstate', handleUrlTab)
    window.addEventListener(ROUTE_CHANGE_EVENT, handleUrlTab)
    return () => {
      window.removeEventListener('popstate', handleUrlTab)
      window.removeEventListener(ROUTE_CHANGE_EVENT, handleUrlTab)
    }
  }, [])

  const refreshUsers = () => setRefreshKey((k) => k + 1)

  useEffect(() => {
    let active = true
    const activeParam =
      statusFilter === 'ACTIVE'
        ? true
        : statusFilter === 'DISABLED'
        ? false
        : undefined

    Promise.resolve().then(() => {
      if (!active) return null
      setIsLoading(true)
      setListError('')
      return adminUserService.listUsers({
        search: debouncedSearch,
        role: roleFilter,
        isActive: activeParam,
        page: currentPage,
        size: pageSize,
      })
    })
      .then((data) => {
        if (active && data) {
          setUsers(data?.content || [])
          setTotalElements(data?.totalElements || 0)
          setTotalPages(data?.totalPages || 1)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setIsLoading(false)
          setUsers([])
          setTotalElements(0)
          setListError(err.message || 'Không thể tải danh sách tài khoản.')
        }
      })

    return () => {
      active = false
    }
  }, [debouncedSearch, roleFilter, statusFilter, currentPage, pageSize, refreshKey, addToast])

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  // Allowed staff creation roles for current operator
  const allowedCreateRoles = useMemo(() => {
    if (isSuperAdmin) {
      return ['ONLINE_STAFF', 'POS_STAFF', 'ADMIN', 'SUPER_ADMIN']
    }
    return ['ONLINE_STAFF', 'POS_STAFF']
  }, [isSuperAdmin])

  const closeCreateModal = () => {
    if (isActionLoading) return
    setCreateModalOpen(false)
    setCreatedStaffCredentials(null)
    setCreateFieldErrors({})
    setCreateForm({
      fullName: '',
      email: '',
      password: '',
      role: 'ONLINE_STAFF',
    })
  }

  const conflictDialogRef = useDialogFocus(conflictModalOpen, closeConflictModal, isActionLoading)

  const openCreateModal = () => {
    if (isActionLoading) return
    try {
      setCreatedStaffCredentials(null)
      setCreateFieldErrors({})
      setCreateForm({
        fullName: '',
        email: '',
        password: generateTemporaryPassword(),
        role: 'ONLINE_STAFF',
      })
      setCreateModalOpen(true)
    } catch (error) {
      addToast({
        message: error.message || 'Không thể tạo mật khẩu tạm thời an toàn.',
        type: 'error',
      })
    }
  }

  const regenerateTemporaryPassword = () => {
    try {
      setCreateForm((current) => ({ ...current, password: generateTemporaryPassword() }))
      setCreateFieldErrors((current) => ({ ...current, password: undefined }))
      addToast({ message: 'Đã tạo mật khẩu tạm thời mới.', type: 'info' })
    } catch (error) {
      addToast({
        message: error.message || 'Không thể tạo mật khẩu tạm thời an toàn.',
        type: 'error',
      })
    }
  }

  const copyToClipboard = async (value, successMessage) => {
    try {
      await navigator.clipboard.writeText(value)
      addToast({ message: successMessage, type: 'success' })
    } catch {
      addToast({
        message: 'Không thể sao chép tự động. Vui lòng chọn và sao chép thủ công.',
        type: 'error',
      })
    }
  }

  // Open detail / edit modal
  const handleOpenDetail = async (userSummary) => {
    if (isActionLoading) return
    try {
      setIsActionLoading(true)
      const fullDetail = await adminUserService.getUserById(userSummary.id)
      setSelectedUser(fullDetail)
      setEditForm({
        fullName: fullDetail.fullName || '',
        phone: fullDetail.phone || '',
        address: fullDetail.address || '',
        newRole: fullDetail.role || '',
      })
      setEditFieldErrors({})
      setDetailModalOpen(true)
    } catch (err) {
      addToast({
        message: err.message || 'Không thể tải thông tin chi tiết người dùng.',
        type: 'error',
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  // Refresh user data on 409 conflict
  const handleReloadConflictUser = async () => {
    if (isActionLoading) return
    if (!selectedUser?.id) {
      setConflictModalOpen(false)
      return
    }
    setIsActionLoading(true)
    try {
      const refreshed = await adminUserService.getUserById(selectedUser.id)
      setSelectedUser(refreshed)
      setEditForm({
        fullName: refreshed.fullName || '',
        phone: refreshed.phone || '',
        address: refreshed.address || '',
        newRole: refreshed.role || '',
      })
      setConflictModalOpen(false)
      refreshUsers()
      addToast({
        message: 'Đã tải lại dữ liệu mới nhất thành công.',
        type: 'info',
      })
    } catch (err) {
      setConflictMessage(err.message || 'Không thể tải lại dữ liệu. Vui lòng thử lại.')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Handle Save Profile updates
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!selectedUser || isActionLoading) return

    const errors = {}
    const fullName = editForm.fullName.trim()
    const phone = editForm.phone.trim()
    const address = editForm.address.trim()
    if (!fullName) errors.fullName = 'Họ và tên không được để trống.'
    else if (fullName.length > 150) errors.fullName = 'Họ và tên tối đa 150 ký tự.'
    if (phone && !isValidVietnameseMobile(phone)) errors.phone = VIETNAMESE_MOBILE_ERROR
    if (address.length > 255) errors.address = 'Địa chỉ tối đa 255 ký tự.'
    setEditFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      addToast({ message: 'Vui lòng sửa các trường được báo lỗi trước khi lưu.', type: 'error' })
      return
    }

    setIsActionLoading(true)
    try {
      const updated = await adminUserService.updateUser(selectedUser.id, {
        fullName,
        phone: phone || null,
        address: address || null,
        expectedVersion: selectedUser.version,
      })
      setSelectedUser(updated)
      setEditFieldErrors({})
      addToast({
        message: 'Cập nhật thông tin tài khoản thành công.',
        type: 'success',
      })
      refreshUsers()
    } catch (err) {
      if (['USER_MODIFIED_BY_ANOTHER_OPERATOR', 'STALE_USER_VERSION'].includes(err.code || err.data?.error)) {
        setConflictMessage(
          err.message ||
            'Dữ liệu người dùng này vừa được thay đổi bởi quản trị viên khác. Vui lòng tải lại dữ liệu mới nhất.'
        )
        setConflictModalOpen(true)
      } else {
        setEditFieldErrors(mapFieldErrors(err))
        addToast({
          message: err.message || 'Lỗi khi cập nhật thông tin.',
          type: 'error',
        })
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  // Handle Role Change
  const handleChangeRole = async () => {
    if (isActionLoading || !selectedUser || !editForm.newRole || editForm.newRole === selectedUser.role) return
    setIsActionLoading(true)
    try {
      const updated = await adminUserService.changeRole(selectedUser.id, {
        newRole: editForm.newRole,
        expectedVersion: selectedUser.version,
      })
      setSelectedUser(updated)
      addToast({
        message: `Đã thay đổi vai trò thành ${ROLE_DEFINITIONS[editForm.newRole]?.label || editForm.newRole}.`,
        type: 'success',
      })
      refreshUsers()
    } catch (err) {
      if (['USER_MODIFIED_BY_ANOTHER_OPERATOR', 'STALE_USER_VERSION'].includes(err.code || err.data?.error)) {
        setConflictMessage(
          err.message ||
            'Vai trò hoặc trạng thái tài khoản vừa được thay đổi bởi quản trị viên khác.'
        )
        setConflictModalOpen(true)
      } else {
        addToast({
          message: err.message || 'Không thể thay đổi vai trò.',
          type: 'error',
        })
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  // Handle Disable / Reactivate toggle
  const handleToggleStatus = async () => {
    if (!selectedUser || isActionLoading) return
    setIsActionLoading(true)
    try {
      let updated
      if (selectedUser.isActive) {
        updated = await adminUserService.disableUser(selectedUser.id, {
          expectedVersion: selectedUser.version,
        })
        addToast({
          message: 'Đã vô hiệu hóa tài khoản và thu hồi toàn bộ phiên đăng nhập.',
          type: 'warning',
        })
      } else {
        updated = await adminUserService.reactivateUser(selectedUser.id, {
          expectedVersion: selectedUser.version,
        })
        addToast({
          message: 'Đã kích hoạt lại tài khoản thành công.',
          type: 'success',
        })
      }
      setSelectedUser(updated)
      refreshUsers()
    } catch (err) {
      if (['USER_MODIFIED_BY_ANOTHER_OPERATOR', 'STALE_USER_VERSION'].includes(err.code || err.data?.error)) {
        setConflictMessage(
          err.message ||
            'Trạng thái tài khoản vừa được cập nhật bởi quản trị viên khác.'
        )
        setConflictModalOpen(true)
      } else {
        addToast({
          message: err.message || 'Thao tác trạng thái tài khoản thất bại.',
          type: 'error',
        })
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  // Handle Create Staff
  const handleCreateStaff = async (e) => {
    e.preventDefault()
    if (isActionLoading) return

    const errors = {}
    const fullName = createForm.fullName.trim()
    const email = createForm.email.trim()
    if (!fullName) errors.fullName = 'Họ và tên không được để trống.'
    else if (fullName.length > 150) errors.fullName = 'Họ và tên tối đa 150 ký tự.'
    if (!email) errors.email = 'Email không được để trống.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Định dạng email không hợp lệ.'
    if (email.length > 255) errors.email = 'Email tối đa 255 ký tự.'
    if (!createForm.password) errors.password = 'Mật khẩu ban đầu không được để trống.'
    else if (createForm.password.length < 8 || createForm.password.length > 72) {
      errors.password = 'Mật khẩu ban đầu phải từ 8 đến 72 ký tự.'
    }
    if (new TextEncoder().encode(createForm.password).length > 72) errors.password = 'Mật khẩu tối đa 72 byte UTF-8; ký tự có dấu có thể chiếm nhiều byte.'
    if (!allowedCreateRoles.includes(createForm.role)) {
      errors.role = 'Vai trò nhân viên không hợp lệ.'
    }
    setCreateFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      addToast({ message: 'Vui lòng sửa các trường được báo lỗi trước khi tạo tài khoản.', type: 'error' })
      return
    }

    setIsActionLoading(true)
    try {
      const temporaryPassword = createForm.password
      await adminUserService.createStaff({ ...createForm, fullName, email })
      addToast({
        message: `Đã khởi tạo tài khoản nhân sự [${email}] thành công.`,
        type: 'success',
      })
      setCreatedStaffCredentials({ email, password: temporaryPassword })
      setCreateForm({
        fullName: '',
        email: '',
        password: '',
        role: 'ONLINE_STAFF',
      })
      setCreateFieldErrors({})
      refreshUsers()
    } catch (err) {
      setCreateFieldErrors(mapFieldErrors(err, { initialPassword: 'password' }))
      addToast({
        message: err.message || 'Không thể tạo nhân sự mới.',
        type: 'error',
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  // Privilege evaluation helpers for UI buttons
  const canActorManageTargetRole = (targetRole) => {
    if (isSuperAdmin) return true
    // Regular admin can only manage customer, online staff, pos staff
    return ['CUSTOMER', 'ONLINE_STAFF', 'POS_STAFF'].includes(targetRole)
  }

  const isSelf = selectedUser?.id === currentUser?.id

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E5E8EB] shadow-2xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#17191B] tracking-tight">
            Quản trị Tài khoản & Nhân sự
          </h1>
          <p className="text-sm text-secondary mt-1">
            Quản lý danh sách khách hàng, phân quyền nhân viên và kiểm soát truy cập hệ thống.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D9488] text-white text-sm font-semibold hover:bg-[#0F766E] transition-colors shadow-2xs cursor-pointer"
          onClick={openCreateModal}
        >
          <span>+ Thêm nhân viên</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E5E8EB] rounded-xl shadow-2xs overflow-x-auto" aria-label="Nhóm tài khoản">
        {['ALL', ...Object.keys(ROLE_DEFINITIONS)].filter((role) => isSuperAdmin || role !== 'SUPER_ADMIN').map((role) => (
          <button
            key={role}
            type="button"
            aria-pressed={roleFilter === role}
            onClick={() => { setRoleFilter(role); setCurrentPage(0) }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${roleFilter === role ? 'bg-brand text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900 hover:bg-[#F6F7F8]'}`}
          >
            {role === 'ALL' ? 'Tất cả tài khoản' : ROLE_DEFINITIONS[role].label}
          </button>
        ))}
      </div>

      {/* Toolbar: Search, Role filter, Status filter */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E8EB] shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
            <Search size={16} />
          </div>
          <input
            type="text"
            name="userSearch"
            aria-label="Tìm tài khoản"
            autoComplete="off"
            className="box-border w-full min-w-0 pl-10 pr-4 py-2 bg-[#F6F7F8] border border-[#E5E8EB] rounded-xl text-sm text-[#17191B] placeholder-muted focus:bg-white focus:outline-none focus:border-[#0D9488] transition-[background-color,border-color,box-shadow]"
            placeholder="Tìm theo họ tên hoặc email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="relative min-w-[150px]">
            <select
              className="w-full appearance-none pl-3 pr-8 py-2 bg-[#F6F7F8] border border-[#E5E8EB] rounded-xl text-sm font-medium text-[#17191B] focus:bg-white focus:outline-none focus:border-[#0D9488] cursor-pointer"
              name="roleFilter" aria-label="Lọc theo vai trò"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setCurrentPage(0)
              }}
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="CUSTOMER">Khách hàng</option>
              <option value="ONLINE_STAFF">Nhân viên Online</option>
              <option value="POS_STAFF">Nhân viên POS</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-3 text-secondary pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[150px]">
            <select
              className="w-full appearance-none pl-3 pr-8 py-2 bg-[#F6F7F8] border border-[#E5E8EB] rounded-xl text-sm font-medium text-[#17191B] focus:bg-white focus:outline-none focus:border-[#0D9488] cursor-pointer"
              name="statusFilter" aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(0)
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="DISABLED">Đã vô hiệu hóa</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-3 text-secondary pointer-events-none" />
          </div>
        </div>
      </div>

      {listError && <div role="alert" className="rounded-xl border border-danger bg-white p-4 text-sm text-danger">{listError} <button type="button" onClick={refreshUsers} className="underline">Tải lại danh sách</button></div>}
      <AdminUserTable
        users={users}
        isLoading={isLoading}
        isActionLoading={isActionLoading}
        listError={listError}
        ROLE_DEFINITIONS={ROLE_DEFINITIONS}
        totalElements={totalElements}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        handleOpenDetail={handleOpenDetail}
      />

      {createModalOpen && <AdminStaffCreateModal
        createdStaffCredentials={createdStaffCredentials}
        createForm={createForm}
        setCreateForm={setCreateForm}
        createFieldErrors={createFieldErrors}
        setCreateFieldErrors={setCreateFieldErrors}
        isActionLoading={isActionLoading}
        allowedCreateRoles={allowedCreateRoles}
        ROLE_DEFINITIONS={ROLE_DEFINITIONS}
        closeCreateModal={closeCreateModal}
        copyToClipboard={copyToClipboard}
        regenerateTemporaryPassword={regenerateTemporaryPassword}
        handleCreateStaff={handleCreateStaff}
      />}

      {detailModalOpen && selectedUser && <AdminUserDetailModal
        selectedUser={selectedUser}
        editForm={editForm}
        setEditForm={setEditForm}
        editFieldErrors={editFieldErrors}
        setEditFieldErrors={setEditFieldErrors}
        isActionLoading={isActionLoading}
        ROLE_DEFINITIONS={ROLE_DEFINITIONS}
        isSuperAdmin={isSuperAdmin}
        isSelf={isSelf}
        canActorManageTargetRole={canActorManageTargetRole}
        closeDetailModal={closeDetailModal}
        handleSaveProfile={handleSaveProfile}
        handleChangeRole={handleChangeRole}
        setStatusConfirmOpen={setStatusConfirmOpen}
      />}

      <ConfirmDialog
        isOpen={statusConfirmOpen}
        title={selectedUser?.isActive ? 'Vô hiệu hóa tài khoản?' : 'Kích hoạt tài khoản?'}
        description={selectedUser?.isActive ? 'Tài khoản sẽ không thể đăng nhập và các phiên đăng nhập hiện tại sẽ bị thu hồi.' : 'Tài khoản sẽ có thể đăng nhập trở lại.'}
        confirmLabel={selectedUser?.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
        variant={selectedUser?.isActive ? 'danger' : 'default'}
        isLoading={isActionLoading}
        onConfirm={async () => { await handleToggleStatus(); setStatusConfirmOpen(false) }}
        onCancel={() => { if (!isActionLoading) setStatusConfirmOpen(false) }}
      />

      {/* MODAL 3: 409 CONFLICT DIALOG (LOST-UPDATE PROTECTION) */}
      {conflictModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div ref={conflictDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="user-conflict-title" className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <CircleAlert size={22} className="shrink-0 text-rose-600" />
              <h2 id="user-conflict-title" className="text-base font-bold text-[#17191B]">Dữ liệu tài khoản đã thay đổi</h2>
            </div>

            <p role="alert" className="text-sm text-secondary mb-4 leading-relaxed">
              {conflictMessage}
            </p>

            <div className="bg-[#F6F7F8] p-3.5 rounded-xl border border-amber-200 text-xs text-amber-800 mb-5">
              Để bảo vệ tính toàn vẹn dữ liệu, các thay đổi vừa rồi chưa được lưu đè. Vui lòng tải lại dữ liệu mới nhất trước khi chỉnh sửa tiếp.
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-[#0D9488] text-white font-semibold text-sm hover:bg-[#0F766E] transition-colors cursor-pointer shadow-2xs"
                disabled={isActionLoading} onClick={handleReloadConflictUser}
              >
                Tải dữ liệu mới nhất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsersPage
