import { useState, useEffect } from 'react'
import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES, HOME_ARTISAN_SECTION } from '../routes/customerRoutes.js'
import ProductCard from '../features/catalog/ProductCard.jsx'
import EditorialEyebrow from '../components/common/EditorialEyebrow.jsx'
import {
  ARTISAN,
  CATEGORIES,
  FEATURED_PRODUCTS,
  HERO,
  WHY_M4N,
} from '../features/home/homeContent.js'

function HomePage() {
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [catDay, catHoi, catGo] = CATEGORIES

  useEffect(() => {
    if (window.location.hash !== `#${HOME_ARTISAN_SECTION.id}`) return
    document
      .getElementById(HOME_ARTISAN_SECTION.id)
      ?.scrollIntoView({ block: 'start' })
  }, [])

  // Filter products based on selected tab
  const filteredProducts =
    selectedGroup === 'all'
      ? FEATURED_PRODUCTS
      : FEATURED_PRODUCTS.filter((p) =>
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
              Mỗi cây đàn tại M4N là một tác phẩm độc bản được nghệ nhân ưu tú đẽo gọt từ gỗ mun, cẩm lai và tre nứa tuyển chọn, bảo tồn trọn vẹn chuẩn mực thẩm âm của âm nhạc cổ truyền Việt Nam.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <RouterLink
                className="inline-flex items-center justify-center font-semibold text-white h-12 px-7 text-sm rounded-lg bg-brand hover:bg-brand-hover active:scale-[0.99] transition-all shadow-xs"
                href={CUSTOMER_ROUTES.products}
              >
                <span>Xem bộ sưu tập</span>
                <span className="ml-2" aria-hidden="true">→</span>
              </RouterLink>

              <RouterLink
                className="inline-flex items-center justify-center font-semibold text-ink h-12 px-6 text-sm rounded-lg bg-white hover:bg-surface-secondary border border-border hover:border-border-strong active:scale-[0.99] transition-all"
                href={CUSTOMER_ROUTES.artisans}
              >
                <span>Về xưởng thủ công</span>
              </RouterLink>
            </div>

            {/* Clear, understated provenance metrics */}
            <div className="pt-6 border-t border-border flex flex-wrap items-center gap-8 sm:gap-10 text-xs">
              <div>
                <span className="text-2xl font-bold text-ink block">100+</span>
                <span className="text-muted">Nhạc cụ tinh tuyển</span>
              </div>
              <div className="w-px h-8 bg-border" aria-hidden="true" />
              <div>
                <span className="text-2xl font-bold text-ink block">15+</span>
                <span className="text-muted">Nghệ nhân ưu tú</span>
              </div>
              <div className="w-px h-8 bg-border" aria-hidden="true" />
              <div>
                <span className="text-2xl font-bold text-ink block">3</span>
                <span className="text-muted">Làng nghề di sản</span>
              </div>
            </div>
          </div>

          {/* Right Column: Authentic Editorial Craft Visual (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="aspect-[16/11] sm:aspect-[16/10] w-full bg-neutral-900 overflow-hidden">
                <img
                  src={HERO.image}
                  alt={HERO.alt}
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
        aria-label="Cam kết chất lượng M4N"
        className="py-10 bg-surface-muted border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">01 · Danh mộc tự nhiên</span>
              <h3 className="text-sm font-bold text-ink">Gỗ nguyên khối chọn lọc</h3>
              <p className="text-xs leading-relaxed text-muted">
                Gỗ mun, cẩm lai, gụ mật sấy tự nhiên đạt độ ẩm chuẩn, không nứt nẻ và tối ưu hóa độ vang.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-jade">02 · Chuẩn mực âm học</span>
              <h3 className="text-sm font-bold text-ink">Thẩm âm thủ công</h3>
              <p className="text-xs leading-relaxed text-muted">
                Từng cung bậc được nghệ nhân trực tiếp so dây, căn chỉnh tần số âm thanh chuẩn mực trước khi xuất xưởng.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">03 · Nguồn gốc minh bạch</span>
              <h3 className="text-sm font-bold text-ink">Bảo tồn làng nghề</h3>
              <p className="text-xs leading-relaxed text-muted">
                Sản phẩm gắn liền người thợ và di sản làng nghề Đào Xá, Trúc Sơn, Đọi Tam không qua trung gian.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-jade">04 · Hậu mãi uy tín</span>
              <h3 className="text-sm font-bold text-ink">Bảo dưỡng trọn đời</h3>
              <p className="text-xs leading-relaxed text-muted">
                Đóng gói chuyên dụng chống sốc, hỗ trợ kỹ thuật căn chỉnh âm sắc và chính sách bảo hành toàn quốc.
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
              className="group flex flex-col rounded-xl overflow-hidden border border-border hover:border-brand/40 bg-white shadow-2xs hover:shadow-md transition-all no-underline"
              href={CUSTOMER_ROUTES.products}
            >
              <div className="aspect-[4/3] overflow-hidden bg-surface-secondary">
                <img
                  alt={catDay.alt}
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
                  <span className="text-[11px] font-semibold text-muted bg-surface-muted px-2 py-0.5 rounded">
                    45+ mẫu
                  </span>
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
              className="group flex flex-col rounded-xl overflow-hidden border border-border hover:border-brand/40 bg-white shadow-2xs hover:shadow-md transition-all no-underline"
              href={CUSTOMER_ROUTES.products}
            >
              <div className="aspect-[4/3] overflow-hidden bg-surface-secondary">
                <img
                  alt={catHoi.alt}
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
                  <span className="text-[11px] font-semibold text-muted bg-surface-muted px-2 py-0.5 rounded">
                    28+ mẫu
                  </span>
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
              className="group flex flex-col rounded-xl overflow-hidden border border-border hover:border-brand/40 bg-white shadow-2xs hover:shadow-md transition-all no-underline"
              href={CUSTOMER_ROUTES.products}
            >
              <div className="aspect-[4/3] overflow-hidden bg-surface-secondary">
                <img
                  alt={catGo.alt}
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
                  <span className="text-[11px] font-semibold text-muted bg-surface-muted px-2 py-0.5 rounded">
                    16+ mẫu
                  </span>
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
                Nhạc cụ kiệt tác
              </h2>
              <p className="text-sm text-muted mt-1 max-w-lg">
                Các tác phẩm được tuyển chọn kỹ lưỡng về âm chuẩn và mỹ thuật chế tác.
              </p>
            </div>

            {/* Clean category pills */}
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-border self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSelectedGroup('all')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
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
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
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
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  selectedGroup === 'hoi-go'
                    ? 'bg-brand text-white shadow-2xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Bộ Hơi / Gõ
              </button>
            </div>
          </div>

          <ul
            aria-label="Danh sách nhạc cụ kiệt tác"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none p-0 m-0"
          >
            {filteredProducts.map((product) => (
              <li key={product.id}>
                <ProductCard priority={true} product={product} />
              </li>
            ))}
          </ul>

          <div className="mt-10 text-center">
            <RouterLink
              className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-lg font-semibold text-xs bg-white hover:bg-surface-secondary text-ink border border-border hover:border-brand/40 shadow-2xs transition-all"
              href={CUSTOMER_ROUTES.products}
            >
              <span>Xem toàn bộ 100+ nhạc cụ M4N</span>
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
                    className="w-full h-full object-cover hover:scale-102 transition-transform duration-700"
                    loading="lazy"
                    src={ARTISAN.image}
                  />
                </div>
                <div className="p-4 bg-surface-muted border-t border-border flex items-center justify-between text-xs text-muted">
                  <span className="font-semibold text-ink">Xưởng mộc truyền thống Đào Xá</span>
                  <span>Hà Nội · 200+ năm gìn giữ hồn đàn</span>
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
                Hai trăm năm giữ lửa bên thớ gỗ danh mộc
              </h2>

              <blockquote className="border-l-2 border-brand pl-4 py-1 text-sm sm:text-base text-ink/90 italic leading-relaxed">
                &ldquo;Mỗi đường đục, thớ gỗ không chỉ tạo nên một cây đàn, mà là gửi gắm cả linh hồn người thợ vào từng cung bậc trầm bổng.&rdquo;
                <footer className="text-xs text-muted not-italic mt-1.5 font-medium">
                  — Nghệ nhân Nguyễn Văn Quý, 40 năm gắn bó xưởng Đào Xá
                </footer>
              </blockquote>

              <p className="text-sm sm:text-base text-muted leading-relaxed">
                Tại làng nghề Đào Xá, mỗi cây đàn được chế tác từ việc tuyển chọn súc gỗ cẩm lai, gỗ mun nguyên khối được hong gió tự nhiên qua nhiều năm để thớ gỗ đạt độ ổn định âm học cao nhất.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-surface-muted border border-border">
                  <p className="text-xs font-bold text-brand uppercase tracking-wider">
                    Gỗ sấy tự nhiên 3+ năm
                  </p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Triệt tiêu độ ẩm tự nhiên, loại bỏ hiện tượng co ngót và giúp âm sắc càng chơi càng vang ấm.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-muted border border-border">
                  <p className="text-xs font-bold text-jade uppercase tracking-wider">
                    Khảm ốc xà cừ thủ công
                  </p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Nghệ thuật cẩn xà cừ truyền thống trên thành đàn, lưu giữ hoa văn cổ kính và bản sắc Việt Nam.
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
            <EditorialEyebrow label="TIÊU CHUẨN M4N" />
            <h2
              id="values-heading"
              className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mt-1.5"
            >
              Vì sao người yêu nhạc tin chọn M4N?
            </h2>
            <p className="text-sm text-muted mt-2">
              Cam kết về chất liệu, nguồn gốc minh bạch và chất lượng âm thanh nguyên bản.
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
            TƯ VẤN TRỰC TIẾP TỪ NGHỆ NHÂN
          </span>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink tracking-tight">
            Bạn cần tìm cây đàn phù hợp với hành trình âm nhạc của mình?
          </h2>

          <p className="text-sm sm:text-base text-muted max-w-xl leading-relaxed">
            Đội ngũ M4N và các nghệ nhân làng nghề luôn sẵn sàng hỗ trợ bạn lựa chọn dòng nhạc cụ, kiểm tra âm sắc và tư vấn phương pháp bảo quản tốt nhất.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <RouterLink
              className="inline-flex items-center justify-center font-semibold text-white h-12 px-7 text-sm rounded-lg bg-brand hover:bg-brand-hover active:scale-[0.99] transition-all shadow-xs"
              href={CUSTOMER_ROUTES.products}
            >
              <span>Xem danh mục nhạc cụ</span>
              <span className="ml-2" aria-hidden="true">→</span>
            </RouterLink>

            <RouterLink
              className="inline-flex items-center justify-center font-semibold text-ink h-12 px-6 text-sm rounded-lg bg-white hover:bg-surface-secondary border border-border active:scale-[0.99] transition-all"
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
