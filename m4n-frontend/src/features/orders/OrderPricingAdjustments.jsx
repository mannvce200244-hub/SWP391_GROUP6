import { formatCurrencyVND } from '../../utils/currency.js'

export default function OrderPricingAdjustments({ order }) {
  return (
    <div className="space-y-2 text-xs">
      {Number(order.productDiscountAmount) > 0 && <p className="text-jade">Tiền hàng đã giảm theo sản phẩm {formatCurrencyVND(order.productDiscountAmount)} từ giá niêm yết {formatCurrencyVND(order.originalTotalAmount)}.</p>}
      <div className="flex justify-between gap-3 text-muted"><span>Phí vận chuyển gốc</span><span>{formatCurrencyVND(order.baseShippingFee ?? 0)}</span></div>
      {Number(order.shippingDiscountAmount) > 0 && <div className="flex justify-between gap-3 text-jade"><span>{order.freeShippingApplied ? 'Miễn phí vận chuyển' : `Voucher ship ${order.shippingVoucherCode}`}</span><span>-{formatCurrencyVND(order.shippingDiscountAmount)}</span></div>}
      <div className="flex justify-between gap-3 text-muted"><span>Phí vận chuyển phải trả</span><span>{formatCurrencyVND(order.shippingFee ?? 0)}</span></div>
    </div>
  )
}
