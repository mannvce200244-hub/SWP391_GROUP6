function ProductSpecs({ product }) {
  if (!product) return null

  const specs = [
    { label: 'Chất liệu', value: product.material },
    { label: 'Kích thước', value: product.dimensions },
    { label: 'Âm vực', value: product.musicalRange },
    { label: 'Xuất xứ', value: product.origin },
    { label: 'Nghệ nhân', value: product.artisan?.name || product.artisanName },
    {
      label: 'Làng nghề',
      value: product.craftVillage
        ? `${product.craftVillage.name}${product.craftVillage.location ? ` (${product.craftVillage.location})` : ''}`
        : product.craftVillageName || null,
    },
  ].filter((spec) => spec.value && String(spec.value).trim() !== '')

  if (specs.length === 0) return null

  return (
    <section aria-labelledby="product-specs-heading" className="py-8">
      <h2
        className="text-lg sm:text-xl font-bold text-ink tracking-tight mb-6"
        id="product-specs-heading"
      >
        Thông tin sản phẩm
      </h2>

      <dl className="divide-y divide-border/60">
        {specs.map((spec) => (
          <div
            key={spec.label}
            className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6 items-baseline"
          >
            <dt className="text-sm font-medium text-muted">{spec.label}</dt>
            <dd className="text-sm font-semibold text-ink sm:col-span-2 leading-relaxed">
              {spec.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default ProductSpecs
