import { createPortal } from 'react-dom'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import ErrorState from '../../components/ui/ErrorState.jsx'
import LoadingState from '../../components/ui/LoadingState.jsx'
import {
  ShoppingBag,
  ChevronRight,
  ArrowRight,
  X,
} from 'lucide-react'
import CartDrawerItem from './CartDrawerItem.jsx'
import useCart from './useCart.js'
import useAuth from '../auth/useAuth.js'
import useToast from '../../components/ui/useToast.js'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import { formatCurrencyVND } from '../../utils/currency.js'

function CartDrawer({ isOpen, onClose }) {
  const {
    cart, cartItemCount, updateCartItem, removeCartItem, loading, error, refreshCart,
    selectedCartItemIds, selectedCartItems, allCartItemsSelected,
    toggleCartItemSelection, selectAllCartItems,
  } = useCart()
  const { isAuthenticated } = useAuth()
  const { addToast } = useToast()
  const drawerRef = useDialogFocus(isOpen, onClose)

  const handleQuantityChange = async (item, quantity) => {
    const result = await updateCartItem(item.id, quantity)
    if (!result.success) addToast({ message: result.message, type: 'error' })
  }

  const handleRemoveItem = async (item) => {
    const result = await removeCartItem(item.id)
    addToast({
      message: result.success
        ? `Đã xóa "${item.productName}" khỏi giỏ hàng.`
        : result.message || 'Không thể xóa sản phẩm khỏi giỏ hàng.',
      type: result.success ? 'success' : 'error',
    })
  }

  if (!isOpen) return null

  const items = cart?.items || []
  const selectedIds = new Set(selectedCartItemIds)
  const selectedTotal = selectedCartItems.reduce((total, item) => total + Number(item.subtotal || 0), 0)

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Giỏ hàng của bạn">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 flex w-full max-w-md pl-4 sm:pl-0">
        <div ref={drawerRef} className="w-full min-w-0 h-full min-h-0 bg-white shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-250">
          
          {/* Drawer Header */}
          <div className="shrink-0 p-5 sm:p-6 border-b border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-xl bg-brand-soft text-brand flex items-center justify-center border border-brand-border">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink font-sans">
                  Giỏ hàng của bạn
                </h3>
                {cartItemCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-soft text-brand border border-brand-border">
                    {cartItemCount}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-muted hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
              aria-label="Đóng giỏ hàng"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
            {!isAuthenticated ? (
              /* Require Login State */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-soft text-brand flex items-center justify-center border border-brand-border">
                  <ShoppingBag size={28} />
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold shadow-md shadow-brand/20 hover:bg-brand-hover transition-all cursor-pointer"
                >
                  <span>Đăng nhập ngay</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : loading && !cart ? (
              <LoadingState message="Đang tải giỏ hàng…" />
            ) : error ? (
              <ErrorState message={error} onRetry={refreshCart} />
            ) : items.length === 0 ? (
              /* Empty Cart State */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-secondary text-subtle flex items-center justify-center border border-border">
                  <ShoppingBag size={28} />
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold shadow-md shadow-brand/20 hover:bg-brand-hover transition-all cursor-pointer"
                >
                  <span>Khám phá nhạc cụ</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                  <label className="min-h-11 inline-flex items-center gap-3 text-sm font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      name="selectAllCartItems"
                      checked={allCartItemsSelected}
                      ref={(input) => { if (input) input.indeterminate = selectedCartItems.length > 0 && !allCartItemsSelected }}
                      disabled={loading}
                      onChange={(event) => selectAllCartItems(event.target.checked)}
                      className="h-5 w-5 accent-brand"
                    />
                    <span>Chọn tất cả</span>
                  </label>
                  <span className="text-xs text-muted" aria-live="polite">Đã chọn {selectedCartItems.length}/{items.length}</span>
                </div>
                <div className="divide-y divide-border/60">
                  {items.map((item) => (
                    <CartDrawerItem
                      key={item.id}
                      item={item}
                      selected={selectedIds.has(item.id)}
                      loading={loading}
                      onToggle={toggleCartItemSelection}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                      onClose={onClose}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer with Subtotal & Actions */}
          {isAuthenticated && items.length > 0 && (
            <div className="shrink-0 p-5 sm:p-6 border-t border-border bg-surface-secondary/40 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted font-medium">Tạm tính đã chọn:</span>
                <span className="text-base font-bold text-ink font-sans tabular-nums" aria-live="polite">
                  {formatCurrencyVND(selectedTotal)}
                </span>
              </div>
              <p className="text-xs text-subtle">
                Giá và mã giảm giá được kiểm tra lại khi đặt hàng. Tồn kho được xác nhận khi nhân viên xử lý đơn hàng.
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigateTo(CUSTOMER_ROUTES.cart)
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-border bg-white text-ink hover:bg-surface-secondary text-sm font-semibold transition-colors cursor-pointer text-center"
                >
                  Xem giỏ hàng
                </button>
                <button
                  type="button"
                  disabled={loading || Boolean(error) || selectedCartItems.length === 0}
                  onClick={() => {
                    onClose()
                    navigateTo(CUSTOMER_ROUTES.checkout)
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold shadow-md shadow-brand/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Thanh toán</span>
                  <ChevronRight size={15} />
                </button>
              </div>
              {selectedCartItems.length === 0 && <p className="text-xs text-muted" role="status">Chọn ít nhất một sản phẩm để thanh toán.</p>}
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body,
  )
}

export default CartDrawer
