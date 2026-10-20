import { useEffect, useState } from 'react'
import ProductCard from './ProductCard.jsx'
import productService from '../../services/productService.js'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'
import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'

function RelatedProducts({ currentProduct }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    productService
      .listProducts()
      .then((allProducts) => {
        if (!active || !Array.isArray(allProducts)) return

        const currentId = String(currentProduct?.id || '')
        const currentGroup = (
          currentProduct?.category?.name ||
          currentProduct?.groupName ||
          ''
        ).toLowerCase()
        const currentVillage = (
          currentProduct?.craftVillage?.name ||
          currentProduct?.craftVillageName ||
          ''
        ).toLowerCase()
        const currentArtisan = (
          currentProduct?.artisan?.name ||
          currentProduct?.artisanName ||
          ''
        ).toLowerCase()

        // Filter out current product
        const candidates = allProducts.filter(
          (p) => String(p.id) !== currentId,
        )

        // Relevance scoring
        const scored = candidates.map((p) => {
          let score = 0
          const pGroup = (p.category?.name || p.groupName || '').toLowerCase()
          const pVillage = (
            p.craftVillage?.name ||
            p.craftVillageName ||
            ''
          ).toLowerCase()
          const pArtisan = (
            p.artisan?.name ||
            p.artisanName ||
            ''
          ).toLowerCase()

          if (
            currentGroup &&
            pGroup &&
            (pGroup.includes(currentGroup) || currentGroup.includes(pGroup))
          ) {
            score += 3
          }
          if (
            currentVillage &&
            pVillage &&
            (pVillage.includes(currentVillage) || currentVillage.includes(pVillage))
          ) {
            score += 2
          }
          if (
            currentArtisan &&
            pArtisan &&
            (pArtisan.includes(currentArtisan) || currentArtisan.includes(pArtisan))
          ) {
            score += 2
          }

          return { product: p, score }
        })

        // Sort descending by relevance score
        scored.sort((a, b) => b.score - a.score)

        const topRecommendations = scored
          .slice(0, 4)
          .map((item) => item.product)
        setProducts(topRecommendations)
      })
      .catch(() => {
        if (active) setProducts([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [currentProduct])

  if (!loading && products.length === 0) {
    return null
  }

  return (
    <section
      aria-labelledby="related-products-heading"
      className="mt-16 pt-12 border-t border-border"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div>
            <EditorialEyebrow showResonance={false} label="GỢI Ý DÀNH CHO BẠN" />
          </div>
          <h2
            id="related-products-heading"
            className="text-xl sm:text-2xl font-bold text-ink tracking-tight mt-1"
          >
            Nhạc cụ liên quan cùng dòng chế tác
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Khám phá thêm các nhạc cụ truyền thống cùng âm vực hoặc kỹ nghệ chế tác tinh hoa.
          </p>
        </div>

        <RouterLink
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover transition-colors shrink-0"
          href={CUSTOMER_ROUTES.products}
        >
          <span>Xem tất cả sản phẩm</span>
          <span aria-hidden="true">→</span>
        </RouterLink>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-border bg-surface-secondary/40 p-3 h-80 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((item, idx) => (
            <div key={item.id || idx}>
              <ProductCard priority={idx < 2} product={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default RelatedProducts
