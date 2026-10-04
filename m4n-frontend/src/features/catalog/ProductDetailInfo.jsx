import ProductMedia from './ProductMedia.jsx'

const PRODUCT_DETAILS = Object.freeze([
  Object.freeze({ key: 'groupName', label: 'Nhóm nhạc cụ' }),
  Object.freeze({ key: 'material', label: 'Chất liệu' }),
  Object.freeze({ key: 'dimensions', label: 'Kích thước' }),
  Object.freeze({ key: 'range', label: 'Âm vực' }),
  Object.freeze({ key: 'origin', label: 'Xuất xứ' }),
  Object.freeze({ key: 'artisanName', label: 'Nghệ nhân' }),
  Object.freeze({ key: 'craftVillageName', label: 'Làng nghề' }),
])

function hasDisplayValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function ProductDetailInfo({ product }) {
  const visibleDetails = PRODUCT_DETAILS.filter(({ key }) =>
    hasDisplayValue(product[key]),
  )

  return (
    <article className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
      <ProductMedia media={product.media} productName={product.name} />
      <div className="flex flex-col gap-4 bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-xs">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
          <span className="resonance-motif" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          CHI TIẾT NHẠC CỤ
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink font-sans">{product.name}</h1>
        {hasDisplayValue(product.priceDisplay) ? (
          <p className="text-2xl font-bold text-brand">{product.priceDisplay}</p>
        ) : null}
        {visibleDetails.length > 0 ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 py-4 border-y border-border/70 my-2">
            {visibleDetails.map(({ key, label }) => (
              <div key={key}>
                <dt className="text-xs font-medium text-muted">{label}</dt>
                <dd className="text-sm font-semibold text-ink mt-0.5">{product[key]}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {hasDisplayValue(product.description) ? (
          <p className="text-sm text-ink/80 leading-relaxed">{product.description}</p>
        ) : null}
      </div>
    </article>
  )
}

export default ProductDetailInfo
