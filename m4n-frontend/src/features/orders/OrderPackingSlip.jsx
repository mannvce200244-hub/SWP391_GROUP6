import { X, Printer } from 'lucide-react'
import { formatCurrencyVND } from '../../utils/currency.js'
import { formatDate, getPaymentMethodBadge } from './adminOrderPresentation.js'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import { createPortal } from 'react-dom'

export default function OrderPackingSlip({ printSlipOrder, onClose }) {
  const dialogRef = useDialogFocus(Boolean(printSlipOrder), onClose)
  return (<>
{/* Printable Packing Slip Modal */}
      {printSlipOrder && createPortal((
        <div className="print-slip-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="packing-slip-title" className="print-slip-dialog bg-white rounded-2xl border border-[#E3E6E8] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overscroll-contain">
            {/* Modal Actions Header */}
            <div className="print-slip-actions flex items-center justify-between px-6 py-3.5 border-b border-[#E3E6E8] bg-[#F6F7F8] rounded-t-2xl">
              <span id="packing-slip-title" className="text-sm font-semibold text-[#17191B] flex items-center gap-1.5">
                <Printer size={16} className="text-[#A62F25]" /> Xem trước phiếu đóng gói & giao hàng
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#17191B] text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <Printer size={14} /> In ngay
                </button>
                <button
                  type="button"
                  onClick={() => onClose()}
                  aria-label="Đóng phiếu giao hàng"
                  className="p-1.5 text-zinc-400 hover:text-[#17191B] rounded-lg hover:bg-[#E3E6E8] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Print Slip Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-[#17191B]" id="printable-slip">
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b-2 border-[#17191B] pb-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-[#17191B]">M4N</h2>
                  <p className="text-xs text-secondary mt-0.5">Tinh hoa Nhạc cụ Dân tộc Việt Nam</p>
                  
                </div>
                <div className="text-right">
                  <h3 className="text-base font-bold uppercase tracking-wider text-[#A62F25]">
                    PHIẾU ĐÓNG GÓI & GIAO HÀNG
                  </h3>
                  <p className="font-mono text-xs font-bold mt-1 text-[#17191B]">
                    {printSlipOrder.orderCode || `#${printSlipOrder.id}`}
                  </p>
                  <p className="text-xs text-secondary mt-0.5">
                    Ngày in: {formatDate(new Date().toISOString())}
                  </p>
                </div>
              </div>

              {/* Recipient & Order Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-[#F6F7F8] p-4 rounded-xl border border-[#E3E6E8]">
                <div>
                  <span className="text-secondary font-semibold block uppercase tracking-wider text-[10px]">
                    Người nhận hàng
                  </span>
                  <p className="text-sm font-bold mt-1 text-[#17191B]">{printSlipOrder.customerName || '—'}</p>
                  <p className="font-medium text-secondary mt-0.5">SĐT: {printSlipOrder.customerPhone || '—'}</p>
                  <p className="mt-1 text-secondary leading-relaxed">
                    Đ/c: {printSlipOrder.shippingAddress || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-secondary font-semibold block uppercase tracking-wider text-[10px]">
                    Chi tiết thanh toán
                  </span>
                  <p className="font-semibold text-secondary mt-1">
                    Hình thức: {getPaymentMethodBadge(printSlipOrder.paymentMethod).label}
                  </p>
                  <p className={`font-bold mt-0.5 ${printSlipOrder.isPaid ? 'text-emerald-700' : 'text-amber-800'}`}>
                    Tình trạng: {printSlipOrder.isPaid
                      ? 'ĐÃ THANH TOÁN'
                      : printSlipOrder.paymentMethod === 'COD'
                        ? 'THU TIỀN KHI GIAO (COD)'
                        : 'CHƯA XÁC MINH THANH TOÁN'}
                  </p>
                  {printSlipOrder.notes && (
                    <p className="mt-2 p-1.5 rounded bg-[#F6F7F8] border border-[#E3E6E8] text-[#17191B] font-medium">
                      Ghi chú: {printSlipOrder.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-xs text-left border border-[#E3E6E8]">
                  <thead>
                    <tr className="bg-[#F6F7F8] border-b border-[#E3E6E8] text-[#17191B]">
                      <th className="p-2.5 font-bold w-10 text-center">STT</th>
                      <th className="p-2.5 font-bold">Mặt hàng nhạc cụ</th>
                      <th className="p-2.5 font-bold w-16 text-center">Số lượng</th>
                      <th className="p-2.5 font-bold w-24 text-right">Đơn giá</th>
                      <th className="p-2.5 font-bold w-28 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E6E8]">
                    {printSlipOrder.items && printSlipOrder.items.length > 0 ? (
                      printSlipOrder.items.map((it, idx) => (
                        <tr key={it.productId || it.id}>
                          <td className="p-2.5 text-center text-secondary">{idx + 1}</td>
                          <td className="p-2.5">
                            <p className="font-semibold text-[#17191B]">{it.productName}</p>
                            {it.productCode && (
                              <span className="font-mono text-[11px] text-zinc-500">Mã: {it.productCode}</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center font-bold text-[#17191B]">{it.quantity}</td>
                          <td className="p-2.5 text-right tabular-nums text-secondary">
                            {it.priceDisplay || formatCurrencyVND(it.price)}
                          </td>
                          <td className="p-2.5 text-right font-semibold tabular-nums text-[#17191B]">
                            {it.lineTotalDisplay || formatCurrencyVND(it.lineTotal)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-secondary">
                          {printSlipOrder.itemsSummary || 'Chi tiết đơn hàng'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#E3E6E8] bg-[#F6F7F8]">
                      <td colSpan={3} className="p-2.5 font-medium text-secondary text-right">Tạm tính:</td>
                      <td colSpan={2} className="p-2.5 text-right tabular-nums font-semibold">
                        {printSlipOrder.totalAmountDisplay || formatCurrencyVND(printSlipOrder.totalAmount)}
                      </td>
                    </tr>
                    {printSlipOrder.discountAmount > 0 && (
                      <tr className="bg-[#F6F7F8] text-rose-600">
                        <td colSpan={3} className="p-2.5 font-medium text-right">
                          Tổng giảm giá:
                        </td>
                        <td colSpan={2} className="p-2.5 text-right tabular-nums font-semibold">
                          -{printSlipOrder.discountAmountDisplay || formatCurrencyVND(printSlipOrder.discountAmount)}
                        </td>
                      </tr>
                    )}
                    {Number(printSlipOrder.manualDiscountAmount) > 0 && <tr><td colSpan={3} className="p-2.5 text-right">Voucher {printSlipOrder.voucherCode}</td><td colSpan={2} className="p-2.5 text-right">-{formatCurrencyVND(printSlipOrder.manualDiscountAmount)}</td></tr>}
                    {Number(printSlipOrder.automaticDiscountAmount) > 0 && <tr><td colSpan={3} className="p-2.5 text-right">Khuyến mãi tự động {printSlipOrder.automaticPromotionCode}</td><td colSpan={2} className="p-2.5 text-right">-{formatCurrencyVND(printSlipOrder.automaticDiscountAmount)}</td></tr>}
                    {Number(printSlipOrder.productDiscountAmount) > 0 && <tr><td colSpan={3} className="p-2.5 text-right">Đã giảm theo sản phẩm (trong tạm tính)</td><td colSpan={2} className="p-2.5 text-right">{formatCurrencyVND(printSlipOrder.productDiscountAmount)}</td></tr>}
                    <tr><td colSpan={3} className="p-2.5 text-right">Phí vận chuyển gốc</td><td colSpan={2} className="p-2.5 text-right">{formatCurrencyVND(printSlipOrder.baseShippingFee ?? 0)}</td></tr>
                    {Number(printSlipOrder.shippingDiscountAmount) > 0 && <tr><td colSpan={3} className="p-2.5 text-right">{printSlipOrder.freeShippingApplied ? 'Freeship' : `Voucher ship ${printSlipOrder.shippingVoucherCode}`}</td><td colSpan={2} className="p-2.5 text-right">-{formatCurrencyVND(printSlipOrder.shippingDiscountAmount)}</td></tr>}
                    <tr><td colSpan={3} className="p-2.5 text-right">Phí vận chuyển phải trả</td><td colSpan={2} className="p-2.5 text-right">{formatCurrencyVND(printSlipOrder.shippingFee ?? 0)}</td></tr>
                    <tr className="bg-[#F6F7F8] border-t-2 border-[#17191B] text-[#17191B] font-bold">
                      <td colSpan={3} className="p-2.5 text-sm text-right">
                        {printSlipOrder.paymentMethod === 'COD' ? 'TỔNG THU (COD):' : 'GIÁ TRỊ ĐƠN HÀNG:'}
                      </td>
                      <td colSpan={2} className="p-2.5 text-right text-base text-[#A62F25] tabular-nums">
                        {printSlipOrder.isPaid && printSlipOrder.paymentMethod === 'COD'
                          ? '0 ₫ (ĐÃ THANH TOÁN)'
                          : printSlipOrder.finalAmountDisplay || formatCurrencyVND(printSlipOrder.finalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signature section */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs text-secondary">
                <div>
                  <p className="font-semibold text-[#17191B]">Người lập phiếu</p>
                  <p className="italic text-[11px] mt-0.5">(Ký, họ tên)</p>
                  <div className="h-16" />
                </div>
                <div>
                  <p className="font-semibold text-[#17191B]">Nhân viên giao nhận</p>
                  <p className="italic text-[11px] mt-0.5">(Ký, họ tên)</p>
                  <div className="h-16" />
                </div>
                <div>
                  <p className="font-semibold text-[#17191B]">Người nhận hàng</p>
                  <p className="italic text-[11px] mt-0.5">(Ký, họ tên)</p>
                  <div className="h-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}
  </>)
}
