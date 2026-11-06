import { X, Eye, CircleCheck, ChevronLeft, ChevronRight, Copy, Check, Printer, Tag, MessageSquare, RotateCcw, MapPin, Truck, PackageCheck } from 'lucide-react'
import { formatCurrencyVND } from '../../utils/currency.js'
import { getStatusBadge, formatDate, getPaymentMethodBadge, getShortAddress } from './adminOrderPresentation.js'
import { IconInstrument } from '../../components/ui/Icons.jsx'
import { isSafeMediaUrl } from '../catalog/productMedia.js'

export default function AdminOrderTable({ orders, loading, hasActiveFilters, resetAllFilters, copyToClipboard, copiedKey, openDetail, openPrintSlip, actionLoadingId, handleConfirm, handleRetryConfirmation, handleStartShipping, handleMarkDelivered, setCancelModalOrder, page, totalPages, totalElements, setPage }) {
  return (<>
{/* Orders Table - Streamlined & High-Efficiency */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-[#E3E6E8]" role="status">
          <div className="w-6 h-6 border-2 border-[#A62F25] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-xs text-secondary font-medium">Đang tải danh sách đơn hàng…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-xl border border-[#E3E6E8] shadow-2xs">
          <IconInstrument size={40} className="mx-auto text-zinc-300 mb-2.5" />
          <p className="text-sm font-semibold text-[#17191B]">Không tìm thấy đơn hàng nào</p>
          <p className="text-xs text-secondary mt-0.5">Hãy thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc</p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-white border border-[#E3E6E8] text-xs font-medium text-[#17191B] hover:bg-[#F6F7F8] transition-colors cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E3E6E8] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-xs text-left">
              <thead>
                <tr className="border-b border-[#E3E6E8] bg-[#F6F7F8] text-[#17191B]">
                  <th className="px-3.5 py-2.5 font-semibold w-36">Đơn hàng</th>
                  <th className="px-3.5 py-2.5 font-semibold w-40">Khách hàng</th>
                  <th className="px-3.5 py-2.5 font-semibold min-w-[260px]">Nhạc cụ đặt mua</th>
                  <th className="px-3.5 py-2.5 font-semibold w-44">Giao đến</th>
                  <th className="px-3.5 py-2.5 font-semibold w-36">Thanh toán</th>
                  <th className="px-3.5 py-2.5 font-semibold text-right w-32">Tổng thu</th>
                  <th className="px-3.5 py-2.5 font-semibold text-center w-32">Trạng thái</th>
                  <th className="px-3.5 py-2.5 font-semibold text-right w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F4F5]">
                {orders.map((order) => {
                  const badge = getStatusBadge(order.status)
                  const payMethod = getPaymentMethodBadge(order.paymentMethod)
                  const hasDiscount = Boolean(order.discountAmount && Number(order.discountAmount) > 0)
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-[#F6F7F8]/60 transition-colors group"
                    >
                      {/* Column 1: Order Code & Date */}
                      <td className="px-3.5 py-3 align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#17191B]" translate="no">
                            {order.orderCode || `#${order.id}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.orderCode, `code-${order.id}`)}
                            title="Sao chép mã đơn"
                            className="text-zinc-400 hover:text-[#17191B] transition-colors cursor-pointer"
                          >
                            {copiedKey === `code-${order.id}` ? (
                              <Check size={11} className="text-emerald-600" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-secondary whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </span>
                          {order.voucherCode && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#A62F25] bg-[#F6F7F8] px-1 py-0.2 rounded border border-[#F7D7D4]"
                              title={`Voucher áp dụng: ${order.voucherCode}`}
                            >
                              <Tag size={9} />
                              {order.voucherCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Customer info (Streamlined: Name + Phone only) */}
                      <td className="px-3.5 py-3 align-middle min-w-0">
                        <p className="font-semibold text-[#17191B] truncate" title={order.customerName || undefined}>
                          {order.customerName || '—'}
                        </p>
                        {order.customerPhone && (
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-secondary">
                            <a
                              href={`tel:${order.customerPhone}`}
                              className="font-mono hover:text-[#A62F25] hover:underline"
                              title="Bấm để gọi"
                            >
                              {order.customerPhone}
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(order.customerPhone, `phone-${order.id}`)}
                              title="Sao chép SĐT"
                              className="text-zinc-400 hover:text-[#17191B] cursor-pointer"
                            >
                              {copiedKey === `phone-${order.id}` ? (
                                <Check size={10} className="text-emerald-600" />
                              ) : (
                                <Copy size={10} />
                              )}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Column 3: Products (Primary focus) & Customer Note Pill */}
                      <td className="px-3.5 py-3 align-middle min-w-0">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-8 h-8 rounded-lg bg-[#F6F7F8] border border-[#E3E6E8] flex items-center justify-center text-zinc-400 shrink-0 overflow-hidden">
                            <IconInstrument size={16} />
                            {isSafeMediaUrl(order.imageUrl) && (
                              <img
                                src={order.imageUrl}
                                alt=""
                                width={32}
                                height={32}
                                loading="lazy"
                                className="absolute inset-0 h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.hidden = true
                                }}
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p
                                className="font-semibold text-xs text-[#17191B] truncate max-w-xs"
                                title={order.itemsSummary || undefined}
                              >
                                {order.itemsSummary || `${order.itemCount || 0} sản phẩm`}
                              </p>
                              {order.notes && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F6F7F8] border border-amber-200 text-amber-900 text-[10px] font-semibold cursor-help shrink-0"
                                  title={`Ghi chú từ khách: ${order.notes}`}
                                >
                                  <MessageSquare size={10} className="text-amber-700 shrink-0" />
                                  <span>Ghi chú</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-secondary mt-0.5">
                              {order.itemCount || 1} sản phẩm
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Delivery Location (Concise short address) */}
                      <td className="px-3.5 py-3 align-middle min-w-0">
                        <div
                          className="flex items-center gap-1 text-secondary hover:text-[#17191B] cursor-help"
                          title={`Địa chỉ đầy đủ: ${order.shippingAddress || 'Chưa có'}`}
                        >
                          <MapPin size={12} className="shrink-0 text-zinc-400" />
                          <span className="truncate">{getShortAddress(order.shippingAddress)}</span>
                        </div>
                      </td>

                      {/* Column 5: Payment (Compact Method Badge + Status Indicator) */}
                      <td className="px-3.5 py-3 align-middle">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${payMethod.className}`}
                          >
                            {payMethod.label}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium whitespace-nowrap ${
                              order.isPaid ? 'text-emerald-700 font-semibold' : 'text-zinc-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                order.isPaid ? 'bg-emerald-600' : 'bg-zinc-400'
                              }`}
                            />
                            {order.isPaid ? 'Đã thu' : 'Chưa thu'}
                          </span>
                        </div>
                      </td>

                      {/* Column 6: Total Amount (Clean bold text, no trailing bug) */}
                      <td className="px-3.5 py-3 align-middle text-right font-bold text-xs text-[#17191B] tabular-nums">
                        <div>{order.finalAmountDisplay || formatCurrencyVND(order.finalAmount)}</div>
                        {hasDiscount ? (
                          <div className="text-[10px] font-normal text-rose-600 tabular-nums mt-0.5">
                            Giảm -{order.discountAmountDisplay || formatCurrencyVND(order.discountAmount)}
                          </div>
                        ) : null}
                      </td>

                      {/* Column 7: Status Badge */}
                      <td className="px-3.5 py-3 align-middle text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Column 8: Actions */}
                      <td className="px-3.5 py-3 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Detail Button */}
                          <button
                            type="button"
                            title="Xem chi tiết đơn hàng"
                            aria-label={`Xem chi tiết đơn ${order.orderCode || order.id}`}
                            onClick={() => openDetail(order.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-[#17191B] hover:bg-[#F2F4F5] transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Print Slip Button */}
                          <button
                            type="button"
                            title="In phiếu đóng gói & giao hàng"
                            aria-label={`In phiếu đơn ${order.orderCode || order.id}`}
                            onClick={() => openPrintSlip(order.id, order)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-[#17191B] hover:bg-[#F2F4F5] transition-colors cursor-pointer"
                          >
                            <Printer size={14} />
                          </button>

                          {/* Confirm Order Button */}
                          {order.status === 'PENDING_CONFIRMATION' && (
                            <button
                              type="button"
                              title="Xác nhận & trừ kho"
                              aria-label={`Xác nhận đơn ${order.orderCode || order.id}`}
                              disabled={actionLoadingId !== null}
                              onClick={() => handleConfirm(order.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-teal-600 hover:bg-[#F6F7F8] hover:text-teal-700 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <CircleCheck size={15} className={actionLoadingId === order.id ? 'animate-spin' : ''} />
                            </button>
                          )}

                          {order.status === 'OUT_OF_STOCK_WAITING' && (
                            <button
                              type="button"
                              title="Thử xác nhận lại"
                              aria-label={`Thử xác nhận lại đơn ${order.orderCode || order.id}`}
                              disabled={actionLoadingId !== null}
                              onClick={() => handleRetryConfirmation(order.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-amber-700 hover:bg-[#F6F7F8] hover:text-amber-800 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <RotateCcw size={14} className={actionLoadingId === order.id ? 'animate-spin' : ''} />
                            </button>
                          )}

                          {/* Start Shipping Button */}
                          {order.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              title="Bắt đầu giao hàng"
                              aria-label={`Bắt đầu giao đơn ${order.orderCode || order.id}`}
                              disabled={actionLoadingId !== null}
                              onClick={() => handleStartShipping(order.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-blue-600 hover:bg-[#F6F7F8] hover:text-blue-700 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <Truck size={15} className={actionLoadingId === order.id ? 'animate-pulse' : ''} />
                            </button>
                          )}

                          {order.status === 'SHIPPING' && (
                            <button
                              type="button"
                              title="Xác nhận đã giao hàng"
                              aria-label={`Xác nhận đã giao đơn ${order.orderCode || order.id}`}
                              disabled={actionLoadingId !== null}
                              onClick={() => handleMarkDelivered(order.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-violet-600 hover:bg-[#F6F7F8] hover:text-violet-700 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <PackageCheck size={15} className={actionLoadingId === order.id ? 'animate-pulse' : ''} />
                            </button>
                          )}

                          {/* Cancel Order Button */}
                          {(order.status === 'PENDING_CONFIRMATION' ||
                            order.status === 'CONFIRMED' ||
                            order.status === 'OUT_OF_STOCK_WAITING') && (
                            <button
                              type="button"
                              title="Hủy đơn hàng"
                              aria-label={`Hủy đơn ${order.orderCode || order.id}`}
                              disabled={actionLoadingId !== null}
                              onClick={() => setCancelModalOrder(order)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:bg-[#F6F7F8] hover:text-rose-700 transition-colors cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {orders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E3E6E8] bg-white">
              <span className="text-xs text-secondary">
                Hiển thị <strong>{orders.length}</strong> / <strong>{totalElements}</strong> đơn hàng · Trang <strong className="text-[#17191B]">{page + 1}</strong> / {totalPages || 1}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Trang đơn hàng trước"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E3E6E8] text-xs font-medium hover:bg-[#F6F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A62F25]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft size={13} /> Trước
                </button>
                <span className="px-2 text-xs font-semibold text-[#17191B]">
                  Trang {page + 1} / {totalPages || 1}
                </span>
                <button
                  type="button"
                  aria-label="Trang đơn hàng tiếp theo"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E3E6E8] text-xs font-medium hover:bg-[#F6F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A62F25]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Sau <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
  </>)
}
