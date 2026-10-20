import { useState, useEffect } from 'react'
import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES, HOME_ARTISAN_SECTION } from '../routes/customerRoutes.js'
import ProductCard from '../features/catalog/ProductCard.jsx'
import EditorialEyebrow from '../components/common/EditorialEyebrow.jsx'
import productService from '../services/productService.js'
import {
  ARTISAN,
  CATEGORIES,
  HERO,
  WHY_M4N,
} from '../features/home/homeContent.js'

function HomePage() {
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [featuredStatus, setFeaturedStatus] = useState('loading')
  const [catDay, catHoi, catGo] = CATEGORIES

  useEffect(() => {
    if (window.location.hash !== `#${HOME_ARTISAN_SECTION.id}`) return
    document
      .getElementById(HOME_ARTISAN_SECTION.id)
      ?.scrollIntoView({ block: 'start' })
  }, [])

  useEffect(() => {
    let active = true

    productService
      .listProducts({ page: 1, size: 8, sort: 'createdAt,desc' })
      .then((products) => {
        if (!active) return
        setFeaturedProducts(products)
        setFeaturedStatus('success')
      })
      .catch(() => {
        if (!active) return
        setFeaturedProducts([])
        setFeaturedStatus('error')
      })

    return () => {
      active = false
    }
  }, [])

  // Filter products based on selected tab
  const filteredProducts =
    selectedGroup === 'all'
      ? featuredProducts
      : featuredProducts.filter((p) =>
          selectedGroup === 'day'
            ? p.groupName?.toLowerCase().includes('dây')
            : p.groupName?.toLowerCase().includes('hơi') ||
              p.groupName?.toLowerCase().includes('gõ'),
        )

  return (
    <div className="w-full flex flex-col bg-white text-ink">
      {/* ============================================================
          SECTION 1: HERO — Editorial Heritage Craft Showcase
          ============================================================ */}
      <section
        aria-labelledby="hero-title"
        className="relative pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-20 bg-white border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Direct value proposition (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <EditorialEyebrow showResonance={false} label="BẢO TỒN VÀ CHẾ TÁC THỦ CÔNG DI SẢN" />
            </div>

            <h1
              id="hero-title"
              className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold leading-[1.14] tracking-tight text-ink"
            >
              Thanh âm di sản từ danh mộc Việt.
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-muted">
              Khám phá nhạc cụ truyền thống Việt Nam cùng thông tin sản phẩm, nghệ nhân và làng nghề được lưu trong danh mục M4N.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <RouterLink
                className="inline-flex items-center justify-center font-semibold text-white h-12 px-7 text-sm rounded-lg bg-brand hover:bg-brand-hover active:scale-[0.99] transition-[background-color,transform,box-shadow] shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
                href={CUSTOMER_ROUTES.products}
              >
                <span>Xem bộ sưu tập</span>
                <span className="ml-2" aria-hidden="true">→</span>
              </RouterLink>

              <RouterLink
                className="inline-flex items-center justify-center font-semibold text-ink h-12 px-6 text-sm rounded-lg bg-white hover:bg-surface-secondary border border-border hover:border-border-strong active:scale-[0.99] transition-[background-color,border-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                href={CUSTOMER_ROUTES.artisans}
              >
                <span>Về xưởng thủ công</span>
              </RouterLink>
            </div>

            <div className="pt-6 border-t border-border flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
              <span>Danh mục trực tuyến</span>
              <span aria-hidden="true">•</span>
              <span>Thông tin nguồn gốc</span>
              <span aria-hidden="true">•</span>
              <span>Hỗ trợ trực tuyến</span>
            </div>
          </div>

          {/* Right Column: Authentic Editorial Craft Visual (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="aspect-[16/11] sm:aspect-[16/10] w-full bg-neutral-900 overflow-hidden">
                <img
                  src={HERO.image}
                  alt={HERO.alt}
                  width="1600"
                  height="900"
                  className="w-full h-full object-cover object-center"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>

              {/* Museum-grade provenance caption */}
              <div className="px-5 py-3.5 bg-surface-muted/50 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" aria-hidden="true" />
                  <span className="font-semibold text-ink">{HERO.instrumentName}</span>
                  <span className="text-border-strong">·</span>
                  <span>{HERO.materialNote}</span>
                </div>

                <RouterLink
                  className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-hover transition-colors text-xs shrink-0"
                  href={CUSTOMER_ROUTES.products}
                >
                  <span>Khám phá bộ sưu tập</span>
                  <span aria-hidden="true">→</span>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 2: TRUST & CRAFTSMANSHIP GUARANTEES
          ============================================================ */}
      <section
        aria-label="Thông tin danh mục M4N"
        className="py-10 bg-surface-muted border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">01 · Thông tin vật liệu</span>
              <h3 className="text-sm font-bold text-ink">Thông số sản phẩm</h3>
              <p className="text-xs leading-relaxed text-muted">
                Xem chất liệu, kích thước và các thông số được lưu trong hồ sơ sản phẩm.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-jade">02 · Thông tin chế tác</span>
              <h3 className="text-sm font-bold text-ink">Nghệ nhân và làng nghề</h3>
              <p className="text-xs leading-relaxed text-muted">
                Tra cứu nghệ nhân và làng nghề khi sản phẩm có thông tin liên kết.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">03 · Danh mục tập trung</span>
              <h3 className="text-sm font-bold text-ink">Tra cứu thuận tiện</h3>
              <p className="text-xs leading-relaxed text-muted">
                Tìm kiếm và lọc sản phẩm theo nhóm nhạc cụ, giá, nghệ nhân và làng nghề.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-jade">04 · Hỗ trợ trực tuyến</span>
              <h3 className="text-sm font-bold text-ink">Trao đổi với nhân viên</h3>
              <p className="text-xs leading-relaxed text-muted">
                Khách hàng có thể gửi câu hỏi và nhận hỗ trợ từ Online Staff trong hệ thống.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 3: COLLECTION GATEWAY — 3 Clean Editorial Columns
          ============================================================ */}
      <section
        aria-labelledby="categories-heading"
        className="py-16 sm:py-20 bg-white border-b border-border"
        id="categories"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <EditorialEyebrow label="DANH MỤC NHẠC CỤ" />
              <h2
                id="categories-heading"
                className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mt-1.5"
              >
                Khám phá theo dòng nhạc cụ
              </h2>
            </div>

            <RouterLink
              className="text-xs font-bold text-brand hover:text-brand-hover transition-colors shrink-0"
              href={CUSTOMER_ROUTES.products}
            >
              Xem tất cả sản phẩm →
            </RouterLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Nhạc cụ Dây */}
            <RouterLink
              className="group flex flex-col rounded-xl overflow-hidden border border-border hover:border-brand/40 bg-white shadow-2xs hover:shadow-md transition-[border-color,box-shadow] no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              href={`${CUSTOMER_ROUTES.products}?group=DAY`}
            >
              <div className="aspect-[4/3] overflow-hidden bg-surface-secondary">
                <img
                  alt={catDay.alt}
                  width="800"
                  height="600"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  loading="lazy"
                  src={catDay.image}
                />
              </div>
              <div className="p-5 flex flex-col gap-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-ink group-hover:text-brand transition-colors">
                    {catDay.title}
                  </h3>
                </div>
                <p className="text-xs text-brand font-medium">
                  Đàn Tranh · Đàn Bầu · Đàn Nguyệt · Tỳ Bà
                </p>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  {catDay.desc}
                </p>
                <span className="text-xs font-semibold text-ink group-hover:text-brand mt-auto pt-3 transition-colors">
                  Khám phá danh mục →
                </span>
              </div>
            </RouterLink>

            {/* Column 2: Nhạc cụ Hơi */}
            <RouterLink
              className="group flex flex-col rounded-xl overflow-hidden border border-border hover:border-brand/40 bg-white shadow-2xs hover:shadow-md transition-[border-color,box-shadow] no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              href={`${CUSTOMER_ROUTES.products}?group=HOI`}
            >
              <div className="aspect-[4/3] overflow-hidden bg-surface-secondary">
                <img
                  alt={catHoi.alt}
                  width="800"
                  height="600"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  loading="lazy"
                  src={catHoi.image}
                />
              </div>
              <div className="p-5 flex flex-col gap-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-ink group-hover:text-brand transition-colors">
                    {catHoi.title}
                  </h3>
                </div>
                <p className="text-xs text-brand font-medium">
                  Sáo Trúc · Tiêu Bát Khổng · Kèn Bầu
                </p>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  {catHoi.desc}
                </p>
                <span className="text-xs font-semibold text-ink group-hover:text-brand mt-auto pt-3 transition-colors">
                  Khám phá danh mục →
                </span>
              </div>
            </RouterLink>

            {/* Column 3: Nhạc cụ Gõ */}
            <RouterLink
              className="group flex flex-col rounded-xl overflow-hidden border border-border hover:border-brand/40 bg-white shadow-2xs hover:shadow-md transition-[border-color,box-shadow] no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              href={`${CUSTOMER_ROUTES.products}?group=GO`}
            >
              <div className="aspect-[4/3] overflow-hidden bg-surface-secondary">
                <img
                  alt={catGo.alt}
                  width="800"
                  height="600"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  loading="lazy"
                  src={catGo.image}
                />
              </div>
              <div className="p-5 flex flex-col gap-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-ink group-hover:text-brand transition-colors">
                    {catGo.title}
                  </h3>
                </div>
                <p className="text-xs text-brand font-medium">
                  Trống Đọi Tam · Mõ Gỗ · Thanh La
                </p>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  {catGo.desc}
                </p>
                <span className="text-xs font-semibold text-ink group-hover:text-brand mt-auto pt-3 transition-colors">
                  Khám phá danh mục →
                </span>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4: CURATED INSTRUMENTS (Sản phẩm tiêu biểu)
          ============================================================ */}
      <section
        aria-labelledby="featured-products-heading"
        className="py-16 sm:py-20 bg-surface-muted border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <EditorialEyebrow label="BỘ SƯU TẬP TIÊU BIỂU" />
              <h2
                id="featured-products-heading"
                className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mt-1.5"
              >
                Sản phẩm mới trong danh mục
              </h2>
              <p className="text-sm text-muted mt-1 max-w-lg">
                Dữ liệu được tải trực tiếp từ danh mục sản phẩm đang hoạt động.
              </p>
            </div>

            {/* Clean category pills */}
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-border self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSelectedGroup('all')}
                aria-pressed={selectedGroup === 'all'}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-[background-color,color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                  selectedGroup === 'all'
                    ? 'bg-brand text-white shadow-2xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setSelectedGroup('day')}
                aria-pressed={selectedGroup === 'day'}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-[background-color,color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                  selectedGroup === 'day'
                    ? 'bg-brand text-white shadow-2xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Đàn Dây
              </button>
              <button
                type="button"
                onClick={() => setSelectedGroup('hoi-go')}
                aria-pressed={selectedGroup === 'hoi-go'}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-[background-color,color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                  selectedGroup === 'hoi-go'
                    ? 'bg-brand text-white shadow-2xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Bộ Hơi / Gõ
              </button>
            </div>
          </div>

          {featuredStatus === 'loading' ? (
            <p className="py-12 text-center text-sm text-muted" role="status">
              Đang tải sản phẩm…
            </p>
          ) : featuredStatus === 'error' ? (
            <p className="py-12 text-center text-sm text-muted" role="alert">
              Không thể tải sản phẩm tiêu biểu. Vui lòng xem toàn bộ danh mục.
            </p>
          ) : filteredProducts.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">
              Chưa có sản phẩm phù hợp trong nhóm này.
            </p>
          ) : (
            <ul
              aria-label="Danh sách sản phẩm mới"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none p-0 m-0"
            >
              {filteredProducts.map((product) => (
                <li key={product.id}>
                  <ProductCard priority={true} product={product} />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10 text-center">
            <RouterLink
              className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-lg font-semibold text-xs bg-white hover:bg-surface-secondary text-ink border border-border hover:border-brand/40 shadow-2xs transition-[background-color,border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              href={CUSTOMER_ROUTES.products}
            >
              <span>Xem toàn bộ danh mục M4N</span>
              <span aria-hidden="true">→</span>
            </RouterLink>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 5: THE HERITAGE WORKSHOP (Không gian xưởng nghề Đào Xá)
          ============================================================ */}
      <section
        aria-labelledby="heritage-heading"
        className="py-16 sm:py-24 bg-white border-b border-border"
        id={HOME_ARTISAN_SECTION.id}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Authentic documentary photograph (6 cols) */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-border bg-surface-secondary shadow-md">
                <div className="aspect-[4/3] sm:aspect-[16/11] overflow-hidden">
                  <img
                    alt={ARTISAN.alt}
                    width="896"
                    height="1200"
                    className="w-full h-full object-cover hover:scale-102 transition-transform duration-700"
                    loading="lazy"
                    src={ARTISAN.image}
                  />
                </div>
                <div className="p-4 bg-surface-muted border-t border-border flex items-center justify-between text-xs text-muted">
                  <span className="font-semibold text-ink">Không gian chế tác nhạc cụ truyền thống</span>
                  <span>Việt Nam</span>
                </div>
              </div>
            </div>

            {/* Right: Direct craftsmanship story (6 cols) */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div>
                <EditorialEyebrow label="KỸ NGHỆ TRUYỀN ĐỜI" />
              </div>

              <h2
                id="heritage-heading"
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight leading-snug"
              >
                Gìn giữ kỹ nghệ bên từng thớ gỗ
              </h2>

              <p className="text-sm sm:text-base text-muted leading-relaxed">
                Tìm hiểu thông tin nghệ nhân, làng nghề và vật liệu được đăng ký trong danh mục M4N.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-surface-muted border border-border">
                  <p className="text-xs font-bold text-brand uppercase tracking-wider">
                    Thông tin vật liệu
                  </p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Xem vật liệu, kích thước và nguồn gốc được lưu cho từng sản phẩm.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-muted border border-border">
                  <p className="text-xs font-bold text-jade uppercase tracking-wider">
                    Kỹ nghệ thủ công
                  </p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Khám phá hồ sơ nghệ nhân và làng nghề có trong hệ thống.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <RouterLink
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-hover transition-colors"
                  href={CUSTOMER_ROUTES.artisans}
                >
                  <span>Khám phá câu chuyện làng nghề & nghệ nhân</span>
                  <span aria-hidden="true">→</span>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 6: CRAFTSMANSHIP STANDARDS (Chuẩn mực chế tác M4N)
          ============================================================ */}
      <section
        aria-labelledby="values-heading"
        className="py-16 sm:py-20 bg-surface-muted border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <EditorialEyebrow label="THÔNG TIN M4N" />
            <h2
              id="values-heading"
              className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mt-1.5"
            >
              Khám phá danh mục M4N
            </h2>
            <p className="text-sm text-muted mt-2">
              Tra cứu thông tin sản phẩm, nguồn gốc và người chế tác trong một nơi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHY_M4N.slice(0, 3).map((item, idx) => (
              <div
                key={item.title}
                className="p-6 rounded-xl bg-white border border-border shadow-2xs flex flex-col gap-2"
              >
                <span className="text-xs font-bold text-brand uppercase tracking-wider">
                  Tiêu chuẩn 0{idx + 1}
                </span>
                <h3 className="text-base font-bold text-ink">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 7: SHOWROOM & CONSULTATION (Lời mời trải nghiệm)
          ============================================================ */}
      <section
        aria-label="Tư vấn và trải nghiệm nhạc cụ"
        className="py-16 sm:py-20 bg-white"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-5">
          <span className="text-xs font-bold uppercase tracking-wider text-brand">
            HỖ TRỢ TRỰC TUYẾN
          </span>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink tracking-tight">
            Bạn cần tìm cây đàn phù hợp với hành trình âm nhạc của mình?
          </h2>

          <p className="text-sm sm:text-base text-muted max-w-xl leading-relaxed">
            Online Staff có thể hỗ trợ bạn tìm thông tin sản phẩm và giải đáp câu hỏi trong phạm vi danh mục M4N.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <RouterLink
              className="inline-flex items-center justify-center font-semibold text-white h-12 px-7 text-sm rounded-lg bg-brand hover:bg-brand-hover active:scale-[0.99] transition-[background-color,transform,box-shadow] shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
              href={CUSTOMER_ROUTES.products}
            >
              <span>Xem danh mục nhạc cụ</span>
              <span className="ml-2" aria-hidden="true">→</span>
            </RouterLink>

            <RouterLink
              className="inline-flex items-center justify-center font-semibold text-ink h-12 px-6 text-sm rounded-lg bg-white hover:bg-surface-secondary border border-border active:scale-[0.99] transition-[background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              href={CUSTOMER_ROUTES.artisans}
            >
              <span>Tìm hiểu các nghệ nhân</span>
            </RouterLink>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
