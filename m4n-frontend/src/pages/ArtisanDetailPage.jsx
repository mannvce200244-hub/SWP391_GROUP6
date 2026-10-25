import { useEffect, useState } from 'react'
import EditorialEyebrow from '../components/common/EditorialEyebrow.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import ProductCard from '../features/catalog/ProductCard.jsx'
import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../routes/customerRoutes.js'
import artisanService from '../services/artisanService.js'
import productService from '../services/productService.js'

function ArtisanDetailPage({ artisanId }) {
  const [retryKey, setRetryKey] = useState(0)
  const [pageState, setPageState] = useState({
    artisan: null,
    products: [],
    productsLoading: true,
    status: 'loading',
  })

  useEffect(() => {
    let active = true

    artisanService
      .getArtisanById(artisanId)
      .then(async (artisan) => {
        if (!active) return

        if (!artisan) {
          setPageState({
            artisan: null,
            products: [],
            productsLoading: false,
            status: 'not_found',
          })
          return
        }

        setPageState({
          artisan,
          products: [],
          productsLoading: true,
          status: 'success',
        })

        try {
          const products = await productService.listProducts({
            artisan: artisan.name,
            page: 1,
            size: 4,
          })

          if (active) {
            setPageState((current) => ({
              ...current,
              products: Array.isArray(products) ? products : [],
              productsLoading: false,
            }))
          }
        } catch {
          if (active) {
            setPageState((current) => ({
              ...current,
              products: [],
              productsLoading: false,
            }))
          }
        }
      })
      .catch(() => {
        if (active) {
          setPageState({
            artisan: null,
            products: [],
            productsLoading: false,
            status: 'error',
          })
        }
      })

    return () => {
      active = false
    }
  }, [artisanId, retryKey])

  useEffect(() => {
    if (!pageState.artisan?.name) return undefined

    const originalTitle = document.title
    document.title = `${pageState.artisan.name} — M4N`

    return () => {
      document.title = originalTitle
    }
  }, [pageState.artisan?.name])

  const handleRetry = () => {
    setPageState({
      artisan: null,
      products: [],
      productsLoading: true,
      status: 'loading',
    })
    setRetryKey((current) => current + 1)
  }

  if (pageState.status === 'loading') {
    return (
      <div className="mx-auto grid min-h-[560px] max-w-7xl animate-pulse gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:px-8 lg:py-16">
        <div className="aspect-4/5 rounded-2xl bg-surface-secondary" />
        <div className="flex flex-col justify-center gap-5">
          <div className="h-4 w-40 rounded bg-surface-secondary" />
          <div className="h-12 w-4/5 rounded bg-surface-secondary" />
          <div className="h-4 w-full rounded bg-surface-secondary" />
          <div className="h-4 w-5/6 rounded bg-surface-secondary" />
        </div>
      </div>
    )
  }

  if (pageState.status === 'error') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState
          message="Không thể tải câu chuyện nghệ nhân. Vui lòng kiểm tra kết nối và thử lại."
          onRetry={handleRetry}
          title="Lỗi tải thông tin nghệ nhân"
        />
      </div>
    )
  }

  if (pageState.status === 'not_found' || !pageState.artisan) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          message="Nghệ nhân này không tồn tại hoặc thông tin chưa được công bố."
          title="Không tìm thấy nghệ nhân"
        >
          <RouterLink
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
            href={CUSTOMER_ROUTES.artisans}
          >
            Quay lại danh sách nghệ nhân
          </RouterLink>
        </EmptyState>
      </div>
    )
  }

  const { artisan, products, productsLoading } = pageState
  const productFilterUrl = `${CUSTOMER_ROUTES.products}?${new URLSearchParams({
    artisan: artisan.name.trim(),
  }).toString()}`
  const biographyParagraphs = artisan.description
    ? artisan.description.split(/\n+/).filter(Boolean)
    : []

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-border bg-surface-secondary">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <nav
            aria-label="Đường dẫn trang"
            className="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap text-xs text-muted sm:text-sm"
          >
            <RouterLink className="transition-colors hover:text-ink" href={CUSTOMER_ROUTES.home}>
              Trang chủ
            </RouterLink>
            <span aria-hidden="true">/</span>
            <RouterLink className="transition-colors hover:text-ink" href={CUSTOMER_ROUTES.artisans}>
              Nghệ nhân & Làng nghề
            </RouterLink>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="max-w-56 truncate font-semibold text-ink">
              {artisan.name}
            </span>
          </nav>
          <RouterLink
            className="hidden shrink-0 text-sm font-semibold text-brand transition-colors hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 sm:inline-flex"
            href={CUSTOMER_ROUTES.artisans}
          >
            <span aria-hidden="true">←</span>&nbsp;Quay lại
          </RouterLink>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
        <div className="aspect-4/5 overflow-hidden rounded-2xl border border-border bg-surface-secondary shadow-sm">
          <img
            alt={`Chân dung ${artisan.name}`}
            className="h-full w-full object-cover"
            decoding="async"
            fetchPriority="high"
            height="800"
            src={artisan.avatar || '/assets/images/vietnamese-instrument-shop.jpg'}
            width="640"
          />
        </div>

        <div className="min-w-0">
          <EditorialEyebrow label="BÀN TAY GIỮ HỒN DÂN TỘC" />
          <h1 className="mt-3 text-pretty text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {artisan.name}
          </h1>

          <div className="mt-6 space-y-4 text-base leading-8 text-muted sm:text-lg">
            {biographyParagraphs.length > 0 ? (
              biographyParagraphs.map((paragraph) => (
                <p className="break-words" key={paragraph}>{paragraph}</p>
              ))
            ) : (
              <p>Câu chuyện của nghệ nhân đang được cập nhật.</p>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <RouterLink
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
              href={productFilterUrl}
            >
              Xem tác phẩm của nghệ nhân <span aria-hidden="true">→</span>
            </RouterLink>
            <RouterLink
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-border-strong hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
              href={CUSTOMER_ROUTES.artisans}
            >
              Xem các nghệ nhân khác
            </RouterLink>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="artisan-products-heading"
        className="border-t border-border bg-surface-secondary"
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <EditorialEyebrow label="TÁC PHẨM TIÊU BIỂU" />
              <h2
                className="mt-2 text-pretty text-2xl font-bold tracking-tight text-ink sm:text-3xl"
                id="artisan-products-heading"
              >
                Nhạc cụ do {artisan.name} chế tác
              </h2>
            </div>
            {products.length > 0 ? (
              <RouterLink
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                href={productFilterUrl}
              >
                Xem tất cả <span aria-hidden="true">→</span>
              </RouterLink>
            ) : null}
          </div>

          {productsLoading ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4" aria-label="Đang tải tác phẩm">
              {[1, 2, 3, 4].map((item) => (
                <div className="aspect-3/4 animate-pulse rounded-xl bg-white" key={item} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-border bg-white p-8 text-center sm:p-12">
              <p className="font-semibold text-ink">Chưa có tác phẩm được công bố</p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">
                Các tác phẩm của {artisan.name} đang được cập nhật. Bạn có thể xem toàn bộ bộ sưu tập hiện có của M4N.
              </p>
              <RouterLink
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                href={CUSTOMER_ROUTES.products}
              >
                Xem toàn bộ nhạc cụ
              </RouterLink>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default ArtisanDetailPage
