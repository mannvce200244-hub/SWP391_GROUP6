import { X, CircleCheck, Clock, Copy, Check, Printer, Tag, MessageSquare, RotateCcw, Truck, PackageCheck } from 'lucide-react'
import { formatCurrencyVND } from '../../utils/currency.js'
import { getStatusBadge, formatDate, getPaymentMethodBadge } from './adminOrderPresentation.js'
import { IconInstrument } from '../../components/ui/Icons.jsx'
import { isSafeMediaUrl } from '../catalog/productMedia.js'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import AdminRefundPanel from './AdminRefundPanel.jsx'
import OrderPricingAdjustments from './OrderPricingAdjustments.jsx'

export default function AdminOrderDetailDialog({ selectedOrderId, orderDetail, detailLoading, copiedKey, copyToClipboard, copyShippingDispatchInfo, openPrintSlip, actionLoadingId, handleConfirm, handleRetryConfirmation, handleStartShipping, handleMarkDelivered, setCancelModalOrder, onClose, onPaymentUpdated }) {
  const dialogRef = useDialogFocus(Boolean(selectedOrderId), onClose)
  return (<>
{/* Order Detail Drawer */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => onClose()}
            aria-hidden="true"
          />
          <div
            ref={dialogRef} tabIndex={-1} role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            className="relative w-full max-w-2xl bg-white shadow-2xl border-l border-[#E3E6E8] flex flex-col h-full overscroll-contain"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E3E6E8] bg-[#F6F7F8]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="order-detail-title" className="text-lg font-bold text-[#17191B]">
                    Đơn hàng {orderDetail?.orderCode || `#${selectedOrderId}`}
                  </h2>
                  {orderDetail?.orderCode && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(orderDetail.orderCode, 'drawer-code')}
                      title="Sao chép mã đơn"
                      className="text-zinc-400 hover:text-[#17191B] cursor-pointer"
                    >
                      {copiedKey === 'drawer-code' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
                <p className="text-xs text-secondary mt-0.5">
                  Ngày đặt: {formatDate(orderDetail?.createdAt)}
                  {orderDetail?.updatedAt && ` · Cập nhật: ${formatDate(orderDetail.updatedAt)}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {orderDetail && (
                  <button
                    type="button"
                    onClick={() => openPrintSlip(orderDetail.id, orderDetail)}
                    title="In phiếu đơn hàng"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E3E6E8] bg-white text-xs font-medium text-[#17191B] hover:bg-[#F6F7F8] cursor-pointer shadow-2xs"
                  >
                    <Printer size={14} /> In phiếu
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Đóng chi tiết đơn hàng"
                  onClick={() => onClose()}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#E3E6E8] text-zinc-500 hover:text-[#17191B] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {detailLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-7 h-7 border-2 border-[#A62F25] border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-sm text-secondary">Đang tải chi tiết đơn hàng…</span>
                </div>
              ) : orderDetail ? (
                <>
                  {/* Status & Key Meta Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F6F7F8] p-3.5 rounded-xl border border-[#E3E6E8]">
                    <div>
                      <span className="text-xs text-secondary block font-medium">Trạng thái</span>
                      <div className="mt-1">
                        {(() => {
                          const b = getStatusBadge(orderDetail.status)
                          return (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${b.className}`}>
                              {b.label}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-secondary block font-medium">Thanh toán</span>
                      <p className="mt-1 text-xs font-semibold text-[#17191B]">
                        {getPaymentMethodBadge(orderDetail.paymentMethod).label}
                      </p>
                      <span className={`text-[11px] font-medium ${orderDetail.isPaid ? 'text-emerald-700' : 'text-secondary'}`}>
                        {orderDetail.isPaid ? '✓ Đã thanh toán' : '○ Chưa thanh toán'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-secondary block font-medium">Số sản phẩm</span>
                      <p className="mt-1 text-xs font-bold text-[#17191B] tabular-nums">
                        {orderDetail.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0} món
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-secondary block font-medium">Tổng tiền</span>
                      <p className="mt-1 text-xs font-bold text-[#A62F25] tabular-nums">
                        {orderDetail.finalAmountDisplay || formatCurrencyVND(orderDetail.finalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Customer Information & Delivery Details */}
                  <div className="rounded-xl border border-[#E3E6E8] bg-white p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-[#F2F4F5] pb-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#17191B]">
                        Thông tin giao nhận
                      </h3>
                      <button
                        type="button"
                        onClick={() => copyShippingDispatchInfo(orderDetail)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#A62F25] hover:underline cursor-pointer"
                      >
                        <Copy size={12} /> Sao chép thông tin vận đơn
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-secondary">Họ tên khách hàng</span>
                        <p className="font-semibold text-[#17191B] mt-0.5">{orderDetail.customerName || '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-secondary">Số điện thoại</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <a href={`tel:${orderDetail.customerPhone}`} className="font-semibold text-[#17191B] hover:text-[#A62F25]">
                            {orderDetail.customerPhone || '—'}
                          </a>
                          {orderDetail.customerPhone && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(orderDetail.customerPhone, 'drawer-phone')}
                              title="Sao chép SĐT"
                              className="text-zinc-400 hover:text-[#17191B] cursor-pointer"
                            >
                              {copiedKey === 'drawer-phone' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-xs text-secondary">Email liên hệ</span>
                        <p className="text-xs text-[#17191B] mt-0.5">{orderDetail.customerEmail || '—'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-xs text-secondary">Địa chỉ giao hàng chi tiết</span>
                        <p className="font-medium text-[#17191B] mt-0.5 break-words">
                          {orderDetail.shippingAddress || 'Chưa có địa chỉ'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Notes Alert Box */}
                  {orderDetail.notes && (
                    <div className="p-3.5 rounded-xl bg-[#F6F7F8] border border-amber-200/80 text-amber-950">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                        <MessageSquare size={14} className="text-amber-700" />
                        Ghi chú từ khách hàng:
                      </div>
                      <p className="text-sm font-medium break-words pl-5">{orderDetail.notes}</p>
                    </div>
                  )}

                  {/* Order Items List with Thumbnails */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#17191B]">
                      Danh sách nhạc cụ & sản phẩm
                    </h3>
                    <div className="border border-[#E3E6E8] rounded-xl overflow-hidden divide-y divide-[#F2F4F5] bg-white">
                      {orderDetail.items && orderDetail.items.length > 0 ? (
                        orderDetail.items.map((item) => (
                          <div key={item.productId || item.id} className="flex items-center gap-3.5 p-3 hover:bg-[#F6F7F8]/40 transition-colors">
                            {/* Product Thumbnail */}
                            <div className="relative w-13 h-13 rounded-lg overflow-hidden border border-[#E3E6E8] bg-[#F6F7F8] shrink-0 flex items-center justify-center">
                              <IconInstrument size={22} className="text-zinc-400" />
                              {isSafeMediaUrl(item.imageUrl) && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  width={52}
                                  height={52}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.hidden = true
                                  }}
                                />
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-[#17191B] truncate">{item.productName}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-secondary">
                                {item.productCode && (
                                  <span className="font-mono text-zinc-500 bg-[#F6F7F8] px-1.5 py-0.2 rounded border border-[#E3E6E8]">
                                    {item.productCode}
                                  </span>
                                )}
                                <span>Số lượng: <strong className="text-[#17191B]">x{item.quantity}</strong></span>
                                <span>·</span>
                                <span>{item.priceDisplay || formatCurrencyVND(item.price)}</span>
                              </div>
                            </div>

                            {/* Line Total */}
                            <div className="text-right shrink-0">
                              <span className="font-bold text-sm text-[#17191B] tabular-nums">
                                {item.lineTotalDisplay || formatCurrencyVND(item.lineTotal)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-secondary">Không có sản phẩm nào.</div>
                      )}
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="bg-[#F6F7F8] rounded-xl p-4 space-y-2 text-sm border border-[#E3E6E8]">
                    <div className="flex justify-between text-secondary">
                      <span>Tạm tính hàng hóa</span>
                      <span className="tabular-nums font-medium text-[#17191B]">
                        {orderDetail.totalAmountDisplay || formatCurrencyVND(orderDetail.totalAmount)}
                      </span>
                    </div>
                    {orderDetail.discountAmount > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Tag size={12} /> Tổng giảm giá
                        </span>
                        <span className="tabular-nums">
                          -{orderDetail.discountAmountDisplay || formatCurrencyVND(orderDetail.discountAmount)}
                        </span>
                      </div>
                    )}
                    {Number(orderDetail.manualDiscountAmount) > 0 && <p className="text-xs text-secondary">Voucher {orderDetail.voucherCode}: -{formatCurrencyVND(orderDetail.manualDiscountAmount)}</p>}
                    {Number(orderDetail.automaticDiscountAmount) > 0 && <p className="text-xs text-secondary">Khuyến mãi tự động {orderDetail.automaticPromotionCode}: -{formatCurrencyVND(orderDetail.automaticDiscountAmount)}</p>}
                    <OrderPricingAdjustments order={orderDetail} />
                    <div className="flex justify-between font-bold text-base text-[#17191B] pt-2 border-t border-[#E3E6E8]">
                      <span>Tổng thanh toán</span>
                      <span className="tabular-nums text-[#A62F25]">
                        {orderDetail.finalAmountDisplay || formatCurrencyVND(orderDetail.finalAmount)}
                      </span>
                    </div>
                  </div>
                  {orderDetail.paymentMethod === 'VNPAY' && <AdminRefundPanel key={orderDetail.id} order={orderDetail} onUpdated={onPaymentUpdated} />}
                </>
              ) : null}
            </div>

            {/* Drawer Action Footer */}
            {orderDetail && (
              <div className="p-4 border-t border-[#E3E6E8] bg-white flex items-center justify-between gap-3">
                <div>
                  <button
                    type="button"
                    onClick={() => openPrintSlip(orderDetail.id, orderDetail)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#E3E6E8] bg-white text-[#17191B] hover:bg-[#F6F7F8] transition-colors cursor-pointer"
                  >
                    <Printer size={14} /> In phiếu giao hàng
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {/* Cancel Button */}
                  {orderDetail.canStaffCancel && (
                    <button
                      type="button"
                      disabled={actionLoadingId !== null}
                              onClick={() => setCancelModalOrder(orderDetail)}
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-rose-200 text-rose-700 bg-[#F6F7F8] hover:bg-[#F6F7F8] transition-colors cursor-pointer"
                    >
                      Hủy đơn
                    </button>
                  )}

                  {/* Confirm Button */}
                  {orderDetail.status === 'PENDING_CONFIRMATION' && (
                    <button
                      type="button"
                      disabled={actionLoadingId !== null}
                      onClick={() => handleConfirm(orderDetail.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-60 transition-colors cursor-pointer shadow-xs"
                    >
                      <CircleCheck size={15} className={actionLoadingId === orderDetail.id ? 'animate-spin' : ''} />
                      {actionLoadingId === orderDetail.id ? 'Đang duyệt kho…' : 'Xác nhận đơn hàng'}
                    </button>
                  )}

                  {orderDetail.status === 'OUT_OF_STOCK_WAITING' && (
                    <button
                      type="button"
                      disabled={actionLoadingId !== null}
                      onClick={() => handleRetryConfirmation(orderDetail.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-60 transition-colors cursor-pointer shadow-xs"
                    >
                      <RotateCcw size={15} className={actionLoadingId === orderDetail.id ? 'animate-spin' : ''} />
                      {actionLoadingId === orderDetail.id ? 'Đang kiểm tra kho…' : 'Thử xác nhận lại'}
                    </button>
                  )}

                  {/* Shipping workflow */}
                  {orderDetail.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      disabled={actionLoadingId !== null}
                      onClick={() => handleStartShipping(orderDetail.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60 transition-colors cursor-pointer shadow-xs"
                    >
                      <Truck size={15} className={actionLoadingId === orderDetail.id ? 'animate-pulse' : ''} />
                      {actionLoadingId === orderDetail.id ? 'Đang cập nhật…' : 'Bắt đầu giao hàng'}
                    </button>
                  )}

                  {orderDetail.status === 'SHIPPING' && (
                    <button
                      type="button"
                      disabled={actionLoadingId !== null}
                      onClick={() => handleMarkDelivered(orderDetail.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-violet-700 text-white hover:bg-violet-800 disabled:opacity-60 transition-colors cursor-pointer shadow-xs"
                    >
                      <PackageCheck size={15} className={actionLoadingId === orderDetail.id ? 'animate-pulse' : ''} />
                      {actionLoadingId === orderDetail.id ? 'Đang cập nhật…' : 'Xác nhận đã giao'}
                    </button>
                  )}

                  {orderDetail.status === 'DELIVERED' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-violet-700 bg-[#F6F7F8] border border-violet-200 rounded-lg">
                      <Clock size={14} /> Chờ khách xác nhận đã nhận hàng
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
  </>)
}
