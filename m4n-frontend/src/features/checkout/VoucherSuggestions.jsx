import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import { getVoucherSuggestions } from '../../services/voucherSuggestionService.js'
import { formatCurrencyVND } from '../../utils/currency.js'

export default function VoucherSuggestions({ pos = false, type = 'MANUAL', subtotal, quantity, appliedCode, disabled, onApply, shippingFee }) {
  const [page, setPage] = useState(0)
  const [retry, setRetry] = useState(0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getVoucherSuggestions({ pos, type, page }).then((data) => {
      if (!active) return
      // Offers can expire or run out between page requests.
      if (page > 0 && page >= data.totalPages) {
        setPage(Math.max(0, data.totalPages - 1))
        return
      }
      setResult(data); setError(''); setLoading(false)
    }).catch((err) => { if (active) { setError(err.message || 'Không thể tải gợi ý voucher.'); setLoading(false) } })
    return () => { active = false }
  }, [pos, type, page, retry])
  const changePage = (value) => { setLoading(true); setPage(value) }
  return <section className="space-y-2 border-t border-border pt-3" aria-label={type === 'SHIPPING' ? 'Gợi ý mã giảm phí vận chuyển' : 'Gợi ý mã giảm tiền hàng'}>
    <h3 className="text-xs font-semibold text-ink">{type === 'SHIPPING' ? 'Gợi ý mã giảm phí vận chuyển' : 'Gợi ý mã giảm tiền hàng'}</h3>
    {loading ? <p role="status" className="text-xs text-muted">Đang tải mã ưu đãi…</p>
      : error ? <p role="alert" className="text-xs text-danger">{error} <button type="button" className="underline min-h-11" onClick={() => { setLoading(true); setRetry((value) => value + 1) }}>Thử lại</button></p>
        : !result?.content?.length ? <p className="text-xs text-muted">Chưa có mã ưu đãi.</p>
          : <div className={pos ? 'space-y-2 max-h-52 overflow-y-auto overscroll-contain p-1' : 'grid grid-cols-1 sm:grid-cols-2 gap-2'}>{result.content.map((voucher) => {
            const missingAmount = Math.max(0, Number(voucher.minimumOrderValue || 0) - Number(subtotal || 0))
            const missingQuantity = Math.max(0, Number(voucher.minimumQuantity || 0) - quantity)
            const freeShipping = type === 'SHIPPING' && shippingFee === 0
            const selected = appliedCode?.toUpperCase() === voucher.code.toUpperCase()
            const eligible = !missingAmount && !missingQuantity && quantity > 0 && !freeShipping
            const saving = type === 'SHIPPING'
              ? Math.min(Number(voucher.fixedDiscountAmount), Number(shippingFee || 0))
              : Math.round(Number(subtotal || 0) * Number(voucher.discountRate))
            return <div key={voucher.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white p-3">
              <div className="min-w-0 text-xs space-y-1">
                <p className="font-semibold break-words"><span className="font-mono">{voucher.code}</span> · {type === 'SHIPPING' ? `Giảm phí ship ${formatCurrencyVND(voucher.fixedDiscountAmount)}` : `Giảm ${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(Number(voucher.discountRate) * 100)}%`}</p>
                <p className="text-muted">Đơn từ {formatCurrencyVND(voucher.minimumOrderValue || 0)}{voucher.minimumQuantity ? ` · Tối thiểu ${voucher.minimumQuantity} sản phẩm` : ''}</p>
                {(missingAmount > 0 || missingQuantity > 0) && <p className="text-muted">{[missingAmount > 0 && `Mua thêm ${formatCurrencyVND(missingAmount)}`, missingQuantity > 0 && `thêm ${missingQuantity} sản phẩm`].filter(Boolean).join(' · ')}</p>}
                {freeShipping && <p className="text-muted">Đơn đã được miễn phí vận chuyển.</p>}
                {eligible && saving > 0 && <p className="text-success">Ước tính giảm {formatCurrencyVND(saving)}</p>}
              </div>
              <Button size="sm" variant="secondary" disabled={disabled || !eligible || selected} onClick={() => onApply(voucher.code)}>{selected ? 'Đang áp dụng' : 'Áp dụng'}</Button>
            </div>
          })}</div>}
    {!loading && !error && result?.totalPages > 1 && <div className="flex justify-end items-center gap-2 text-xs"><Button size="sm" variant="ghost" disabled={page === 0} onClick={() => changePage(page - 1)}>Trước</Button><span>Trang {page + 1}/{result.totalPages}</span><Button size="sm" variant="ghost" disabled={page + 1 >= result.totalPages} onClick={() => changePage(page + 1)}>Sau</Button></div>}
  </section>
}
