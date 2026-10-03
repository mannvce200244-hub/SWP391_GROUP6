const emptyProductCatalogAdapter = Object.freeze({
  async listProducts() {
    return []
  },

  async getProductById() {
    return null
  },
})

export default emptyProductCatalogAdapter
