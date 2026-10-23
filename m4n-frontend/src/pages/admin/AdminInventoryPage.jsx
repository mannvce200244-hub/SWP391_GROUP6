import { useState, useEffect } from 'react'
import { getInventory, importStock } from '../../services/inventoryService.js'
import useToast from '../../components/ui/useToast.js'
import { Boxes, Search, PackagePlus, X, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'IN_STOCK', label: 'Còn hàng' },
  { id: 'LOW_STOCK', label: 'Sắp hết' },
  { id: 'OUT_OF_STOCK', label: 'Hết hàng' },
]

function getStockBadge(status) {
  switch (status) {
    case 'IN_STOCK':
      return { label: 'Còn hàng', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
    case 'LOW_STOCK':
      return { label: 'Sắp hết', className: 'text-amber-800 bg-[#F6F7F8] border-amber-200' }
    case 'OUT_OF_STOCK':
      return { label: 'Hết hàng', className: 'text-rose-700 bg-rose-50 border-rose-200' }
    default:
      return { label: status || '—', className: 'text-zinc-600 bg-zinc-50 border-zinc-200' }
  }
}

export default function AdminInventoryPage() {
  const { addToast } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  // Import stock modal
  const [importTarget, setImportTarget] = useState(null)
  const [importQuantity, setImportQuantity] = useState('')
  const [importNotes, setImportNotes] = useState('')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    let active = true
    getInventory({
      page,
      size: 15,
      keyword,
      status: statusFilter === 'ALL' ? '' : statusFilter,
    })
      .then((res) => {
        if (active) {
          if (res && res.content) {
            setItems(res.content)
            setTotalPages(res.totalPages || 1)
          } else if (Array.isArray(res)) {
            setItems(res)
            setTotalPages(1)
          } else {
            setItems([])
          }
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Không thể tải dữ liệu tồn kho')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [page, keyword, statusFilter, refreshKey])

  const reloadInventory = () => {
    setLoading(true)
    setError(null)
    setRefreshKey((k) => k + 1)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    setKeyword(searchInput.trim())
  }

  const handleImportStock = async () => {
    if (!importTarget) return
    const qty = Number(importQuantity)
    if (!Number.isInteger(qty) || qty <= 0) {
      addToast({ message: 'Số lượng nhập phải là số nguyên lớn hơn 0.', type: 'error' })
      return
    }
    setImporting(true)
    try {
      await importStock(importTarget.productId, { quantity: qty, notes: importNotes.trim() })
      addToast({ message: `Đã nhập ${qty} sản phẩm "${importTarget.productName}" vào kho.`, type: 'success' })
      setImportTarget(null)
      setImportQuantity('')
      setImportNotes('')
      reloadInventory()
    } catch (err) {
      addToast({ message: err.message || 'Nhập kho thất bại.', type: 'error' })
    } finally {
      setImporting(false)
    }
  }

  if (error && !loading && items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-rose-600 mb-3">{error}</p>
        <button
          type="button"
          onClick={reloadInventory}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[#F6F7F8] hover:bg-[#E3E6E8] text-[#17191B] border border-[#E3E6E8] transition-colors cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#17191B]">Kho hàng</h2>
        <p className="text-sm text-secondary mt-0.5">
          Theo dõi tồn kho và nhập thêm sản phẩm trực tiếp tại đây
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm sản phẩm theo tên hoặc mã…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40 transition-colors"
          />
        </form>

        <div className="flex gap-1.5 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setStatusFilter(tab.id); setPage(0) }}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#17191B] text-white border-[#17191B]'
                  : 'bg-white text-secondary border-[#E3E6E8] hover:bg-[#F6F7F8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-secondary">Đang tải tồn kho…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E3E6E8]">
          <Boxes size={40} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-sm text-secondary">Không có sản phẩm nào trong kho.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E3E6E8] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E3E6E8] bg-[#F6F7F8]">
                  <th className="text-left px-4 py-3 font-semibold text-[#17191B]">Sản phẩm</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#17191B]">Mã SP</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#17191B]">Tồn kho</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#17191B]">Trạng thái</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#17191B]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const badge = getStockBadge(item.status)
                  return (
                    <tr key={item.productId} className="border-b border-[#F2F4F5] hover:bg-[#F6F7F8]/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#17191B]">{item.productName}</td>
                      <td className="px-4 py-3 text-secondary font-mono text-xs">{item.productCode}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{item.quantity}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setImportTarget(item)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#F6F7F8] hover:bg-[#E3E6E8] text-[#17191B] border border-[#E3E6E8] transition-colors cursor-pointer"
                        >
                          <PackagePlus size={13} />
                          Nhập kho
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {items.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E3E6E8] bg-white">
              <span className="text-xs text-secondary">
                Hiển thị <strong>{items.length}</strong> mặt hàng kho · Trang <strong className="text-[#17191B]">{page + 1}</strong> / {totalPages || 1}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E3E6E8] text-xs font-medium hover:bg-[#F6F7F8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft size={14} /> Trước
                </button>
                <span className="px-2 text-xs font-semibold text-[#17191B]">
                  Trang {page + 1} / {totalPages || 1}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E3E6E8] text-xs font-medium hover:bg-[#F6F7F8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Sau <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock Import Modal */}
      {importTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stock-import-title"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setImportTarget(null)} aria-hidden="true" />
          <div className="relative bg-white rounded-2xl border border-[#E3E6E8] shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="stock-import-title" className="text-lg font-bold text-[#17191B]">Nhập kho</h3>
              <button
                type="button"
                aria-label="Đóng hộp thoại nhập kho"
                onClick={() => setImportTarget(null)}
                className="p-1 rounded-lg hover:bg-[#F6F7F8] cursor-pointer"
              >
                <X size={18} className="text-zinc-400" aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm text-secondary">
              Sản phẩm: <strong>{importTarget.productName}</strong> ({importTarget.productCode})
            </p>
            <p className="text-sm text-secondary">
              Tồn kho hiện tại: <strong>{importTarget.quantity}</strong>
            </p>
            <div>
              <label htmlFor="stock-import-quantity" className="block text-sm font-medium text-[#17191B] mb-1">Số lượng nhập thêm</label>
              <input
                id="stock-import-quantity"
                name="stockImportQuantity"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={importQuantity}
                onChange={(e) => setImportQuantity(e.target.value)}
                placeholder="VD: 10"
                className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40"
              />
            </div>
            <div>
              <label htmlFor="stock-import-notes" className="block text-sm font-medium text-[#17191B] mb-1">Ghi chú (tùy chọn)</label>
              <input
                id="stock-import-notes"
                name="stockImportNotes"
                type="text"
                autoComplete="off"
                value={importNotes}
                onChange={(e) => setImportNotes(e.target.value)}
                placeholder="VD: Nhập lô mới từ xưởng…"
                className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setImportTarget(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-[#E3E6E8] text-[#17191B] hover:bg-[#F6F7F8] transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleImportStock}
                disabled={importing}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#A62F25] text-white hover:bg-[#84231D] disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {importing ? 'Đang nhập…' : 'Xác nhận nhập kho'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
