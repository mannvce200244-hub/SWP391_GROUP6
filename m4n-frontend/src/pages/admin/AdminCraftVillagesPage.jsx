import { useState, useEffect } from 'react'
import craftVillageService from '../../services/craftVillageService.js'
import useToast from '../../components/ui/useToast.js'
import { MapPin, Search, Trash2, UserRound, Plus, Pencil } from 'lucide-react'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import CraftVillageManagementModal from '../../components/admin/CraftVillageManagementModal.jsx'

export default function AdminCraftVillagesPage() {
  const { addToast } = useToast()
  const [villages, setVillages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVillage, setSelectedVillage] = useState(null)

  useEffect(() => {
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
          setError(err.message || 'Không thể tải dữ liệu làng nghề')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [refreshKey])

  const reloadVillages = () => {
    setLoading(true)
    setError(null)
    setRefreshKey((k) => k + 1)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await craftVillageService.deleteCraftVillage(deleteTarget.id)
      addToast({ message: `Đã xóa làng nghề "${deleteTarget.name}".`, type: 'success' })
      setDeleteTarget(null)
      reloadVillages()
    } catch (err) {
      addToast({ message: err.message || 'Không thể xóa làng nghề.', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const requestDelete = (village) => {
    const artisanCount = village.artisanCount ?? 0
    const productCount = village.productCount ?? 0

    if (artisanCount > 0 || productCount > 0) {
      addToast({
        message: `Không thể xóa làng nghề "${village.name}" vì đang liên kết ${artisanCount} nghệ nhân và ${productCount} sản phẩm. Vui lòng gỡ các liên kết trước.`,
        type: 'error',
        duration: 5000,
      })
      return
    }

    setDeleteTarget(village)
  }

  const filtered = villages.filter((v) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.location && v.location.toLowerCase().includes(q)) ||
      (v.description && v.description.toLowerCase().includes(q))
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-secondary">Đang tải làng nghề…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-rose-600 mb-3">{error}</p>
        <button
          type="button"
          onClick={reloadVillages}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[#F6F7F8] hover:bg-[#E3E6E8] text-[#17191B] border border-[#E3E6E8] transition-colors cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#17191B]">Quản lý Làng nghề</h2>
          <p className="text-sm text-secondary mt-0.5">
            {villages.length} làng nghề trong hệ thống
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedVillage(null)
            setIsModalOpen(true)
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-sm font-medium transition-colors shadow-2xs cursor-pointer"
        >
          <Plus size={16} />
          Thêm làng nghề
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm làng nghề…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E3E6E8]">
          <MapPin size={40} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-sm text-secondary">
            {search ? 'Không tìm thấy làng nghề phù hợp.' : 'Chưa có làng nghề nào.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E3E6E8] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E3E6E8] bg-[#F6F7F8]">
                  <th className="text-left px-4 py-3 font-semibold text-[#17191B]">Làng nghề</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#17191B]">Địa điểm</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#17191B]">Nghệ nhân</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#17191B]">Sản phẩm</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#17191B]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((village) => (
                  <tr key={village.id} className="border-b border-[#F2F4F5] hover:bg-[#F6F7F8]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {village.imageUrl ? (
                          <img
                            src={village.imageUrl}
                            alt={village.name}
                            className="w-9 h-9 rounded-lg object-cover border border-[#E3E6E8]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[#F6F7F8] flex items-center justify-center border border-[#E3E6E8]">
                            <MapPin size={16} className="text-zinc-400" />
                          </div>
                        )}
                        <span className="font-medium text-[#17191B]">{village.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-secondary">{village.location || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-secondary">
                        <UserRound size={13} className="text-zinc-400" />
                        {village.artisanCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-secondary">{village.productCount ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Chỉnh sửa"
                          onClick={() => {
                            setSelectedVillage(village)
                            setIsModalOpen(true)
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors cursor-pointer"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          title={
                            (village.artisanCount ?? 0) > 0 || (village.productCount ?? 0) > 0
                              ? `Không thể xóa: đang liên kết ${village.artisanCount ?? 0} nghệ nhân và ${village.productCount ?? 0} sản phẩm`
                              : 'Xóa làng nghề'
                          }
                          aria-label={`Xóa làng nghề ${village.name}`}
                          onClick={() => requestDelete(village)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            (village.artisanCount ?? 0) > 0 || (village.productCount ?? 0) > 0
                              ? 'text-zinc-300 hover:text-zinc-500 hover:bg-[#F6F7F8]'
                              : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50'
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

      {deleteTarget && (
        <ConfirmDialog
          isOpen
          title="Xóa làng nghề"
          description={`Bạn có chắc muốn xóa làng nghề "${deleteTarget.name}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          variant="danger"
          isLoading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Craft Village Create / Edit Modal */}
      {isModalOpen && (
        <CraftVillageManagementModal
          key={selectedVillage ? `village-${selectedVillage.id}` : 'village-new'}
          isOpen={isModalOpen}
          initialVillage={selectedVillage}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedVillage(null)
          }}
          onSuccess={reloadVillages}
        />
      )}
    </div>
  )
}
