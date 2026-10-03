import ProductCard from './ProductCard.jsx'

function ProductGrid({ products }) {
  return (
    <ul aria-label="Danh sách sản phẩm" className="product-grid">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}

export default ProductGrid
