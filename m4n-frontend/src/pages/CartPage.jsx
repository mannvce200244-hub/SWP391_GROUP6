import useCart from '../features/cart/useCart.js'
import useAuth from '../features/auth/useAuth.js'
import {
  IconShoppingBag,
  IconInstrument,
  IconArrowRight,
  IconChevronRight,
  IconCheck,
  IconShield,
} from '../components/ui/Icons.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'

function CartPage() {
  const { cart, cartItemCount, updateCartItem, removeCartItem, loading } = useCart()
  const { isAuthenticated } = useAuth()

  const items = cart?.items || []

  return (
    <div className="w-full bg-surface-secondary/40 min-h-[calc(100vh-80px)] py-8 sm:py-12">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb & Title */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            <button
              type="button"
              onClick={() => navigateTo(CUSTOMER_ROUTES.home)}
              className="hover:text-ink transition-colors cursor-pointer"
            >
              Trang chủ
            </button>
            <span className="text-subtle">/</span>
            <span className="text-brand font-bold">Giỏ hàng của bạn</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-ink font-sans">
                Giỏ hàng nhạc cụ
              </h1>
              {cartItemCount > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-soft text-brand border border-brand-border">
                  {cartItemCount} sản phẩm
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigateTo(CUSTOMER_ROUTES.products)}
              className="self-start sm:self-center inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline cursor-pointer"
            >
              <span>Tiếp tục chọn nhạc cụ</span>
              <IconArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          /* Login Prompt */
          <div className="rounded-[32px] bg-white border border-border/80 p-12 text-center shadow-sm max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mx-auto border border-brand-border">
              <IconShoppingBag size={28} />
            </div>
            <h3 className="text-xl font-black text-ink">
              Vui lòng đăng nhập tài khoản
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Đăng nhập để xem danh sách nhạc cụ đã thêm vào giỏ hàng và tiến hành đặt hàng an toàn.
            </p>
            <button
              type="button"
              onClick={() => navigateTo(CUSTOMER_ROUTES.login)}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-brand hover:bg-brand-hover text-white text-sm font-bold shadow-md shadow-brand/20 transition-all cursor-pointer"
            >
              <span>Đăng nhập ngay</span>
              <IconArrowRight size={15} />
            </button>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="rounded-[32px] bg-white border border-border/80 p-12 text-center shadow-sm max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-secondary text-subtle flex items-center justify-center mx-auto border border-border">
              <IconShoppingBag size={28} />
            </div>
            <h3 className="text-xl font-black text-ink">
              Giỏ hàng của bạn đang trống
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Bạn chưa chọn nhạc cụ truyền thống nào. Hãy dạo quanh bộ sưu tập di sản M4N để lựa chọn tác phẩm ưng ý nhất.
            </p>
            <button
              type="button"
              onClick={() => navigateTo(CUSTOMER_ROUTES.products)}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-brand hover:bg-brand-hover text-white text-sm font-bold shadow-md shadow-brand/20 transition-all cursor-pointer"
            >
              <span>Khám phá bộ sưu tập</span>
              <IconArrowRight size={15} />
            </button>
          </div>
        ) : (
          /* Cart Items Grid */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
            
            {/* Left: Items List */}
            <div className="rounded-[32px] bg-white border border-border/80 p-6 sm:p-8 shadow-sm divide-y divide-border/60">
              {items.map((item) => (
                <div key={item.id} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-20 h-20 rounded-2xl bg-surface-secondary border border-border/80 flex items-center justify-center overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-brand">
                          <IconInstrument size={28} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3
                        className="text-base font-bold text-ink truncate cursor-pointer hover:text-brand transition-colors"
                        onClick={() => {
                          if (item.productId) {
                            navigateTo(CUSTOMER_ROUTES.productDetail(item.productId))
                          }
                        }}
                      >
                        {item.productName}
                      </h3>
                      {item.productCode && (
                        <p className="text-xs text-subtle mt-0.5 font-mono">
                          Mã: {item.productCode}
                        </p>
                      )}
                      <p className="text-sm font-black text-brand mt-1">
                        {item.unitPriceDisplay}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 shrink-0 pt-2 sm:pt-0">
                    {/* Quantity Selector */}
                    <div className="inline-flex items-center border border-border rounded-xl bg-surface-secondary/60 p-1">
                      <button
                        type="button"
                        disabled={loading || item.quantity <= 1}
                        onClick={() => updateCartItem(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-xs font-bold text-ink hover:bg-white rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                        aria-label="Giảm số lượng"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-xs font-bold text-ink">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => updateCartItem(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-xs font-bold text-ink hover:bg-white rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right min-w-[100px]">
                      <span className="text-sm font-black text-ink block">
                        {item.subtotalDisplay}
                      </span>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => removeCartItem(item.id)}
                        className="text-xs text-subtle hover:text-danger font-medium transition-colors cursor-pointer mt-1"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Summary Box */}
            <div className="rounded-[28px] bg-white border border-border/80 p-6 sm:p-7 shadow-sm space-y-5 sticky top-24">
              <h3 className="text-lg font-black text-ink font-sans pb-3 border-b border-border/60">
                Tóm tắt đơn hàng
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-muted">
                  <span>Số lượng nhạc cụ:</span>
                  <span className="font-bold text-ink">{cartItemCount} sản phẩm</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Tạm tính tiền hàng:</span>
                  <span className="font-bold text-ink">{cart?.totalAmountDisplay}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-baseline justify-between">
                <span className="text-sm font-bold text-ink">Tổng tạm tính:</span>
                <span className="text-2xl font-black text-brand font-sans">
                  {cart?.totalAmountDisplay}
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigateTo(CUSTOMER_ROUTES.checkout)}
                className="w-full h-12 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>Tiến hành thanh toán</span>
                <IconChevronRight size={16} />
              </button>

              <div className="pt-2 flex flex-col gap-2 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="text-brand shrink-0" />
                  <span>Bảo hành âm thanh và nứt gãy 12 tháng</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconShield size={14} className="text-brand shrink-0" />
                  <span>Đóng gói hộp xốp & khung gỗ tiêu chuẩn</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

export default CartPage
