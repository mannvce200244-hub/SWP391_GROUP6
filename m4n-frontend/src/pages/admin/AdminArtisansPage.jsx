import { useState, useEffect } from 'react'
import artisanService from '../../services/artisanService.js'
import useToast from '../../components/ui/useToast.js'
import { UserRound, Search, Trash2, Landmark, Plus, Pencil } from 'lucide-react'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import ArtisanManagementModal from '../../components/admin/ArtisanManagementModal.jsx'

export default function AdminArtisansPage() {
  const { addToast } = useToast()
  const [artisans, setArtisans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedArtisan, setSelectedArtisan] = useState(null)

  useEffect(() => {
    let active = true
    artisanService
      .getAdminArtisans()
      .then((data) => {
        if (active) {
          setArtisans(data || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Không thể tải dữ liệu nghệ nhân')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [refreshKey])

  const reloadArtisans = () => {
    setLoading(true)
    setError(null)
    setRefreshKey((k) => k + 1)
  }

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      await artisanService.deleteArtisan(deleteTarget.id)
      addToast({ message: `Đã xóa nghệ nhân "${deleteTarget.name}".`, type: 'success' })
      setDeleteTarget(null)
      reloadArtisans()
    } catch (err) {
      addToast({ message: err.message || 'Không thể xóa nghệ nhân.', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const requestDelete = (artisan) => {
    const productCount = artisan.productCount ?? 0

    if (productCount > 0) {
      addToast({
        message: `Không thể xóa nghệ nhân "${artisan.name}" vì đang liên kết ${productCount} sản phẩm. Vui lòng gỡ các liên kết trước.`,
        type: 'error',
        duration: 5000,
      })
      return
    }

    setDeleteTarget(artisan)
  }

  const filtered = artisans.filter((a) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.craftVillageName && a.craftVillageName.toLowerCase().includes(q)) ||
      (a.biography && a.biography.toLowerCase().includes(q))
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-secondary">Đang tải nghệ nhân…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p role="alert" className="text-sm text-rose-600 mb-3">{error}</p>
        <button
          type="button"
          onClick={reloadArtisans}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[#F6F7F8] hover:bg-[#E3E6E8] text-[#17191B] border border-[#E3E6E8] transition-colors cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#17191B]">Quản lý Nghệ nhân</h2>
          <p className="text-sm text-secondary mt-0.5">
            {artisans.length} nghệ nhân trong hệ thống
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedArtisan(null)
            setIsModalOpen(true)
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-sm font-medium transition-colors shadow-2xs cursor-pointer"
        >
          <Plus size={16} />
          Thêm nghệ nhân
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          name="masterSearch" aria-label="Tìm theo tên hoặc thông tin liên quan"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm nghệ nhân…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40 transition-colors"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E3E6E8]">
          <UserRound size={40} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-sm text-secondary">
            {search ? 'Không tìm thấy nghệ nhân phù hợp.' : 'Chưa có nghệ nhân nào.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E3E6E8] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E3E6E8] bg-[#F6F7F8]">
                  <th className="text-left px-4 py-3 font-semibold text-[#17191B]">Nghệ nhân</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#17191B]">Làng nghề</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#17191B]">Sản phẩm</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#17191B]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((artisan) => (
                  <tr key={artisan.id} className="border-b border-[#F2F4F5] hover:bg-[#F6F7F8]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {artisan.avatarUrl ? (
                          <img
                            src={artisan.avatarUrl}
                            alt={artisan.name}
                            className="w-9 h-9 rounded-lg object-cover border border-[#E3E6E8]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[#F6F7F8] flex items-center justify-center border border-[#E3E6E8]">
                            <UserRound size={16} className="text-zinc-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[#17191B]">{artisan.name}</p>
                          {artisan.biography && (
                            <p className="max-w-xs truncate text-xs text-secondary">{artisan.biography}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {artisan.craftVillageName ? (
                        <span className="inline-flex items-center gap-1 text-secondary">
                          <Landmark size={13} className="text-zinc-400" aria-hidden="true" />
                          {artisan.craftVillageName}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-secondary">{artisan.productCount ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Chỉnh sửa" aria-label="Chỉnh sửa"
                          aria-label={`Chỉnh sửa nghệ nhân ${artisan.name}`}
                          onClick={() => {
                            setSelectedArtisan(artisan)
                            setIsModalOpen(true)
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors cursor-pointer"
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          title={(artisan.productCount ?? 0) > 0
                            ? `Không thể xóa: đang liên kết ${artisan.productCount} sản phẩm`
                            : 'Xóa nghệ nhân'}
                          aria-label={`Xóa nghệ nhân ${artisan.name}`}
                          onClick={() => requestDelete(artisan)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            (artisan.productCount ?? 0) > 0
                              ? 'text-zinc-300 hover:text-zinc-500 hover:bg-[#F6F7F8]'
                              : 'text-zinc-400 hover:text-rose-600 hover:bg-surface-secondary'
                          }`}
                        >
                          <Trash2 size={15} aria-hidden="true" />
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

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen
          title="Xóa nghệ nhân"
          description={`Bạn có chắc muốn xóa nghệ nhân "${deleteTarget.name}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          variant="danger"
          isLoading={deleting}
          onConfirm={handleDelete}
          onCancel={() => { if (!deleting) setDeleteTarget(null) }}
        />
      )}

      {/* Artisan Create / Edit Modal */}
      {isModalOpen && (
        <ArtisanManagementModal
          key={selectedArtisan ? `artisan-${selectedArtisan.id}` : 'artisan-new'}
          isOpen={isModalOpen}
          initialArtisan={selectedArtisan}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedArtisan(null)
          }}
          onSuccess={reloadArtisans}
        />
      )}
    </div>
  )
}
