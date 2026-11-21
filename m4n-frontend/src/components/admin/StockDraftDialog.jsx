import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { importStock } from '../../services/inventoryService.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import { Skeleton } from '../ui/Skeleton.jsx'
import adminProductService from '../../services/adminProductService.js'
import ProductVariantPicker from '../../features/catalog/ProductVariantPicker.jsx'
import ProductFormModal from './ProductFormModal.jsx'

export default function StockDraftDialog({ product, onClose, onCreated }) {
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [selection, setSelection] = useState(null)
  const [variantsPage, setVariantsPage] = useState(null)
  const [detailTargetId, setDetailTargetId] = useState(product.productId)
  const [productError, setProductError] = useState('')
  const [retry, setRetry] = useState(0)
  const [variantSource, setVariantSource] = useState(null)
  const [pickerVersion, setPickerVersion] = useState(0)
  const requestRef = useRef(null)
  useEffect(() => {
    let active = true
    // Share only this dialog's read when development mode replays the effect.
    if (requestRef.current?.id !== detailTargetId || requestRef.current?.retry !== retry) {
      requestRef.current = { id: detailTargetId, retry, promise: Promise.all([
        adminProductService.getProductDetail(detailTargetId),
        adminProductService.listVariants(detailTargetId),
      ]) }
    }
    requestRef.current.promise.then(([data, variants]) => {
      if (active) { setSelection(data); setVariantsPage(variants); setProductError('') }
    }).catch((failure) => { if (active) setProductError(failure.message || 'Không thể tải biến thể. Hãy thử lại.') })
    return () => { active = false }
  }, [detailTargetId, retry])
  const errorRef = useRef(null)
  const variantButtonRef = useRef(null)
  const dialogRef = useDialogFocus(true, onClose, busy)
  const action = 'nhập'
  const productReady = Boolean(selection && variantsPage && !productError)
  const count = Number(quantity)
  const cost = Number(unitCost)
  const validQuantity = quantity.trim() !== '' && Number.isInteger(count) && count > 0 && count <= 2147483647
  const validCost = unitCost.trim() !== '' && Number.isSafeInteger(cost) && cost >= 0 && cost <= 9999999999

  function closeVariantForm() {
    setVariantSource(null)
    requestAnimationFrame(() => (variantButtonRef.current || dialogRef.current?.querySelector('[data-dialog-initial-focus]') || dialogRef.current)?.focus())
  }

  async function submit(event) {
    event.preventDefault()
    if (busy || !productReady) return
    const nextErrors = {}
    if (!validQuantity) {
      nextErrors.quantity = 'Số lượng phải là số nguyên từ 1 đến 2.147.483.647.'
    }
    if (!validCost) {
      nextErrors.unitCost = 'Đơn giá nhập phải là số đồng nguyên từ 0 đến 9.999.999.999.'
    }
    if (reason.trim().length > 500) nextErrors.reason = 'Lý do không quá 500 ký tự.'
    setErrors(nextErrors)
    setError('')
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => dialogRef.current?.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    setBusy(true)
    try {
      const draft = await importStock(selection.id, { quantity: count, unitCost: cost, notes: reason.trim() })
      onCreated(draft)
    } catch (failure) {
      setErrors({ ...failure.fieldErrors, reason: failure.fieldErrors?.notes })
      setError(failure.message || 'Không thể tạo phiếu kho. Vui lòng thử lại.')
      requestAnimationFrame(() => errorRef.current?.focus())
    } finally { setBusy(false) }
  }

  return (<>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <form onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-labelledby="stock-draft-title"
        aria-describedby="stock-draft-description" tabIndex={-1} ref={dialogRef}
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain rounded-xl border border-border bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 id="stock-draft-title" className="text-lg font-semibold text-ink">Nhập thêm hàng theo lô</h3>
          <Button variant="ghost" size="sm" disabled={busy} onClick={onClose} aria-label="Đóng hộp thoại tạo phiếu kho"><X size={18} aria-hidden="true" /></Button>
        </div>
        <p className="text-sm break-words">
          <strong>{selection?.variantLabel ? `${selection.variantGroup} · ${selection.variantLabel}` : selection?.name || (detailTargetId === product.productId ? product.productName : 'Biến thể vừa tạo')}</strong>
          {(selection?.code || detailTargetId === product.productId) && <> · <span translate="no">{selection?.code || product.productCode}</span></>}
        </p>
        <p id="stock-draft-description" className="text-sm text-muted">Chọn đúng biến thể trước khi nhập số lượng và giá nhập. Chỉ hàng đạt QC được cộng vào tồn của SKU đã chọn.</p>
        {!productReady && !productError && <div role="status" className="space-y-3">
          <p className="text-sm text-muted">Đang tải biến thể và tồn kho…</p>
          <Skeleton width="100%" height="80px" />
          <Skeleton width="100%" height="64px" />
          <Skeleton width="100%" height="64px" />
        </div>}
        {productError && <p role="alert" className="text-sm text-danger">{productError} <button type="button" className="underline" onClick={() => { setProductError(''); setRetry((value) => value + 1) }}>Thử lại</button></p>}
        {productReady && <>
        {selection.variantGroup && <ProductVariantPicker key={`${product.productId}-${pickerVersion}`} product={selection} admin initialPage={variantsPage} disabled={busy}
          onSelect={(variant) => {
            if (variant.id === selection.id) return
            setSelection(variant); setQuantity(''); setUnitCost(''); setErrors({}); setError('')
          }} />}
        {selection?.variantGroup && <Button ref={variantButtonRef} variant="secondary" disabled={busy} onClick={async () => {
          setBusy(true)
          try { setVariantSource(await adminProductService.getProductDetail(selection.id)) }
          catch (failure) { setError(failure.message || 'Không thể tải thông tin biến thể.') }
          finally { setBusy(false) }
        }}>Tạo thêm biến thể</Button>}
        <p className="text-xs text-muted">SKU: <strong translate="no">{selection.code}</strong> · Giá niêm yết: {formatCurrencyVND(selection.originalPrice ?? selection.price)}. Giá nhập của lô được khai báo bên dưới.</p>
        {error && <p role="alert" ref={errorRef} tabIndex={-1} className="text-sm text-danger focus-visible:outline focus-visible:outline-danger">{error}</p>}
        <Input id="stock-draft-quantity" name="quantity" label={`Số lượng ${action}`} required type="number" inputMode="numeric"
          autoComplete="off" min={1} max={2147483647} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)}
          error={errors.quantity} disabled={busy} data-dialog-initial-focus />
        <Input id="stock-draft-unit-cost" name="unitCost" label="Đơn giá nhập (đồng / sản phẩm)" required type="number" inputMode="numeric"
          autoComplete="off" min={0} max={9999999999} step={1} value={unitCost} onChange={(event) => setUnitCost(event.target.value)} error={errors.unitCost} disabled={busy} />
        <p className="rounded-lg bg-surface-secondary p-3 text-sm" aria-live="polite">Tiền lô dự kiến: <strong>{validQuantity && validCost ? formatCurrencyVND(BigInt(count) * BigInt(cost)) : '—'}</strong>. Tiền thực nhận được tính lại sau QC.</p>
        <Input id="stock-draft-reason" name="reason" label="Ghi chú lô hàng (tùy chọn)"
          autoComplete="off" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} error={errors.reason} disabled={busy} />
        </>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" disabled={busy} onClick={onClose}>Đóng</Button>
          <Button type="submit" disabled={!productReady} loading={busy} loadingLabel="Đang tạo phiếu…">Tạo phiếu {action}</Button>
        </div>
      </form>
    </div>
    {variantSource && <ProductFormModal isOpen variantSource={variantSource} onClose={closeVariantForm} onSuccess={(id) => {
      setVariantSource(null)
      setPickerVersion((value) => value + 1)
      setQuantity(''); setUnitCost(''); setErrors({}); setError('')
      setSelection(null); setVariantsPage(null); setProductError(''); setDetailTargetId(id)
    }} />}
    </>
  )
}
