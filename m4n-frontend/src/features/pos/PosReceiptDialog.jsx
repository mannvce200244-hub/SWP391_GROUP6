import { useRef, useState } from 'react'
import { Check } from 'lucide-react'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import useToast from '../../components/ui/useToast.js'
import { downloadInvoicePdf, openInvoicePdf } from '../../services/posService.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import { posPaymentMethodLabel } from '../../services/posMomoService.js'

export default function PosReceiptDialog({ sale, staffName, onNewSale }) {
  const dialogRef = useDialogFocus(true, onNewSale)
  const { addToast } = useToast()
  const [pdfPending, setPdfPending] = useState(false)
  const pending = useRef(false)
  const handlePdf = async (open) => {
    if (pending.current) return
    pending.current = true
    setPdfPending(true)
    try {
      if (open) await openInvoicePdf(sale.invoiceId)
      else await downloadInvoicePdf(sale.invoiceId)
    } catch (error) {
      addToast({ message: error.message || 'Không thể tải hóa đơn PDF. Vui lòng thử lại.', type: 'error' })
    } finally {
      pending.current = false
      setPdfPending(false)
    }
  }
  return (<>
      {/* Sale Success Modal */}
      {sale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pos-receipt-title" tabIndex={-1} className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 bg-[#F6F7F8] text-ink flex flex-col items-center justify-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Check size={28} className="text-success" />
              </div>
              <h3 id="pos-receipt-title" className="text-xl font-bold">Thanh toán thành công!</h3>
              <span className="text-xs text-secondary">
                Đã trừ tồn kho showroom an toàn và tạo hóa đơn bán hàng.
              </span>
            </div>

            {/* Receipt Summary */}
            <div className="p-6 flex flex-col gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-canvas border border-border flex flex-col gap-2">
                {Number(sale.productDiscountAmount) > 0 && <p className="text-jade">Đã giảm theo sản phẩm {formatCurrencyVND(sale.productDiscountAmount)} từ niêm yết {formatCurrencyVND(sale.originalTotalAmount)}.</p>}
                <div className="flex justify-between">
                  <span className="text-muted">Mã hóa đơn:</span>
                  <span className="font-bold text-ink font-mono">{sale.invoiceCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Tổng tiền thanh toán:</span>
                  <span className="font-bold text-brand font-mono text-sm">{formatCurrencyVND(sale.finalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Phương thức:</span>
                  <span className="font-medium text-ink">
                    {posPaymentMethodLabel(sale.paymentMethod)}
                  </span>
                </div>
                {sale.paymentMethod === 'CASH' && sale.amountReceived && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted">Tiền khách đưa:</span>
                      <span className="font-mono text-ink">{formatCurrencyVND(sale.amountReceived)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Tiền thừa trả khách:</span>
                      <span className="font-mono">{formatCurrencyVND(sale.amountChange)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Thu ngân:</span>
                  <span className="text-ink">{sale.staffName || staffName}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handlePdf(false)}
                  disabled={pdfPending}
                  className="py-2.5 px-4 rounded-xl border border-brand bg-[#F6F7F8] hover:bg-[#F6F7F8] text-brand font-bold text-center transition-colors cursor-pointer"
                >
                  Tải hóa đơn PDF
                </button>
                <button
                  type="button"
                  onClick={() => handlePdf(true)}
                  disabled={pdfPending}
                  className="py-2.5 px-4 rounded-xl border border-border bg-canvas hover:bg-surface-secondary text-ink font-bold text-center transition-colors cursor-pointer"
                >
                  Mở PDF để in
                </button>
              </div>

              <button
                type="button"
                onClick={onNewSale}
                className="w-full py-3 rounded-xl bg-brand text-white font-bold text-sm shadow-md hover:bg-brand/90 transition-all cursor-pointer"
              >
                + Bắt đầu đơn hàng mới
              </button>
            </div>
          </div>
        </div>
      )}
  </>)
}
