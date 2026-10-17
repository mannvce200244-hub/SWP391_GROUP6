import { useState, useEffect, useCallback } from 'react'
import artisanService from '../../services/artisanService.js'
import craftVillageService from '../../services/craftVillageService.js'
import useToast from '../ui/useToast.js'
import { IconUser, IconLandmark, IconX } from '../ui/Icons.jsx'

export default function ArtisanManagementModal({ isOpen, onClose, onSuccess }) {
  const { addToast } = useToast()
  const [artisans, setArtisans] = useState([])
  const [craftVillages, setCraftVillages] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingArtisan, setEditingArtisan] = useState(null)
  const [search, setSearch] = useState('')

  // Form fields
  const [name, setName] = useState('')
  const [craftVillageId, setCraftVillageId] = useState('')
  const [biography, setBiography] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [serverError, setServerError] = useState('')

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
    setServerError('')
    try {
      const [artisanData, villageData] = await Promise.all([
        artisanService.getAdminArtisans(),
        craftVillageService.getCraftVillages().catch(() => []),
      ])
      setArtisans(artisanData || [])
      setCraftVillages(villageData || [])
    } catch (err) {
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
      craftVillageService.getCraftVillages().catch(() => []),
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
          setServerError(err.message || 'Không thể tải dữ liệu nghệ nhân')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [isOpen])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const startEdit = (a) => {
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
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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
      setServerError(err.message || 'Đã xảy ra lỗi khi lưu nghệ nhân')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (a) => {
    if (a.productCount > 0) {
      addToast({
        message: `Không thể xóa nghệ nhân "${a.name}" vì đang có ${a.productCount} sản phẩm liên kết.`,
        type: 'error',
      })
      return
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa nghệ nhân "${a.name}"?`)) {
      return
    }

    try {
      await artisanService.deleteArtisan(a.id)
      addToast({
        message: `Đã xóa nghệ nhân "${a.name}".`,
        type: 'success',
      })
      if (editingArtisan?.id === a.id) resetForm()
      await fetchData()
      if (onSuccess) onSuccess()
    } catch (err) {
      addToast({
        message: err.message || 'Không thể xóa nghệ nhân này',
        type: 'error',
      })
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
              <IconUser size={20} />
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
            <IconX size={18} />
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
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  Tên nghệ nhân <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nghệ nhân Nguyễn Văn A..."
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    formErrors.name ? 'border-rose-400 bg-rose-50/30' : 'border-[#E5E8EB]'
                  } bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30`}
                />
                {formErrors.name && (
                  <span className="text-xs text-rose-500 mt-1 block">{formErrors.name}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  Làng nghề trực thuộc
                </label>
                <select
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
                <label className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  URL ảnh đại diện
                </label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://... hoặc /assets/..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#17191B] mb-1.5">
                  Tiểu sử & Tay nghề
                </label>
                <textarea
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
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : editingArtisan ? 'Cập nhật' : 'Thêm mới'}
                </button>
                {editingArtisan && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="py-2.5 px-4 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] hover:bg-[#F2F4F5] text-sm font-medium text-zinc-700 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right / Bottom: Artisan List */}
          <div className="lg:col-span-7 bg-[#FFFFFF] p-5 rounded-xl border border-[#E5E8EB] shadow-2xs flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-[#E5E8EB]">
              <h3 className="text-sm font-bold text-[#17191B]">
                Danh sách ({artisans.length})
              </h3>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm nghệ nhân hoặc làng nghề..."
                className="px-3.5 py-1.5 text-sm rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 w-48"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-secondary">
                Đang tải dữ liệu nghệ nhân...
              </div>
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
                              <IconLandmark size={13} className="text-secondary shrink-0" />
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
                            className="px-2.5 py-1.5 rounded-lg bg-[#F2F4F5] hover:bg-[#E5E8EB] text-zinc-700 text-xs font-medium transition-colors cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(a)}
                            disabled={a.productCount > 0}
                            title={
                              a.productCount > 0
                                ? 'Không thể xóa nghệ nhân đang có sản phẩm liên kết'
                                : 'Xóa nghệ nhân'
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              a.productCount > 0
                                ? 'opacity-30 cursor-not-allowed bg-zinc-100 text-zinc-400'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer'
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
    </div>
  )
}
