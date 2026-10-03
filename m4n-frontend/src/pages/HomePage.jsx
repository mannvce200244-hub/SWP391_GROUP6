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
    desc: 'Đàn tranh, đàn bầu, đàn nguyệt và các nhạc cụ dây cổ truyền chế tác từ gỗ cẩm lai, gỗ mun và gỗ gụ quý.',
    image: catNhacCuDay,
    alt: 'Nhạc cụ dây truyền thống Việt Nam: đàn tranh và đàn bầu',
  }),
  Object.freeze({
    id: 'hoi',
    num: '02',
    label: 'HƠI',
    title: 'Nhạc cụ hơi',
    desc: 'Sáo trúc, tiêu và các nhạc cụ hơi nứa già thủ công mang âm sắc thanh thoát của làng quê Việt.',
    image: catNhacCuHoi,
    alt: 'Nhạc cụ hơi truyền thống: sáo trúc và tiêu thủ công',
  }),
  Object.freeze({
    id: 'go',
    num: '03',
    label: 'GÕ',
    title: 'Nhạc cụ gõ',
    desc: 'Trống bản, thanh la, mõ gỗ mít và các nhạc cụ gõ mộc mạc gìn giữ nhịp điệu dân tộc.',
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
    <div className="home-page">
      {/* SECTION 1: HERO (Asymmetric 5 cols / 7 cols) */}
      <section aria-labelledby="hero-title" className="home-hero-wrap">
        <div className="home-container home-hero">
          <div className="home-hero__content">
            <p className="eyebrow">NHẠC CỤ TRUYỀN THỐNG VIỆT NAM</p>
            <h1 id="hero-title">
              Nhạc cụ truyền thống, cho không gian sống hôm nay.
            </h1>
            <p className="home-hero__summary">
              Khám phá nhạc cụ theo nhóm, nghệ nhân và làng nghề, với thông tin rõ
              ràng về nguồn gốc và chế tác thủ công.
            </p>
            <div className="home-hero__actions">
              <RouterLink
                className="button button--primary"
                href={CUSTOMER_ROUTES.products}
              >
                Khám phá sản phẩm
              </RouterLink>
              <a className="secondary-link" href="#categories">
                Xem danh mục <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div className="home-hero__media">
            <div className="home-hero__image-wrap">
              <img
                alt="Nghệ sĩ biểu diễn Đàn Tranh truyền thống Việt Nam"
                className="home-hero__image"
                decoding="async"
                fetchPriority="high"
                height="650"
                src={heroDanTranh}
                width="880"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CATEGORIES (Asymmetric 12-Column Editorial Grid) */}
      <section
        aria-labelledby="categories-title"
        className="home-section-wrap home-categories-wrap"
        id="categories"
      >
        <div className="home-container">
          <div className="section-header section-header--with-action">
            <div>
              <p className="eyebrow">DANH MỤC NHẠC CỤ</p>
              <h2 id="categories-title">Khám phá danh mục</h2>
            </div>
            <p className="section-header__lead">
              Ba nhóm nhạc cụ chính cấu thành bản sắc âm nhạc cổ truyền Việt Nam.
            </p>
          </div>

          <div className="categories-asym-grid">
            {/* Primary Feature: Nhạc cụ dây (7 cols) */}
            <div className="cat-feature">
              <RouterLink
                className="cat-feature-link"
                href={CUSTOMER_ROUTES.products}
              >
                <div className="cat-feature__media">
                  <img
                    alt={catDay.alt}
                    decoding="async"
                    height="520"
                    src={catDay.image}
                    width="780"
                  />
                  <span className="cat-tag">{catDay.num} / {catDay.label}</span>
                </div>
                <div className="cat-feature__body">
                  <div className="cat-feature__meta">
                    <h3>{catDay.title}</h3>
                    <span className="text-link">
                      Xem sản phẩm <span aria-hidden="true">→</span>
                    </span>
                  </div>
                  <p>{catDay.desc}</p>
                </div>
              </RouterLink>
            </div>

            {/* Secondary Stack: Nhạc cụ hơi & Nhạc cụ gõ (5 cols) */}
            <div className="cat-stack">
              <RouterLink
                className="cat-stack-card"
                href={CUSTOMER_ROUTES.products}
              >
                <div className="cat-stack-card__media">
                  <img
                    alt={catHoi.alt}
                    decoding="async"
                    height="240"
                    src={catHoi.image}
                    width="360"
                  />
                  <span className="cat-tag">{catHoi.num} / {catHoi.label}</span>
                </div>
                <div className="cat-stack-card__body">
                  <h3>{catHoi.title}</h3>
                  <p>{catHoi.desc}</p>
                  <span className="text-link">
                    Xem sản phẩm <span aria-hidden="true">→</span>
                  </span>
                </div>
              </RouterLink>

              <RouterLink
                className="cat-stack-card"
                href={CUSTOMER_ROUTES.products}
              >
                <div className="cat-stack-card__media">
                  <img
                    alt={catGo.alt}
                    decoding="async"
                    height="240"
                    src={catGo.image}
                    width="360"
                  />
                  <span className="cat-tag">{catGo.num} / {catGo.label}</span>
                </div>
                <div className="cat-stack-card__body">
                  <h3>{catGo.title}</h3>
                  <p>{catGo.desc}</p>
                  <span className="text-link">
                    Xem sản phẩm <span aria-hidden="true">→</span>
                  </span>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURED PRODUCTS (Sản phẩm được quan tâm) */}
      <section
        aria-labelledby="featured-title"
        className="home-section-wrap home-products-wrap"
      >
        <div className="home-container">
          <div className="section-header section-header--with-action">
            <div>
              <p className="eyebrow">TUYỂN CHỌN M4N</p>
              <h2 id="featured-title">Sản phẩm được quan tâm</h2>
              <p className="section-header__lead">
                Những nhạc cụ tiêu biểu được chế tác thủ công bởi các nghệ nhân làng
                nghề.
              </p>
            </div>
            <RouterLink
              className="text-link text-link--section"
              href={CUSTOMER_ROUTES.products}
            >
              Xem tất cả sản phẩm <span aria-hidden="true">→</span>
            </RouterLink>
          </div>

          <ul aria-label="Danh sách sản phẩm được quan tâm" className="product-grid product-grid--4col">
            {FEATURED_PRODUCTS.map((product) => (
              <li key={product.id}>
                <ProductCard priority={true} product={product} />
              </li>
            ))}
          </ul>

          <div className="section-footer-mobile">
            <RouterLink
              className="button button--quiet"
              href={CUSTOMER_ROUTES.products}
            >
              Xem tất cả sản phẩm →
            </RouterLink>
          </div>
        </div>
      </section>

      {/* SECTION 4: ARTISAN & CRAFT VILLAGE (Asymmetric 7 cols / 5 cols) */}
      <section
        aria-labelledby="artisan-section-title"
        className="home-section-wrap home-artisan-wrap"
      >
        <div className="home-container">
          <div className="artisan-grid">
            <div className="artisan-grid__media">
              <img
                alt="Nghệ nhân chế tác đàn truyền thống tại xưởng mộc làng nghề"
                className="artisan-grid__image"
                decoding="async"
                height="620"
                src={artisanWorkshop}
                width="840"
              />
            </div>

            <div className="artisan-grid__content">
              <p className="eyebrow">NGHỆ NHÂN & LÀNG NGHỀ</p>
              <h2 id="artisan-section-title">
                Người làm nên thanh âm.
              </h2>
              <p>
                Mỗi cây đàn, chiếc sáo tại M4N được tạo tác thủ công bởi các nghệ
                nhân dày dạn kinh nghiệm từ những cái nôi làng nghề truyền thống
                như Đào Xá, Trúc Sơn hay Bát Tràng.
              </p>
              <p>
                Sự tỉ mỉ trong từng đường vân gỗ quý, kỹ thuật căng dây chuẩn xác và
                đôi tai thẩm âm mộc mạc mang lại những nhạc cụ có thanh âm chuẩn mực,
                đồng hành bền bỉ cùng người nghệ sĩ.
              </p>

              <div className="artisan-grid__actions">
                <RouterLink
                  className="button button--primary"
                  href={CUSTOMER_ROUTES.products}
                >
                  Khám phá nghệ nhân
                </RouterLink>
                <RouterLink
                  className="secondary-link"
                  href={CUSTOMER_ROUTES.products}
                >
                  Khám phá làng nghề <span aria-hidden="true">→</span>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: VỀ M4N / VALUES (12-Column Asymmetric Editorial Grid) */}
      <section
        aria-labelledby="values-heading"
        className="home-section-wrap home-values-wrap"
      >
        <div className="home-container">
          <div className="values-editorial-grid">
            {/* Left: 4 columns editorial intro */}
            <div className="values-editorial__intro">
              <p className="eyebrow">VỀ M4N</p>
              <h2 id="values-heading">
                Một nơi để hiểu rõ hơn về nhạc cụ Việt.
              </h2>
              <p className="values-editorial__lead">
                M4N tập trung vào sản phẩm, nguồn gốc và thông tin cần thiết để
                người mua lựa chọn phù hợp.
              </p>
            </div>

            {/* Right: 8 columns stacked horizontal rows */}
            <div className="values-editorial__list">
              <div className="values-row">
                <span className="values-row__num" aria-hidden="true">01</span>
                <div className="values-row__content">
                  <h3 className="values-row__title">Thông tin rõ ràng</h3>
                  <p className="values-row__desc">
                    Minh bạch về chất liệu gỗ, kích thước, xuất xứ làng nghề và thông
                    tin nghệ nhân trực tiếp chế tác.
                  </p>
                </div>
              </div>

              <div className="values-row">
                <span className="values-row__num" aria-hidden="true">02</span>
                <div className="values-row__content">
                  <h3 className="values-row__title">Nhạc cụ truyền thống</h3>
                  <p className="values-row__desc">
                    Tập trung chuẩn mực vào 3 nhóm nhạc cụ dây, hơi và gõ tiêu biểu của
                    âm nhạc truyền thống Việt Nam.
                  </p>
                </div>
              </div>

              <div className="values-row">
                <span className="values-row__num" aria-hidden="true">03</span>
                <div className="values-row__content">
                  <h3 className="values-row__title">Hỗ trợ trực tuyến</h3>
                  <p className="values-row__desc">
                    Nhân viên tư vấn trực tuyến hỗ trợ giải đáp kỹ thuật, âm sắc và cách
                    bảo quản đàn chu đáo.
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
