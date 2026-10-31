import useDialogFocus from '../hooks/useDialogFocus.js'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, Printer, Search, X } from 'lucide-react'
import posService from '../services/posService.js'
import { posPaymentMethodLabel } from '../services/posMomoService.js'
import useToast from '../components/ui/useToast.js'
import PosMomoPendingPayments from '../features/pos/PosMomoPendingPayments.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'

const DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
})

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : DATE_FORMATTER.format(date)
}

export default function PosTransactionHistoryPage() {
  const { addToast } = useToast()
  const [invoices, setInvoices] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const dialogRef = useDialogFocus(Boolean(selectedInvoice), () => setSelectedInvoice(null))
  const detailPending = useRef(false)
  const pdfPending = useRef(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let active = true

    async function loadInvoices() {
      setLoading(true)
      setError('')
      try {
        const result = await posService.listInvoices({ page, size: 10, search: debouncedSearch })
        if (!active) return
        setInvoices(result?.content || [])
        setTotalPages(result?.totalPages || 1)
        setTotalElements(result?.totalElements || 0)
      } catch (requestError) {
        if (!active) return
        setError(requestError.message || 'Không thể tải lịch sử giao dịch.')
        setInvoices([])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadInvoices()

    return () => {
      active = false
    }
  }, [page, debouncedSearch, reloadKey])

  const handleViewInvoice = async (invoiceId) => {
    if (detailPending.current) return
    detailPending.current = true
    setDetailLoading(true)
    try {
      setSelectedInvoice(await posService.getInvoice(invoiceId))
    } catch (requestError) {
      addToast({
        message: requestError.message || 'Không thể tải chi tiết hóa đơn.',
        type: 'error',
      })
    } finally {
      detailPending.current = false
      setDetailLoading(false)
    }
  }

  const handlePrintInvoice = async (invoiceId) => {
    if (pdfPending.current) return
    pdfPending.current = true
    setPdfLoading(true)
    try {
      await posService.downloadInvoicePdf(invoiceId)
      addToast({ message: 'Đã tải hóa đơn PDF.', type: 'success' })
    } catch (requestError) {
      addToast({
        message: requestError.message || 'Không thể tải hóa đơn PDF.',
        type: 'error',
      })
    } finally {
      pdfPending.current = false
      setPdfLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5" aria-labelledby="pos-history-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">POS · Giao dịch của tôi</p>
          <h1 id="pos-history-title" className="mt-1 text-2xl font-bold text-ink">Lịch sử giao dịch</h1>
          <p className="mt-1 text-sm text-muted">Chỉ hiển thị các hóa đơn do tài khoản thu ngân hiện tại tạo.</p>
        </div>
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Tìm hóa đơn</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Mã hóa đơn hoặc tên khách hàng"
            className="h-11 w-full rounded-lg border border-border bg-white pl-10 pr-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-xs">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted" role="status">Đang tải lịch sử giao dịch…</div>
        ) : error ? (
          <div className="p-10 text-center" role="alert">
            <p className="font-semibold text-danger">Không thể tải dữ liệu</p>
            <p className="mt-1 text-sm text-muted">{error}</p>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 underline text-brand">Thử lại</button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-ink">Chưa có giao dịch phù hợp</p>
            <p className="mt-1 text-sm text-muted">Hóa đơn hoàn tất tại quầy sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-surface-secondary text-xs uppercase tracking-wide text-secondary">
                <tr>
                  <th className="px-4 py-3">Mã hóa đơn</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Thanh toán</th>
                  <th className="px-4 py-3 text-right">Tổng tiền</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((invoice) => (
                  <tr key={invoice.invoiceId} className="hover:bg-surface-secondary/60">
                    <td className="px-4 py-3 font-semibold text-ink">{invoice.invoiceCode}</td>
                    <td className="px-4 py-3 text-secondary">{formatDate(invoice.createdAt)}</td>
                    <td className="px-4 py-3 text-ink">{invoice.customerName || 'Khách lẻ tại quầy'}</td>
                    <td className="px-4 py-3 text-secondary">{posPaymentMethodLabel(invoice.paymentMethod)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">{invoice.formattedFinalAmount}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewInvoice(invoice.invoiceId)}
                          disabled={detailLoading}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-secondary hover:bg-surface-secondary hover:text-ink disabled:opacity-50"
                          aria-label={`Xem hóa đơn ${invoice.invoiceCode}`}
                        >
                          <Eye size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={pdfLoading} onClick={() => handlePrintInvoice(invoice.invoiceId)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-secondary hover:bg-surface-secondary hover:text-brand"
                          aria-label={`Tải PDF hóa đơn ${invoice.invoiceCode}`}
                        >
                          <Printer size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && invoices.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">{totalElements} giao dịch · Trang {page + 1}/{totalPages}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-ink hover:bg-surface-secondary disabled:opacity-40"
              >
                <ChevronLeft size={15} aria-hidden="true" /> Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-ink hover:bg-surface-secondary disabled:opacity-40"
              >
                Sau <ChevronRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      <PosMomoPendingPayments onSelect={(id) => navigateTo(`${CUSTOMER_ROUTES.pos}?m4nPosPaymentId=${encodeURIComponent(id)}`)} />

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setSelectedInvoice(null)} aria-label="Đóng chi tiết hóa đơn" />
          <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="pos-invoice-detail-title" className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-xl border border-border bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand">Hóa đơn POS</p>
                <h2 id="pos-invoice-detail-title" className="mt-1 text-xl font-bold text-ink">{selectedInvoice.invoiceCode}</h2>
                <p className="mt-1 text-sm text-muted">{formatDate(selectedInvoice.createdAt)}</p>
              </div>
              <button data-dialog-initial-focus type="button" onClick={() => setSelectedInvoice(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-secondary" aria-label="Đóng">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <dl className="grid grid-cols-1 gap-3 py-4 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Khách hàng</dt><dd className="font-semibold text-ink">{selectedInvoice.customerName || 'Khách lẻ tại quầy'}</dd></div>
              <div><dt className="text-muted">Phương thức</dt><dd className="font-semibold text-ink">{posPaymentMethodLabel(selectedInvoice.paymentMethod)}</dd></div>
            </dl>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-surface-secondary text-left text-xs uppercase text-secondary">
                  <tr><th className="px-3 py-2.5">Sản phẩm</th><th className="px-3 py-2.5 text-center">SL</th><th className="px-3 py-2.5 text-right">Thành tiền</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(selectedInvoice.items || []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-3"><span className="font-medium text-ink">{item.productName}</span><span className="ml-2 text-xs text-muted">{item.productCode}</span></td>
                      <td className="px-3 py-3 text-center tabular-nums">{item.quantity}</td>
                      <td className="px-3 py-3 text-right font-medium tabular-nums">{item.formattedLineAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="font-semibold text-ink">Tổng thanh toán</span>
              <strong className="text-lg tabular-nums text-brand">{selectedInvoice.formattedFinalAmount}</strong>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" disabled={pdfLoading} onClick={() => handlePrintInvoice(selectedInvoice.invoiceId)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover">
                <Printer size={16} aria-hidden="true" /> Tải PDF để in lại
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
