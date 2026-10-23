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
  Phone,
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
        {invoices.length > 0 && (
          <div className="px-5 py-3.5 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-500">
            <div>
              Hiển thị <strong className="text-zinc-800">{invoices.length}</strong> / <strong className="text-zinc-800">{totalElements}</strong> hóa đơn · Trang <span className="font-medium text-zinc-700">{page + 1}</span> / {totalPages || 1}
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold text-zinc-700">
                {page + 1} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-3 backdrop-blur-sm animate-fade-in sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-detail-title"
        >
          <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#E3E6E8] bg-[#F6F7F8] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E3E6E8] bg-white px-4 py-3.5 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Receipt className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 id="invoice-detail-title" className="truncate font-semibold text-ink">
                    Chi tiết hóa đơn {selectedInvoice.invoiceCode}
                  </h3>
                  <p className="text-xs text-secondary">Bản xem trước hóa đơn bán hàng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="cursor-pointer rounded-lg p-2 text-secondary transition-colors hover:bg-[#F6F7F8] hover:text-ink"
                aria-label="Đóng chi tiết hóa đơn"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain p-3 sm:p-6">
              <article className="mx-auto w-full max-w-xl border border-[#CDD2D5] bg-white px-5 py-7 text-ink shadow-lg sm:px-8 sm:py-9">
                <header className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    M4N · Nhạc cụ truyền thống
                  </p>
                  <h4 className="mt-2 text-xl font-bold tracking-wide sm:text-2xl">HÓA ĐƠN BÁN HÀNG</h4>
                  <p className="mt-2 font-mono text-sm font-semibold">{selectedInvoice.invoiceCode}</p>
                  <p className="mt-1 text-xs text-secondary">Mã giao dịch POS #{selectedInvoice.invoiceId}</p>
                </header>

                <div className="my-6 border-t border-dashed border-[#AEB5B9]" />

                <dl className="space-y-2.5 text-sm">
                  <div className="flex items-start justify-between gap-5">
                    <dt className="shrink-0 text-secondary">Thời gian</dt>
                    <dd className="text-right font-medium">{formatDate(selectedInvoice.createdAt)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-5">
                    <dt className="shrink-0 text-secondary">Thu ngân</dt>
                    <dd className="text-right font-medium">{selectedInvoice.staffName || '—'}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-5">
                    <dt className="shrink-0 text-secondary">Thanh toán</dt>
                    <dd className="text-right font-medium">
                      {getPaymentBadge(selectedInvoice.paymentMethod).label}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-5">
                    <dt className="shrink-0 text-secondary">Khách hàng</dt>
                    <dd className="text-right font-medium">
                      {selectedInvoice.customerName || 'Khách vãng lai'}
                      {selectedInvoice.customerPhone && (
                        <span className="mt-0.5 block font-normal text-secondary">{selectedInvoice.customerPhone}</span>
                      )}
                    </dd>
                  </div>
                  {selectedInvoice.voucherCode && (
                    <div className="flex items-start justify-between gap-5">
                      <dt className="shrink-0 text-secondary">Voucher</dt>
                      <dd className="font-mono text-right font-semibold">{selectedInvoice.voucherCode}</dd>
                    </div>
                  )}
                </dl>

                <div className="my-6 border-t border-dashed border-[#AEB5B9]" />

                <section aria-labelledby="invoice-items-title">
                  <h5 id="invoice-items-title" className="mb-3 text-xs font-bold uppercase tracking-[0.14em]">
                    Danh sách sản phẩm
                  </h5>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[440px] table-fixed text-left text-xs">
                      <thead className="border-y border-ink">
                        <tr>
                          <th scope="col" className="w-[42%] py-2 pr-2 font-semibold">Sản phẩm</th>
                          <th scope="col" className="w-[10%] px-1 py-2 text-center font-semibold">SL</th>
                          <th scope="col" className="w-[22%] px-1 py-2 text-right font-semibold">Đơn giá</th>
                          <th scope="col" className="w-[26%] py-2 pl-2 text-right font-semibold">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dashed divide-[#CDD2D5]">
                        {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                          selectedInvoice.items.map((item, idx) => (
                            <tr key={item.id || idx}>
                              <td className="py-3 pr-2 align-top">
                                <div className="font-semibold">{item.productName}</div>
                                {item.productCode && (
                                  <div className="mt-0.5 font-mono text-[11px] text-secondary">{item.productCode}</div>
                                )}
                              </td>
                              <td className="px-1 py-3 text-center align-top font-medium tabular-nums">{item.quantity}</td>
                              <td className="px-1 py-3 text-right align-top text-secondary tabular-nums">
                                {item.formattedUnitPrice || formatCurrencyVND(item.unitPrice)}
                              </td>
                              <td className="py-3 pl-2 text-right align-top font-semibold tabular-nums">
                                {item.formattedLineAmount || formatCurrencyVND(item.lineAmount)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-secondary">
                              Không có thông tin chi tiết các món
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="my-6 border-t border-dashed border-[#AEB5B9]" />

                <section className="ml-auto max-w-sm space-y-2.5 text-sm" aria-label="Tổng kết thanh toán">
                  <div className="flex items-baseline justify-between gap-5 text-secondary">
                    <span>Tạm tính</span>
                    <span className="tabular-nums">
                      {selectedInvoice.formattedSubtotal || formatCurrencyVND(selectedInvoice.subtotal)}
                    </span>
                  </div>
                  {Number(selectedInvoice.discount) > 0 && (
                    <div className="flex items-baseline justify-between gap-5">
                      <span>Giảm giá</span>
                      <span className="font-medium tabular-nums">
                        -{selectedInvoice.formattedDiscount || formatCurrencyVND(selectedInvoice.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between gap-5 border-y-2 border-ink py-3 text-base font-bold">
                    <span>Tổng thanh toán</span>
                    <span className="text-right tabular-nums">
                      {selectedInvoice.formattedFinalAmount || formatCurrencyVND(selectedInvoice.finalAmount)}
                    </span>
                  </div>
                  {selectedInvoice.amountReceived != null && (
                    <div className="flex items-baseline justify-between gap-5 text-secondary">
                      <span>Tiền khách đưa</span>
                      <span className="tabular-nums">
                        {selectedInvoice.formattedAmountReceived || formatCurrencyVND(selectedInvoice.amountReceived)}
                      </span>
                    </div>
                  )}
                  {selectedInvoice.amountChange != null && (
                    <div className="flex items-baseline justify-between gap-5 text-secondary">
                      <span>Tiền thối lại</span>
                      <span className="tabular-nums">
                        {selectedInvoice.formattedAmountChange || formatCurrencyVND(selectedInvoice.amountChange)}
                      </span>
                    </div>
                  )}
                </section>

                {selectedInvoice.notes && (
                  <div className="mt-6 border-t border-dashed border-[#AEB5B9] pt-4 text-xs text-secondary">
                    <span className="font-semibold text-ink">Ghi chú: </span>
                    {selectedInvoice.notes}
                  </div>
                )}

                <footer className="mt-8 border-t border-dashed border-[#AEB5B9] pt-6 text-center">
                  <p className="font-semibold">Cảm ơn quý khách!</p>
                  <p className="mt-1 text-xs text-secondary">Hẹn gặp lại quý khách tại M4N.</p>
                </footer>
              </article>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#E3E6E8] bg-white px-4 py-3.5 sm:px-6">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="cursor-pointer rounded-lg border border-[#CDD2D5] bg-white px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-[#F6F7F8] hover:text-ink"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedInvoice.invoiceId)}
                disabled={downloadingId === selectedInvoice.invoiceId}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {downloadingId === selectedInvoice.invoiceId ? 'Đang tải PDF…' : 'Tải hóa đơn PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
