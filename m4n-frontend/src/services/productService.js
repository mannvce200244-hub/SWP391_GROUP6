import productCatalogAdapter from '../api/productCatalogAdapter.js'

function createProductService(adapter) {
  return Object.freeze({
    async listProducts(filters) {
      const result = await adapter.listProducts(filters)
      if (Array.isArray(result)) {
        return result
      }
      if (result && Array.isArray(result.products)) {
        return result.products
      }
      return []
    },

    async listProductsPage(filters) {
      const result = await adapter.listProducts(filters)
      if (result && Array.isArray(result.products)) {
        return result
      }
      if (Array.isArray(result)) {
        return {
          products: result,
          totalPages: 1,
          totalElements: result.length,
          page: 1,
          size: result.length,
        }
      }
      return {
        products: [],
        totalPages: 1,
        totalElements: 0,
        page: 1,
        size: 9,
      }
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

    async getCategories() {
      return adapter.getCategories()
    },
  })
}

const productService = createProductService(productCatalogAdapter)

export default productService
