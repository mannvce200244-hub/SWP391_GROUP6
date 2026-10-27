import { useState, useEffect, useCallback } from 'react'
import artisanService from '../../services/artisanService.js'
import craftVillageService from '../../services/craftVillageService.js'
import useToast from '../ui/useToast.js'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import { UserRound, Landmark, X } from 'lucide-react'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'

export default function ArtisanManagementModal({ isOpen, onClose, onSuccess, initialArtisan = null }) {
  const { addToast } = useToast()
  const [artisans, setArtisans] = useState([])
  const [craftVillages, setCraftVillages] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingArtisan, setEditingArtisan] = useState(initialArtisan)
  const [search, setSearch] = useState('')
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null)
  const [modalDeleting, setModalDeleting] = useState(false)

  // Form fields
  const [name, setName] = useState(() => initialArtisan?.name || '')
  const [craftVillageId, setCraftVillageId] = useState(() =>
    initialArtisan?.craftVillageId ? String(initialArtisan.craftVillageId) : ''
  )
  const [biography, setBiography] = useState(() => initialArtisan?.biography || '')
  const [avatarUrl, setAvatarUrl] = useState(() => initialArtisan?.avatarUrl || '')
  const [formErrors, setFormErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loadFailed, setLoadFailed] = useState(false)


  const resetForm = useCallback(() => {
    setEditingArtisan(null)
    setName('')
    setCraftVillageId('')
    setBiography('')
    setAvatarUrl('')
    setFormErrors({})
    setServerError('')
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setLoadFailed(false)
    setServerError('')
    try {
      const [artisanData, villageData] = await Promise.all([
        artisanService.getAdminArtisans(),
        craftVillageService.getCraftVillages(),
      ])
      setArtisans(artisanData || [])
      setCraftVillages(villageData || [])
    } catch (err) {
      setLoadFailed(true)
      setServerError(err.message || 'Không thể tải dữ liệu nghệ nhân')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    let active = true

    Promise.all([
      artisanService.getAdminArtisans(),
      craftVillageService.getCraftVillages(),
    ])
      .then(([artisanData, villageData]) => {
        if (active) {
          setArtisans(artisanData || [])
          setCraftVillages(villageData || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setLoadFailed(true)
          setServerError(err.message || 'Không thể tải dữ liệu nghệ nhân')
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

  const startEdit = (a) => {
    if (submitting || modalDeleting) return
    setEditingArtisan(a)
    setName(a.name)
    setCraftVillageId(a.craftVillageId ? String(a.craftVillageId) : '')
    setBiography(a.biography || '')
    setAvatarUrl(a.avatarUrl || '')
    setFormErrors({})
    setServerError('')
  }

  const validate = () => {
    const errors = {}
    if (!name.trim()) {
      errors.name = 'Tên nghệ nhân không được để trống'
    } else if (name.trim().length > 150) {
      errors.name = 'Tên nghệ nhân không được vượt quá 150 ký tự'
    }
    if (avatarUrl.trim().length > 500) errors.avatarUrl = 'URL ảnh đại diện tối đa 500 ký tự.'
    setFormErrors(errors)
    if (Object.keys(errors).length) document.getElementById("artisan-" + Object.keys(errors)[0])?.focus()
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
        craftVillageId: craftVillageId ? Number(craftVillageId) : null,
        biography: biography.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      }

      if (editingArtisan) {
        await artisanService.updateArtisan(editingArtisan.id, payload)
        addToast({
          message: `Đã cập nhật thông tin nghệ nhân "${name.trim()}".`,
          type: 'success',
        })
      } else {
        await artisanService.createArtisan(payload)
        addToast({
          message: `Đã thêm nghệ nhân mới "${name.trim()}".`,
          type: 'success',
        })
      }
      resetForm()
      await fetchData()
      if (onSuccess) onSuccess()
    } catch (err) {
      setFormErrors(err.fieldErrors || err.data?.fieldErrors || {})
      setServerError(err.message || 'Đã xảy ra lỗi khi lưu nghệ nhân')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (a) => {
    if (submitting || modalDeleting) return
    if (a.productCount > 0) {
      addToast({
        message: `Không thể xóa nghệ nhân "${a.name}" vì đang có ${a.productCount} sản phẩm liên kết. Vui lòng gỡ các liên kết trước.`,
        type: 'error',
        duration: 5000,
      })
      return
    }
    setDeleteConfirmTarget(a)
  }

  const confirmDeleteArtisan = async () => {
    if (!deleteConfirmTarget || modalDeleting || submitting) return
    setModalDeleting(true)
    try {
      await artisanService.deleteArtisan(deleteConfirmTarget.id)
      addToast({
        message: `Đã xóa nghệ nhân "${deleteConfirmTarget.name}".`,
        type: 'success',
      })
      if (editingArtisan?.id === deleteConfirmTarget.id) resetForm()
      setDeleteConfirmTarget(null)
      await fetchData()
      if (onSuccess) onSuccess()
    } catch (err) {
      addToast({
        message: err.message || 'Không thể xóa nghệ nhân này',
        type: 'error',
      })
    } finally {
      setModalDeleting(false)
    }
  }

  if (!isOpen) return null

  const filteredArtisans = artisans.filter((a) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      a.name.toLowerCase().includes(q) ||
      (a.craftVillageName && a.craftVillageName.toLowerCase().includes(q))
    )
  })

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="artisan-modal-title"
    >
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E8EB] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E8EB] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center font-bold text-sm">
              <UserRound size={20} />
            </div>
            <div>
              <h2 id="artisan-modal-title" className="text-lg font-bold text-[#17191B]">
                Quản lý Nghệ nhân
              </h2>
              <p className="text-xs text-secondary">
                Hồ sơ nghệ nhân chế tác và liên kết làng nghề truyền thống
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
              {editingArtisan ? `Chỉnh sửa: ${editingArtisan.name}` : 'Thêm mới nghệ nhân'}
            </h3>

            {serverError && (
              <div role="alert" className="mb-4 p-3 rounded-lg bg-[#FFFFFF] border border-rose-200 text-rose-700 text-xs">
                {serverError}
                {loadFailed && <button type="button" onClick={fetchData} className="block mt-2 underline">Tải lại dữ liệu</button>}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <fieldset disabled={submitting || modalDeleting} className="contents">
              <div>
                <label htmlFor="artisan-name" className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  Tên nghệ nhân <span className="text-rose-500">*</span>
                </label>
                <input id="artisan-name" name="name" maxLength={150} aria-invalid={Boolean(formErrors.name)} aria-describedby={formErrors.name ? "artisan-name-error" : undefined}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nghệ nhân Nguyễn Văn A..."
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    formErrors.name ? 'border-rose-400 bg-surface-secondary/30' : 'border-[#E5E8EB]'
                  } bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30`}
                />
                {formErrors.name && (
                  <span id="artisan-name-error" role="alert" className="text-xs text-rose-500 mt-1 block">{formErrors.name}</span>
                )}
              </div>

              <div>
                <label htmlFor="artisan-craftVillageId" className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  Làng nghề trực thuộc
                </label>
                <select id="artisan-craftVillageId" name="craftVillageId" aria-invalid={Boolean(formErrors.craftVillageId)}
                  value={craftVillageId}
                  onChange={(e) => setCraftVillageId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
                >
                  <option value="">-- Không thuộc làng nghề cụ thể --</option>
                  {craftVillages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.location || 'Chưa có địa chỉ'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="artisan-avatarUrl" className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  URL ảnh đại diện
                </label>
                <input id="artisan-avatarUrl" name="avatarUrl" maxLength={500} aria-invalid={Boolean(formErrors.avatarUrl)}
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://... hoặc /assets/..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
                />
                {formErrors.avatarUrl && <p role="alert" className="text-xs text-danger">{formErrors.avatarUrl}</p>}
              </div>

              <div>
                <label htmlFor="artisan-biography" className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  Tiểu sử & Tay nghề
                </label>
                <textarea id="artisan-biography" name="biography" aria-invalid={Boolean(formErrors.biography)}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  rows={3}
                  placeholder="Kinh nghiệm, giải thưởng, quá trình gìn giữ nghề..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting || modalDeleting || loading || loadFailed}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : editingArtisan ? 'Cập nhật' : 'Thêm mới'}
                </button>
                {editingArtisan && (
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

          {/* Right / Bottom: Artisan List */}
          <div className="lg:col-span-7 bg-[#FFFFFF] p-5 rounded-xl border border-[#E5E8EB] shadow-2xs flex flex-col">
            <div className="flex flex-col gap-2.5 mb-3 pb-2 border-b border-[#E5E8EB] sm:flex-row sm:items-center sm:justify-between">
              <h3 className="shrink-0 text-sm font-bold text-[#17191B]">
                Danh sách ({artisans.length})
              </h3>
              <input
                type="text"
                name="artisanSearch"
                aria-label="Tìm nghệ nhân"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm nghệ nhân hoặc làng nghề…"
                className="box-border h-9 w-full min-w-0 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] px-3.5 text-sm text-[#17191B] transition-[border-color,box-shadow] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 sm:w-48 sm:min-w-48 sm:max-w-48 sm:shrink-0"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-secondary">
                Đang tải dữ liệu nghệ nhân...
              </div>
            ) : loadFailed ? (
              <p className="py-12 text-center text-sm text-secondary">Danh sách chưa tải được. Vui lòng tải lại dữ liệu.</p>
            ) : filteredArtisans.length === 0 ? (
              <div className="py-12 text-center text-sm text-secondary">
                Không tìm thấy nghệ nhân nào phù hợp.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E8EB] text-secondary font-semibold text-xs bg-[#F6F7F8]">
                      <th className="py-2.5 px-3">Nghệ nhân</th>
                      <th className="py-2.5 px-3">Làng nghề</th>
                      <th className="py-2.5 px-3 text-center">Sản phẩm</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E8EB]">
                    {filteredArtisans.map((a) => (
                      <tr
                        key={a.id}
                        className={`hover:bg-[#F6F7F8] transition-colors ${
                          editingArtisan?.id === a.id ? 'bg-[#0D9488]/5' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {a.avatarUrl ? (
                              <img
                                src={a.avatarUrl}
                                alt={a.name}
                                className="w-8 h-8 rounded-full object-cover border border-[#E5E8EB]"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-100 border border-[#E5E8EB] flex items-center justify-center text-xs font-bold text-secondary">
                                {a.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-[#17191B]">{a.name}</div>
                              {a.biography && (
                                <div className="text-xs text-secondary truncate max-w-[160px]">
                                  {a.biography}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-secondary">
                          {a.craftVillageName ? (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <Landmark size={13} className="text-secondary shrink-0" />
                              <span>{a.craftVillageName}</span>
                            </span>
                          ) : (
                            <span className="text-muted italic text-xs">Chưa gắn</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              a.productCount > 0
                                ? 'bg-[#0D9488]/10 text-[#0D9488]'
                                : 'bg-zinc-100 text-zinc-500'
                            }`}
                          >
                            {a.productCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => startEdit(a)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#F2F4F5] hover:bg-[#E5E8EB] text-zinc-700 text-[13px] font-medium transition-colors cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(a)}
                            title={
                              a.productCount > 0
                                ? 'Không thể xóa nghệ nhân đang có sản phẩm liên kết'
                                : 'Xóa nghệ nhân'
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                              a.productCount > 0
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

      {deleteConfirmTarget && (
        <ConfirmDialog
          isOpen
          title="Xóa nghệ nhân"
          description={`Bạn có chắc chắn muốn xóa nghệ nhân "${deleteConfirmTarget.name}"?`}
          confirmLabel="Xóa"
          variant="danger"
          isLoading={modalDeleting}
          onConfirm={confirmDeleteArtisan}
          onCancel={() => { if (!modalDeleting) setDeleteConfirmTarget(null) }}
        />
      )}
    </div>
  )
}
