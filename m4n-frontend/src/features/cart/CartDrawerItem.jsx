import QuantitySelector from '../../components/ui/QuantitySelector.jsx'
import RouterLink from '../../routes/RouterLink.jsx'
import { IconInstrument } from '../../components/ui/Icons.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'

function CartDrawerItem({ item, selected, loading, onToggle, onQuantityChange, onRemove, onClose }) {
  return (
    <div className="py-4 flex items-start gap-2">
      <label className="min-h-11 min-w-11 inline-flex items-center justify-center shrink-0 cursor-pointer">
        <input
          type="checkbox"
          name="cartItem"
          value={item.id}
          checked={selected}
          disabled={loading}
          onChange={() => onToggle(item.id)}
          className="h-5 w-5 accent-brand"
        />
        <span className="sr-only">Chọn {item.productName} để thanh toán</span>
      </label>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl bg-surface-secondary border border-border/80 flex items-center justify-center overflow-hidden shrink-0">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.productName} width={56} height={56} className="w-full h-full object-cover" />
            ) : (
              <div className="text-brand" aria-hidden="true"><IconInstrument size={24} /></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-ink break-words">
              <RouterLink href={CUSTOMER_ROUTES.productDetail(item.productId)} onClick={onClose} className="hover:text-brand transition-colors">
                {item.productName}
              </RouterLink>
            </h4>
            <p className="text-xs font-bold text-brand mt-0.5 tabular-nums">{item.unitPriceDisplay}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <QuantitySelector label={`Số lượng ${item.productName}`} disabled={loading} value={item.quantity} max={item.stockQuantity ?? 0} onChange={(quantity) => onQuantityChange(item, quantity)} />
          <button
            type="button"
            disabled={loading}
            onClick={() => onRemove(item)}
            className="min-h-11 px-2 text-xs text-subtle hover:text-danger font-medium transition-colors disabled:opacity-40 cursor-pointer"
            aria-label={`Xóa ${item.productName} khỏi giỏ hàng`}
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  )
}

export default CartDrawerItem
