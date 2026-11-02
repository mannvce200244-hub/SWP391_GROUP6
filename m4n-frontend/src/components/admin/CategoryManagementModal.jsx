import { useState, useEffect, useCallback } from 'react'
import categoryService from '../../services/categoryService.js'
import useToast from '../ui/useToast.js'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx'
import { Layers, X } from 'lucide-react'

export default function CategoryManagementModal({ isOpen, onClose, onSuccess }) {
  const { addToast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [search, setSearch] = useState('')

  // Form fields
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loadFailed, setLoadFailed] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [catToDelete, setCatToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)


  const resetForm = useCallback(() => {
    setEditingCategory(null)
    setCode('')
    setName('')
    setDescription('')
    setFormErrors({})
    setServerError('')
  }, [])

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setLoadFailed(false)
    setServerError('')
    try {
      const data = await categoryService.getAdminCategories()
      setCategories(data || [])
    } catch (err) {
      setLoadFailed(true)
      setServerError(err.message || 'Không thể tải danh sách danh mục')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    let active = true

    categoryService
      .getAdminCategories()
      .then((data) => {
        if (active) {
          setCategories(data || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setLoadFailed(true)
          setServerError(err.message || 'Không thể tải danh sách danh mục')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [isOpen])

  const handleClose = () => {
    if (submitting || deleting) return
    resetForm()
    onClose()
  }

  const dialogRef = useDialogFocus(isOpen, () => handleClose(), submitting || deleting)

  const startEdit = (cat) => {
    if (submitting || deleting) return
    setEditingCategory(cat)
    setCode(cat.code)
    setName(cat.name)
    setDescription(cat.description || '')
    setFormErrors({})
    setServerError('')
  }

  const validate = () => {
    const errors = {}
    if (!editingCategory) {
      if (!code.trim()) {
        errors.code = 'Mã danh mục không được để trống'
      } else if (code.trim().length > 50) {
        errors.code = 'Mã danh mục không được vượt quá 50 ký tự'
      }
    }
    if (!name.trim()) {
      errors.name = 'Tên danh mục không được để trống'
    } else if (name.trim().length > 150) {
      errors.name = 'Tên danh mục không được vượt quá 150 ký tự'
    }
    setFormErrors(errors)
    if (Object.keys(errors).length) document.getElementById("category-" + Object.keys(errors)[0])?.focus()
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting || deleting || loading || loadFailed) return
    if (!validate()) return

    setSubmitting(true)
    setServerError('')
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
          message: `Đã thêm danh mục mới "${name.trim()}".`,
          type: 'success',
        })
      }
      resetForm()
      await fetchCategories()
      if (onSuccess) onSuccess()
    } catch (err) {
      setFormErrors(err.fieldErrors || err.data?.fieldErrors || {})
      setServerError(err.message || 'Đã xảy ra lỗi khi lưu danh mục')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (cat) => {
    if (submitting || deleting) return
    if (cat.productCount > 0) {
      addToast({
        message: `Không thể xóa danh mục "${cat.name}" vì đang có ${cat.productCount} sản phẩm liên kết. Vui lòng chuyển sản phẩm sang danh mục khác trước.`,
        type: 'error',
        duration: 5000,
      })
      return
    }
    setCatToDelete(cat)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!catToDelete || deleting || submitting) return
    setDeleting(true)
    try {
      await categoryService.deleteCategory(catToDelete.id)
      addToast({
        message: `Đã xóa danh mục "${catToDelete.name}".`,
        type: 'success',
      })
      if (editingCategory?.id === catToDelete.id) resetForm()
      setDeleteConfirmOpen(false)
      setCatToDelete(null)
      await fetchCategories()
      if (onSuccess) onSuccess()
    } catch (err) {
      addToast({
        message: err.message || 'Không thể xóa danh mục này',
        type: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  if (!isOpen) return null

  const filteredCategories = categories.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
  })

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
    >
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E8EB] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E8EB] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center font-bold text-sm">
              <Layers size={20} />
            </div>
            <div>
              <h2 id="category-modal-title" className="text-lg font-bold text-[#17191B]">
                Quản lý Danh mục Nhạc cụ
              </h2>
              <p className="text-xs text-secondary">
                Thêm mới, cập nhật và quản lý phân loại nhạc cụ truyền thống
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-secondary hover:text-[#17191B] hover:bg-[#F2F4F5] transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#F6F7F8]">
          {/* Left / Top: Form */}
          <div className="lg:col-span-5 bg-[#FFFFFF] p-5 rounded-xl border border-[#E5E8EB] shadow-2xs flex flex-col h-fit">
            <h3 className="text-sm font-bold text-[#17191B] mb-3 pb-2 border-b border-[#E5E8EB]">
              {editingCategory ? `Chỉnh sửa: ${editingCategory.code}` : 'Thêm mới danh mục'}
            </h3>

            {serverError && (
              <div role="alert" className="mb-4 p-3 rounded-lg bg-[#FFFFFF] border border-rose-200 text-rose-700 text-xs">
                {serverError}
                {loadFailed && <button type="button" onClick={fetchCategories} className="block mt-2 underline">Tải lại dữ liệu</button>}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <fieldset disabled={submitting || deleting} className="contents">
              <div>
                <label htmlFor="category-code" className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  Mã danh mục <span className="text-rose-500">*</span>
                </label>
                <input id="category-code" name="code" maxLength={50} aria-invalid={Boolean(formErrors.code)} aria-describedby={formErrors.code ? "category-code-error" : undefined}
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={Boolean(editingCategory)}
                  placeholder="VD: DAY, HOI, GO..."
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    formErrors.code ? 'border-rose-400 bg-surface-secondary/30' : 'border-[#E5E8EB]'
                  } ${editingCategory ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'bg-[#FFFFFF] text-[#17191B]'} focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 font-mono`}
                />
                {formErrors.code && (
                  <span id="category-code-error" role="alert" className="text-xs text-rose-500 mt-1 block">{formErrors.code}</span>
                )}
                <span className="text-xs text-muted mt-0.5 block">
                  {editingCategory ? 'Không thể đổi mã sau khi tạo' : 'Viết hoa, không dấu, tối đa 50 ký tự'}
                </span>
              </div>

              <div>
                <label htmlFor="category-name" className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input id="category-name" name="name" maxLength={150} aria-invalid={Boolean(formErrors.name)} aria-describedby={formErrors.name ? "category-name-error" : undefined}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nhạc cụ dây, Nhạc cụ hơi..."
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    formErrors.name ? 'border-rose-400 bg-surface-secondary/30' : 'border-[#E5E8EB]'
                  } bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30`}
                />
                {formErrors.name && (
                  <span id="category-name-error" role="alert" className="text-xs text-rose-500 mt-1 block">{formErrors.name}</span>
                )}
              </div>

              <div>
                <label htmlFor="category-description" className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  Mô tả
                </label>
                <textarea id="category-description" name="description" aria-invalid={Boolean(formErrors.description)}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Mô tả đặc điểm nhạc cụ thuộc nhóm danh mục này..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting || deleting || loading || loadFailed}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : editingCategory ? 'Cập nhật' : 'Thêm mới'}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => { if (!submitting && !deleting) resetForm() }}
                    className="py-2.5 px-4 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] hover:bg-[#F2F4F5] text-sm font-medium text-zinc-700 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </fieldset>
            </form>
          </div>

          {/* Right / Bottom: Category List */}
          <div className="lg:col-span-7 bg-[#FFFFFF] p-5 rounded-xl border border-[#E5E8EB] shadow-2xs flex flex-col">
            <div className="flex flex-col gap-2.5 mb-3 pb-2 border-b border-[#E5E8EB] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <h3 className="shrink-0 text-sm font-bold text-[#17191B]">
                  Danh sách ({categories.length})
                </h3>
              </div>
              <input
                type="text"
                name="categorySearch"
                aria-label="Tìm danh mục"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã hoặc tên…"
                className="box-border h-9 w-full min-w-0 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] px-3.5 text-sm text-[#17191B] transition-[border-color,box-shadow] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 sm:w-48 sm:min-w-48 sm:max-w-48 sm:shrink-0"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-secondary">
                Đang tải dữ liệu danh mục...
              </div>
            ) : loadFailed ? (
              <p className="py-12 text-center text-sm text-secondary">Danh sách chưa tải được. Vui lòng tải lại dữ liệu.</p>
            ) : filteredCategories.length === 0 ? (
              <div className="py-12 text-center text-sm text-secondary">
                Không tìm thấy danh mục nào phù hợp.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E8EB] text-secondary font-semibold text-xs bg-[#F6F7F8]">
                      <th className="py-2.5 px-3">Mã</th>
                      <th className="py-2.5 px-3">Tên danh mục</th>
                      <th className="py-2.5 px-3 text-center">Sản phẩm</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E8EB]">
                    {filteredCategories.map((cat) => (
                      <tr
                        key={cat.id}
                        className={`hover:bg-[#F6F7F8] transition-colors ${
                          editingCategory?.id === cat.id ? 'bg-[#0D9488]/5' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-[#17191B] text-xs">
                          {cat.code}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#17191B]">{cat.name}</div>
                          {cat.description && (
                            <div className="text-xs text-secondary truncate max-w-[200px]">
                              {cat.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              cat.productCount > 0
                                ? 'bg-[#0D9488]/10 text-[#0D9488]'
                                : 'bg-zinc-100 text-zinc-500'
                            }`}
                          >
                            {cat.productCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#F2F4F5] hover:bg-[#E5E8EB] text-zinc-700 text-[13px] font-medium transition-colors cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            title={
                              cat.productCount > 0
                                ? 'Không thể xóa danh mục đang có sản phẩm'
                                : 'Xóa danh mục'
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                              cat.productCount > 0
                                ? 'bg-[#F6F7F8] text-zinc-400 hover:bg-[#E3E6E8] cursor-pointer'
                                : 'bg-surface-secondary hover:bg-surface-secondary text-rose-600 cursor-pointer'
                            }`}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E8EB] bg-[#FFFFFF] flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 text-sm font-semibold text-zinc-700 hover:text-[#17191B] hover:bg-[#F2F4F5] rounded-xl border border-[#E5E8EB] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Xóa danh mục nhạc cụ?"
        description={`Bạn có chắc chắn muốn xóa danh mục "${catToDelete?.name}"? Thao tác này sẽ xóa vĩnh viễn danh mục khỏi hệ thống.`}
        confirmLabel="Xóa danh mục"
        cancelLabel="Hủy"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) {
            setDeleteConfirmOpen(false)
            setCatToDelete(null)
          }
        }}
      />
    </div>
  )
}
