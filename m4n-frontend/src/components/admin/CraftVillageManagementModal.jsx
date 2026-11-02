import { useState, useEffect, useCallback } from 'react'
import craftVillageService from '../../services/craftVillageService.js'
import useToast from '../ui/useToast.js'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import { Landmark, X } from 'lucide-react'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'

export default function CraftVillageManagementModal({ isOpen, onClose, onSuccess, initialVillage = null }) {
  const { addToast } = useToast()
  const [villages, setVillages] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingVillage, setEditingVillage] = useState(initialVillage)
  const [search, setSearch] = useState('')
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null)
  const [modalDeleting, setModalDeleting] = useState(false)

  // Form fields
  const [name, setName] = useState(() => initialVillage?.name || '')
  const [location, setLocation] = useState(() => initialVillage?.location || '')
  const [description, setDescription] = useState(() => initialVillage?.description || '')
  const [imageUrl, setImageUrl] = useState(() => initialVillage?.imageUrl || '')
  const [formErrors, setFormErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loadFailed, setLoadFailed] = useState(false)


  const resetForm = useCallback(() => {
    setEditingVillage(null)
    setName('')
    setLocation('')
    setDescription('')
    setImageUrl('')
    setFormErrors({})
    setServerError('')
  }, [])

  const fetchVillages = useCallback(async () => {
    setLoading(true)
    setLoadFailed(false)
    setServerError('')
    try {
      const data = await craftVillageService.getAdminCraftVillages()
      setVillages(data || [])
    } catch (err) {
      setLoadFailed(true)
      setServerError(err.message || 'Không thể tải dữ liệu làng nghề')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    let active = true

    craftVillageService
      .getAdminCraftVillages()
      .then((data) => {
        if (active) {
          setVillages(data || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setLoadFailed(true)
          setServerError(err.message || 'Không thể tải dữ liệu làng nghề')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [isOpen])

  const handleClose = () => {
    if (submitting || modalDeleting) return
    resetForm()
    onClose()
  }

  const dialogRef = useDialogFocus(isOpen, () => handleClose(), submitting || modalDeleting)

  const startEdit = (v) => {
    if (submitting || modalDeleting) return
    setEditingVillage(v)
    setName(v.name)
    setLocation(v.location)
    setDescription(v.description || '')
    setImageUrl(v.imageUrl || '')
    setFormErrors({})
    setServerError('')
  }

  const validate = () => {
    const errors = {}
    if (!name.trim()) {
      errors.name = 'Tên làng nghề không được để trống'
    } else if (name.trim().length > 150) {
      errors.name = 'Tên làng nghề không được vượt quá 150 ký tự'
    }
    if (!location.trim()) {
      errors.location = 'Địa chỉ / Vị trí không được để trống'
    } else if (location.trim().length > 255) {
      errors.location = 'Địa chỉ không được vượt quá 255 ký tự'
    }
    if (imageUrl.trim().length > 500) errors.imageUrl = 'URL hình ảnh tối đa 500 ký tự.'
    setFormErrors(errors)
    if (Object.keys(errors).length) document.getElementById("craftvillage-" + Object.keys(errors)[0])?.focus()
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting || modalDeleting || loading || loadFailed) return
    if (!validate()) return

    setSubmitting(true)
    setServerError('')
    try {
      const payload = {
        name: name.trim(),
        location: location.trim(),
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
      }

      if (editingVillage) {
        await craftVillageService.updateCraftVillage(editingVillage.id, payload)
        addToast({
          message: `Đã cập nhật thông tin làng nghề "${name.trim()}".`,
          type: 'success',
        })
      } else {
        await craftVillageService.createCraftVillage(payload)
        addToast({
          message: `Đã thêm làng nghề mới "${name.trim()}".`,
          type: 'success',
        })
      }
      resetForm()
      await fetchVillages()
      if (onSuccess) onSuccess()
    } catch (err) {
      setFormErrors(err.fieldErrors || err.data?.fieldErrors || {})
      setServerError(err.message || 'Đã xảy ra lỗi khi lưu làng nghề')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (v) => {
    if (submitting || modalDeleting) return
    if (v.artisanCount > 0 || v.productCount > 0) {
      addToast({
        message: `Không thể xóa làng nghề "${v.name}" vì đang có ${v.artisanCount} nghệ nhân và ${v.productCount} sản phẩm liên kết. Vui lòng gỡ các liên kết trước.`,
        type: 'error',
        duration: 5000,
      })
      return
    }
    setDeleteConfirmTarget(v)
  }

  const confirmDeleteVillage = async () => {
    if (!deleteConfirmTarget || modalDeleting || submitting) return
    setModalDeleting(true)
    try {
      await craftVillageService.deleteCraftVillage(deleteConfirmTarget.id)
      addToast({
        message: `Đã xóa làng nghề "${deleteConfirmTarget.name}".`,
        type: 'success',
      })
      if (editingVillage?.id === deleteConfirmTarget.id) resetForm()
      setDeleteConfirmTarget(null)
      await fetchVillages()
      if (onSuccess) onSuccess()
    } catch (err) {
      addToast({
        message: err.message || 'Không thể xóa làng nghề này',
        type: 'error',
      })
    } finally {
      setModalDeleting(false)
    }
  }

  if (!isOpen) return null

  const filteredVillages = villages.filter((v) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return v.name.toLowerCase().includes(q) || v.location.toLowerCase().includes(q)
  })

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="village-modal-title"
    >
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E8EB] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E8EB] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center font-bold text-sm">
              <Landmark size={20} />
            </div>
            <div>
              <h2 id="village-modal-title" className="text-lg font-bold text-[#17191B]">
                Quản lý Làng nghề Truyền thống
              </h2>
              <p className="text-xs text-secondary">
                Lưu giữ thông tin các làng nghề làm nhạc cụ dân gian trên toàn quốc
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
              {editingVillage ? `Chỉnh sửa: ${editingVillage.name}` : 'Thêm mới làng nghề'}
            </h3>

            {serverError && (
              <div role="alert" className="mb-4 p-3 rounded-lg bg-[#FFFFFF] border border-rose-200 text-rose-700 text-xs">
                {serverError}
                {loadFailed && <button type="button" onClick={fetchVillages} className="block mt-2 underline">Tải lại dữ liệu</button>}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <fieldset disabled={submitting || modalDeleting} className="contents">
              <div>
                <label htmlFor="craftvillage-name" className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  Tên làng nghề <span className="text-rose-500">*</span>
                </label>
                <input id="craftvillage-name" name="name" maxLength={150} aria-invalid={Boolean(formErrors.name)} aria-describedby={formErrors.name ? "craftvillage-name-error" : undefined}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Làng Đào Xá..."
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    formErrors.name ? 'border-rose-400 bg-surface-secondary/30' : 'border-[#E5E8EB]'
                  } bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30`}
                />
                {formErrors.name && (
                  <span id="craftvillage-name-error" role="alert" className="text-xs text-rose-500 mt-1 block">{formErrors.name}</span>
                )}
              </div>

              <div>
                <label htmlFor="craftvillage-location" className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  Địa chỉ / Vị trí <span className="text-rose-500">*</span>
                </label>
                <input id="craftvillage-location" name="location" maxLength={255} aria-invalid={Boolean(formErrors.location)} aria-describedby={formErrors.location ? "craftvillage-location-error" : undefined}
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="VD: Ứng Hòa, Hà Nội..."
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    formErrors.location ? 'border-rose-400 bg-surface-secondary/30' : 'border-[#E5E8EB]'
                  } bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30`}
                />
                {formErrors.location && (
                  <span id="craftvillage-location-error" role="alert" className="text-xs text-rose-500 mt-1 block">{formErrors.location}</span>
                )}
              </div>

              <div>
                <label htmlFor="craftvillage-imageUrl" className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  URL hình ảnh
                </label>
                <input id="craftvillage-imageUrl" name="imageUrl" maxLength={500} aria-invalid={Boolean(formErrors.imageUrl)}
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... hoặc /assets/..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
                />
                {formErrors.imageUrl && <p role="alert" className="text-xs text-danger">{formErrors.imageUrl}</p>}
              </div>

              <div>
                <label htmlFor="craftvillage-description" className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  Lịch sử & Mô tả
                </label>
                <textarea id="craftvillage-description" name="description" aria-invalid={Boolean(formErrors.description)}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Lịch sử phát triển làng nghề, truyền thống, đặc sản nhạc cụ..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting || modalDeleting || loading || loadFailed}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : editingVillage ? 'Cập nhật' : 'Thêm mới'}
                </button>
                {editingVillage && (
                  <button
                    type="button"
                    onClick={() => { if (!submitting && !modalDeleting) resetForm() }}
                    className="py-2.5 px-4 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] hover:bg-[#F2F4F5] text-sm font-medium text-zinc-700 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </fieldset>
            </form>
          </div>

          {/* Right / Bottom: Village List */}
          <div className="lg:col-span-7 bg-[#FFFFFF] p-5 rounded-xl border border-[#E5E8EB] shadow-2xs flex flex-col">
            <div className="flex flex-col gap-2.5 mb-3 pb-2 border-b border-[#E5E8EB] sm:flex-row sm:items-center sm:justify-between">
              <h3 className="shrink-0 text-sm font-bold text-[#17191B]">
                Danh sách ({villages.length})
              </h3>
              <input
                type="text"
                name="craftVillageSearch"
                aria-label="Tìm làng nghề"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên hoặc địa chỉ…"
                className="box-border h-9 w-full min-w-0 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] px-3.5 text-sm text-[#17191B] transition-[border-color,box-shadow] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 sm:w-48 sm:min-w-48 sm:max-w-48 sm:shrink-0"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-secondary">
                Đang tải dữ liệu làng nghề...
              </div>
            ) : loadFailed ? (
              <p className="py-12 text-center text-sm text-secondary">Danh sách chưa tải được. Vui lòng tải lại dữ liệu.</p>
            ) : filteredVillages.length === 0 ? (
              <div className="py-12 text-center text-sm text-secondary">
                Không tìm thấy làng nghề nào phù hợp.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E8EB] text-secondary font-semibold text-xs bg-[#F6F7F8]">
                      <th className="py-2.5 px-3">Làng nghề</th>
                      <th className="py-2.5 px-3">Vị trí</th>
                      <th className="py-2.5 px-3 text-center">Nghệ nhân</th>
                      <th className="py-2.5 px-3 text-center">Sản phẩm</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E8EB]">
                    {filteredVillages.map((v) => {
                      const inUse = v.artisanCount > 0 || v.productCount > 0
                      return (
                        <tr
                          key={v.id}
                          className={`hover:bg-[#F6F7F8] transition-colors ${
                            editingVillage?.id === v.id ? 'bg-[#0D9488]/5' : ''
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="font-semibold text-[#17191B]">{v.name}</div>
                            {v.description && (
                              <div className="text-xs text-secondary truncate max-w-[150px]">
                                {v.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-secondary text-xs">
                            {v.location}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600">
                              {v.artisanCount}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                v.productCount > 0
                                  ? 'bg-[#0D9488]/10 text-[#0D9488]'
                                  : 'bg-zinc-100 text-zinc-500'
                              }`}
                            >
                              {v.productCount}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => startEdit(v)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#F2F4F5] hover:bg-[#E5E8EB] text-zinc-700 text-[13px] font-medium transition-colors cursor-pointer"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(v)}
                              title={
                                inUse
                                  ? 'Không thể xóa làng nghề đang có nghệ nhân hoặc sản phẩm liên kết'
                                  : 'Xóa làng nghề'
                              }
                              className={`px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                                inUse
                                  ? 'bg-[#F6F7F8] text-zinc-400 hover:bg-[#E3E6E8] cursor-pointer'
                                  : 'bg-surface-secondary hover:bg-surface-secondary text-rose-600 cursor-pointer'
                              }`}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      )
                    })}
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

      {deleteConfirmTarget && (
        <ConfirmDialog
          isOpen
          title="Xóa làng nghề"
          description={`Bạn có chắc chắn muốn xóa làng nghề "${deleteConfirmTarget.name}"?`}
          confirmLabel="Xóa"
          variant="danger"
          isLoading={modalDeleting}
          onConfirm={confirmDeleteVillage}
          onCancel={() => { if (!modalDeleting) setDeleteConfirmTarget(null) }}
        />
      )}
    </div>
  )
}
