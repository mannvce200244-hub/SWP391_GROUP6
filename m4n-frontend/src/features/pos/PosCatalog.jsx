import { useState } from 'react'
import { Package, Plus } from 'lucide-react'
import ProductVariantPicker from '../catalog/ProductVariantPicker.jsx'
import { formatCurrencyVND } from '../../utils/currency.js'
import { groupPosCatalog } from './posCatalogGroups.js'

function ProductImage({ product }) {
  const [failed, setFailed] = useState(false)
  return <div className="aspect-4/3 w-full overflow-hidden rounded-lg bg-surface-secondary">
    {product.primaryImage && !failed ? <img src={product.primaryImage} alt={product.name}
      width={320} height={240} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      : <div className="flex h-full items-center justify-center text-muted"><Package size={24} aria-hidden="true" /></div>}
  </div>
}

export default function PosCatalog({ products, onAdd, disabled = false }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
    {groupPosCatalog(products).map(({ key, product }) => product.variantGroup ? (
      <article key={key} aria-label={product.variantGroup}
        className="col-span-2 min-w-0 space-y-3 rounded-xl border border-border bg-white p-3 shadow-xs sm:col-span-3">
        <div className="flex items-center gap-3">
          <div className="w-24 shrink-0"><ProductImage key={product.primaryImage} product={product} /></div>
          <div className="min-w-0">
            <h3 className="break-words text-sm font-bold text-ink">{product.variantGroup}</h3>
            <p className="mt-1 text-xs text-muted">{product.categoryName}</p>
          </div>
        </div>
        <ProductVariantPicker product={product} purchasing disabled={disabled} onSelect={(variant) => onAdd({
          ...variant, quantity: variant.stockQuantity, primaryImage: variant.media?.[0]?.url,
        })} />
      </article>
    ) : (
      <button key={key} type="button" disabled={disabled || product.quantity <= 0} onClick={() => onAdd(product)}
        className="group flex min-w-0 flex-col justify-between gap-3 rounded-xl border border-border bg-white p-3 text-left shadow-xs transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50">
        <div className="space-y-2">
          <ProductImage key={product.primaryImage} product={product} />
          <p className="text-xs text-muted">{product.quantity > 0 ? `Còn ${product.quantity}` : 'Hết hàng'}</p>
          <p className="break-all font-mono text-xs text-muted" translate="no">{product.code}</p>
          <span className="block line-clamp-2 text-xs font-bold text-ink group-hover:text-brand">{product.name}</span>
        </div>
        <div className="flex w-full items-center justify-between gap-2 border-t border-border/60 pt-2">
          <span className="break-words text-xs font-bold tabular-nums text-brand">{formatCurrencyVND(product.price)}</span>
          <Plus size={18} className="shrink-0" aria-hidden="true" />
        </div>
      </button>
    ))}
  </div>
}
