import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Package, X } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import QuantitySelector from '../../components/ui/QuantitySelector.jsx'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import productService from '../../services/productService.js'
import productVariantService from '../../services/productVariantService.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import { getFirstProductImage } from './productMedia.js'
import { additionalQuantityLimit, hasProductVariants } from './productPurchase.js'
import { buildAttributeGroups, optionAvailability, selectVariantOption } from './variantOptions.js'

function isSameOption(left, right) {
  return String(left || '').trim().normalize('NFC').toLocaleLowerCase('vi')
    === String(right || '').trim().normalize('NFC').toLocaleLowerCase('vi')
}

function PurchaseImage({ product, thumbnail = false }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const image = getFirstProductImage(product.media)
  return image && image.url !== failedUrl
    ? <img src={image.url} alt={thumbnail ? '' : product.name} width={thumbnail ? 36 : 112} height={thumbnail ? 36 : 112}
      onError={() => setFailedUrl(image.url)} className={`${thumbnail ? 'h-9 w-9' : 'h-24 w-24 sm:h-28 sm:w-28'} shrink-0 rounded-md border border-border object-contain bg-white`} />
    : <div className={`${thumbnail ? 'h-9 w-9' : 'h-24 w-24 sm:h-28 sm:w-28'} flex shrink-0 flex-col items-center justify-center gap-1 rounded-md bg-surface-secondary text-muted`}>
      <Package size={thumbnail ? 18 : 28} aria-hidden="true" />{!thumbnail && <span className="text-xs">Chưa có ảnh</span>}
    </div>
}

/** One purchase choice shared by the customer storefront and the cashier. */
export default function ProductPurchaseDialog({ id, product, initialQuantity = 1, confirmLabel, onConfirm, onClose, quantityLimit, disabled = false }) {
  const titleId = useId()
  const quantityId = useId()
  const [selected, setSelected] = useState(product)
  const [quantity, setQuantity] = useState(initialQuantity)
  const [page, setPage] = useState(0)
  const [retry, setRetry] = useState(0)
  const [options, setOptions] = useState(null)
  const [detail, setDetail] = useState(null)
  const [pending, setPending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const submitting = useRef(false)
  const variants = hasProductVariants(product)
  const busy = pending || disabled
  const dialogRef = useDialogFocus(true, onClose, busy)
  const currentOptions = options?.page === page && options?.retry === retry
  const currentDetail = detail?.id === selected.id && detail?.retry === retry
  const displayed = currentDetail && detail.product ? detail.product : selected
  const loading = !currentDetail || (variants && !currentOptions)
  const loadError = (currentDetail && detail.error) || (variants && currentOptions && options.error)
  const limit = additionalQuantityLimit(quantityLimit ? quantityLimit(displayed) : displayed.stockQuantity)
  const validQuantity = Number.isSafeInteger(quantity) && quantity > 0 && quantity <= limit
  const variantList = options?.data?.content || []
  const groups = buildAttributeGroups(variantList)
  const activeOptionVariant = variantList.find((item) => item.id === selected.id) || displayed
  const canConfirm = !loading && !loadError && !busy && validQuantity && (!variants || variantList.length > 0)

  useEffect(() => {
    let active = true
    productService.getProductById(selected.id).then((value) => {
      if (active) setDetail({ id: selected.id, retry, product: value, error: value ? null : 'Sản phẩm không còn được kinh doanh.' })
    }).catch(() => { if (active) setDetail({ id: selected.id, retry, error: 'Chưa tải được giá và tồn kho. Vui lòng thử lại.' }) })
    return () => { active = false }
  }, [selected.id, retry])

  useEffect(() => {
    if (!variants) return undefined
    let active = true
    productVariantService.list(product.id, page).then((data) => {
      if (active) setOptions({ page, retry, data })
    }).catch(() => { if (active) setOptions({ page, retry, error: 'Chưa tải được các biến thể. Vui lòng thử lại.' }) })
    return () => { active = false }
  }, [product.id, variants, page, retry])

  const chooseVariant = (next) => {
    if (next && next.id !== selected.id) {
      setSelected(next)
      setQuantity(1)
      setSubmitError('')
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!canConfirm || submitting.current) return
    submitting.current = true
    setPending(true)
    setSubmitError('')
    try {
      if (await onConfirm(displayed, quantity)) onClose()
      else setSubmitError('Chưa thể thêm sản phẩm. Vui lòng kiểm tra thông báo và thử lại.')
    } catch {
      setSubmitError('Chưa thể thực hiện. Lựa chọn của bạn vẫn được giữ, vui lòng thử lại.')
    } finally {
      submitting.current = false
      setPending(false)
    }
  }

  return createPortal(<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-5"
    onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <section id={id} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
      className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-white shadow-xl sm:rounded-2xl">
      <header className="relative flex shrink-0 gap-4 border-b border-border p-5 pr-16">
        <PurchaseImage key={displayed.id} product={displayed} />
        <div className="min-w-0 space-y-1 self-center" aria-live="polite" aria-busy={!currentDetail}>
          <h2 id={titleId} className="line-clamp-2 break-words text-base font-bold text-ink">{product.familyName || product.variantGroup || product.name}</h2>
          <p className="break-words text-xl font-bold tabular-nums text-brand">{formatCurrencyVND(displayed.price)}</p>
          {Number(displayed.originalPrice) > Number(displayed.price) && <del className="block text-xs tabular-nums text-muted">{formatCurrencyVND(displayed.originalPrice)}</del>}
          <p className="text-sm text-muted">{!currentDetail ? 'Đang kiểm tra tồn kho…' : detail.product ? `Kho: ${displayed.stockQuantity}` : 'Chưa xác nhận tồn kho'}</p>
          <p className="break-all text-xs text-muted" translate="no">SKU: {displayed.code}{displayed.variantLabel ? ` · ${displayed.variantLabel}` : ''}</p>
        </div>
        <button type="button" aria-label="Đóng chọn sản phẩm" data-dialog-initial-focus disabled={busy} onClick={onClose}
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40"><X size={22} aria-hidden="true" /></button>
      </header>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain p-5">
          {variants && (!currentOptions ? (
            <p role="status" className="text-sm text-muted">Đang tải biến thể…</p>
          ) : options.data && (
            variantList.length === 0 ? (
              <p className="text-sm text-muted">Chưa có biến thể để chọn.</p>
            ) : groups.structured ? (
              <div className="space-y-4">
                <fieldset disabled={busy} className="min-w-0">
                  <legend className="mb-2.5 text-sm font-semibold text-ink">{groups.option1Name}</legend>
                  <div className="flex flex-wrap gap-2">
                    {groups.option1Values.map((value) => {
                      const isSelected = isSameOption(activeOptionVariant.option1Value, value)
                      const availability = optionAvailability(variantList, activeOptionVariant, 1, value)
                      const isOutOfStock = groups.option2Name
                        ? !availability.anyInStock
                        : (availability.exists && !availability.inStock)
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={isSelected}
                          disabled={busy || !availability.anyExists}
                          onClick={() => chooseVariant(selectVariantOption(variantList, activeOptionVariant, 1, value))}
                          className={`relative flex min-h-10 max-w-full items-center gap-1.5 rounded-lg border px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40 cursor-pointer ${
                            isSelected
                              ? isOutOfStock
                                ? 'border-[#C8CDD2] bg-[#F6F7F8] text-muted font-semibold pr-7'
                                : 'border-brand bg-[#FFFFFF] text-brand font-semibold pr-7'
                              : !availability.exists
                                ? 'border-dashed border-[#E3E6E8] bg-[#F6F7F8] text-muted hover:border-subtle'
                                : isOutOfStock
                                  ? 'border-[#E3E6E8] bg-[#F6F7F8] text-muted hover:border-subtle'
                                  : 'border-border bg-[#FFFFFF] text-ink hover:border-brand'
                          }`}
                        >
                          <span className="break-words">{value}</span>
                          {isOutOfStock && <span className="text-xs text-muted">(Hết hàng)</span>}
                          {isSelected && <Check className="absolute right-1.5 top-1/2 -translate-y-1/2" size={14} aria-hidden="true" />}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                {groups.option2Name && groups.option2Values.length > 0 && (
                  <fieldset disabled={busy} className="min-w-0">
                    <legend className="mb-2.5 text-sm font-semibold text-ink">{groups.option2Name}</legend>
                    <div className="flex flex-wrap gap-2">
                      {groups.option2Values.map((value) => {
                        const isSelected = isSameOption(activeOptionVariant.option2Value, value)
                        const availability = optionAvailability(variantList, activeOptionVariant, 2, value)
                        const isOutOfStock = availability.exists && !availability.inStock
                        return (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={isSelected}
                            disabled={busy || !availability.anyExists}
                            onClick={() => chooseVariant(selectVariantOption(variantList, activeOptionVariant, 2, value))}
                            className={`relative flex min-h-10 max-w-full items-center gap-1.5 rounded-lg border px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40 cursor-pointer ${
                              isSelected
                                ? isOutOfStock
                                  ? 'border-[#C8CDD2] bg-[#F6F7F8] text-muted font-semibold pr-7'
                                  : 'border-brand bg-[#FFFFFF] text-brand font-semibold pr-7'
                                : !availability.exists
                                  ? 'border-dashed border-[#E3E6E8] bg-[#F6F7F8] text-muted hover:border-subtle'
                                  : isOutOfStock
                                    ? 'border-[#E3E6E8] bg-[#F6F7F8] text-muted hover:border-subtle'
                                    : 'border-border bg-[#FFFFFF] text-ink hover:border-brand'
                            }`}
                          >
                            <span className="break-words">{value}</span>
                            {isOutOfStock && <span className="text-xs text-muted">(Hết hàng)</span>}
                            {isSelected && <Check className="absolute right-1.5 top-1/2 -translate-y-1/2" size={14} aria-hidden="true" />}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                )}
              </div>
            ) : (
              <fieldset disabled={busy} className="min-w-0">
                <legend className="mb-3 text-sm font-semibold text-ink">Chọn biến thể</legend>
                <div className="flex flex-wrap gap-2">
                  {variantList.map((variant) => {
                    const isOutOfStock = (variant.stockQuantity ?? 0) <= 0
                    const isSelected = variant.id === selected.id
                    return (
                      <button type="button" key={variant.id} aria-pressed={isSelected}
                        onClick={() => chooseVariant(variant)}
                        className={`relative flex min-h-11 max-w-full items-center gap-2 rounded-lg border px-2.5 py-2 pr-6 text-left text-sm focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40 cursor-pointer ${
                          isSelected
                            ? isOutOfStock
                              ? 'border-[#C8CDD2] bg-[#F6F7F8] text-muted'
                              : 'border-brand bg-[#FFFFFF] text-brand'
                            : isOutOfStock
                              ? 'border-[#E3E6E8] bg-[#F6F7F8] text-muted hover:border-subtle'
                              : 'border-border bg-[#FFFFFF] text-ink hover:border-brand'
                        }`}>
                        <PurchaseImage product={variant} thumbnail /><span className="min-w-0 break-words">{variant.variantLabel || 'Mặc định'}{isOutOfStock && <span className="block text-xs text-muted">Hết hàng</span>}</span>
                        {isSelected && <Check className="absolute right-1 top-1" size={14} aria-hidden="true" />}
                      </button>
                    )
                  })}
                </div>
                {options.data.totalPages > 1 && <nav aria-label="Trang biến thể" className="mt-3 flex items-center gap-3 text-sm">
                  <Button variant="quiet" size="sm" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Trước</Button>
                  <span>{page + 1}/{options.data.totalPages}</span>
                  <Button variant="quiet" size="sm" disabled={page >= options.data.totalPages - 1} onClick={() => setPage((value) => value + 1)}>Sau</Button>
                </nav>}
              </fieldset>
            )
          ))}
          {loadError && <div role="alert" className="space-y-2 text-sm text-danger"><p>{loadError}</p><Button variant="quiet" onClick={() => setRetry((value) => value + 1)}>Thử lại</Button></div>}
          {!currentDetail && <p role="status" className="text-sm text-muted">Đang cập nhật giá và tồn kho…</p>}
          <div className="flex flex-wrap items-start justify-between gap-3 border-t border-border pt-4">
            <div className="space-y-1"><label htmlFor={quantityId} className="text-sm font-semibold text-ink">Số lượng</label>
              {currentDetail && detail.product && <p className="text-xs text-muted">{limit > 0 ? `Có thể thêm tối đa ${limit}.` : 'Không còn số lượng có thể thêm.'}</p>}</div>
            <QuantitySelector id={quantityId} key={selected.id} label="Số lượng cần mua" value={quantity} onChange={setQuantity} max={limit} disabled={busy || loading || Boolean(loadError)} />
          </div>
          {submitError && <p role="alert" className="text-sm text-danger">{submitError}</p>}
        </div>
        <footer className="shrink-0 space-y-3 border-t border-border bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between text-sm"><span className="text-muted">Tạm tính</span><strong className="tabular-nums text-ink">{currentDetail && validQuantity && !loadError ? formatCurrencyVND(Number(displayed.price) * quantity) : '—'}</strong></div>
          <Button type="submit" disabled={!canConfirm} loading={pending} className="w-full" size="lg">{confirmLabel}</Button>
        </footer>
      </form>
    </section>
  </div>, document.body)
}
