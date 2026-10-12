import { useState, useEffect } from 'react'
import useToast from '../../components/ui/useToast.js'
import { getInventory, importStock } from '../../services/inventoryService.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import {
  IconPlus,
  IconSearch,
  IconPackage,
  IconAlertCircle,
  IconClose,
  IconCheck,
} from '../../components/ui/Icons.jsx'

const STATUS_TABS = [
  { id: 'ALL', label: 'Tất cả trạng thái' },
  { id: 'IN_STOCK', label: 'Còn hàng (>5)' },
  { id: 'LOW_STOCK', label: 'Sắp hết (1-5)' },
  { id: 'OUT_OF_STOCK', label: 'Hết hàng (0)' },
]

function formatDateVN(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return dateStr
  }
}

function AdminInstrumentsPage() {
  const { addToast } = useToast()

  // Data & Query states
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  // Stock Import Modal state
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [importQuantity, setImportQuantity] = useState(1)
  const [importNotes, setImportNotes] = useState('')
  const [submittingImport, setSubmittingImport] = useState(false)

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchInput)
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch Inventory
  useEffect(() => {
    let active = true

    getInventory({
      page,
      size: pageSize,
      keyword,
      status: selectedStatus,
    })
      .then((res) => {
        if (!active) return
        const data = res?.data || res
        setItems(data.content || [])
        setTotalElements(data.totalElements || 0)
        setTotalPages(data.totalPages || 1)
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(err?.response?.data?.message || 'Không thể tải danh sách tồn kho nhạc cụ.')
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [page, pageSize, keyword, selectedStatus, refreshKey])

  const triggerRefresh = () => {
    setLoading(true)
    setRefreshKey((k) => k + 1)
  }

  // Open Stock Import Modal
  const handleOpenImport = (product) => {
    setSelectedProduct(product)
    setImportQuantity(1)
    setImportNotes('')
    setImportModalOpen(true)
  }

  // Submit Stock Import
  const handleSubmitImport = async (e) => {
    e.preventDefault()
    if (!selectedProduct) return
    const qty = parseInt(importQuantity, 10)
    if (isNaN(qty) || qty <= 0) {
      addToast({
        message: 'Số lượng nhập kho phải là số nguyên dương lớn hơn 0.',
        type: 'error',
      })
      return
    }

    setSubmittingImport(true)
    try {
      const res = await importStock(selectedProduct.productId, {
        quantity: qty,
        notes: importNotes,
      })
      const result = res?.data || res
      addToast({
        message: result.message || `Đã nhập thêm ${qty} sản phẩm vào kho thành công.`,
        type: 'success',
      })
      setImportModalOpen(false)
      setSelectedProduct(null)
      triggerRefresh()
    } catch (err) {
      addToast({
        message: err?.response?.data?.message || 'Không thể thực hiện nhập kho. Vui lòng thử lại.',
        type: 'error',
      })
    } finally {
      setSubmittingImport(false)
    }
  }

  // Summary counts for current loaded dataset
  const inStockCount = items.filter((i) => i.status === 'IN_STOCK').length
  const lowStockCount = items.filter((i) => i.status === 'LOW_STOCK').length
  const outOfStockCount = items.filter((i) => i.status === 'OUT_OF_STOCK').length

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-muted uppercase">QUẢN TRỊ KHO VẬN</span>
          <h1 className="text-2xl font-bold tracking-tight text-ink mt-0.5">Nhạc cụ & Tồn kho Showroom</h1>
          <p className="text-xs text-muted mt-1">
            Theo dõi số lượng sellable thực tế tại kho, tra cứu mã vạch và thực hiện nghiệp vụ Nhập kho tức thì.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={triggerRefresh}
            className="px-3.5 py-2 rounded-xl border border-border bg-canvas hover:bg-surface-secondary text-xs font-semibold text-ink transition-colors cursor-pointer"
          >
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted">Tổng nhạc cụ quản lý</span>
            <p className="text-xl font-bold text-ink mt-0.5">{totalElements}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-ink">
            <IconPackage size={20} />
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted">Sẵn sàng bán (&gt;5)</span>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{inStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IconCheck size={20} />
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted">Cảnh báo sắp hết (1–5)</span>
            <p className="text-xl font-bold text-amber-700 mt-0.5">{lowStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <IconAlertCircle size={20} />
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted">Đang hết hàng (0)</span>
            <p className="text-xl font-bold text-rose-700 mt-0.5">{outOfStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <IconClose size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Tìm theo tên nhạc cụ, mã sản phẩm, barcode..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-border bg-canvas focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all text-ink placeholder:text-muted"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
            >
              <IconClose size={14} />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.id)
                setPage(0)
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-canvas border border-border text-muted hover:text-ink hover:bg-surface-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            <span className="text-xs text-muted">Đang tải dữ liệu tồn kho từ cơ sở dữ liệu...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-rose-600">
            <IconAlertCircle size={24} />
            <p className="text-xs font-semibold">{error}</p>
            <button
              type="button"
              onClick={triggerRefresh}
              className="mt-2 px-3 py-1 rounded-lg border border-rose-300 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <IconPackage size={32} className="text-muted/60" />
            <p className="text-sm font-bold text-ink">Không tìm thấy nhạc cụ phù hợp</p>
            <p className="text-xs text-muted">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái tồn kho.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-canvas/60 text-muted font-bold tracking-wider uppercase text-[10px]">
                  <th className="py-3 px-4">Nhạc cụ</th>
                  <th className="py-3 px-4">Mã SKU / Barcode</th>
                  <th className="py-3 px-4">Phân loại</th>
                  <th className="py-3 px-4 text-right">Giá niêm yết</th>
                  <th className="py-3 px-4 text-center">Tồn khả dụng</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4">Cập nhật</th>
                  <th className="py-3 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((item) => {
                  const statusBadge =
                    item.status === 'IN_STOCK' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{item.statusLabel || 'Còn hàng'}</span>
                      </span>
                    ) : item.status === 'LOW_STOCK' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{item.statusLabel || 'Sắp hết'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>{item.statusLabel || 'Hết hàng'}</span>
                      </span>
                    )

                  return (
                    <tr key={item.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {item.primaryImage ? (
                            <img
                              src={item.primaryImage}
                              alt={item.productName}
                              className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-surface-secondary border border-border flex items-center justify-center text-muted shrink-0">
                              <IconPackage size={18} />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-bold text-ink hover:text-brand transition-colors line-clamp-1">
                              {item.productName}
                            </span>
                            <span className="text-[10px] text-muted font-mono">{item.productCode}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-ink">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold">{item.productCode}</span>
                          {item.barcode ? (
                            <span className="inline-block text-[10px] text-muted bg-canvas px-1.5 py-0.5 rounded border border-border/80 w-fit">
                              {item.barcode}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted/60">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted font-medium">
                        {item.categoryName || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-ink font-mono">
                        {formatCurrencyVND(item.price)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-sm font-bold text-ink font-mono">
                          {item.quantity}
                        </span>
                        <span className="text-[10px] text-muted ml-1">cây</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {statusBadge}
                      </td>
                      <td className="py-3.5 px-4 text-muted text-[11px] whitespace-nowrap">
                        {formatDateVN(item.updatedAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenImport(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <IconPlus size={13} />
                          <span>Nhập kho</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted">
            <span>
              Trang {page + 1} / {totalPages} (Tổng {totalElements} nhạc cụ)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1 rounded-lg border border-border bg-canvas hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-semibold text-ink transition-colors"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                className="px-3 py-1 rounded-lg border border-border bg-canvas hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-semibold text-ink transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stock Import Modal */}
      {importModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-secondary/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <IconPlus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">Nhập kho nhạc cụ</h3>
                  <span className="text-[10px] text-muted">Bổ sung số lượng bán tại showroom</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !submittingImport && setImportModalOpen(false)}
                className="text-muted hover:text-ink transition-colors cursor-pointer"
              >
                <IconClose size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitImport} className="p-6 flex flex-col gap-5 text-xs">
              {/* Product Preview Card */}
              <div className="p-3.5 rounded-xl bg-canvas border border-border flex items-center gap-3">
                {selectedProduct.primaryImage ? (
                  <img
                    src={selectedProduct.primaryImage}
                    alt={selectedProduct.productName}
                    className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-surface-secondary border border-border flex items-center justify-center text-muted shrink-0">
                    <IconPackage size={20} />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-ink text-sm truncate">{selectedProduct.productName}</span>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted font-mono">
                    <span>Mã: {selectedProduct.productCode}</span>
                    {selectedProduct.barcode && <span>· Barcode: {selectedProduct.barcode}</span>}
                  </div>
                  <span className="text-brand font-bold mt-1 font-mono">{formatCurrencyVND(selectedProduct.price)}</span>
                </div>
              </div>

              {/* Current vs Projected Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-surface-secondary/40 border border-border/80 flex flex-col">
                  <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Tồn kho hiện tại</span>
                  <span className="text-lg font-bold text-ink mt-0.5 font-mono">
                    {selectedProduct.quantity} <span className="text-xs font-normal text-muted">cây</span>
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col">
                  <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">Dự kiến sau nhập</span>
                  <span className="text-lg font-bold text-emerald-700 mt-0.5 font-mono">
                    {selectedProduct.quantity + (parseInt(importQuantity, 10) || 0)}{' '}
                    <span className="text-xs font-normal text-emerald-700/80">cây</span>
                  </span>
                </div>
              </div>

              {/* Import Quantity Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="import-qty" className="font-bold text-ink text-xs">
                  Số lượng nhập thêm <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportQuantity((prev) => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                    className="w-9 h-9 rounded-lg border border-border bg-canvas hover:bg-surface-secondary text-ink font-bold flex items-center justify-center cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <input
                    id="import-qty"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={importQuantity}
                    onChange={(e) => setImportQuantity(e.target.value)}
                    className="flex-1 text-center py-2 text-sm font-bold text-ink rounded-lg border border-border bg-canvas focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setImportQuantity((prev) => (parseInt(prev, 10) || 0) + 1)}
                    className="w-9 h-9 rounded-lg border border-border bg-canvas hover:bg-surface-secondary text-ink font-bold flex items-center justify-center cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] text-muted">
                  Backend sẽ cộng dồn số lượng này vào tồn kho hiện tại một cách an toàn và giao dịch.
                </span>
              </div>

              {/* Import Notes */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="import-notes" className="font-bold text-ink text-xs">
                  Ghi chú nhập kho (tùy chọn)
                </label>
                <input
                  id="import-notes"
                  type="text"
                  placeholder="Ví dụ: Nhập bổ sung đợt lễ hội Đào Xá..."
                  value={importNotes}
                  onChange={(e) => setImportNotes(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-canvas focus:outline-none focus:ring-1 focus:ring-brand text-ink placeholder:text-muted text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={submittingImport}
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-canvas hover:bg-surface-secondary text-xs font-semibold text-ink transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingImport || !importQuantity || parseInt(importQuantity, 10) <= 0}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingImport ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <IconCheck size={14} />
                      <span>Xác nhận nhập kho</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInstrumentsPage
