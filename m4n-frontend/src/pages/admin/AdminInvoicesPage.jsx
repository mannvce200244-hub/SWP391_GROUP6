import { useState, useEffect } from 'react'
import { listInvoices, downloadInvoicePdf } from '../../services/posService.js'
import useToast from '../../components/ui/useToast.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import {
  Receipt,
  Search,
  Download,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  CreditCard,
  Calendar,
  Phone,
  FileText,
} from 'lucide-react'

function formatDate(isoString) {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

function getPaymentBadge(method) {
  switch (method) {
    case 'CASH':
      return { label: 'Tiền mặt', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
    case 'BANK_TRANSFER':
    case 'TRANSFER':
      return { label: 'Chuyển khoản', className: 'text-blue-700 bg-blue-50 border-blue-200' }
    case 'CARD':
      return { label: 'Thẻ POS', className: 'text-purple-700 bg-purple-50 border-purple-200' }
    case 'VNPAY':
      return { label: 'VNPay', className: 'text-sky-700 bg-sky-50 border-sky-200' }
    default:
      return { label: method || 'Khác', className: 'text-zinc-700 bg-zinc-50 border-zinc-200' }
  }
}

export default function AdminInvoicesPage() {
  const { addToast } = useToast()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const [refreshKey, setRefreshKey] = useState(0)

  // Detail Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    let active = true
    listInvoices({ page, size: 15, search })
      .then((res) => {
        if (active) {
          if (res && res.content) {
            setInvoices(res.content)
            setTotalPages(res.totalPages || 1)
            setTotalElements(res.totalElements || 0)
          } else if (Array.isArray(res)) {
            setInvoices(res)
            setTotalPages(1)
            setTotalElements(res.length)
          } else {
            setInvoices([])
            setTotalPages(1)
            setTotalElements(0)
          }
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Không thể tải danh sách hóa đơn POS')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [page, search, refreshKey])

  const reloadInvoices = () => {
    setLoading(true)
    setError(null)
    setRefreshKey((k) => k + 1)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    setSearch(searchInput.trim())
  }

  const handleDownloadPdf = async (invoiceId) => {
    setDownloadingId(invoiceId)
    try {
      await downloadInvoicePdf(invoiceId)
      addToast({ message: 'Đã tải hóa đơn PDF thành công.', type: 'success' })
    } catch (err) {
      addToast({ message: err.message || 'Tải PDF hóa đơn thất bại.', type: 'error' })
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-red-600" />
            Hóa đơn bán tại quầy (POS)
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Tra cứu, xem chi tiết và in ấn xuất PDF các hóa đơn bán hàng tại Showroom.
          </p>
        </div>
        <div className="text-sm text-zinc-500">
          Tổng số: <span className="font-semibold text-zinc-800">{totalElements}</span> hóa đơn
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm theo mã hóa đơn, tên khách hàng, tên thu ngân..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
            >
              Tìm kiếm
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  setSearch('')
                  setPage(0)
                }}
                className="px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Đặt lại
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={reloadInvoices}
            className="font-medium underline hover:text-rose-900 ml-3"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Mã hóa đơn</th>
                <th className="px-5 py-3.5">Thời gian</th>
                <th className="px-5 py-3.5">Khách hàng</th>
                <th className="px-5 py-3.5">Thu ngân</th>
                <th className="px-5 py-3.5">Thanh toán</th>
                <th className="px-5 py-3.5 text-right">Tổng thanh toán</th>
                <th className="px-5 py-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-zinc-400">
                    <div className="inline-block w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm">Đang tải danh sách hóa đơn...</p>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-zinc-400">
                    <Receipt className="w-12 h-12 mx-auto mb-2 text-zinc-300 stroke-[1.5]" />
                    <p className="text-base font-medium text-zinc-700">Chưa có hóa đơn nào</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      {search ? 'Không tìm thấy hóa đơn phù hợp với từ khóa.' : 'Các hóa đơn phát sinh tại POS sẽ hiển thị ở đây.'}
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const badge = getPaymentBadge(inv.paymentMethod)
                  return (
                    <tr key={inv.invoiceId} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-4 font-semibold text-zinc-900 font-mono">
                        {inv.invoiceCode}
                      </td>
                      <td className="px-5 py-4 text-zinc-600 text-xs whitespace-nowrap">
                        {formatDate(inv.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-zinc-800">
                        <div className="font-medium">{inv.customerName || 'Khách vãng lai'}</div>
                        {inv.customerPhone && (
                          <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {inv.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-zinc-600 text-sm">
                        {inv.staffName || '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-zinc-900 whitespace-nowrap">
                        {inv.formattedFinalAmount || formatCurrencyVND(inv.finalAmount)}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(inv.invoiceId)}
                            disabled={downloadingId === inv.invoiceId}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Tải PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-500">
            <div>
              Trang <span className="font-medium text-zinc-700">{page + 1}</span> / {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="font-bold text-zinc-900">Chi tiết hóa đơn {selectedInvoice.invoiceCode}</h3>
                  <p className="text-xs text-zinc-500">Mã giao dịch POS #{selectedInvoice.invoiceId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/60 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
                <div>
                  <span className="text-zinc-400 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Thời gian
                  </span>
                  <span className="font-medium text-zinc-800">{formatDate(selectedInvoice.createdAt)}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Thu ngân
                  </span>
                  <span className="font-medium text-zinc-800">{selectedInvoice.staffName || '—'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Thanh toán
                  </span>
                  <span className="font-medium text-zinc-800">
                    {getPaymentBadge(selectedInvoice.paymentMethod).label}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-zinc-400">Khách hàng: </span>
                    <span className="font-semibold text-zinc-800">{selectedInvoice.customerName || 'Khách vãng lai'}</span>
                    {selectedInvoice.customerPhone && (
                      <span className="text-zinc-500 ml-2">({selectedInvoice.customerPhone})</span>
                    )}
                  </div>
                  {selectedInvoice.voucherCode && (
                    <div className="text-xs">
                      <span className="text-zinc-400">Voucher áp dụng: </span>
                      <span className="font-mono font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {selectedInvoice.voucherCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-zinc-400" /> Danh sách sản phẩm
                </h4>
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                      <tr>
                        <th className="px-4 py-2.5">Sản phẩm</th>
                        <th className="px-4 py-2.5 text-center">Số lượng</th>
                        <th className="px-4 py-2.5 text-right">Đơn giá</th>
                        <th className="px-4 py-2.5 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                        selectedInvoice.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-zinc-50/50">
                            <td className="px-4 py-2.5">
                              <div className="font-medium text-zinc-900">{item.productName}</div>
                              {item.productCode && (
                                <div className="text-[11px] text-zinc-400 font-mono">{item.productCode}</div>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-center font-medium text-zinc-800">{item.quantity}</td>
                            <td className="px-4 py-2.5 text-right text-zinc-600">
                              {item.formattedUnitPrice || formatCurrencyVND(item.unitPrice)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-zinc-900">
                              {item.formattedLineAmount || formatCurrencyVND(item.lineAmount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                            Không có thông tin chi tiết các món
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>Tạm tính:</span>
                  <span>{selectedInvoice.formattedSubtotal || formatCurrencyVND(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discount && selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Giảm giá:</span>
                    <span>-{selectedInvoice.formattedDiscount || formatCurrencyVND(selectedInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-zinc-900 pt-2 border-t border-zinc-200">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-red-600">
                    {selectedInvoice.formattedFinalAmount || formatCurrencyVND(selectedInvoice.finalAmount)}
                  </span>
                </div>
                {selectedInvoice.amountReceived != null && (
                  <div className="flex justify-between text-xs text-zinc-500 pt-1">
                    <span>Tiền khách đưa:</span>
                    <span>{selectedInvoice.formattedAmountReceived || formatCurrencyVND(selectedInvoice.amountReceived)}</span>
                  </div>
                )}
                {selectedInvoice.amountChange != null && (
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Tiền thối lại:</span>
                    <span>{selectedInvoice.formattedAmountChange || formatCurrencyVND(selectedInvoice.amountChange)}</span>
                  </div>
                )}
              </div>

              {/* Notes if any */}
              {selectedInvoice.notes && (
                <div className="text-xs text-zinc-500 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                  <span className="font-semibold text-zinc-700">Ghi chú: </span>
                  {selectedInvoice.notes}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedInvoice.invoiceId)}
                disabled={downloadingId === selectedInvoice.invoiceId}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloadingId === selectedInvoice.invoiceId ? 'Đang tải PDF...' : 'Tải hóa đơn PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
