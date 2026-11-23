import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import productVariantService from '../../services/productVariantService.js'
import adminProductService from '../../services/adminProductService.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import { buildAttributeGroups, optionAvailability, selectVariantOption } from './variantOptions.js'

function isSameOption(left, right) {
  return String(left || '').trim().normalize('NFC').toLocaleLowerCase('vi')
    === String(right || '').trim().normalize('NFC').toLocaleLowerCase('vi')
}

export default function ProductVariantPicker({ product, onSelect, admin = false, disabled = false, switching = false, initialPage = null }) {
  const [page, setPage] = useState(0)
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState(null)
  const family = product.familyId != null ? `product:${product.familyId}` : product.variantGroup || `sku:${product.id}`
  const useInitialPage = Boolean(initialPage) && page === 0 && retry === 0
  const current = useInitialPage || (state?.page === page && state?.retry === retry && state?.family === family && state?.admin === admin)
  const reusePage = useInitialPage || (admin && current)
  const data = useInitialPage ? initialPage : state?.data
  const error = useInitialPage ? null : state?.error
  const requestRef = useRef(null)

  useEffect(() => {
    if (reusePage) return undefined
    let active = true
    const key = JSON.stringify([admin, product.id, family, page, retry])
    if (requestRef.current?.key !== key) {
      requestRef.current = { key, promise: admin ? adminProductService.listVariants(product.id, page) : productVariantService.list(product.id, page) }
    }
    requestRef.current.promise.then((result) => {
      if (active) setState({ page, retry, family, admin, data: result })
    }).catch((err) => { if (active) setState({ page, retry, family, admin, error: err.message }) })
    return () => { active = false }
  }, [product.id, family, page, retry, admin, reusePage])

  const variants = data?.content || []
  const groups = buildAttributeGroups(variants)
  const activeVariant = variants.find((item) => item.id === product.id) || product
  const displayedActive = admin && activeVariant.id === product.id ? product : activeVariant
  const activePrice = admin ? displayedActive.originalPrice ?? displayedActive.price : displayedActive.price
  const activeOutOfStock = (displayedActive.stockQuantity ?? 0) <= 0

  const handleChooseOption = (dimension, value) => {
    const next = selectVariantOption(variants, activeVariant, dimension, value)
    if (next) onSelect(next)
  }

  const chipTone = (selected, isOutOfStock, exists) => {
    if (selected) {
      if (isOutOfStock) {
        return admin
          ? 'border-brand/70 bg-[#F6F7F8] text-muted font-semibold pr-7'
          : 'border-[#C8CDD2] bg-[#F6F7F8] text-muted font-semibold pr-7'
      }
      return 'border-brand bg-[#FFFFFF] text-brand font-semibold pr-7'
    }
    if (!exists) return 'border-dashed border-[#E3E6E8] bg-[#F6F7F8] text-muted hover:border-subtle'
    if (isOutOfStock) return 'border-[#E3E6E8] bg-[#F6F7F8] text-muted hover:border-subtle'
    return 'border-border bg-[#FFFFFF] text-ink hover:border-brand'
  }

  const summaryLine = (
    <p
      role="status"
      className={`rounded-lg border px-3 py-2 text-xs ${
        activeOutOfStock
          ? 'border-[#E3E6E8] bg-[#F6F7F8] text-muted'
          : 'border-border bg-surface-secondary text-secondary'
      }`}
    >
      Đang chọn:{' '}
      <strong className={activeOutOfStock ? 'text-muted' : 'text-ink'}>
        {displayedActive.variantLabel || 'Mặc định'}
      </strong>
      {' · '}
      <span className={`font-semibold tabular-nums ${activeOutOfStock ? 'text-muted' : 'text-brand'}`}>
        {formatCurrencyVND(activePrice)}{admin ? ' niêm yết' : ''}
      </span>
      {' · '}
      <span>{activeOutOfStock ? 'Hết hàng' : `Còn ${displayedActive.stockQuantity}`}</span>
      {switching ? ' · Đang kiểm tra thông tin…' : ''}
    </p>
  )

  return (
    <div className="min-w-0 space-y-3" aria-busy={!current}>
      {!groups.structured && <p className="text-sm font-semibold text-ink">Chọn biến thể</p>}
      {!current ? <p role="status" className="text-sm text-muted">Đang tải biến thể…</p> : error ? (
        <div role="alert" className="text-sm text-danger">{error} <button type="button" onClick={() => setRetry((value) => value + 1)} className="underline">Thử lại</button></div>
      ) : groups.structured ? (
        <div className="space-y-3">
          <fieldset className="min-w-0 space-y-2" disabled={disabled}>
            <legend className="text-sm font-semibold text-ink">{groups.option1Name}</legend>
            <div className="flex flex-wrap gap-2">
              {groups.option1Values.map((value) => {
                const selected = isSameOption(activeVariant.option1Value, value)
                const availability = optionAvailability(variants, activeVariant, 1, value)
                const isOutOfStock = groups.option2Name
                  ? !availability.anyInStock
                  : (availability.exists && !availability.inStock)
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    disabled={disabled || !availability.anyExists}
                    onClick={() => handleChooseOption(1, value)}
                    className={`relative min-h-10 min-w-0 max-w-full rounded-xl border px-3.5 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40 cursor-pointer ${chipTone(selected, isOutOfStock, availability.exists)}`}
                  >
                    <span className="break-words">{value}</span>
                    {isOutOfStock && (
                      <span className="ml-1.5 text-xs text-muted">(Hết hàng)</span>
                    )}
                    {selected && <Check className="absolute right-2 top-1/2 -translate-y-1/2" size={14} aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {groups.option2Name && groups.option2Values.length > 0 && (
            <fieldset className="min-w-0 space-y-2" disabled={disabled}>
              <legend className="text-sm font-semibold text-ink">{groups.option2Name}</legend>
              <div className="flex flex-wrap gap-2">
                {groups.option2Values.map((value) => {
                  const selected = isSameOption(activeVariant.option2Value, value)
                  const availability = optionAvailability(variants, activeVariant, 2, value)
                  const isOutOfStock = availability.exists && !availability.inStock
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      disabled={disabled || !availability.anyExists}
                      onClick={() => handleChooseOption(2, value)}
                      className={`relative min-h-10 min-w-0 max-w-full rounded-xl border px-3.5 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40 cursor-pointer ${chipTone(selected, isOutOfStock, availability.exists)}`}
                    >
                      <span className="break-words">{value}</span>
                      {isOutOfStock && (
                        <span className="ml-1.5 text-xs text-muted">(Hết hàng)</span>
                      )}
                      {!availability.exists && availability.anyExists && (
                        <span className="ml-1.5 text-xs text-muted">(Đổi nhóm 1)</span>
                      )}
                      {selected && <Check className="absolute right-2 top-1/2 -translate-y-1/2" size={14} aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          )}

          {summaryLine}
        </div>
      ) : <>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => {
            const displayed = admin && variant.id === product.id ? product : variant
            const price = admin ? displayed.originalPrice ?? displayed.price : displayed.price
            const isOutOfStock = (displayed.stockQuantity ?? 0) <= 0
            const selected = variant.id === product.id
            const details = <><span className="block break-words font-semibold">{displayed.variantLabel || 'Mặc định'}</span>
              <span className="block text-xs">{formatCurrencyVND(price)}{admin ? ' niêm yết' : ''} · {isOutOfStock ? 'Hết hàng' : `Còn ${displayed.stockQuantity}`}</span></>
            return <button key={variant.id} type="button" aria-pressed={selected}
            disabled={disabled} onClick={() => onSelect(variant)}
            className={`min-h-11 min-w-0 max-w-full rounded-xl border px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40 cursor-pointer ${
              selected
                ? isOutOfStock
                  ? admin
                    ? 'border-brand/70 bg-[#F6F7F8] text-muted'
                    : 'border-[#C8CDD2] bg-[#F6F7F8] text-muted'
                  : 'border-brand bg-[#FFFFFF] text-brand'
                : isOutOfStock
                  ? 'border-[#E3E6E8] bg-[#F6F7F8] text-muted hover:border-subtle'
                  : 'border-border bg-[#FFFFFF] text-ink hover:border-brand'
            }`}>
            {details}
          </button>})}
        </div>
        {summaryLine}
        {data.totalPages > 1 && <div className="flex items-center gap-3 text-sm">
          <button type="button" disabled={disabled || page === 0} onClick={() => setPage((value) => value - 1)}>Trước</button>
          <span>{page + 1}/{data.totalPages}</span>
          <button type="button" disabled={disabled || page >= data.totalPages - 1} onClick={() => setPage((value) => value + 1)}>Sau</button>
        </div>}
      </>}
    </div>
  )
}
