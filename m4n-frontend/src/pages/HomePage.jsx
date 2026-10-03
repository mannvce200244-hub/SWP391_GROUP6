import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../routes/customerRoutes.js'
import ProductCard from '../features/catalog/ProductCard.jsx'

// Photography assets
import heroDanTranh from '../assets/images/hero-dan-tranh.jpg'
import catNhacCuDay from '../assets/images/cat-nhac-cu-day.jpg'
import catNhacCuHoi from '../assets/images/cat-nhac-cu-hoi.jpg'
import catNhacCuGo from '../assets/images/cat-nhac-cu-go.jpg'
import prodDanTranh from '../assets/images/prod-dan-tranh.jpg'
import prodDanBau from '../assets/images/prod-dan-bau.jpg'
import prodSaoTruc from '../assets/images/prod-sao-truc.jpg'
import prodDanNguyet from '../assets/images/prod-dan-nguyet.jpg'
import artisanWorkshop from '../assets/images/artisan-workshop.jpg'

const CATEGORIES = Object.freeze([
  Object.freeze({
    id: 'day',
    num: '01',
    label: 'DÂY',
    title: 'Nhạc cụ dây',
    desc: 'Đàn tranh, đàn bầu, đàn nguyệt chế tác từ gỗ cẩm lai, gỗ mun và gỗ gụ quý với âm sắc ngân vang.',
    image: catNhacCuDay,
    alt: 'Nhạc cụ dây truyền thống Việt Nam: đàn tranh và đàn bầu',
  }),
  Object.freeze({
    id: 'hoi',
    num: '02',
    label: 'HƠI',
    title: 'Nhạc cụ hơi',
    desc: 'Sáo trúc, tiêu và các nhạc cụ hơi nứa già thủ công mang âm sắc thanh thoát, mộc mạc.',
    image: catNhacCuHoi,
    alt: 'Nhạc cụ hơi truyền thống: sáo trúc và tiêu thủ công',
  }),
  Object.freeze({
    id: 'go',
    num: '03',
    label: 'GÕ',
    title: 'Nhạc cụ gõ',
    desc: 'Trống bản, thanh la, mõ gỗ mít gìn giữ nhịp điệu cổ truyền và nghi lễ dân gian.',
    image: catNhacCuGo,
    alt: 'Nhạc cụ gõ truyền thống: trống bản và thanh la',
  }),
])

const FEATURED_PRODUCTS = Object.freeze([
  Object.freeze({
    id: '1',
    name: 'Đàn Tranh 16 Dây',
    groupName: 'Nhạc cụ dây',
    artisanName: 'Nghệ nhân Nguyễn Văn Quý',
    craftVillageName: 'Làng Đào Xá',
    priceDisplay: '8.500.000 ₫',
    media: [
      Object.freeze({
        type: 'image',
        url: prodDanTranh,
        alt: 'Đàn Tranh 16 Dây gỗ cẩm lai khảm xà cừ',
      }),
    ],
  }),
  Object.freeze({
    id: '2',
    name: 'Đàn Bầu Gỗ Mun',
    groupName: 'Nhạc cụ dây',
    artisanName: 'Nghệ nhân Phạm Chí Khánh',
    craftVillageName: 'Hà Nội',
    priceDisplay: '6.200.000 ₫',
    media: [
      Object.freeze({
        type: 'image',
        url: prodDanBau,
        alt: 'Đàn Bầu Gỗ Mun cẩn hoa văn truyền thống',
      }),
    ],
  }),
  Object.freeze({
    id: '3',
    name: 'Sáo Trúc Tone C',
    groupName: 'Nhạc cụ hơi',
    artisanName: '',
    craftVillageName: 'Làng nghề Trúc Sơn',
    priceDisplay: '650.000 ₫',
    media: [
      Object.freeze({
        type: 'image',
        url: prodSaoTruc,
        alt: 'Sáo Trúc Tone C nứa già quấn chỉ đen',
      }),
    ],
  }),
  Object.freeze({
    id: '4',
    name: 'Đàn Nguyệt Gỗ Gụ',
    groupName: 'Nhạc cụ dây',
    artisanName: 'Nghệ nhân Trần Văn Phong',
    craftVillageName: 'Làng Đào Xá',
    priceDisplay: '5.800.000 ₫',
    media: [
      Object.freeze({
        type: 'image',
        url: prodDanNguyet,
        alt: 'Đàn Nguyệt Gỗ Gụ âm sắc cổ truyền',
      }),
    ],
  }),
])

function HomePage() {
  const [catDay, catHoi, catGo] = CATEGORIES

  return (
    <div className="w-full">
      {/* SECTION 1: HERO */}
      <section aria-labelledby="hero-title" className="py-12 sm:py-16 lg:py-20 bg-surface border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
              <span className="resonance-motif" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
              Nhạc cụ truyền thống Việt Nam
            </p>
            <h1 id="hero-title" className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink font-sans tracking-tight leading-tight">
              Thanh âm Việt, trong một trải nghiệm hiện đại.
            </h1>
            <p className="text-base text-muted leading-relaxed max-w-lg">
              Khám phá bộ sưu tập nhạc cụ chế tác thủ công bởi nghệ nhân làng nghề, 
              minh bạch nguồn gốc và chất liệu dành cho người yêu âm sắc hôm nay.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <RouterLink
                className="inline-flex items-center justify-center font-semibold transition-colors bg-brand text-white hover:bg-brand-hover h-11 px-6 text-base rounded-lg cursor-pointer shadow-xs"
                href={CUSTOMER_ROUTES.products}
              >
                Khám phá sản phẩm
              </RouterLink>
              <a className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-brand transition-colors cursor-pointer" href="#categories">
                Xem danh mục <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-md bg-surface-secondary aspect-4/3 lg:aspect-16/10">
              <img
                alt="Nghệ sĩ biểu diễn Đàn Tranh truyền thống Việt Nam"
                className="w-full h-full object-cover"
                decoding="async"
                fetchPriority="high"
                height="650"
                src={heroDanTranh}
                width="880"
              />
              <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10 shadow-sm" aria-hidden="true">
                <span className="w-2 h-2 rounded-full bg-brand" />
                <span>Đàn Tranh · Nhạc cụ dây</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: QUICK CATEGORY NAVIGATION */}
      <section
        aria-labelledby="categories-title"
        className="py-14 sm:py-20 bg-canvas"
        id="categories"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand mb-1">
                <span className="resonance-motif" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                DANH MỤC NHẠC CỤ
              </p>
              <h2 id="categories-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">Khám phá theo nhóm nhạc cụ</h2>
              <p className="text-sm text-muted leading-relaxed max-w-lg mt-1">
                Ba nhóm nhạc cụ chính cấu thành bản sắc âm nhạc cổ truyền Việt Nam.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Primary Feature: Nhạc cụ dây (7 cols) */}
            <div className="lg:col-span-7 flex flex-col rounded-2xl bg-surface border border-border overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 group">
              <RouterLink
                className="flex flex-col h-full no-underline"
                href={CUSTOMER_ROUTES.products}
              >
                <div className="aspect-16/10 w-full overflow-hidden bg-surface-secondary relative">
                  <img
                    alt={catDay.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    decoding="async"
                    height="520"
                    src={catDay.image}
                    width="780"
                  />
                  <span className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-surface/90 backdrop-blur-md text-xs font-bold text-ink border border-border/80 tracking-wider uppercase">{catDay.num} / {catDay.label}</span>
                </div>
                <div className="p-6 sm:p-8 flex flex-col gap-2 flex-1 justify-between">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-ink group-hover:text-brand transition-colors">{catDay.title}</h3>
                    <span className="text-xs font-semibold text-brand flex items-center gap-1 group-hover:underline">
                      Xem sản phẩm <span aria-hidden="true">→</span>
                    </span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{catDay.desc}</p>
                </div>
              </RouterLink>
            </div>

            {/* Secondary Stack: Nhạc cụ hơi & Nhạc cụ gõ (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <RouterLink
                className="flex flex-col sm:flex-row lg:flex-col rounded-2xl bg-surface border border-border overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 group flex-1 no-underline"
                href={CUSTOMER_ROUTES.products}
              >
                <div className="w-full sm:w-48 lg:w-full aspect-16/9 sm:aspect-auto lg:aspect-16/9 overflow-hidden bg-surface-secondary relative shrink-0">
                  <img
                    alt={catHoi.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    decoding="async"
                    height="240"
                    src={catHoi.image}
                    width="360"
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-surface/90 backdrop-blur-md text-[11px] font-bold text-ink border border-border/80 tracking-wider uppercase">{catHoi.num} / {catHoi.label}</span>
                </div>
                <div className="p-5 sm:p-6 flex flex-col gap-1.5 flex-1 justify-between">
                  <h3 className="text-base font-bold text-ink group-hover:text-brand transition-colors">{catHoi.title}</h3>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">{catHoi.desc}</p>
                  <span className="text-xs font-semibold text-brand flex items-center gap-1 group-hover:underline mt-1">
                    Xem sản phẩm <span aria-hidden="true">→</span>
                  </span>
                </div>
              </RouterLink>

              <RouterLink
                className="flex flex-col sm:flex-row lg:flex-col rounded-2xl bg-surface border border-border overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 group flex-1 no-underline"
                href={CUSTOMER_ROUTES.products}
              >
                <div className="w-full sm:w-48 lg:w-full aspect-16/9 sm:aspect-auto lg:aspect-16/9 overflow-hidden bg-surface-secondary relative shrink-0">
                  <img
                    alt={catGo.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    decoding="async"
                    height="240"
                    src={catGo.image}
                    width="360"
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-surface/90 backdrop-blur-md text-[11px] font-bold text-ink border border-border/80 tracking-wider uppercase">{catGo.num} / {catGo.label}</span>
                </div>
                <div className="p-5 sm:p-6 flex flex-col gap-1.5 flex-1 justify-between">
                  <h3 className="text-base font-bold text-ink group-hover:text-brand transition-colors">{catGo.title}</h3>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">{catGo.desc}</p>
                  <span className="text-xs font-semibold text-brand flex items-center gap-1 group-hover:underline mt-1">
                    Xem sản phẩm <span aria-hidden="true">→</span>
                  </span>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURED PRODUCTS */}
      <section
        aria-labelledby="featured-title"
        className="py-14 sm:py-20 bg-surface border-y border-border/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand mb-1">
                <span className="resonance-motif" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                TUYỂN CHỌN M4N
              </p>
              <h2 id="featured-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">Sản phẩm nổi bật</h2>
              <p className="text-sm text-muted leading-relaxed max-w-lg mt-1">
                Những nhạc cụ tiêu biểu được tuyển chọn kỹ lưỡng về âm sắc và độ hoàn thiện.
              </p>
            </div>
            <RouterLink
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
              href={CUSTOMER_ROUTES.products}
            >
              Xem tất cả sản phẩm <span aria-hidden="true">→</span>
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
              className="inline-flex items-center justify-center font-semibold transition-colors border border-border bg-surface text-ink hover:bg-surface-secondary h-10 px-5 text-sm rounded-lg w-full"
              href={CUSTOMER_ROUTES.products}
            >
              Xem tất cả sản phẩm →
            </RouterLink>
          </div>
        </div>
      </section>

      {/* SECTION 4: ARTISAN & CRAFT VILLAGE */}
      <section
        aria-labelledby="artisan-section-title"
        className="py-14 sm:py-20 bg-canvas"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-border shadow-md bg-surface-secondary aspect-4/3">
              <img
                alt="Nghệ nhân chế tác đàn truyền thống tại xưởng mộc làng nghề"
                className="w-full h-full object-cover"
                decoding="async"
                height="620"
                src={artisanWorkshop}
                width="840"
              />
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4 text-sm text-muted leading-relaxed">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
                <span className="resonance-motif" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                NGHỆ NHÂN & LÀNG NGHỀ
              </p>
              <h2 id="artisan-section-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">
                Nghệ nhân — người giữ hồn nhạc cụ
              </h2>
              <p>
                Mỗi nhạc cụ tại M4N mang dấu ấn của bàn tay nghệ nhân dày dặn kinh nghiệm 
                từ những làng nghề truyền thống lâu đời như Đào Xá, Trúc Sơn và các vùng 
                nghề nổi tiếng khác trên khắp Việt Nam.
              </p>
              <p>
                Từ việc chọn lựa gỗ quý, thực hiện kỹ thuật căng dây chuẩn xác đến 
                quá trình hoàn thiện âm sắc — mỗi công đoạn đều được thực hiện tỉ mỉ 
                để mang đến những nhạc cụ có chất lượng vượt trội, thanh âm thuần khiết.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <RouterLink
                  className="inline-flex items-center justify-center font-semibold transition-colors bg-brand text-white hover:bg-brand-hover h-10 px-5 text-sm rounded-lg shadow-xs"
                  href={CUSTOMER_ROUTES.products}
                >
                  Khám phá nhạc cụ
                </RouterLink>
                <RouterLink
                  className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-brand transition-colors"
                  href={CUSTOMER_ROUTES.products}
                >
                  Tìm hiểu làng nghề <span aria-hidden="true">→</span>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: VỀ M4N / VALUES */}
      <section
        aria-labelledby="values-heading"
        className="py-14 sm:py-20 bg-surface border-t border-border/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left: editorial intro */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
                <span className="resonance-motif" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                VỀ M4N
              </p>
              <h2 id="values-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">
                Tôn vinh di sản âm nhạc Việt
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                M4N cam kết mang đến trải nghiệm mua sắm nhạc cụ truyền thống 
                với thông tin minh bạch, chất lượng đảm bảo và sự hỗ trợ tận tâm.
              </p>
            </div>

            {/* Right: structured value rows */}
            <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-6">
              <div className="flex gap-4 sm:gap-6 p-6 rounded-xl bg-canvas border border-border/80">
                <span className="text-2xl font-bold text-brand/40 font-mono shrink-0" aria-hidden="true">01</span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-bold text-ink">Minh bạch nguồn gốc</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Mỗi sản phẩm đều có thông tin đầy đủ về chất liệu, kích thước, 
                    xuất xứ làng nghề và nghệ nhân chế tác để bạn lựa chọn tự tin.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 sm:gap-6 p-6 rounded-xl bg-canvas border border-border/80">
                <span className="text-2xl font-bold text-brand/40 font-mono shrink-0" aria-hidden="true">02</span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-bold text-ink">Tuyển chọn âm sắc</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Nhạc cụ được thẩm định kỹ lưỡng, chỉ chấp nhận những sản phẩm 
                    đạt chuẩn về độ vang, tính cân bằng âm học và thẩm mỹ cao nhất.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 sm:gap-6 p-6 rounded-xl bg-canvas border border-border/80">
                <span className="text-2xl font-bold text-brand/40 font-mono shrink-0" aria-hidden="true">03</span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-bold text-ink">Tư vấn chuyên môn</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Đội ngũ am hiểu nhạc cụ sẵn sàng hỗ trợ tư vấn âm sắc, kỹ thuật bảo quản 
                    và hướng dẫn sử dụng phù hợp với từng nhu cầu học tập và biểu diễn.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
