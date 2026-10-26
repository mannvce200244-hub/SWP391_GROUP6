import { useState, useEffect, useMemo } from 'react'
import adminUserService from '../../services/adminUserService.js'
import useAuth from '../../features/auth/useAuth.js'
import useToast from '../../components/ui/useToast.js'
import { ROUTE_CHANGE_EVENT } from '../../routes/customerRoutes.js'
import CustomerOrderHistory from '../../components/admin/CustomerOrderHistory.jsx'
import { isValidVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '../../utils/phone.js'
import {
  ChevronDown,
  Search,
  Shield,
  CircleAlert,
  Copy,
  RefreshCw,
  X,
} from 'lucide-react'

const TEMP_PASSWORD_LENGTH = 16
const PASSWORD_UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const PASSWORD_LOWERCASE = 'abcdefghijkmnopqrstuvwxyz'
const PASSWORD_DIGITS = '23456789'
const PASSWORD_SYMBOLS = '!@#$%*+-_?'
const PASSWORD_CHARACTERS = `${PASSWORD_UPPERCASE}${PASSWORD_LOWERCASE}${PASSWORD_DIGITS}${PASSWORD_SYMBOLS}`

const ROLE_DEFINITIONS = Object.freeze({
  CUSTOMER: { label: 'Khách hàng', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  ONLINE_STAFF: { label: 'Nhân viên Online', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  POS_STAFF: { label: 'Nhân viên POS', bg: 'bg-[#F6F7F8]', text: 'text-amber-800', border: 'border-amber-200' },
  ADMIN: { label: 'Quản trị viên', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  SUPER_ADMIN: { label: 'Super Admin', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
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

function secureRandomIndex(maxExclusive) {
  if (!window.crypto?.getRandomValues) {
    throw new Error('Trình duyệt không hỗ trợ tạo mật khẩu an toàn.')
  }

  const limit = 256 - (256 % maxExclusive)
  const randomByte = new Uint8Array(1)
  do {
    window.crypto.getRandomValues(randomByte)
  } while (randomByte[0] >= limit)
  return randomByte[0] % maxExclusive
}

function randomCharacter(characters) {
  return characters[secureRandomIndex(characters.length)]
}

function generateTemporaryPassword() {
  const characters = [
    randomCharacter(PASSWORD_UPPERCASE),
    randomCharacter(PASSWORD_LOWERCASE),
    randomCharacter(PASSWORD_DIGITS),
    randomCharacter(PASSWORD_SYMBOLS),
  ]

  while (characters.length < TEMP_PASSWORD_LENGTH) {
    characters.push(randomCharacter(PASSWORD_CHARACTERS))
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomIndex(index + 1)
    const currentCharacter = characters[index]
    characters[index] = characters[swapIndex]
    characters[swapIndex] = currentCharacter
  }

  return characters.join('')
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

    adminUserService
      .listUsers({
        search: debouncedSearch,
        role: roleFilter,
        isActive: activeParam,
        page: currentPage,
        size: pageSize,
      })
      .then((data) => {
        if (active) {
          setUsers(data?.content || [])
          setTotalElements(data?.totalElements || 0)
          setTotalPages(data?.totalPages || 1)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setIsLoading(false)
          addToast({
            message: err.message || 'Không thể tải danh sách tài khoản.',
            type: 'error',
          })
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

  const openCreateModal = () => {
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
    if (!selectedUser?.id) {
      setConflictModalOpen(false)
      return
    }
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
    } catch {
      setConflictModalOpen(false)
    }
  }

  // Handle Save Profile updates
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!selectedUser) return

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
      if (err.status === 409 || err.code === 'USER_MODIFIED_BY_ANOTHER_OPERATOR' || err.code === 'STALE_USER_VERSION') {
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
    if (!selectedUser || !editForm.newRole || editForm.newRole === selectedUser.role) return
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
      if (err.status === 409 || err.code === 'USER_MODIFIED_BY_ANOTHER_OPERATOR' || err.code === 'STALE_USER_VERSION') {
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
    if (!selectedUser) return
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
      if (err.status === 409 || err.code === 'USER_MODIFIED_BY_ANOTHER_OPERATOR' || err.code === 'STALE_USER_VERSION') {
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

    const errors = {}
    const fullName = createForm.fullName.trim()
    const email = createForm.email.trim()
    if (!fullName) errors.fullName = 'Họ và tên không được để trống.'
    else if (fullName.length > 150) errors.fullName = 'Họ và tên tối đa 150 ký tự.'
    if (!email) errors.email = 'Email không được để trống.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Định dạng email không hợp lệ.'
    if (!createForm.password) errors.password = 'Mật khẩu ban đầu không được để trống.'
    else if (createForm.password.length < 8 || createForm.password.length > 72) {
      errors.password = 'Mật khẩu ban đầu phải từ 8 đến 72 ký tự.'
    }
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

      {/* Quick Role Segment Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E5E8EB] rounded-xl shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setRoleFilter('ALL')
            setCurrentPage(0)
          }}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            roleFilter === 'ALL'
              ? 'bg-[#111315] text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          Tất cả tài khoản
        </button>
        <button
          type="button"
          onClick={() => {
            setRoleFilter('CUSTOMER')
            setCurrentPage(0)
          }}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            roleFilter === 'CUSTOMER'
              ? 'bg-[#0D9488] text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          Khách hàng
        </button>
        <button
          type="button"
          onClick={() => {
            setRoleFilter('ONLINE_STAFF')
            setCurrentPage(0)
          }}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            roleFilter === 'ONLINE_STAFF'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          Nhân viên Online
        </button>
        <button
          type="button"
          onClick={() => {
            setRoleFilter('POS_STAFF')
            setCurrentPage(0)
          }}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            roleFilter === 'POS_STAFF'
              ? 'bg-brand text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          Nhân viên POS
        </button>
        <button
          type="button"
          onClick={() => {
            setRoleFilter('ADMIN')
            setCurrentPage(0)
          }}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            roleFilter === 'ADMIN'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          Quản trị viên
        </button>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => {
              setRoleFilter('SUPER_ADMIN')
              setCurrentPage(0)
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              roleFilter === 'SUPER_ADMIN'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            Super Admin
          </button>
        )}
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

      {/* Users Table Container */}
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
                          onClick={() => handleOpenDetail(u)}
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
              disabled={currentPage <= 0}
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
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: CREATE STAFF */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="bg-white rounded-2xl border border-[#E5E8EB] shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 overscroll-contain"
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
            </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: USER DETAIL & PRIVILEGE MANAGEMENT */}
      {detailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="bg-white rounded-2xl border border-[#E5E8EB] shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto overscroll-contain"
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
                onClick={() => setDetailModalOpen(false)}
                aria-label="Đóng"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Profile editing form */}
            <form noValidate onSubmit={handleSaveProfile} className="flex flex-col gap-4 text-sm">
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
                    maxLength={20}
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
              <div className="p-4 rounded-xl bg-[#F6F7F8] border border-[#E5E8EB] flex justify-between items-center">
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
                    onClick={handleToggleStatus}
                    className={`px-4 py-2 rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-2xs ${
                      selectedUser.isActive
                        ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {selectedUser.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt lại'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: 409 CONFLICT DIALOG (LOST-UPDATE PROTECTION) */}
      {conflictModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <CircleAlert size={22} className="shrink-0 text-rose-600" />
              <h2 className="text-base font-bold text-[#17191B]">Xung đột phiên làm việc (HTTP 409)</h2>
            </div>

            <p className="text-sm text-secondary mb-4 leading-relaxed">
              {conflictMessage}
            </p>

            <div className="bg-[#F6F7F8] p-3.5 rounded-xl border border-amber-200 text-xs text-amber-800 mb-5">
              Để bảo vệ tính toàn vẹn dữ liệu, các thay đổi vừa rồi chưa được lưu đè. Vui lòng tải lại dữ liệu mới nhất trước khi chỉnh sửa tiếp.
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-[#0D9488] text-white font-semibold text-sm hover:bg-[#0F766E] transition-colors cursor-pointer shadow-2xs"
                onClick={handleReloadConflictUser}
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
