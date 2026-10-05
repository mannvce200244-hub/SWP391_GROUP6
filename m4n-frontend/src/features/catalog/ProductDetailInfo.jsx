import { useState } from 'react'
import { IconShoppingBag } from '../../components/ui/Icons.jsx'
import { useToast } from '../../components/ui/useToast.js'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import { useCart } from '../cart/useCart.js'
import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'
import ArtisanVillageSection from './ArtisanVillageSection.jsx'
import ProductGallery from './ProductGallery.jsx'
import ProductSpecs from './ProductSpecs.jsx'
import QuantitySelector from './QuantitySelector.jsx'

function ProductDetailInfo({ product }) {
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [isBuying, setIsBuying] = useState(false)
  const { addToCart } = useCart()
  const { addToast } = useToast()

  if (!product) return null

  const isOutOfStock = product.availability === 'OUT_OF_STOCK'
  const categoryName = product.category?.name || product.groupName
  const artisanName = product.artisan?.name || product.artisanName
  const villageName = product.craftVillage?.name || product.craftVillageName
  const formattedPrice =
    product.priceDisplay ||
    (product.price != null ? formatCurrencyVND(product.price) : 'Liên hệ')

  const handleAddToCart = async () => {
    if (isOutOfStock || isAdding || isBuying) return

    try {
      setIsAdding(true)
      const result = await addToCart(product.id, quantity)

      if (result.requireAuth) {
        addToast({
          message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.',
          type: 'error',
        })
        navigateTo(CUSTOMER_ROUTES.login)
        return
      }

      if (result.success) {
        addToast({
          message: `Đã thêm ${quantity} nhạc cụ "${product.name}" vào giỏ hàng.`,
          type: 'success',
        })
      } else {
        addToast({
          message: result.message || 'Không thể thêm sản phẩm vào giỏ hàng.',
          type: 'error',
        })
      }
    } catch {
      addToast({
        message: 'Đã xảy ra lỗi khi thêm vào giỏ hàng.',
        type: 'error',
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (isOutOfStock || isAdding || isBuying) return

    try {
      setIsBuying(true)
      const result = await addToCart(product.id, quantity)

      if (result.requireAuth) {
        addToast({
          message: 'Vui lòng đăng nhập để tiến hành mua hàng.',
          type: 'info',
        })
        navigateTo(CUSTOMER_ROUTES.login)
        return
      }

      if (result.success) {
        addToast({
          message: `Đã chọn mua ${quantity} nhạc cụ "${product.name}".`,
          type: 'success',
        })
      } else {
        addToast({
          message: result.message || 'Không thể tiến hành mua hàng.',
          type: 'error',
        })
      }
    } catch {
      addToast({
        message: 'Đã xảy ra lỗi khi tiến hành mua hàng.',
        type: 'error',
      })
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
          <ProductGallery media={product.media} productName={product.name} />
        </div>

        {/* Right Column (5 cols): Details & Purchase */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-surface p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs">
          {/* Category Tag & Code */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <EditorialEyebrow label={categoryName || 'Nhạc cụ truyền thống'} />
            {product.code && (
              <span className="text-xs font-mono text-muted">Mã: {product.code}</span>
            )}
          </div>

          {/* Instrument Title */}
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-ink tracking-tight leading-snug">
            {product.name}
          </h1>

          {/* Price & Availability */}
          <div className="flex items-baseline justify-between gap-4 flex-wrap pt-1">
            <div className="text-2xl sm:text-3xl font-bold text-ink font-serif tracking-tight">
              {formattedPrice}
            </div>
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-muted text-muted border border-border">
                <span className="w-2 h-2 rounded-full bg-subtle" /> Tạm hết hàng
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-jade-soft/60 text-jade border border-jade-border/70">
                <span className="w-2 h-2 rounded-full bg-jade animate-pulse" /> Còn hàng {product.stockQuantity != null ? `(${product.stockQuantity} sản phẩm)` : ''}
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

          {/* Purchase / Add to Cart Actions */}
          <div className="pt-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted block">
                Số lượng
              </label>
              {product.stockQuantity != null && !isOutOfStock && (
                <span className="text-xs text-muted">
                  Kho hàng: <strong className="font-semibold text-ink">{product.stockQuantity}</strong> sản phẩm có sẵn
                </span>
              )}
            </div>

            {/* Row 1: Quantity Selector + Add to Cart */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <QuantitySelector
                disabled={isOutOfStock || isAdding || isBuying}
                max={product.stockQuantity != null && product.stockQuantity > 0 ? product.stockQuantity : (isOutOfStock ? 0 : 99)}
                min={1}
                onChange={setQuantity}
                value={quantity}
              />
              <button
                aria-label={isOutOfStock ? 'Sản phẩm tạm hết hàng' : 'Thêm nhạc cụ vào giỏ hàng'}
                className="flex-1 h-11 px-4 rounded-lg text-sm font-semibold text-brand bg-brand-soft/60 hover:bg-brand-soft border border-brand/30 active:bg-brand-soft/90 transition-all duration-150 flex items-center justify-center gap-2 shadow-2xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                disabled={isOutOfStock || isAdding || isBuying}
                onClick={handleAddToCart}
                type="button"
              >
                <IconShoppingBag size={18} />
                <span>
                  {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                </span>
              </button>
            </div>

            {/* Row 2: Buy Now Primary Button */}
            <button
              aria-label={isOutOfStock ? 'Sản phẩm tạm hết hàng' : `Mua ngay ${product.name}`}
              className="w-full h-12 px-6 rounded-lg text-sm font-bold uppercase tracking-wider text-white bg-brand hover:bg-brand-hover active:bg-brand-dark transition-all duration-150 flex items-center justify-center gap-2 shadow-xs hover:shadow-md disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              disabled={isOutOfStock || isAdding || isBuying}
              onClick={handleBuyNow}
              type="button"
            >
              <span>
                {isOutOfStock
                  ? 'Tạm hết hàng'
                  : isBuying
                    ? 'Đang xử lý...'
                    : 'Mua hàng'}
              </span>
              {!isOutOfStock && !isBuying && (
                <span aria-hidden="true" className="text-base font-normal">→</span>
              )}
            </button>
          </div>

          {/* Craft Trust Guarantees */}
          <div className="mt-4 pt-4 border-t border-border/60 flex flex-col gap-2 text-xs text-muted">
            <div className="flex items-center gap-2">
              <span className="text-jade font-bold">✓</span>
              <span>Chế tác thủ công chuẩn quy cách di sản âm nhạc dân tộc</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-jade font-bold">✓</span>
              <span>Kiểm định âm sắc và căn chỉnh bởi nghệ nhân</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-jade font-bold">✓</span>
              <span>Đóng gói chuyên dụng chống sốc trong quá trình vận chuyển</span>
            </div>
          </div>
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
    </article>
  )
}

export default ProductDetailInfo
