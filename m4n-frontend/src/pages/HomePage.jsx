import { useEffect } from 'react'
import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES, HOME_ARTISAN_SECTION } from '../routes/customerRoutes.js'
import ProductCard from '../features/catalog/ProductCard.jsx'
import SectionHeading from '../features/home/SectionHeading.jsx'
import HomepageVideoSection from '../features/home/HomepageVideoSection.jsx'
import EditorialEyebrow from '../components/common/EditorialEyebrow.jsx'
import {
  ARTISAN,
  CATEGORIES,
  FEATURED_PRODUCTS,
  HERO,
  KNOWLEDGE_BLOCKS,
  SUPPORT,
  TRUST_ITEMS,
  VALUES,
} from '../features/home/homeContent.js'

function HomePage() {
  const [catDay, catHoi, catGo] = CATEGORIES

  // Scroll to the artisan section when the homepage is opened with its anchor
  // (e.g. a cross-route click on "Nghệ nhân & Làng nghề" navigated to /#artisans).
  useEffect(() => {
    if (window.location.hash !== `#${HOME_ARTISAN_SECTION.id}`) return

    document
      .getElementById(HOME_ARTISAN_SECTION.id)
      ?.scrollIntoView({ block: 'start' })
  }, [])

  return (
    <div className="w-full flex flex-col">
      {/* SECTION 1: HERO */}
      <section aria-labelledby="hero-title" className="relative py-12 sm:py-16 lg:py-20 bg-surface border-b border-border/80 overflow-hidden">
        {/* Subtle background ambient craft glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-soft/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-jade-soft/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 flex flex-col gap-5 sm:gap-6">
            <EditorialEyebrow
              className="self-start"
              label="Nhạc cụ truyền thống Việt Nam"
            />

            <h1 id="hero-title" className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink font-sans tracking-tight leading-[1.15]">
              <span className="text-brand">Thanh âm Việt</span>, trong một trải nghiệm hiện đại.
            </h1>

            <p className="text-base sm:text-lg text-muted leading-relaxed max-w-xl">
              Khám phá nhạc cụ theo nhóm, nghệ nhân và làng nghề truyền thống. Thông tin minh bạch về chất liệu, âm sắc và nguồn gốc chế tác.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <RouterLink
                className="inline-flex items-center justify-center font-bold transition-all bg-brand text-white hover:bg-brand-hover hover:-translate-y-0.5 shadow-sm hover:shadow-md h-12 px-7 text-base rounded-xl cursor-pointer"
                href={CUSTOMER_ROUTES.products}
              >
                Khám phá sản phẩm
              </RouterLink>
              <a
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-brand bg-surface border border-border hover:border-brand/40 hover:bg-surface-secondary px-5 h-12 rounded-xl transition-all shadow-xs cursor-pointer"
                href="#categories"
              >
                <span>Xem danh mục</span>
                <span aria-hidden="true">↓</span>
              </a>
            </div>

            {/* Quick Hero Metrics */}
            <div className="pt-4 sm:pt-6 grid grid-cols-3 gap-4 border-t border-border/70 max-w-lg">
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-ink font-sans">03</p>
                <p className="text-xs text-muted font-medium mt-0.5">Nhóm nhạc cụ chính</p>
              </div>
              <div className="border-l border-border/70 pl-4">
                <p className="text-xl sm:text-2xl font-extrabold text-brand font-sans">100%</p>
                <p className="text-xs text-muted font-medium mt-0.5">Gỗ & Tre truyền thống</p>
              </div>
              <div className="border-l border-border/70 pl-4">
                <p className="text-xl sm:text-2xl font-extrabold text-jade font-sans">Làng nghề</p>
                <p className="text-xs text-muted font-medium mt-0.5">Đào Xá & Trúc Sơn</p>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Frame */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg bg-surface-secondary aspect-4/3 lg:aspect-16/11 group">
              <img
                alt={HERO.alt}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
                decoding="async"
                fetchPriority="high"
                height="650"
                src={HERO.image}
                width="880"
              />

              {/* Bottom Craft Metadata Badge */}
              <div
                className="absolute bottom-4 left-4 right-4 sm:right-auto inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-black/75 backdrop-blur-md text-white text-xs font-medium border border-white/15 shadow-md"
                aria-hidden="true"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
                <span className="font-semibold">Đàn Tranh 16 Dây</span>
                <span className="text-white/50">·</span>
                <span className="text-white/80 truncate">Nghệ nhân Làng Đào Xá</span>
              </div>

              {/* Top Right Floating Chip */}
              <div
                className="absolute top-4 right-4 hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/90 backdrop-blur-md text-ink text-[11px] font-bold border border-border/80 shadow-xs"
                aria-hidden="true"
              >
                <span className="text-brand">✦</span>
                <span>Chế tác thủ công</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: QUICK TRUST STRIP */}
      <section aria-label="Cam kết dịch vụ M4N" className="bg-surface border-b border-border/70 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_ITEMS.map((item, index) => (
            <div
              key={item.title}
              className="flex items-start gap-3.5 p-3 rounded-xl bg-canvas/60 border border-border/60 hover:bg-surface-secondary/60 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-soft border border-brand-border text-brand shrink-0 flex items-center justify-center font-bold text-sm">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-bold text-ink">{item.title}</p>
                <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: INSTRUMENT CATEGORIES BENTO GRID */}
      <section aria-labelledby="categories-title" className="py-16 sm:py-20 bg-canvas" id="categories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            description="Ba nhóm nhạc cụ chính tạo nên nhiều sắc thái đặc trưng trong âm nhạc truyền thống Việt Nam."
            eyebrow="DANH MỤC NHẠC CỤ"
            id="categories-title"
            title="Khám phá theo nhóm nhạc cụ"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8 sm:mt-10">
            {/* Primary Bento Card: Nhạc cụ dây (7 cols) */}
            <div className="lg:col-span-7 flex flex-col rounded-2xl bg-surface border border-border overflow-hidden shadow-xs hover:shadow-lg hover:border-brand/30 transition-all duration-300 group">
              <RouterLink className="flex flex-col h-full no-underline" href={CUSTOMER_ROUTES.products}>
                <div className="aspect-16/10 lg:aspect-auto lg:flex-1 w-full overflow-hidden bg-surface-secondary relative min-h-[260px]">
                  <img
                    alt={catDay.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
                    decoding="async"
                    height="520"
                    src={catDay.image}
                    width="780"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-surface/95 backdrop-blur-md text-xs font-bold text-ink border border-border/80 tracking-wider uppercase shadow-xs">
                    {catDay.num} / {catDay.label}
                  </span>
                </div>
                <div className="p-6 sm:p-8 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-ink group-hover:text-brand transition-colors">
                      {catDay.title}
                    </h3>
                    <span className="text-xs font-bold text-brand flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                      Khám phá ngay <span aria-hidden="true">→</span>
                    </span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{catDay.desc}</p>
                  
                  {/* Tag Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {catDay.examples.map((ex) => (
                      <span key={ex} className="px-2.5 py-1 rounded-md bg-surface-secondary text-xs font-medium text-ink/80 border border-border/60">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </RouterLink>
            </div>

            {/* Secondary Bento Stack: Nhạc cụ hơi & Nhạc cụ gõ (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {[catHoi, catGo].map((category) => (
                <RouterLink
                  key={category.id}
                  className="flex flex-col sm:flex-row lg:flex-col rounded-2xl bg-surface border border-border overflow-hidden shadow-xs hover:shadow-lg hover:border-brand/30 transition-all duration-300 group flex-1 no-underline"
                  href={CUSTOMER_ROUTES.products}
                >
                  <div className="w-full sm:w-52 lg:w-full aspect-16/9 sm:aspect-auto lg:aspect-16/9 overflow-hidden bg-surface-secondary relative shrink-0">
                    <img
                      alt={category.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
                      decoding="async"
                      height="240"
                      src={category.image}
                      width="360"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-surface/95 backdrop-blur-md text-[11px] font-bold text-ink border border-border/80 tracking-wider uppercase shadow-xs">
                      {category.num} / {category.label}
                    </span>
                  </div>
                  <div className="p-5 sm:p-6 flex flex-col gap-2 flex-1 justify-between">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-lg font-bold text-ink group-hover:text-brand transition-colors">
                        {category.title}
                      </h3>
                      <p className="text-xs text-muted leading-relaxed">{category.desc}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 mt-1">
                      <span className="text-xs text-subtle font-medium truncate">
                        {category.examples.join(' · ')}
                      </span>
                      <span className="text-xs font-bold text-brand shrink-0 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Xem <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </div>
                </RouterLink>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURED PRODUCTS */}
      <section aria-labelledby="featured-title" className="py-16 sm:py-20 bg-surface border-y border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <SectionHeading
              description="Một số nhạc cụ tiêu biểu đang có trong danh mục tuyển chọn của M4N."
              eyebrow="TUYỂN CHỌN M4N"
              id="featured-title"
              title="Sản phẩm nổi bật"
            />
            <RouterLink
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-hover group"
              href={CUSTOMER_ROUTES.products}
            >
              <span>Xem tất cả sản phẩm</span>
              <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
            </RouterLink>
          </div>

          <ul aria-label="Danh sách sản phẩm nổi bật" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none p-0 m-0">
            {FEATURED_PRODUCTS.map((product) => (
              <li key={product.id}>
                <ProductCard priority={true} product={product} />
              </li>
            ))}
          </ul>

          <div className="sm:hidden mt-8 text-center">
            <RouterLink
              className="inline-flex items-center justify-center font-bold transition-colors border border-border bg-surface text-ink hover:bg-surface-secondary h-11 px-5 text-sm rounded-xl w-full shadow-xs"
              href={CUSTOMER_ROUTES.products}
            >
              Xem tất cả sản phẩm →
            </RouterLink>
          </div>
        </div>
      </section>

      {/* SECTION 5: THANH ÂM VIỆT — VIDEO EXPERIENCE */}
      <HomepageVideoSection />

      {/* SECTION 6: ARTISAN & CRAFT VILLAGE */}
      <section
        aria-labelledby="artisan-section-title"
        className="scroll-mt-24 py-16 sm:py-20 bg-surface border-t border-border/80"
        id={HOME_ARTISAN_SECTION.id}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 flex flex-col gap-5 lg:order-1">
            <SectionHeading
              eyebrow="NGHỆ NHÂN & LÀNG NGHỀ"
              id="artisan-section-title"
              title="Đằng sau nhạc cụ là câu chuyện của người làm nghề."
            />
            <p className="text-sm sm:text-base text-muted leading-relaxed">{ARTISAN.intro}</p>

            {/* Craft Village Highlight Pills */}
            <div className="flex flex-wrap gap-2 py-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-secondary text-xs font-semibold text-ink border border-border">
                <span className="text-brand">📍</span> Làng nghề Đào Xá (Hà Nội)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-secondary text-xs font-semibold text-ink border border-border">
                <span className="text-brand">📍</span> Làng nghề Trúc Sơn
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <RouterLink
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white hover:bg-brand-hover text-sm font-bold transition-all shadow-xs"
                href={CUSTOMER_ROUTES.products}
              >
                <span>Khám phá theo nghệ nhân</span>
                <span aria-hidden="true">→</span>
              </RouterLink>
              <RouterLink
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-secondary text-ink hover:text-brand text-sm font-semibold border border-border transition-all"
                href={CUSTOMER_ROUTES.products}
              >
                <span>Khám phá theo làng nghề</span>
                <span aria-hidden="true">→</span>
              </RouterLink>
            </div>
          </div>

          <div className="lg:col-span-6 lg:order-2 rounded-2xl overflow-hidden border border-border shadow-lg bg-surface-secondary aspect-4/3 group">
            <img
              alt={ARTISAN.alt}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
              decoding="async"
              height="620"
              loading="lazy"
              src={ARTISAN.image}
              width="840"
            />
          </div>
        </div>
      </section>

      {/* SECTION 7: DISCOVER / KNOWLEDGE */}
      <section aria-labelledby="knowledge-title" className="py-16 sm:py-20 bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="GỢI Ý M4N" id="knowledge-title" title="Hiểu thêm trước khi lựa chọn" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-10">
            {KNOWLEDGE_BLOCKS.map((block, index) => (
              <div key={block.title} className="flex flex-col gap-3 p-6 rounded-2xl bg-surface border border-border/80 shadow-xs hover:shadow-md hover:border-brand/30 transition-all duration-300">
                <span className="text-sm font-extrabold text-brand font-mono" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}.
                </span>
                <h3 className="text-base font-bold text-ink">{block.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{block.desc}</p>
                {block.href ? (
                  <RouterLink
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-hover mt-auto pt-2"
                    href={block.href}
                  >
                    <span>{block.linkLabel}</span>
                    <span aria-hidden="true">→</span>
                  </RouterLink>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: M4N VALUES */}
      <section aria-labelledby="values-heading" className="py-16 sm:py-20 bg-surface border-t border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-5 flex flex-col gap-3">
            <SectionHeading
              description="Một nền tảng mua sắm nhạc cụ truyền thống với thông tin rõ ràng và hỗ trợ trực tuyến trong cùng một hệ thống."
              eyebrow="VỀ M4N"
              id="values-heading"
              title="Giá trị trong cách M4N hoạt động"
            />
          </div>

          <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5">
            {VALUES.map((value) => (
              <div key={value.num} className="flex gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl bg-canvas border border-border/80 hover:border-border-strong transition-colors">
                <span className="text-xl sm:text-2xl font-extrabold text-brand/60 font-mono shrink-0" aria-hidden="true">
                  {value.num}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-bold text-ink">{value.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9: SUPPORT CTA */}
      <section aria-labelledby="support-title" className="py-14 sm:py-16 bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-surface-secondary border border-border px-6 sm:px-10 py-8 sm:py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-1.5 max-w-xl">
              <h2 id="support-title" className="text-xl sm:text-2xl font-bold tracking-tight text-ink font-sans">
                {SUPPORT.title}
              </h2>
              <p className="text-sm text-muted leading-relaxed">{SUPPORT.desc}</p>
            </div>
            <RouterLink
              className="inline-flex shrink-0 items-center justify-center gap-2 font-bold transition-all bg-brand text-white hover:bg-brand-hover hover:-translate-y-0.5 h-12 px-7 text-sm rounded-xl shadow-xs cursor-pointer"
              href={SUPPORT.href}
            >
              <span>{SUPPORT.linkLabel}</span>
              <span aria-hidden="true">→</span>
            </RouterLink>
          </div>
        </div>
      </section>

      {/* SECTION 10: FINAL BRAND CTA */}
      <section aria-labelledby="final-cta-title" className="py-16 sm:py-20 lg:py-24 bg-white border-t border-border/70 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-5">
          <span className="resonance-motif text-brand" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <h2 id="final-cta-title" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink max-w-2xl font-sans leading-tight">
            Gìn giữ thanh âm truyền thống trong cách tiếp cận của hôm nay.
          </h2>
          <p className="text-sm sm:text-base text-muted max-w-xl leading-relaxed">
            Khám phá danh mục nhạc cụ truyền thống Việt Nam đầy đủ và minh bạch trên M4N.
          </p>
          <RouterLink
            className="inline-flex items-center justify-center gap-2 font-bold transition-all bg-brand text-white hover:bg-brand-hover hover:-translate-y-0.5 shadow-sm h-12 px-8 text-base rounded-xl mt-2 cursor-pointer"
            href={CUSTOMER_ROUTES.products}
          >
            <span>Khám phá sản phẩm ngay</span>
            <span aria-hidden="true">→</span>
          </RouterLink>
        </div>
      </section>
    </div>
  )
}

export default HomePage

