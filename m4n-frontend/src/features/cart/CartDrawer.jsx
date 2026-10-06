import { useEffect } from 'react'
import {
  IconShoppingBag,
  IconInstrument,
  IconChevronRight,
  IconArrowRight,
} from '../../components/ui/Icons.jsx'
import useCart from './useCart.js'
import useAuth from '../auth/useAuth.js'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'

function CartDrawer({ isOpen, onClose }) {
  const { cart, cartItemCount, updateCartItem, removeCartItem, loading } = useCart()
  const { isAuthenticated } = useAuth()

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const items = cart?.items || []

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Giỏ hàng của bạn">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-250">
          
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center border border-brand-border">
                <IconShoppingBag size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-ink font-sans">
                  Giỏ hàng của bạn
                </h3>
                <p className="text-xs text-muted">
                  {cartItemCount > 0
                    ? `${cartItemCount} nhạc cụ đã chọn`
                    : 'Chưa có sản phẩm nào'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
              aria-label="Đóng giỏ hàng"
            >
              <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {!isAuthenticated ? (
              /* Require Login State */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-soft text-brand flex items-center justify-center border border-brand-border">
                  <IconShoppingBag size={28} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-ink">
                    Vui lòng đăng nhập
                  </h4>
                  <p className="text-xs text-muted mt-1 max-w-xs">
                    Đăng nhập để xem các nhạc cụ trong giỏ hàng và đồng bộ đơn đặt hàng của bạn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigateTo(CUSTOMER_ROUTES.login)
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-md shadow-brand/20 hover:bg-brand-hover transition-all cursor-pointer"
                >
                  <span>Đăng nhập ngay</span>
                  <IconArrowRight size={14} />
                </button>
              </div>
            ) : items.length === 0 ? (
              /* Empty Cart State */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-secondary text-subtle flex items-center justify-center border border-border">
                  <IconShoppingBag size={28} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-ink">
                    Giỏ hàng đang trống
                  </h4>
                  <p className="text-xs text-muted mt-1 max-w-xs">
                    Bạn chưa chọn nhạc cụ truyền thống nào. Hãy khám phá kho tàng di sản M4N.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigateTo(CUSTOMER_ROUTES.products)
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-md shadow-brand/20 hover:bg-brand-hover transition-all cursor-pointer"
                >
                  <span>Khám phá nhạc cụ</span>
                  <IconArrowRight size={14} />
                </button>
              </div>
            ) : (
              /* Items List */
              <div className="divide-y divide-border/60">
                {items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-3.5">
                    {/* Item Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-surface-secondary border border-border/80 flex items-center justify-center overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-brand">
                          <IconInstrument size={24} />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h4
                        className="text-sm font-bold text-ink truncate cursor-pointer hover:text-brand transition-colors"
                        onClick={() => {
                          onClose()
                          if (item.productId) {
                            navigateTo(CUSTOMER_ROUTES.productDetail(item.productId))
                          }
                        }}
                        title={item.productName}
                      >
                        {item.productName}
                      </h4>
                      <p className="text-xs font-black text-brand mt-0.5">
                        {item.unitPriceDisplay || item.subtotalDisplay}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="inline-flex items-center border border-border rounded-lg bg-surface-secondary/60 p-0.5">
                          <button
                            type="button"
                            disabled={loading || item.quantity <= 1}
                            onClick={() => updateCartItem(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-xs font-bold text-ink hover:bg-white rounded transition-colors disabled:opacity-40 cursor-pointer"
                            aria-label="Giảm số lượng"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-ink">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => updateCartItem(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-xs font-bold text-ink hover:bg-white rounded transition-colors disabled:opacity-40 cursor-pointer"
                            aria-label="Tăng số lượng"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Item Button */}
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => removeCartItem(item.id)}
                          className="text-xs text-subtle hover:text-danger font-medium transition-colors cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Footer with Subtotal & Actions */}
          {isAuthenticated && items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-border bg-surface-secondary/40 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted font-medium">Tạm tính:</span>
                <span className="text-base font-black text-ink font-sans">
                  {cart?.totalAmountDisplay || '0 ₫'}
                </span>
              </div>
              <p className="text-[11px] text-subtle">
                Phí vận chuyển và chi phí bảo hiểm nhạc cụ sẽ được tính tại bước thanh toán.
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigateTo(CUSTOMER_ROUTES.cart)
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-border bg-white text-ink hover:bg-surface-secondary text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  Xem giỏ hàng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigateTo(CUSTOMER_ROUTES.cart)
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-md shadow-brand/20 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Thanh toán</span>
                  <IconChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default CartDrawer
