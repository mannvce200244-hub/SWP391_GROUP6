import { useState, useEffect } from 'react'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import artisanService from '../../services/artisanService.js'
import adminProductService from '../../services/adminProductService.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'
import ArtisanManagementModal from '../../components/admin/ArtisanManagementModal.jsx'
import { IconInstrument } from '../../components/ui/Icons.jsx'
import {
  ArrowLeft,
  Pencil,
  RefreshCw,
  ExternalLink,
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

export default function AdminArtisanDetailPage({ artisanId }) {
  const [artisan, setArtisan] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (!artisanId) return
    let active = true

    Promise.resolve()
      .then(() => {
        if (!active) return null
        setLoading(true)
        setError(null)
        return Promise.all([
          artisanService.getArtisanDetail(artisanId),
          adminProductService
            .listProducts({ artisanId: Number(artisanId), page: 0, size: 50 })
            .catch(() => ({ content: [] })),
        ])
      })
      .then((result) => {
        if (!active || !result) return
        const [artisanData, productsData] = result
        setArtisan(artisanData)
        setProducts(productsData?.content || [])
        setLoading(false)
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Không tìm thấy thông tin nghệ nhân này.')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [artisanId, refreshKey])

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-secondary font-medium">
          Đang tải chi tiết hồ sơ nghệ nhân...
        </span>
      </div>
    )
  }

  if (error || !artisan) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E8EB] p-10 text-center max-w-lg mx-auto my-8 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-[#F6F7F8] text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-200">
          <UserRound size={24} />
        </div>
        <h2 className="text-base font-bold text-[#17191B] mb-1">
          Không thể tải thông tin nghệ nhân
        </h2>
        <p className="text-sm text-secondary mb-5">
          {error || 'Nghệ nhân không tồn tại hoặc đã bị xóa.'}
        </p>
        <button
          type="button"
          onClick={() => navigateTo(CUSTOMER_ROUTES.adminArtisans)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#17191B] text-white text-sm font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Quay lại Danh sách Nghệ nhân</span>
        </button>
      </div>
    )
  }

  const biographyParagraphs = artisan.biography
    ? artisan.biography.split(/\n+/).filter(Boolean)
    : []

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E8EB] shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigateTo(CUSTOMER_ROUTES.adminArtisans)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F6F7F8] text-[#17191B] transition-colors cursor-pointer shrink-0"
            title="Quay lại danh sách nghệ nhân"
            aria-label="Quay lại danh sách nghệ nhân"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-secondary">
                Hồ sơ Nghệ nhân
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F6F7F8] text-secondary border border-[#E5E8EB]">
                #{artisan.id}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#17191B] truncate">
              {artisan.name}
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
            onClick={() => navigateTo(CUSTOMER_ROUTES.artisanDetail(artisan.id))}
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

        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Portrait + Metadata */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="aspect-4/5 w-full rounded-2xl border border-[#E5E8EB] bg-[#F6F7F8] overflow-hidden flex items-center justify-center shadow-2xs">
              {artisan.avatarUrl ? (
                <img
                  src={artisan.avatarUrl}
                  alt={`Chân dung ${artisan.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-secondary p-6 text-center">
                  <UserRound size={48} className="text-zinc-300" />
                  <span className="text-xs">Chưa có ảnh chân dung</span>
                </div>
              )}
            </div>

            {/* Metadata Box */}
            <div className="rounded-xl border border-[#E5E8EB] bg-[#F6F7F8] p-4 space-y-3 text-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary pb-2 border-b border-[#E5E8EB]">
                Thông tin quản trị
              </h3>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-secondary">Làng nghề:</span>
                {artisan.craftVillageName ? (
                  <button
                    type="button"
                    onClick={() =>
                      artisan.craftVillageId &&
                      navigateTo(CUSTOMER_ROUTES.adminCraftVillageDetail(artisan.craftVillageId))
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D9488] hover:underline cursor-pointer text-right"
                  >
                    <Landmark size={13} />
                    <span>{artisan.craftVillageName}</span>
                  </button>
                ) : (
                  <span className="text-xs text-zinc-400">Chưa gắn làng nghề</span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-secondary">Số nhạc cụ chế tác:</span>
                <span className="text-xs font-bold text-[#17191B]">
                  {artisan.productCount ?? products.length} sản phẩm
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-secondary">Ngày khởi tạo:</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#17191B]">
                  <Calendar size={13} className="text-secondary" />
                  {formatDateVN(artisan.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Public Story / Biography Preview */}
          <div className="lg:col-span-8 flex flex-col justify-between gap-6">
            <div>
              <EditorialEyebrow label="BÀN TAY GIỮ HỒN DÂN TỘC" />
              <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#17191B]">
                {artisan.name}
              </h2>

              {artisan.craftVillageName && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F6F7F8] border border-[#E5E8EB] text-xs font-semibold text-secondary">
                  <Landmark size={14} className="text-[#0D9488]" />
                  <span>Làng nghề: {artisan.craftVillageName}</span>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-[#E5E8EB]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#17191B]">
                    Tiểu sử & Câu chuyện nghệ nhân (Hiển thị trên trang chính)
                  </h3>
                </div>

                {biographyParagraphs.length > 0 ? (
                  <div className="space-y-4 text-sm sm:text-base leading-7 text-[#2C3033] bg-[#F6F7F8]/60 p-5 rounded-xl border border-[#E5E8EB]">
                    {biographyParagraphs.map((paragraph, idx) => (
                      <p key={idx} className="break-words">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#E5E8EB] bg-[#F6F7F8] p-8 text-center">
                    <p className="text-sm font-semibold text-[#17191B]">
                      Chưa có nội dung tiểu sử nghệ nhân
                    </p>
                    <p className="text-xs text-secondary mt-1 mb-4">
                      Thêm câu chuyện và quá trình làm nghề để hiển thị đẹp mắt trên trang chi tiết nghệ nhân.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-semibold hover:bg-[#0F766E] transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                      <span>Bổ sung tiểu sử ngay</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Associated Products Section */}
      <div className="bg-white rounded-2xl border border-[#E5E8EB] shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E8EB] flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#17191B]">
              Nhạc cụ do {artisan.name} chế tác ({products.length})
            </h3>
            <p className="text-xs text-secondary">
              Danh sách các tác phẩm đang liên kết với nghệ nhân này trên hệ thống
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-12 text-center">
            <IconInstrument size={32} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-sm text-secondary">
              Chưa có sản phẩm nhạc cụ nào liên kết với nghệ nhân này.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E8EB] bg-[#F6F7F8] text-xs font-semibold text-secondary">
                  <th className="py-3 px-4">Nhạc cụ</th>
                  <th className="py-3 px-4">Danh mục</th>
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
                      {p.category?.name || '—'}
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
        <ArtisanManagementModal
          key={`edit-artisan-${artisan.id}`}
          isOpen={showEditModal}
          initialArtisan={artisan}
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

