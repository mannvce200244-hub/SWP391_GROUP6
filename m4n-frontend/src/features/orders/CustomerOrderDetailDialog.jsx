import { Check, X } from 'lucide-react'
import { IconInstrument } from '../../components/ui/Icons.jsx'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import { formatDate, getStatusBadge } from './orderPresentation.js'
import OrderPricingAdjustments from './OrderPricingAdjustments.jsx'

export default function CustomerOrderDetailDialog({ isOpen, order, loading, onClose, onCancel, onReceive, receivingOrderId }) {
  const dialogRef = useDialogFocus(isOpen, onClose)
  if (!isOpen) return null
  return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-xs overscroll-contain">
          <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="order-detail-title" className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[calc(100dvh-12px)] sm:max-h-[calc(100dvh-48px)] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="shrink-0 p-4 sm:p-6 border-b border-border/60 flex items-center justify-between bg-surface-secondary/40">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 id="order-detail-title" className="text-lg font-bold text-ink font-mono">
                    {order?.orderCode || 'Chi tiết đơn hàng'}
                  </h3>
                  {order && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(order.status).className}`}>
                      {getStatusBadge(order.status).label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Ngày đặt: {formatDate(order?.createdAt)}
                </p>
              </div>

              <button
                type="button"
                aria-label="Đóng chi tiết đơn hàng"
                onClick={onClose}
                className="w-9 h-9 rounded-xl text-muted hover:text-ink hover:bg-surface-secondary flex items-center justify-center cursor-pointer transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="min-h-0 p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-6 flex-1 text-xs">
              {loading ? (
                <div className="py-12 text-center text-muted">Đang tải chi tiết đơn hàng...</div>
              ) : order ? (
                <>
                  {/* Status Timeline */}
                  <div className="p-4 rounded-2xl bg-surface-secondary/50 border border-border/70 space-y-3">
                    <h4 className="font-bold text-ink uppercase tracking-wider text-xs">
                      Tiến độ đơn hàng
                    </h4>

                    {order.status === 'CANCELLED' ? (
                      <div className="p-3 rounded-xl bg-surface-secondary border border-rose-200 text-rose-800 text-xs font-medium">
                        Đơn hàng này đã bị hủy.
                      </div>
                    ) : order.status === 'OUT_OF_STOCK_WAITING' ? (
                      <div className="p-3 rounded-xl bg-[#F6F7F8] border border-orange-200 text-orange-800 text-xs font-medium">
                        Sản phẩm hiện đang tạm hết tồn kho sẵn sàng. Đơn hàng chuyển sang hàng đợi chế tác/nhập kho từ làng nghề.
                      </div>
                    ) : (
                      <div className="relative pt-2">
                        <div aria-hidden="true" className="absolute left-[10%] right-[10%] top-[22px] h-0.5 bg-border" />
                        <div className="relative grid grid-cols-5 gap-1 text-center">
                        {[
                          ['PENDING_CONFIRMATION', 'Đã đặt'],
                          ['CONFIRMED', 'Đã xác nhận'],
                          ['SHIPPING', 'Đang giao'],
                          ['DELIVERED', 'Đã giao'],
                          ['COMPLETED', 'Hoàn thành'],
                        ].map(([status, label], index, steps) => {
                          const currentIndex = steps.findIndex(([stepStatus]) => stepStatus === order.status)
                          const isReached = index <= currentIndex
                          const isCurrent = index === currentIndex
                          return (
                            <div key={status} className="space-y-1 min-w-0">
                              <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                                isReached
                                  ? isCurrent ? 'bg-brand text-white ring-2 ring-brand/20' : 'bg-emerald-600 text-white'
                                  : 'bg-surface-secondary text-muted'
                              }`}>
                                {isReached && !isCurrent ? <Check size={14} className="stroke-[2.5]" /> : index + 1}
                              </div>
                              <span className="font-semibold text-ink block text-[10px] sm:text-xs leading-tight">{label}</span>
                            </div>
                          )
                        })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Customer Information Snapshot */}
                  <div className="space-y-2 p-4 rounded-2xl bg-white border border-border/80">
                    <h4 className="font-bold text-ink uppercase tracking-wider text-xs pb-2 border-b border-border/60">
                      Thông tin giao nhận
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-muted">
                      <div>Người nhận: <strong className="text-ink">{order.customerName}</strong></div>
                      <div>Số điện thoại: <strong className="text-ink">{order.customerPhone}</strong></div>
                      <div className="col-span-2">Email: {order.customerEmail}</div>
                      <div className="col-span-2">Địa chỉ: {order.shippingAddress}</div>
                      {order.notes && (
                        <div className="col-span-2 text-ink italic">Ghi chú: {order.notes}</div>
                      )}
                    </div>
                  </div>

                  {/* Purchased Items List */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-ink uppercase tracking-wider text-xs">
                      Danh sách nhạc cụ ({order.items?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {order.items?.map((it) => (
                        <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary/30 border border-border/60">
                          <div className="w-12 h-12 rounded-lg bg-surface-secondary overflow-hidden shrink-0">
                            {it.imageUrl ? (
                              <img src={it.imageUrl} alt={it.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-subtle">
                                <IconInstrument size={18} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-ink line-clamp-1">{it.productName}</h5>
                            <span className="text-xs text-muted">Mã: {it.productCode} &bull; SL: {it.quantity}</span>
                          </div>
                          <div className="flex items-center gap-3 text-right">
                            {order.status === 'COMPLETED' && it.productId && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose()
                                  navigateTo(CUSTOMER_ROUTES.productDetail(it.productId))
                                }}
                                className="px-2.5 py-1 text-[11px] rounded-lg border border-teal-300 text-teal-700 bg-surface-secondary hover:bg-surface-secondary font-bold transition-colors cursor-pointer"
                              >
                                Đánh giá
                              </button>
                            )}
                            <span className="font-bold text-ink">{it.lineTotalDisplay}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Calculation Breakdown */}
                  <div className="space-y-2 p-4 rounded-2xl bg-surface-secondary/40 border border-border/70">
                    <div className="flex justify-between text-muted">
                      <span>Tạm tính tiền hàng:</span>
                      <span className="font-bold text-ink">{order.totalAmountDisplay}</span>
                    </div>

                    {order.voucherCode && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Voucher ({order.voucherCode}):</span>
                        <span className="font-bold">-{formatCurrencyVND(order.manualDiscountAmount ?? order.discountAmount)}</span>
                      </div>
                    )}
                    {Number(order.automaticDiscountAmount) > 0 && (
                      <div className="flex justify-between text-jade">
                        <span>Ưu đãi tự động ({order.automaticPromotionCode}):</span>
                        <span className="font-bold">-{formatCurrencyVND(order.automaticDiscountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-muted">
                      <span>Phương thức thanh toán:</span>
                      <span className="font-medium text-ink">{order.paymentMethod}</span>
                    </div>

                    <div className="flex justify-between text-muted">
                      <span>Trạng thái thanh toán:</span>
                      <span className={`font-bold ${order.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>

                    <OrderPricingAdjustments order={order} />
                    <div className="pt-2 border-t border-border/60 flex justify-between items-baseline">
                      <span className="text-sm font-bold text-ink">Tổng thanh toán:</span>
                      <span className="text-lg font-bold text-brand font-sans">{order.finalAmountDisplay}</span>
                    </div>
                    {order.paymentMethod === 'VNPAY' && <button type="button" onClick={() => { onClose(); navigateTo(`${CUSTOMER_ROUTES.paymentReturn}?orderId=${encodeURIComponent(order.id)}`) }} className="h-11 px-4 rounded-lg border border-border font-semibold text-brand">Kiểm tra / thanh toán VNPay</button>}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 p-3 sm:p-5 border-t border-border/60 bg-white flex flex-wrap items-center gap-2">
              {order?.canCustomerCancel && order.status === 'PENDING_CONFIRMATION' && (
                <button
                  type="button"
                  onClick={() => onCancel(order)}
                  className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-surface-secondary text-xs font-bold transition-all cursor-pointer"
                >
                  Hủy đơn hàng này
                </button>
              )}

              {order?.status === 'DELIVERED' && (
                <button
                  type="button"
                  disabled={receivingOrderId === order.id}
                  onClick={() => onReceive(order)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {receivingOrderId === order.id ? 'Đang xác nhận…' : 'Đã nhận được hàng'}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="ml-auto px-5 py-2.5 rounded-xl bg-[#17191B] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
  )
}

