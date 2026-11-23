import { useState } from 'react'
import { ChevronRight, Package, Plus } from 'lucide-react'
import { formatCurrencyVND } from '../../utils/currency.js'
import { groupPosCatalog, hasPosVariants } from './posCatalogGroups.js'

function ProductImage({ product }) {
  const [failed, setFailed] = useState(false)
  return <div className="aspect-4/3 w-full overflow-hidden rounded-lg bg-surface-secondary">
    {product.primaryImage && !failed ? <img src={product.primaryImage} alt={product.familyName || product.name}
      width={320} height={240} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      : <div className="flex h-full items-center justify-center text-muted"><Package size={24} aria-hidden="true" /></div>}
  </div>
}

export default function PosCatalog({ products, onSelect, onAdd, selectedProductId, disabled = false }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
    {groupPosCatalog(products).map(({ key, product }) => {
      const variants = hasPosVariants(product)
      const selected = selectedProductId === product.id
      const name = variants ? product.familyName || product.variantGroup || product.name : product.name
      return <article key={key} className={`flex min-w-0 flex-col justify-between gap-3 rounded-xl border bg-white p-3 shadow-xs ${selected ? 'border-brand' : 'border-border'}`}>
        <button type="button" disabled={disabled} aria-label={`Xem sản phẩm ${name}`}
          aria-haspopup="dialog" aria-expanded={selected} aria-controls={selected ? 'pos-variant-selection' : undefined}
          onClick={() => onSelect(product)}
          className="group w-full space-y-2 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50">
          <ProductImage key={product.primaryImage} product={product} />
          <p className="text-xs text-muted">{variants ? product.variantCount > 1 ? `${product.variantCount} biến thể` : 'Có lựa chọn biến thể'
            : product.quantity > 0 ? `Còn ${product.quantity}` : 'Hết hàng'}</p>
          {!variants && <p className="break-all font-mono text-xs text-muted" translate="no">{product.code}</p>}
          <span className="block line-clamp-2 text-xs font-bold text-ink group-hover:text-brand">{name}</span>
        </button>
        <div className="flex w-full items-center justify-between gap-2 border-t border-border/60 pt-2">
          <span className="break-words text-xs font-bold tabular-nums text-brand">{variants ? 'Chọn biến thể' : formatCurrencyVND(product.price)}</span>
          {variants ? <button type="button" aria-label={`Xem biến thể ${name}`} disabled={disabled}
            aria-haspopup="dialog" onClick={() => onSelect(product)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-brand hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"><ChevronRight size={18} aria-hidden="true" /></button>
            : <button type="button" aria-label={`Thêm ${name} vào hóa đơn`} disabled={disabled || product.quantity <= 0}
              onClick={() => onAdd(product)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-brand hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"><Plus size={18} aria-hidden="true" /></button>}
        </div>
      </article>
    })}
  </div>
}
