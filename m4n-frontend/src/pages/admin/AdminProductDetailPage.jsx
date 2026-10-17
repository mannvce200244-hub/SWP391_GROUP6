import { useState, useEffect } from 'react'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import adminProductService from '../../services/adminProductService.js'
import { importStock } from '../../services/inventoryService.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import useToast from '../../components/ui/useToast.js'
import ProductFormModal from '../../components/admin/ProductFormModal.jsx'
import {
  IconArrowLeft,
  IconCopy,
  IconPencil,
  IconPackage,
  IconRefresh,
  IconImageOff,
  IconUserRound,
  IconLandmark,
  IconMapPin,
  IconClose,
} from '../../components/ui/Icons.jsx'

export default function AdminProductDetailPage({ productId }) {
  const { addToast } = useToast()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Media viewer
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)

  // Modals & Action states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importQuantity, setImportQuantity] = useState(1)
  const [importNotes, setImportNotes] = useState('')
  const [submittingImport, setSubmittingImport] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)

  useEffect(() => {
    if (!productId) return
    let active = true

    adminProductService
      .getProductDetail(productId)
      .then((data) => {
        if (active) {
          setProduct(data)
          setActiveMediaIndex(0)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Không tìm thấy thông tin sản phẩm nhạc cụ này')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [productId, refreshKey])

  const handleToggleStatus = async () => {
    if (!product || togglingStatus) return
    const newStatus = !product.isActive
    setTogglingStatus(true)
    try {
      const updated = await adminProductService.updateStatus(product.id, newStatus)
      setProduct((prev) => ({
        ...prev,
        isActive: updated.isActive,
      }))
      addToast({
        message: updated.isActive
          ? `Đã kích hoạt kinh doanh sản phẩm "${product.name}".`
          : `Đã tạm ngừng kinh doanh sản phẩm "${product.name}".`,
        type: updated.isActive ? 'success' : 'info',
      })
    } catch (err) {
      addToast({
        message: err.message || 'Không thể thay đổi trạng thái sản phẩm',
        type: 'error',
      })
    } finally {
      setTogglingStatus(false)
    }
  }

  const handleCopyCode = () => {
    if (!product?.code) return
    navigator.clipboard.writeText(product.code)
    addToast({
      message: `Đã sao chép mã sản phẩm: ${product.code}`,
      type: 'info',
    })
  }

  const handleCopyBarcode = () => {
    if (!product?.barcode) return
    navigator.clipboard.writeText(product.barcode)
    addToast({
      message: `Đã sao chép mã vạch: ${product.barcode}`,
      type: 'info',
    })
  }

  const handleImportSubmit = async (e) => {
    e.preventDefault()
    const qty = parseInt(importQuantity, 10)
    if (isNaN(qty) || qty <= 0) {
      addToast({ message: 'Số lượng nhập phải lớn hơn 0', type: 'error' })
      return
    }

    setSubmittingImport(true)
    try {
      await importStock(product.id, {
        quantity: qty,
        notes: importNotes.trim() || undefined,
      })
      addToast({
        message: `Nhập kho thành công +${qty} sản phẩm.`,
        type: 'success',
      })
      setShowImportModal(false)
      setImportQuantity(1)
      setImportNotes('')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      addToast({
        message: err.message || 'Nhập kho thất bại',
        type: 'error',
      })
    } finally {
      setSubmittingImport(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 bg-[#FFFFFF] rounded-2xl border border-[#E3E6E8] shadow-2xs">
        <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-secondary">
          Đang tải thông tin chi tiết nhạc cụ...
        </span>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E3E6E8] p-8 sm:p-12 text-center shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">
          Không tìm thấy nhạc cụ
        </h2>
        <p className="text-sm text-secondary max-w-md mx-auto mb-6 leading-relaxed">
          {error || 'Sản phẩm không tồn tại hoặc đã bị xóa khỏi hệ thống cơ sở dữ liệu.'}
        </p>
        <button
          type="button"
          onClick={() => navigateTo(CUSTOMER_ROUTES.adminInstruments)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
        >
          <IconArrowLeft size={16} />
          <span>Quay lại danh sách nhạc cụ</span>
        </button>
      </div>
    )
  }

  const mediaItems = product.media || []
  const activeMedia = mediaItems[activeMediaIndex] || mediaItems[0]

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-6 rounded-2xl border border-[#E3E6E8] shadow-2xs">
        <div className="flex flex-col gap-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-secondary font-medium">
            <button
              type="button"
              onClick={() => navigateTo(CUSTOMER_ROUTES.adminInstruments)}
              className="hover:text-brand flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <IconArrowLeft size={16} />
              <span>Danh sách nhạc cụ</span>
            </button>
            <span className="text-subtle">/</span>
            <span className="font-mono text-ink font-semibold">{product.code}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3 mt-0.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              {product.name}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                product.isActive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-zinc-100 text-zinc-700 border-zinc-200'
              }`}
            >
              {product.isActive ? 'Đang kinh doanh' : 'Tạm ngừng'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-sm text-secondary mt-0.5">
            <span>Mã định danh:</span>
            <span className="font-mono text-sm font-bold text-ink bg-[#F6F7F8] px-2.5 py-0.5 rounded-md border border-[#E3E6E8]">
              {product.code}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-brand transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-[#F6F7F8]"
              title="Sao chép mã nhạc cụ"
            >
              <IconCopy size={13} />
              <span>Sao chép mã</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
              product.isActive
                ? 'border-[#E3E6E8] bg-[#FFFFFF] hover:bg-[#F2F4F5] text-ink'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <IconRefresh size={16} className={togglingStatus ? 'animate-spin' : ''} />
            <span>
              {togglingStatus
                ? 'Đang xử lý...'
                : product.isActive
                ? 'Tạm ngừng bán'
                : 'Kích hoạt bán'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <IconPackage size={16} />
            <span>Nhập kho</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <IconPencil size={16} />
            <span>Chỉnh sửa</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Media Gallery & Cultural Story */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Media Viewer Card */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E3E6E8] shadow-2xs flex flex-col">
            <h2 className="text-base sm:text-lg font-semibold text-ink mb-4 pb-2.5 border-b border-[#E3E6E8]">
              Hình ảnh & video ({mediaItems.length})
            </h2>

            {/* Main Stage */}
            <div className="relative aspect-16/10 rounded-xl bg-[#F6F7F8] border border-[#E3E6E8] overflow-hidden flex items-center justify-center">
              {activeMedia ? (
                activeMedia.mediaType === 'VIDEO' ? (
                  <video
                    src={activeMedia.url}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={activeMedia.url}
                    alt={activeMedia.altText || product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                )
              ) : (
                <div className="text-secondary text-sm flex flex-col items-center justify-center py-12 gap-2.5">
                  <div className="w-12 h-12 rounded-xl bg-surface-secondary border border-border/80 flex items-center justify-center text-muted mb-1">
                    <IconImageOff size={26} />
                  </div>
                  <span className="font-medium text-ink">Chưa có hình ảnh cho sản phẩm này</span>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                  >
                    + Thêm hình ảnh đa phương tiện
                  </button>
                </div>
              )}

              {activeMedia?.isPrimary && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-brand text-white text-xs font-semibold shadow-xs">
                  Ảnh đại diện chính
                </span>
              )}
            </div>

            {/* Thumbnail Strip */}
            {mediaItems.length > 1 && (
              <div className="flex items-center gap-2.5 mt-3.5 overflow-x-auto pb-1">
                {mediaItems.map((m, idx) => (
                  <button
                    key={m.id || idx}
                    type="button"
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                      activeMediaIndex === idx
                        ? 'border-brand ring-2 ring-brand/30 scale-105'
                        : 'border-[#E3E6E8] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={m.url}
                      alt={m.altText || 'Thumbnail'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description & Cultural Heritage */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E3E6E8] shadow-2xs flex flex-col">
            <h2 className="text-base sm:text-lg font-semibold text-ink mb-4 pb-2.5 border-b border-[#E3E6E8]">
              Mô tả chi tiết
            </h2>
            <div className="text-sm sm:text-base text-ink leading-relaxed whitespace-pre-line">
              {product.description || (
                <span className="text-secondary italic">Chưa có mô tả chi tiết cho sản phẩm này.</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Key Stats, Specifications, Artisan/Village */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Quick Metrics Card */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E3E6E8] shadow-2xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F6F7F8] border border-[#E3E6E8]">
                <span className="text-sm font-medium text-secondary block mb-1">
                  Đơn giá niêm yết
                </span>
                <span className="text-xl sm:text-2xl font-bold text-brand font-mono">
                  {formatCurrencyVND(product.price)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F6F7F8] border border-[#E3E6E8]">
                <span className="text-sm font-medium text-secondary block mb-1">
                  Tồn kho thực tế
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl sm:text-2xl font-bold text-ink font-mono">
                    {product.stockQuantity || 0}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      (product.stockQuantity || 0) === 0
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : (product.stockQuantity || 0) <= 5
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {(product.stockQuantity || 0) === 0
                      ? 'Hết hàng'
                      : (product.stockQuantity || 0) <= 5
                      ? 'Sắp hết'
                      : 'Còn hàng'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications Card */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E3E6E8] shadow-2xs flex flex-col">
            <h2 className="text-base sm:text-lg font-semibold text-ink mb-4 pb-2.5 border-b border-[#E3E6E8]">
              Thông số kỹ thuật
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <dt className="text-sm font-medium text-secondary mb-1">Mã sản phẩm</dt>
                <dd className="font-mono font-bold text-ink">{product.code}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-secondary mb-1">Mã vạch (Barcode)</dt>
                <dd className="font-mono font-medium text-ink flex items-center gap-2">
                  <span>{product.barcode || '—'}</span>
                  {product.barcode && (
                    <button
                      type="button"
                      onClick={handleCopyBarcode}
                      className="p-1 text-secondary hover:text-brand transition-colors cursor-pointer"
                      title="Sao chép barcode"
                    >
                      <IconCopy size={13} />
                    </button>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-secondary mb-1">Danh mục</dt>
                <dd className="font-semibold text-ink">
                  {product.category?.name || '—'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-secondary mb-1">Âm vực</dt>
                <dd className="text-ink">{product.musicalRange || '—'}</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-secondary mb-1">Kích thước</dt>
                <dd className="text-ink leading-relaxed">{product.dimensions || '—'}</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-secondary mb-1">Chất liệu chế tác</dt>
                <dd className="text-ink leading-relaxed">{product.material || '—'}</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-secondary mb-1">Xuất xứ địa phương</dt>
                <dd className="text-ink leading-relaxed">{product.origin || '—'}</dd>
              </div>
            </dl>
          </div>

          {/* Artisan & Craft Village Card */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E3E6E8] shadow-2xs flex flex-col gap-4">
            <h2 className="text-base sm:text-lg font-semibold text-ink pb-2.5 border-b border-[#E3E6E8]">
              Nghệ nhân & làng nghề chế tác
            </h2>

            {/* Artisan Section */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-surface-secondary border border-border/80 text-secondary flex items-center justify-center shrink-0">
                <IconUserRound size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-secondary block">
                  Nghệ nhân chế tác
                </span>
                {product.artisan ? (
                  <>
                    <h3 className="text-sm font-bold text-ink mt-0.5">
                      {product.artisan.name}
                    </h3>
                    {product.artisan.biography && (
                      <p className="text-sm text-secondary mt-1 leading-relaxed line-clamp-3">
                        {product.artisan.biography}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-secondary italic">Chưa gắn nghệ nhân</span>
                )}
              </div>
            </div>

            <div className="border-t border-[#E3E6E8]" />

            {/* Craft Village Section */}
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-surface-secondary border border-border/80 text-secondary flex items-center justify-center shrink-0">
                <IconLandmark size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-secondary block">
                  Làng nghề truyền thống
                </span>
                {product.craftVillage ? (
                  <>
                    <h3 className="text-sm font-bold text-ink mt-0.5">
                      {product.craftVillage.name}
                    </h3>
                    {product.craftVillage.location && (
                      <p className="text-sm text-secondary mt-1 flex items-center gap-1">
                        <IconMapPin size={14} className="text-subtle shrink-0" />
                        <span>{product.craftVillage.location}</span>
                      </p>
                    )}
                    {product.craftVillage.description && (
                      <p className="text-sm text-secondary mt-1.5 leading-relaxed line-clamp-3">
                        {product.craftVillage.description}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-secondary italic">Chưa gắn làng nghề</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      <ProductFormModal
        isOpen={showEditModal}
        productId={product.id}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      {/* Stock Import Modal */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E3E6E8] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4.5 border-b border-[#E3E6E8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconPackage size={20} className="text-brand" />
                <h3 className="text-base font-bold text-ink">
                  Nhập kho: {product.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:text-ink hover:bg-[#F2F4F5] transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <IconClose size={18} />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 flex flex-col gap-4.5">
              <div>
                <span className="text-xs font-semibold text-secondary block mb-1">Tên sản phẩm</span>
                <span className="text-sm font-bold text-ink block">{product.name}</span>
                <span className="text-xs text-secondary block mt-1">
                  Tồn kho hiện tại: <strong className="text-ink font-mono">{product.stockQuantity || 0}</strong>
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Số lượng nhập thêm <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setImportQuantity((q) => Math.max(1, (parseInt(q, 10) || 1) - 1))}
                    className="w-10 h-10 rounded-xl border border-[#E3E6E8] bg-[#F6F7F8] hover:bg-[#E3E6E8] font-bold text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={importQuantity}
                    onChange={(e) => setImportQuantity(e.target.value)}
                    className="flex-1 text-center py-2 text-sm font-bold text-ink rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-brand/30 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setImportQuantity((q) => (parseInt(q, 10) || 0) + 1)}
                    className="w-10 h-10 rounded-xl border border-[#E3E6E8] bg-[#F6F7F8] hover:bg-[#E3E6E8] font-bold text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Ghi chú nhập kho (tùy chọn)
                </label>
                <input
                  type="text"
                  value={importNotes}
                  onChange={(e) => setImportNotes(e.target.value)}
                  placeholder="VD: Nhập thêm đợt nghệ nhân Đào Xá hoàn thiện..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E3E6E8]">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-secondary hover:text-ink hover:bg-[#F2F4F5] rounded-xl border border-[#E3E6E8] transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingImport}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <IconPackage size={16} />
                  <span>{submittingImport ? 'Đang cập nhật...' : 'Xác nhận nhập kho'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
