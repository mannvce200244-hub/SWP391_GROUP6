export function hasProductVariants(product) {
  return Boolean(product.variantCount > 1 || product.variantLabel || (!product.familyId && product.variantGroup))
}

// Items already in a cart/bill consume the displayed add allowance, not stock.
export function additionalQuantityLimit(stock, alreadySelected = 0) {
  if (!Number.isSafeInteger(stock) || stock < 0 || !Number.isSafeInteger(alreadySelected) || alreadySelected < 0) return 0
  return Math.max(0, stock - alreadySelected)
}
