import { useState, useEffect } from 'react'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import craftVillageService from '../../services/craftVillageService.js'
import artisanService from '../../services/artisanService.js'
import adminProductService from '../../services/adminProductService.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'
import CraftVillageManagementModal from '../../components/admin/CraftVillageManagementModal.jsx'
import { IconInstrument } from '../../components/ui/Icons.jsx'
import {
  ArrowLeft,
  Pencil,
  RefreshCw,
  ExternalLink,
  MapPin,
  UserRound,
  Landmark,
  Eye,
  Calendar,
} from 'lucide-react'

function formatDateVN(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return '—'
  }
}

export default function AdminCraftVillageDetailPage({ villageId }) {
  const [village, setVillage] = useState(null)
  const [artisans, setArtisans] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (!villageId) return
    let active = true

    Promise.resolve()
      .then(() => {
        if (!active) return null
        setLoading(true)
        setError(null)
        return Promise.all([
          craftVillageService.getCraftVillageDetail(villageId),
          artisanService.getAdminArtisans().catch(() => []),
          adminProductService
            .listProducts({ craftVillageId: Number(villageId), page: 0, size: 50 })
            .catch(() => ({ content: [] })),
        ])
      })
      .then((result) => {
        if (!active || !result) return
        const [villageData, allArtisans, productsData] = result
        setVillage(villageData)
        const linkedArtisans = (allArtisans || []).filter(
          (a) => Number(a.craftVillageId) === Number(villageId)
        )
        setArtisans(linkedArtisans)
        setProducts(productsData?.content || [])
        setLoading(false)
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Không tìm thấy thông tin làng nghề này.')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [villageId, refreshKey])

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-secondary font-medium">
          Đang tải chi tiết hồ sơ làng nghề...
        </span>
      </div>
    )
  }

  if (error || !village) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E8EB] p-10 text-center max-w-lg mx-auto my-8 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-[#F6F7F8] text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-200">
          <MapPin size={24} />
        </div>
        <h2 className="text-base font-bold text-[#17191B] mb-1">
          Không thể tải thông tin làng nghề
        </h2>
        <p className="text-sm text-secondary mb-5">
          {error || 'Làng nghề không tồn tại hoặc đã bị xóa.'}
        </p>
        <button
          type="button"
          onClick={() => navigateTo(CUSTOMER_ROUTES.adminCraftVillages)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#17191B] text-white text-sm font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Quay lại Danh sách Làng nghề</span>
        </button>
      </div>
    )
  }

  const descriptionParagraphs = village.description
    ? village.description.split(/\n+/).filter(Boolean)
    : []

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E8EB] shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigateTo(CUSTOMER_ROUTES.adminCraftVillages)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F6F7F8] text-[#17191B] transition-colors cursor-pointer shrink-0"
            title="Quay lại danh sách làng nghề"
            aria-label="Quay lại danh sách làng nghề"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-secondary">
                Hồ sơ Làng nghề truyền thống
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F6F7F8] text-secondary border border-[#E5E8EB]">
                #{village.id}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#17191B] truncate">
              {village.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F6F7F8] text-secondary hover:text-[#17191B] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={15} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo(CUSTOMER_ROUTES.craftVillageDetail(village.id))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F6F7F8] text-[#17191B] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            title="Xem giao diện hiển thị trên trang khách hàng"
          >
            <ExternalLink size={15} className="text-[#0D9488]" />
            <span>Xem trên trang chính thống</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Pencil size={15} />
            <span>Chỉnh sửa thông tin</span>
          </button>
        </div>
      </div>

      {/* Storefront Preview & Detailed Information Card */}
      <div className="bg-white rounded-2xl border border-[#E5E8EB] shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E5E8EB] bg-[#F6F7F8] flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Bố cục hiển thị trên trang chính thống & Thông tin chi tiết
          </span>
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="text-xs font-semibold text-[#0D9488] hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            <Pencil size={13} />
            <span>Sửa nhanh nội dung</span>
          </button>
        </div>

        <div className="p-6 sm:p-8 flex flex-col gap-8">
          {/* Hero Landscape Preview */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-[#E5E8EB] aspect-16/9 sm:aspect-21/9 bg-[#F6F7F8] shadow-xs">
            {village.imageUrl ? (
              <img
                src={village.imageUrl}
                alt={village.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-secondary gap-2">
                <Landmark size={44} className="text-zinc-300" />
                <span className="text-xs">Chưa có ảnh bìa làng nghề</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 pointer-events-none" />

            <div className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8 flex flex-col gap-2 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-white/95 text-[#17191B] tracking-wider uppercase shadow-2xs">
                  Làng nghề di sản
                </span>
                {village.location && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-black/50 backdrop-blur-xs text-white/90 border border-white/20">
                    {village.location}
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                {village.name}
              </h2>
            </div>
          </div>

          {/* Story & Sidebar Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div>
                <EditorialEyebrow label="CÂU CHUYỆN DI SẢN" />
                <h3 className="mt-2 text-xl sm:text-2xl font-bold text-[#17191B]">
                  Lịch sử và Kỹ nghệ truyền thống
                </h3>
              </div>

              {descriptionParagraphs.length > 0 ? (
                <div className="space-y-4 text-sm sm:text-base leading-7 text-[#2C3033] bg-[#F6F7F8]/60 p-5 rounded-xl border border-[#E5E8EB]">
                  {descriptionParagraphs.map((paragraph, idx) => (
                    <p key={idx} className="break-words">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#E5E8EB] bg-[#F6F7F8] p-8 text-center">
                  <p className="text-sm font-semibold text-[#17191B]">
                    Chưa có bài giới thiệu lịch sử làng nghề
                  </p>
                  <p className="text-xs text-secondary mt-1 mb-4">
                    Thêm mô tả về lịch sử hình thành và kỹ nghệ chế tác để hiển thị trên trang chi tiết làng nghề.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-semibold hover:bg-[#0F766E] transition-colors cursor-pointer"
                  >
                    <Pencil size={14} />
                    <span>Bổ sung mô tả ngay</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar Overview */}
            <div className="lg:col-span-4 rounded-xl border border-[#E5E8EB] bg-[#F6F7F8] p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary pb-2.5 border-b border-[#E5E8EB]">
                Thông tin tổng quan
              </h3>

              <div className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                <span className="text-secondary">Địa phương:</span>
                <span className="font-semibold text-[#17191B] text-right">
                  {village.location || 'Chưa cập nhật'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <span className="text-secondary">Nghệ nhân hợp tác:</span>
                <span className="font-bold text-[#17191B]">
                  {village.artisanCount ?? artisans.length} nghệ nhân
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <span className="text-secondary">Nhạc cụ liên kết:</span>
                <span className="font-bold text-[#17191B]">
                  {village.productCount ?? products.length} sản phẩm
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <span className="text-secondary">Ngày khởi tạo:</span>
                <span className="inline-flex items-center gap-1 font-medium text-[#17191B]">
                  <Calendar size={13} className="text-secondary" />
                  {formatDateVN(village.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Associated Artisans Section */}
      <div className="bg-white rounded-2xl border border-[#E5E8EB] shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E8EB] flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#17191B]">
              Nghệ nhân thuộc {village.name} ({artisans.length})
            </h3>
            <p className="text-xs text-secondary">
              Các nghệ nhân đang gắn kết với làng nghề này
            </p>
          </div>
        </div>

        {artisans.length === 0 ? (
          <div className="py-10 text-center">
            <UserRound size={32} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-sm text-secondary">
              Chưa có nghệ nhân nào liên kết với làng nghề này.
            </p>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {artisans.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E5E8EB] bg-[#F6F7F8]/50 hover:bg-[#F6F7F8] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {a.avatarUrl ? (
                    <img
                      src={a.avatarUrl}
                      alt={a.name}
                      className="w-11 h-11 rounded-xl object-cover border border-[#E5E8EB] shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-white border border-[#E5E8EB] flex items-center justify-center shrink-0">
                      <UserRound size={18} className="text-zinc-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => navigateTo(CUSTOMER_ROUTES.adminArtisanDetail(a.id))}
                      className="text-sm font-semibold text-[#17191B] hover:text-[#0D9488] truncate block cursor-pointer text-left"
                    >
                      {a.name}
                    </button>
                    <span className="text-xs text-secondary">
                      {a.productCount ?? 0} tác phẩm
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo(CUSTOMER_ROUTES.adminArtisanDetail(a.id))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E8EB] bg-white hover:bg-[#F6F7F8] text-xs font-medium text-[#17191B] shrink-0 cursor-pointer"
                >
                  <Eye size={13} />
                  <span>Chi tiết</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Associated Products Section */}
      <div className="bg-white rounded-2xl border border-[#E5E8EB] shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E8EB] flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#17191B]">
              Nhạc cụ xuất xứ từ {village.name} ({products.length})
            </h3>
            <p className="text-xs text-secondary">
              Danh sách các nhạc cụ truyền thống gắn với làng nghề này
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-12 text-center">
            <IconInstrument size={32} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-sm text-secondary">
              Chưa có sản phẩm nhạc cụ nào liên kết với làng nghề này.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E8EB] bg-[#F6F7F8] text-xs font-semibold text-secondary">
                  <th className="py-3 px-4">Nhạc cụ</th>
                  <th className="py-3 px-4">Nghệ nhân</th>
                  <th className="py-3 px-4 text-right">Đơn giá</th>
                  <th className="py-3 px-4 text-center">Tồn kho</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8EB]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F6F7F8]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#F6F7F8] border border-[#E5E8EB] overflow-hidden shrink-0 flex items-center justify-center">
                          {p.primaryImage ? (
                            <img src={p.primaryImage} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <IconInstrument size={18} className="text-secondary" />
                          )}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => navigateTo(CUSTOMER_ROUTES.adminInstrumentDetail(p.id))}
                            className="font-semibold text-[#17191B] hover:text-[#0D9488] transition-colors cursor-pointer text-left"
                          >
                            {p.name}
                          </button>
                          <p className="font-mono text-xs text-secondary">{p.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-secondary">
                      {p.artisan?.name || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#17191B]">
                      {formatCurrencyVND(p.price)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-[#17191B]">
                      {p.stockQuantity ?? 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          p.isActive
                            ? 'bg-[#F6F7F8] text-emerald-700 border-emerald-200'
                            : 'bg-[#F6F7F8] text-zinc-500 border-zinc-200'
                        }`}
                      >
                        {p.isActive ? 'Kinh doanh' : 'Tạm ngừng'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigateTo(CUSTOMER_ROUTES.adminInstrumentDetail(p.id))}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E8EB] bg-white hover:bg-[#F6F7F8] text-xs font-medium text-[#17191B] transition-colors cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>Chi tiết SP</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <CraftVillageManagementModal
          key={`edit-village-${village.id}`}
          isOpen={showEditModal}
          initialVillage={village}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            setRefreshKey((k) => k + 1)
          }}
        />
      )}
    </div>
  )
}

