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
    <article className="product-detail">
      <ProductMedia media={product.media} productName={product.name} />
      <div className="product-detail__content">
        <p className="eyebrow">Chi tiết sản phẩm</p>
        <h1>{product.name}</h1>
        {hasDisplayValue(product.priceDisplay) ? (
          <p className="product-detail__price">{product.priceDisplay}</p>
        ) : null}
        {visibleDetails.length > 0 ? (
          <dl className="detail-list">
            {visibleDetails.map(({ key, label }) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{product[key]}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {hasDisplayValue(product.description) ? <p>{product.description}</p> : null}
      </div>
    </article>
  )
}

export default ProductDetailInfo
