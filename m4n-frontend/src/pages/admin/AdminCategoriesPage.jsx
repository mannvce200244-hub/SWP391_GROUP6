import { useState, useEffect, useTransition } from 'react'
import categoryService from '../../services/categoryService.js'
import useToast from '../../components/ui/useToast.js'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx'
import {
  Layers,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Package,
  RotateCcw,
  Loader2,
  AlertCircle,
} from 'lucide-react'

export default function AdminCategoriesPage() {
  const { addToast } = useToast()
  const [, startTransition] = useTransition()

  // Data state
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  // Modal create/edit state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [modalServerError, setModalServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)

  // Delete confirm dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Load categories on search or refresh
  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = activeSearch.trim() ? { search: activeSearch.trim() } : {}
        const data = await categoryService.getAdminCategories(params)
        if (active) {
          setCategories(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Không thể tải danh sách danh mục nhạc cụ. Vui lòng thử lại.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [activeSearch, refreshKey])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setActiveSearch(searchInput.trim())
      })
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Open create modal
  const handleOpenCreate = () => {
    setEditingCategory(null)
    setCode('')
    setName('')
    setDescription('')
    setFormErrors({})
    setModalServerError('')
    setModalOpen(true)
  }

  // Open edit modal
  const handleOpenEdit = (cat) => {
    setEditingCategory(cat)
    setCode(cat.code)
    setName(cat.name)
    setDescription(cat.description || '')
    setFormErrors({})
    setModalServerError('')
    setModalOpen(true)
  }

  // Close modal
  const handleCloseModal = () => {
    if (submitting) return
    setModalOpen(false)
    setEditingCategory(null)
    setFormErrors({})
    setModalServerError('')
  }

  // Client validation
  const validateForm = () => {
    const errs = {}
    if (!editingCategory) {
      if (!code.trim()) {
        errs.code = 'Mã danh mục không được để trống'
      } else if (code.trim().length > 50) {
        errs.code = 'Mã danh mục tối đa 50 ký tự'
      } else if (!/^[A-Za-z0-9_-]+$/.test(code.trim())) {
        errs.code = 'Mã danh mục chỉ chứa chữ cái, số, gạch nối (-) hoặc gạch dưới (_)'
      }
    }

    if (!name.trim()) {
      errs.name = 'Tên danh mục không được để trống'
    } else if (name.trim().length > 150) {
      errs.name = 'Tên danh mục tối đa 150 ký tự'
    }

    if (description && description.trim().length > 500) {
      errs.description = 'Mô tả tối đa 500 ký tự'
    }

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Submit create or edit
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    setModalServerError('')

    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          name: name.trim(),
          description: description.trim() || null,
        })
        addToast({
          message: `Đã cập nhật danh mục "${name.trim()}".`,
          type: 'success',
        })
      } else {
        await categoryService.createCategory({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || null,
        })
        addToast({
          message: `Đã tạo mới danh mục "${name.trim()}".`,
          type: 'success',
        })
      }

      handleCloseModal()
      setRefreshKey((prev) => prev + 1)
    } catch (err) {
      setModalServerError(err.message || 'Đã xảy ra lỗi khi lưu danh mục')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete request
  const handleRequestDelete = (cat) => {
    if (cat.productCount > 0) {
      addToast({
        message: `Không thể xóa danh mục "${cat.name}" vì đang có ${cat.productCount} sản phẩm liên kết. Vui lòng chuyển sản phẩm sang danh mục khác trước.`,
        type: 'error',
      })
      return
    }
    setCategoryToDelete(cat)
    setDeleteConfirmOpen(true)
  }

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return
    setDeleting(true)
    try {
      await categoryService.deleteCategory(categoryToDelete.id)
      addToast({
        message: `Đã xóa danh mục "${categoryToDelete.name}".`,
        type: 'success',
      })
      setDeleteConfirmOpen(false)
      setCategoryToDelete(null)
      setRefreshKey((prev) => prev + 1)
    } catch (err) {
      addToast({
        message: err.message || 'Không thể xóa danh mục này.',
        type: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#17191B] tracking-tight">
            Quản lý Danh mục Nhạc cụ
          </h1>
          <p className="text-sm text-secondary mt-1 max-w-2xl leading-relaxed">
            Quản lý các danh mục dùng để phân loại sản phẩm, phục vụ bộ lọc tìm kiếm và quản lý kho nhạc cụ truyền thống.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Thêm danh mục</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E5E8EB] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-96 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm danh mục theo tên, mã hoặc mô tả..."
            className="w-full pl-10 pr-9 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 shadow-2xs"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-[#17191B] cursor-pointer"
              aria-label="Xóa tìm kiếm"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-secondary font-medium">
          <Layers size={15} className="text-[#0D9488]" />
          <span>Tổng số danh mục:</span>
          <span className="font-semibold font-mono text-[#17191B] bg-slate-100 px-2 py-0.5 rounded-md">
            {categories.length}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        /* Loading Skeleton */
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E8EB] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#E5E8EB] flex items-center justify-between animate-pulse">
            <div className="h-4 bg-slate-200 rounded-md w-36" />
            <div className="h-4 bg-slate-200 rounded-md w-24" />
          </div>
          <div className="divide-y divide-[#E5E8EB]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-7 bg-slate-200 rounded-md w-16" />
                  <div className="space-y-2 flex-1 max-w-sm">
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                  </div>
                </div>
                <div className="h-6 bg-slate-200 rounded-full w-20 hidden sm:block" />
                <div className="h-8 bg-slate-200 rounded-xl w-24" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        /* Error State */
        <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-rose-200 shadow-2xs text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-base font-semibold text-[#17191B]">Không thể tải dữ liệu</h3>
          <p className="text-sm text-secondary max-w-md">{error}</p>
          <button
            type="button"
            onClick={() => setRefreshKey((prev) => prev + 1)}
            className="mt-2 px-4 py-2 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] hover:bg-[#F6F7F8] text-sm font-medium text-[#17191B] flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <RotateCcw size={15} />
            <span>Thử lại</span>
          </button>
        </div>
      ) : categories.length === 0 ? (
        /* Empty State */
        <div className="bg-[#FFFFFF] p-12 rounded-2xl border border-[#E5E8EB] shadow-2xs text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center">
            <Layers size={28} />
          </div>
          {activeSearch ? (
            <>
              <h3 className="text-base font-semibold text-[#17191B]">Không tìm thấy danh mục phù hợp</h3>
              <p className="text-sm text-secondary max-w-md">
                Không có danh mục nào khớp với từ khóa <span className="font-semibold text-ink">"{activeSearch}"</span>.
              </p>
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="mt-2 px-4 py-2 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] hover:bg-[#F6F7F8] text-sm font-medium text-[#17191B] cursor-pointer shadow-2xs"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            </>
          ) : (
            <>
              <h3 className="text-base font-semibold text-[#17191B]">Chưa có danh mục nhạc cụ nào</h3>
              <p className="text-sm text-secondary max-w-md">
                Tạo danh mục đầu tiên để phân loại các loại nhạc cụ truyền thống (ví dụ: Nhạc cụ dây, Nhạc cụ hơi, Nhạc cụ gõ...).
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-2 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus size={16} />
                <span>Thêm danh mục mới</span>
              </button>
            </>
          )}
        </div>
      ) : (
        /* Data Table */
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E8EB] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8F9FA] border-b border-[#E5E8EB] text-xs font-semibold text-secondary uppercase tracking-wider">
                <tr>
                  <th scope="col" className="py-3.5 px-4 w-28">
                    Mã danh mục
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Tên danh mục
                  </th>
                  <th scope="col" className="py-3.5 px-4 hidden md:table-cell">
                    Mô tả
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-center w-36">
                    Số sản phẩm
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-right w-28">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8EB]">
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-[#F8F9FA]/80 transition-colors group"
                  >
                    {/* Mã */}
                    <td className="py-4 px-4 font-mono font-semibold text-xs text-[#0D9488]">
                      <span className="bg-[#0D9488]/10 px-2.5 py-1 rounded-md">
                        {cat.code}
                      </span>
                    </td>

                    {/* Tên */}
                    <td className="py-4 px-4 font-medium text-[#17191B]">
                      <div className="font-semibold text-sm text-[#17191B]">
                        {cat.name}
                      </div>
                      {/* Mobile-only description snippet */}
                      {cat.description && (
                        <div className="text-xs text-secondary line-clamp-1 mt-0.5 md:hidden">
                          {cat.description}
                        </div>
                      )}
                    </td>

                    {/* Mô tả */}
                    <td className="py-4 px-4 text-secondary text-xs hidden md:table-cell max-w-xs truncate">
                      {cat.description || (
                        <span className="text-muted italic">Chưa có mô tả</span>
                      )}
                    </td>

                    {/* Số sản phẩm */}
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-mono ${
                          cat.productCount > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Package size={13} className="shrink-0" />
                        <span>{cat.productCount}</span>
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 rounded-lg text-secondary hover:text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors cursor-pointer"
                          aria-label={`Chỉnh sửa danh mục ${cat.name}`}
                          title="Chỉnh sửa danh mục"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(cat)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            cat.productCount > 0
                              ? 'text-zinc-300 hover:text-rose-500 hover:bg-rose-50 cursor-not-allowed'
                              : 'text-secondary hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          aria-label={`Xóa danh mục ${cat.name}`}
                          title={
                            cat.productCount > 0
                              ? `Không thể xóa vì có ${cat.productCount} sản phẩm liên kết`
                              : 'Xóa danh mục'
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
        >
          <div className="relative w-full max-w-md bg-[#FFFFFF] rounded-2xl border border-[#E5E8EB] shadow-2xl p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8EB]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center font-bold">
                  <Layers size={18} />
                </div>
                <div>
                  <h3
                    id="category-modal-title"
                    className="text-base font-bold text-[#17191B]"
                  >
                    {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                  </h3>
                  <p className="text-xs text-secondary mt-0.5">
                    {editingCategory
                      ? 'Cập nhật thông tin phân loại nhạc cụ'
                      : 'Khai báo nhóm/danh mục phân loại sản phẩm mới'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
                className="p-1.5 rounded-lg text-secondary hover:text-[#17191B] hover:bg-[#F6F7F8] transition-colors cursor-pointer"
                aria-label="Đóng cửa sổ"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error banner */}
            {modalServerError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-relaxed">{modalServerError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mã danh mục (Chỉ hiển thị hoặc tạo mới, không cho đổi mã khi edit) */}
              <div>
                <label className="block text-xs font-semibold text-[#17191B] mb-1.5">
                  Mã danh mục <span className="text-rose-500">*</span>
                </label>
                {editingCategory ? (
                  <div className="px-3.5 py-2 rounded-xl bg-[#F8F9FA] border border-[#E5E8EB] text-xs font-mono font-semibold text-secondary">
                    {editingCategory.code}
                    <span className="ml-2 text-[11px] text-muted font-normal">
                      (Mã cố định của hệ thống)
                    </span>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="VD: DAY, HOI, GO, PHIM..."
                      className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                        formErrors.code ? 'border-rose-400 bg-rose-50/30' : 'border-[#E5E8EB]'
                      } bg-[#FFFFFF] text-[#17191B] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 shadow-2xs`}
                      maxLength={50}
                    />
                    {formErrors.code && (
                      <span className="text-xs text-rose-500 mt-1 block">
                        {formErrors.code}
                      </span>
                    )}
                    <span className="text-[11px] text-secondary mt-1 block">
                      Viết hoa, không dấu, dùng để liên kết bộ lọc catalog.
                    </span>
                  </>
                )}
              </div>

              {/* Tên danh mục */}
              <div>
                <label className="block text-xs font-semibold text-[#17191B] mb-1.5">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nhạc cụ dây, Nhạc cụ hơi, Nhạc cụ gõ..."
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    formErrors.name ? 'border-rose-400 bg-rose-50/30' : 'border-[#E5E8EB]'
                  } bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 shadow-2xs`}
                  maxLength={150}
                />
                {formErrors.name && (
                  <span className="text-xs text-rose-500 mt-1 block">
                    {formErrors.name}
                  </span>
                )}
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-xs font-semibold text-[#17191B] mb-1.5">
                  Mô tả
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Mô tả đặc điểm nhạc cụ thuộc danh mục này..."
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    formErrors.description ? 'border-rose-400 bg-rose-50/30' : 'border-[#E5E8EB]'
                  } bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 shadow-2xs resize-none`}
                  maxLength={500}
                />
                {formErrors.description && (
                  <span className="text-xs text-rose-500 mt-1 block">
                    {formErrors.description}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E8EB]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] hover:bg-[#F6F7F8] text-sm font-medium text-secondary hover:text-[#17191B] transition-colors cursor-pointer shadow-2xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Xóa danh mục nhạc cụ?"
        description={`Bạn có chắc chắn muốn xóa danh mục "${categoryToDelete?.name}" (${categoryToDelete?.code})? Thao tác này sẽ xóa vĩnh viễn danh mục khỏi hệ thống nếu không có sản phẩm liên kết.`}
        confirmLabel="Xóa danh mục"
        cancelLabel="Hủy"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) {
            setDeleteConfirmOpen(false)
            setCategoryToDelete(null)
          }
        }}
      />
    </div>
  )
}
