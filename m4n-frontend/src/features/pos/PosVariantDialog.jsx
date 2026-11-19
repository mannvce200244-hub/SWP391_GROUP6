import useDialogFocus from '../../hooks/useDialogFocus.js'
import ProductVariantPicker from '../catalog/ProductVariantPicker.jsx'
import { X } from 'lucide-react'

export default function PosVariantDialog({ product, onSelect, onClose }) {
  const ref = useDialogFocus(true, onClose)
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
    <section ref={ref} role="dialog" aria-modal="true" aria-labelledby="pos-variant-title" tabIndex={-1}
      className="w-full max-w-lg max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="pos-variant-title" className="min-w-0 break-words font-semibold text-ink">{product.variantGroup}</h2>
        <button type="button" onClick={onClose} aria-label="Đóng chọn biến thể" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-surface-secondary"><X aria-hidden="true" /></button>
      </div>
      <ProductVariantPicker key={product.id} product={product} purchasing onSelect={(variant) => onSelect({
        ...variant, quantity: variant.stockQuantity, primaryImage: variant.media?.[0]?.url,
      })} />
    </section>
  </div>
}
