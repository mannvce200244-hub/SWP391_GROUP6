import productCatalogAdapter from '../api/productCatalogAdapter.js'

function createProductService(adapter) {
  return Object.freeze({
    async listProducts(filters) {
      const products = await adapter.listProducts(filters)

      if (!Array.isArray(products)) {
        throw new Error('Product catalog response must be an array.')
      }

      return products
    },

    async getProductById(productId) {
      const product = await adapter.getProductById(productId)

      if (
        product !== null &&
        (typeof product !== 'object' || Array.isArray(product))
      ) {
        throw new Error('Product detail response must be an object or null.')
      }

      return product
    },
  })
}

const productService = createProductService(productCatalogAdapter)

export default productService
