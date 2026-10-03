import ProductCard from './ProductCard.jsx'

function ProductGrid({ products }) {
  return (
    <ul aria-label="Danh sách sản phẩm" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}

export default ProductGrid
