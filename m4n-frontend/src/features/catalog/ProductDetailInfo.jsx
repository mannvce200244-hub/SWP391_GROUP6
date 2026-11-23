import { useState } from 'react'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { useToast } from '../../components/ui/useToast.js'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import { useCart } from '../cart/useCart.js'
import useAuth from '../auth/useAuth.js'
import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'
import ArtisanVillageSection from './ArtisanVillageSection.jsx'
import ProductGallery from './ProductGallery.jsx'
import ProductSpecs from './ProductSpecs.jsx'
import QuantitySelector from '../../components/ui/QuantitySelector.jsx'
import ProductVariantPicker from './ProductVariantPicker.jsx'
import ProductPurchaseDialog from './ProductPurchaseDialog.jsx'
import { additionalQuantityLimit, hasProductVariants } from './productPurchase.js'

function ProductDetailInfo({ product, switching = false, onSelectVariant }) {
  const [quantityState, setQuantityState] = useState({ id: product?.id, value: 1 })
  const quantity = quantityState.id === product?.id ? quantityState.value : 1
  const setQuantity = (value) => setQuantityState({ id: product.id, value })
  const [isAdding, setIsAdding] = useState(false)
  const [isBuying, setIsBuying] = useState(false)
  const [purchaseMode, setPurchaseMode] = useState(null)
  const { addToCart, buyNow, cart, loading: cartLoading } = useCart()
  const { isAuthenticated, user } = useAuth()
  const { addToast } = useToast()
  if (quantityState.id !== product?.id) setQuantityState({ id: product?.id, value: 1 })

  if (!product) return null

  const isOutOfStock = product.availability === 'OUT_OF_STOCK'
  const hasVariants = hasProductVariants(product)
  const categoryName = product.category?.name || product.groupName
  const artisanName = product.artisan?.name || product.artisanName
  const villageName = product.craftVillage?.name || product.craftVillageName
  const formattedPrice =
    product.priceDisplay ||
    (product.price != null ? formatCurrencyVND(product.price) : 'Liên hệ')
  const canPurchase = !isAuthenticated || user?.role === 'CUSTOMER'
  const inCart = cart?.items?.find((item) => item.productId === product.id)?.quantity ?? 0
  const remainingForCart = Math.max(0, (product.stockQuantity ?? 0) - inCart)
  const exceedsCartStock = inCart > 0 && quantity > remainingForCart

  const handleAddToCart = async (selected, amount) => {
    const selectedInCart = cart?.items?.find(item => item.productId === selected.id)?.quantity ?? 0
    if (switching || isAdding || isBuying || cartLoading || !Number.isSafeInteger(amount) || amount < 1
      || amount > additionalQuantityLimit(selected.stockQuantity, selectedInCart)) return false

    try {
      setIsAdding(true)
      const result = await addToCart(selected.id, amount)

      if (result.requireAuth) {
        addToast({
          message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.',
          type: 'error',
        })
        navigateTo(CUSTOMER_ROUTES.login)
        return false
      }

      if (result.success) {
        addToast({
          message: `Đã thêm ${amount} nhạc cụ “${selected.name}” vào giỏ hàng.`,
          type: 'success',
        })
        onSelectVariant?.(selected)
        return true
      } else {
        addToast({
          message: result.message || 'Không thể thêm sản phẩm vào giỏ hàng.',
          type: 'error',
        })
        return false
      }
    } catch {
      addToast({
        message: 'Đã xảy ra lỗi khi thêm vào giỏ hàng.',
        type: 'error',
      })
      return false
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = async (selected, amount) => {
    if (switching || isAdding || isBuying || !Number.isSafeInteger(amount) || amount < 1 || amount > selected.stockQuantity) return false

    try {
      setIsBuying(true)
      const result = await buyNow(selected.id, amount)

      if (result.requireAuth) {
        addToast({
          message: 'Vui lòng đăng nhập để tiến hành mua hàng.',
          type: 'info',
        })
        navigateTo(CUSTOMER_ROUTES.login)
        return false
      }

      if (result.success) {
        addToast({
          message: `Đã chọn mua ${amount} nhạc cụ “${selected.name}”.`,
          type: 'success',
        })
        navigateTo(result.checkoutUrl)
        return true
      } else {
        addToast({
          message: result.message || 'Không thể tiến hành mua hàng.',
          type: 'error',
        })
        return false
      }
    } catch {
      addToast({
        message: 'Đã xảy ra lỗi khi tiến hành mua hàng.',
        type: 'error',
      })
      return false
    } finally {
      setIsBuying(false)
    }
  }

  return (
    <article className="flex flex-col gap-12">
      {/* Top Section: 12 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column (7 cols): Gallery */}
        <div className="lg:col-span-7">
          <ProductGallery key={product.id} media={product.media} productName={product.name} />
        </div>

        {/* Right Column (5 cols): Details & Purchase */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-surface p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs">
          {/* Category Tag & Code */}
          {Number(product.productDiscountAmount) > 0 && <p className="text-sm text-jade">Giảm theo sản phẩm {formatCurrencyVND(product.productDiscountAmount)} · Giá niêm yết <del>{formatCurrencyVND(product.originalPrice)}</del></p>}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <EditorialEyebrow label={categoryName || 'Nhạc cụ truyền thống'} />
            {product.code && (
              <span className="text-xs font-mono text-muted">Mã: {product.code}</span>
            )}
          </div>

          {/* Instrument Title */}
          <h1 className="break-words text-2xl sm:text-3xl font-bold font-sans text-ink tracking-tight leading-snug">
            {product.name}
          </h1>

          {/* Price & Availability */}
          <div className="flex items-baseline justify-between gap-4 flex-wrap pt-1">
            <div className="text-2xl sm:text-3xl font-bold text-brand font-sans tracking-tight">
              {formattedPrice}
            </div>
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-muted text-muted border border-border">
                <span className="w-2 h-2 rounded-full bg-subtle" /> Tạm hết hàng
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-secondary text-jade border border-jade-border/70">
                <span className="w-2 h-2 rounded-full bg-jade" /> {product.availability === 'LOW_STOCK' ? 'Sắp hết hàng' : 'Có hàng tại thời điểm kiểm tra'}
              </span>
            )}
          </div>

          {/* Thin Divider */}
          <div className="border-t border-border/60 my-1" />

          {/* Quick Summary Chips */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {product.material && (
              <div className="bg-surface-secondary/40 p-2.5 rounded-lg border border-border/50">
                <span className="text-muted block text-2xs uppercase tracking-wider font-medium">Chất liệu</span>
                <span className="font-semibold text-ink truncate block mt-0.5">{product.material}</span>
              </div>
            )}
            {product.origin && (
              <div className="bg-surface-secondary/40 p-2.5 rounded-lg border border-border/50">
                <span className="text-muted block text-2xs uppercase tracking-wider font-medium">Xuất xứ</span>
                <span className="font-semibold text-ink truncate block mt-0.5">{product.origin}</span>
              </div>
            )}
            {artisanName && (
              <div className="bg-surface-secondary/40 p-2.5 rounded-lg border border-border/50">
                <span className="text-muted block text-2xs uppercase tracking-wider font-medium">Nghệ nhân</span>
                <span className="font-semibold text-ink truncate block mt-0.5">{artisanName}</span>
              </div>
            )}
            {villageName && (
              <div className="bg-surface-secondary/40 p-2.5 rounded-lg border border-border/50">
                <span className="text-muted block text-2xs uppercase tracking-wider font-medium">Làng nghề</span>
                <span className="font-semibold text-ink truncate block mt-0.5">{villageName}</span>
              </div>
            )}
          </div>

          {(product.familyId || product.variantGroup) ? (
            <ProductVariantPicker product={product} disabled={isAdding || isBuying} switching={switching} onSelect={onSelectVariant} />
          ) : (
            product.variantLabel && <p role="status" className="text-sm text-muted">Đang chọn: <strong className={isOutOfStock ? 'text-muted' : 'text-ink'}>{product.variantLabel}</strong> · {formattedPrice}{switching ? ' · Đang kiểm tra thông tin…' : ''}</p>
          )}
          {/* Purchase / Add to Cart Actions */}
          {canPurchase ? (
          <div className="pt-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted block">
                Số lượng
              </label>
              {!isOutOfStock && (
                <span className="text-xs text-jade font-medium">
                  Tồn kho sẽ được xác nhận khi xử lý đơn
                </span>
              )}
            </div>

            {/* Row 1: Quantity Selector + Add to Cart */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <QuantitySelector
                key={product.id}
                disabled={switching || isOutOfStock || isAdding || isBuying || cartLoading}
                max={product.stockQuantity != null && product.stockQuantity > 0 ? product.stockQuantity : (isOutOfStock ? 0 : 99)}
                min={1}
                onChange={setQuantity}
                value={quantity}
              />
              <button
                aria-label={isOutOfStock && !hasVariants ? 'Sản phẩm tạm hết hàng' : 'Thêm nhạc cụ vào giỏ hàng'}
                className="flex-1 h-11 px-4 rounded-lg text-sm font-semibold text-brand bg-brand-soft/60 hover:bg-brand-soft border border-brand/30 active:bg-brand-soft/90 transition-all duration-150 flex items-center justify-center gap-2 shadow-2xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                disabled={switching || isAdding || isBuying || cartLoading || (!hasVariants && (isOutOfStock || exceedsCartStock))}
                onClick={() => setPurchaseMode('cart')}
                aria-haspopup="dialog"
                type="button"
              >
                <ShoppingBag size={18} />
                <span>
                  {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                </span>
              </button>
            </div>

            {inCart > 0 && <p role="status" className={`text-xs ${exceedsCartStock ? 'text-danger' : 'text-muted'}`}>
              Đã có {inCart} sản phẩm trong giỏ. {remainingForCart > 0 ? `Có thể thêm tối đa ${remainingForCart} sản phẩm.` : 'Đã đạt số lượng tồn kho.'}
            </p>}

            {/* Row 2: Buy Now Primary Button */}
            <button
              aria-label={isOutOfStock && !hasVariants ? 'Sản phẩm tạm hết hàng' : `Mua ngay ${product.name}`}
              className="w-full h-12 px-6 rounded-lg text-sm font-bold uppercase tracking-wider text-white bg-brand hover:bg-brand-hover active:bg-brand-dark transition-all duration-150 flex items-center justify-center gap-2 shadow-xs hover:shadow-md disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              disabled={switching || (isOutOfStock && !hasVariants) || isAdding || isBuying}
              onClick={() => setPurchaseMode('buy')}
              aria-haspopup="dialog"
              type="button"
            >
              <span>
                {isOutOfStock
                  ? hasVariants ? 'Chọn biến thể để mua' : 'Tạm hết hàng'
                  : isBuying
                    ? 'Đang xử lý...'
                    : 'Mua hàng'}
              </span>
              {!isOutOfStock && !isBuying && (
                <ArrowRight size={16} aria-hidden="true" />
              )}
            </button>
          </div>
          ) : (
            <div className="mt-2 rounded-lg border border-border bg-surface-secondary p-3 text-sm text-muted">
              Tài khoản nhân sự chỉ có quyền xem thông tin sản phẩm. Vui lòng sử dụng đúng bàn làm việc theo vai trò.
            </div>
          )}

          <p className="mt-4 pt-4 border-t border-border/60 text-xs text-muted">
            Giá và tồn kho hiển thị có thể thay đổi; hệ thống xác nhận lại khi đơn hàng được xử lý.
          </p>
        </div>
      </div>

      {/* Bottom Sections with Thin Dividers */}
      <div className="border-t border-border/70 pt-8 flex flex-col divide-y divide-border/60">
        {/* Description & Acoustic Characteristic */}
        {product.description && (
          <section aria-labelledby="product-desc-heading" className="pb-8">
            <h2
              className="text-lg sm:text-xl font-bold text-ink tracking-tight mb-4"
              id="product-desc-heading"
            >
              Mô tả & Âm sắc
            </h2>
            <div className="prose prose-neutral max-w-none text-ink/80 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </section>
        )}

        {/* Technical Specifications */}
        <ProductSpecs product={product} />

        {/* Artisan & Craft Village Section */}
        <ArtisanVillageSection
          artisan={product.artisan || product.artisanName}
          craftVillage={product.craftVillage || product.craftVillageName}
        />
      </div>
      {purchaseMode && <ProductPurchaseDialog key={product.id} product={product} initialQuantity={quantity}
        confirmLabel={purchaseMode === 'buy' ? 'Mua ngay' : 'Thêm vào giỏ hàng'}
        onClose={() => setPurchaseMode(null)} disabled={isAdding || isBuying || (purchaseMode === 'cart' && cartLoading)}
        quantityLimit={purchaseMode === 'cart' ? selected => additionalQuantityLimit(selected.stockQuantity,
          cart?.items?.find(item => item.productId === selected.id)?.quantity ?? 0) : undefined}
        onConfirm={purchaseMode === 'buy' ? handleBuyNow : handleAddToCart} />}
    </article>
  )
}

export default ProductDetailInfo
