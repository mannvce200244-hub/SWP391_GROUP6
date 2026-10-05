import { useEffect, useState } from 'react'
import EditorialEyebrow from '../components/common/EditorialEyebrow.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import ProductCard from '../features/catalog/ProductCard.jsx'
import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../routes/customerRoutes.js'
import artisanService from '../services/artisanService.js'
import productService from '../services/productService.js'

function CraftVillageDetailPage({ slugOrId }) {
  const [pageState, setPageState] = useState({
    village: null,
    products: [],
    productsLoading: true,
    status: 'loading', // 'loading' | 'success' | 'not_found' | 'error'
  })
  const [retryKey, setRetryKey] = useState(0)

  // Fetch Craft Village Details and Associated Products
  useEffect(() => {
    let active = true

    artisanService
      .getCraftVillageBySlug(slugOrId)
      .then(async (village) => {
        if (!active) return
        if (!village) {
          setPageState({
            village: null,
            products: [],
            productsLoading: false,
            status: 'not_found',
          })
          return
        }

        setPageState({
          village,
          products: [],
          productsLoading: true,
          status: 'success',
        })

        try {
          const items = await productService.listProducts({ craftVillage: village.name })
          if (active) {
            setPageState((prev) => ({
              ...prev,
              products: Array.isArray(items) ? items : [],
              productsLoading: false,
            }))
          }
        } catch {
          if (active) {
            setPageState((prev) => ({
              ...prev,
              products: [],
              productsLoading: false,
            }))
          }
        }
      })
      .catch(() => {
        if (active) {
          setPageState({
            village: null,
            products: [],
            productsLoading: false,
            status: 'error',
          })
        }
      })

    return () => {
      active = false
    }
  }, [slugOrId, retryKey])

  // Document Title
  useEffect(() => {
    if (pageState.village?.name) {
      const originalTitle = document.title
      document.title = `${pageState.village.name} — Làng nghề truyền thống M4N`
      return () => {
        document.title = originalTitle
      }
    }
  }, [pageState.village?.name])

  const handleRetry = () => {
    setPageState({
      village: null,
      products: [],
      productsLoading: true,
      status: 'loading',
    })
    setRetryKey((k) => k + 1)
  }

  const villagesTabUrl = `${CUSTOMER_ROUTES.artisans}?tab=villages`

  // Loading State
  if (pageState.status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse flex flex-col gap-8">
        <div className="h-4 w-48 bg-surface-secondary rounded" />
        <div className="aspect-21/9 w-full bg-surface-secondary rounded-2xl" />
        <div className="space-y-4 max-w-3xl">
          <div className="h-8 w-72 bg-surface-secondary rounded" />
          <div className="h-4 w-full bg-surface-secondary rounded" />
          <div className="h-4 w-5/6 bg-surface-secondary rounded" />
        </div>
      </div>
    )
  }

  // Error State
  if (pageState.status === 'error') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ErrorState
          message="Không thể kết nối đến máy chủ để tải thông tin làng nghề. Vui lòng thử lại."
          onRetry={handleRetry}
          title="Lỗi tải dữ liệu làng nghề"
        />
      </div>
    )
  }

  // 404 Not Found State
  if (pageState.status === 'not_found' || !pageState.village) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          message="Không tìm thấy làng nghề bạn yêu cầu hoặc thông tin chưa được đăng ký trong hệ thống."
          title="Không tìm thấy làng nghề"
        >
          <div className="flex items-center gap-3 mt-4">
            <RouterLink
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand hover:bg-brand-hover transition-colors shadow-xs"
              href={villagesTabUrl}
            >
              Quay lại Nghệ nhân & Làng nghề
            </RouterLink>
          </div>
        </EmptyState>
      </div>
    )
  }

  const { village, products, productsLoading } = pageState

  return (
    <div className="w-full flex flex-col bg-white">
      {/* 1. TOP BREADCRUMB & BACK ACTION */}
      <div className="border-b border-border/70 bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <nav
            aria-label="Đường dẫn trang"
            className="flex items-center gap-2 text-xs sm:text-sm text-muted overflow-x-auto whitespace-nowrap scrollbar-none"
          >
            <RouterLink
              className="hover:text-ink transition-colors"
              href={CUSTOMER_ROUTES.home}
            >
              Trang chủ
            </RouterLink>
            <span aria-hidden="true" className="text-subtle">
              /
            </span>
            <RouterLink
              className="hover:text-ink transition-colors"
              href={CUSTOMER_ROUTES.artisans}
            >
              Nghệ nhân & Làng nghề
            </RouterLink>
            <span aria-hidden="true" className="text-subtle">
              /
            </span>
            <RouterLink
              className="hover:text-ink transition-colors"
              href={villagesTabUrl}
            >
              Làng nghề
            </RouterLink>
            <span aria-hidden="true" className="text-subtle">
              /
            </span>
            <span aria-current="page" className="text-ink font-semibold truncate max-w-[200px] sm:max-w-none">
              {village.name}
            </span>
          </nav>

          <RouterLink
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand hover:text-brand-hover shrink-0 transition-colors"
            href={villagesTabUrl}
          >
            <span aria-hidden="true">←</span> Quay lại Làng nghề
          </RouterLink>
        </div>
      </div>

      {/* 2. VILLAGE HERO LANDSCAPE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16 flex flex-col gap-10">
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-border aspect-16/9 sm:aspect-21/9 bg-surface-secondary shadow-sm">
          <img
            alt={village.name}
            className="w-full h-full object-cover"
            decoding="async"
            fetchPriority="high"
            height="500"
            src={village.coverImage || '/assets/images/artisan-workshop.jpg'}
            width="1200"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 pointer-events-none" />

          {/* Hero Caption */}
          <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 flex flex-col gap-2.5 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-white/95 text-ink tracking-wider uppercase border border-border/80 shadow-2xs">
                Làng nghề di sản
              </span>
              <span className="px-3 py-1 rounded-md text-xs font-medium bg-black/50 backdrop-blur-xs text-white/90 border border-white/20">
                {village.province || village.location}
              </span>
              {village.craft ? (
                <span className="px-3 py-1 rounded-md text-xs font-medium bg-brand/90 backdrop-blur-xs text-white border border-brand/40">
                  {village.craft}
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-sans mt-1">
              {village.name}
            </h1>

            <p className="text-sm sm:text-base text-white/85 font-medium max-w-2xl line-clamp-2 sm:line-clamp-none">
              {village.metadataText || `${village.craft} · ${village.province || village.location}`}
            </p>
          </div>
        </div>

        {/* 3. STORY & OVERVIEW SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 items-start">
          {/* Main Narrative Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <EditorialEyebrow label="CÂU CHUYỆN DI SẢN" />
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">
                Lịch sử và Kỹ nghệ truyền thống
              </h2>
            </div>

            <div className="prose prose-neutral max-w-none text-muted text-sm sm:text-base leading-relaxed space-y-4">
              <p className="text-base sm:text-lg text-ink/90 font-medium leading-relaxed">
                {village.description}
              </p>
              <p>
                Trải qua hàng trăm năm gìn giữ và tiếp nối, các nghệ nhân nơi đây luôn trung thành với phương pháp chế tác thủ công tinh xảo. Từng thớ gỗ, từng sợi tơ, từng chất liệu tự nhiên đều được tuyển chọn kỹ lưỡng, mang trọn tinh hoa và hồn cốt văn hóa dân tộc Việt Nam.
              </p>
              <p>
                Mỗi sản phẩm hoàn thiện không đơn thuần là một nhạc cụ hay tác phẩm thủ công, mà là kết tinh của sự kiên nhẫn, lòng say mê và tri thức bản địa tích lũy qua nhiều thế hệ truyền thừa.
              </p>
            </div>
          </div>

          {/* Sidebar Overview Card */}
          <div className="bg-surface rounded-2xl border border-border p-6 flex flex-col gap-5 shadow-xs">
            <h3 className="text-base font-bold text-ink font-sans pb-3 border-b border-border/80">
              Thông tin tổng quan
            </h3>

            <dl className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted font-normal">Địa phương</dt>
                <dd className="text-ink font-semibold text-right">
                  {village.province || village.location || 'Việt Nam'}
                </dd>
              </div>

              {village.craft && (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted font-normal">Đặc trưng nghề</dt>
                  <dd className="text-brand font-semibold text-right">
                    {village.craft}
                  </dd>
                </div>
              )}

              {village.region && (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted font-normal">Miền</dt>
                  <dd className="text-ink font-semibold text-right">
                    Miền {village.region}
                  </dd>
                </div>
              )}

              {village.artisanCount ? (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted font-normal">Nghệ nhân hợp tác</dt>
                  <dd className="text-ink font-semibold text-right">
                    {village.artisanCount} nghệ nhân
                  </dd>
                </div>
              ) : null}

              {village.productCount ? (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted font-normal">Bộ sưu tập</dt>
                  <dd className="text-ink font-semibold text-right">
                    {village.productCount} tác phẩm
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="pt-4 border-t border-border/80 flex flex-col gap-2.5">
              <RouterLink
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-brand text-white hover:bg-brand-hover transition-colors shadow-xs text-center"
                href={`${CUSTOMER_ROUTES.products}?craftVillage=${encodeURIComponent(village.name)}`}
              >
                Khám phá sản phẩm làng nghề <span aria-hidden="true">→</span>
              </RouterLink>
            </div>
          </div>
        </div>

        {/* 4. RELATED PRODUCTS / INSTRUMENTS SECTION */}
        <section aria-labelledby="related-products-heading" className="pt-8 border-t border-border/80 flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <EditorialEyebrow label="BỘ SƯU TẬP TỪ LÀNG NGHỀ" />
              <h2 id="related-products-heading" className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-ink font-sans">
                Nhạc cụ chế tác từ {village.name}
              </h2>
            </div>

            {products.length > 0 && (
              <RouterLink
                className="text-xs sm:text-sm font-semibold text-brand hover:text-brand-hover inline-flex items-center gap-1.5 transition-colors"
                href={`${CUSTOMER_ROUTES.products}?craftVillage=${encodeURIComponent(village.name)}`}
              >
                Xem tất cả ({products.length}) <span aria-hidden="true">→</span>
              </RouterLink>
            )}
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-3/4 rounded-xl bg-surface-secondary animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-surface-secondary/40 p-8 sm:p-12 text-center flex flex-col items-center gap-3">
              <p className="text-sm sm:text-base font-medium text-ink">
                Hiện tại các nhạc cụ từ {village.name} đang được nghệ nhân hoàn thiện cho đợt tuyển chọn tiếp theo.
              </p>
              <p className="text-xs sm:text-sm text-muted max-w-lg">
                Bạn có thể khám phá thêm các bộ sưu tập nhạc cụ truyền thống phong phú khác từ khắp các làng nghề Việt Nam trên M4N.
              </p>
              <RouterLink
                className="mt-2 inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-brand hover:bg-brand-hover transition-colors shadow-xs"
                href={CUSTOMER_ROUTES.products}
              >
                Xem danh mục nhạc cụ M4N
              </RouterLink>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default CraftVillageDetailPage
