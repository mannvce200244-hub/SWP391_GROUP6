import { useEffect, useState } from 'react'
import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'
import ProductCard from '../catalog/ProductCard.jsx'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'
import productService from '../../services/productService.js'

function ArtisanProductsSection() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    productService
      .listProducts()
      .then((items) => {
        if (active) {
          // Take first 4 instruments from real catalog
          setProducts(items.slice(0, 4))
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <section
      aria-labelledby="artisan-products-heading"
      className="py-16 sm:py-20 bg-surface border-t border-border/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8 sm:gap-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-2xl flex flex-col gap-2">
            <EditorialEyebrow label="TỪ NGƯỜI LÀM ĐẾN NGƯỜI DÙNG" />
            <h2
              id="artisan-products-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans"
            >
              Khám phá sản phẩm từ những đôi tay tài hoa
            </h2>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              Mỗi sản phẩm là kết quả của kỹ thuật, thời gian và câu chuyện của người làm ra nó.
            </p>
          </div>

          <RouterLink
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-hover group shrink-0"
            href={CUSTOMER_ROUTES.products}
          >
            <span>Xem tất cả sản phẩm</span>
            <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
          </RouterLink>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-surface-secondary/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : null}

        <div className="sm:hidden text-center mt-2">
          <RouterLink
            className="inline-flex items-center justify-center font-bold transition-colors border border-border bg-surface text-ink hover:bg-surface-secondary h-11 px-5 text-sm rounded-xl w-full shadow-xs"
            href={CUSTOMER_ROUTES.products}
          >
            Xem tất cả sản phẩm →
          </RouterLink>
        </div>
      </div>
    </section>
  )
}

export default ArtisanProductsSection
