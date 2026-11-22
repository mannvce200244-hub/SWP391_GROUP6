export function hasPosVariants(product) {
  return Boolean(product.variantCount > 1 || product.variantLabel || (!product.familyId && product.variantGroup))
}

export function groupPosCatalog(products) {
  const groups = new Map()
  for (const product of products) {
    const family = product.variantGroup?.trim().normalize('NFC')
    const key = product.familyId != null ? `product:${product.familyId}` : family ? `family:${family.toLocaleLowerCase('vi')}` : `sku:${product.id}`
    if (!groups.has(key)) groups.set(key, { key, product })
  }
  return [...groups.values()]
}
