import { useEffect, useRef, useState } from 'react'
import AccountLayout from '../../layouts/AccountLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import useToast from '../../components/ui/useToast.js'
import Pagination from '../catalog/Pagination.jsx'
import useAuth from '../auth/useAuth.js'
import CheckoutRecipientFields from './CheckoutRecipientFields.jsx'
import ShippingAddressFields from './ShippingAddressFields.jsx'
import useSavedAddresses from './useSavedAddresses.js'
import { validateRecipient, recipientFromAddress, deliveryFromAddress } from './recipientValidation.js'
import deliveryAddressService from '../../services/deliveryAddressService.js'
import shippingService from '../../services/shippingService.js'

export default function DeliveryAddressesPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const addresses = useSavedAddresses()
  const [editor, setEditor] = useState(null)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const [deleting, setDeleting] = useState(null)
  const [options, setOptions] = useState(null)
  const [optionsError, setOptionsError] = useState('')
  const [retry, setRetry] = useState(0)
  const heading = useRef(null)
  const addButton = useRef(null)
  useEffect(() => {
    let active = true
    shippingService.getOptions().then((result) => { if (active) { setOptions(result); setOptionsError('') } })
      .catch((failure) => { if (active) setOptionsError(failure.message || 'Không thể tải cấu hình giao hàng.') })
    return () => { active = false }
  }, [retry])
  const editingId = editor?.id
  useEffect(() => { if (editingId !== undefined) heading.current?.focus() }, [editingId])

  const carrierEnabled = Boolean(options?.carrierEnabled)
  function closeEditor() {
    setEditor(null)
    requestAnimationFrame(() => addButton.current?.focus())
  }
  function openEditor(address) {
    setEditor({ id: address.id ?? null, version: address.version,
      value: recipientFromAddress(address), delivery: deliveryFromAddress(address) })
    setErrors({})
    setError('')
  }
  function changeField(event) {
    const { name, value } = event.target
    setEditor((current) => ({ ...current, value: { ...current.value, [name]: value } }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }
  async function save(event) {
    event.preventDefault()
    if (pending.current || !options) return
    const validation = validateRecipient(editor.value, carrierEnabled)
    setErrors(validation)
    if (Object.keys(validation).length) {
      document.getElementById(Object.keys(validation)[0])?.focus()
      return
    }
    if (carrierEnabled && (!editor.delivery.provinceId || !editor.delivery.wardId || !editor.delivery.streetAddress.trim())) {
      setError('Vui lòng chọn tỉnh/thành, phường/xã và địa chỉ chi tiết.')
      document.getElementById(!editor.delivery.provinceId ? 'shipping-province' : !editor.delivery.wardId ? 'shipping-ward' : 'shipping-street')?.focus()
      return
    }
    pending.current = true
    setBusy(true)
    setError('')
    try {
      const recipient = Object.fromEntries(Object.entries(editor.value).map(([key, value]) => [key, value.trim()]))
      const payload = { ...recipient, deliveryAddress: carrierEnabled ? editor.delivery : null, expectedVersion: editor.version }
      if (editor.id) await deliveryAddressService.update(editor.id, payload)
      else await deliveryAddressService.create(payload)
      closeEditor()
      addresses.reload(0)
      addToast({ type: 'success', message: 'Đã lưu địa chỉ nhận hàng.' })
    } catch (failure) {
      setError(failure.message || 'Không thể lưu địa chỉ. Vui lòng thử lại.')
      setErrors(failure.fieldErrors || {})
      document.getElementById(Object.keys(failure.fieldErrors || {})[0])?.focus()
    } finally { pending.current = false; setBusy(false) }
  }
  async function remove() {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    try {
      await deliveryAddressService.remove(deleting.id, deleting.version)
      setDeleting(null)
      addresses.reload()
      addToast({ type: 'success', message: 'Đã xóa địa chỉ nhận hàng.' })
    } catch (failure) {
      setDeleting(null)
      setError(failure.message || 'Không thể xóa địa chỉ. Vui lòng tải lại và thử lại.')
    } finally { pending.current = false; setBusy(false) }
  }

  return <AccountLayout activeTab="addresses">
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div><h1 className="text-2xl font-bold text-ink">Địa chỉ nhận hàng</h1><p className="mt-2 text-sm text-muted">Lưu thông tin người nhận để chọn nhanh khi thanh toán.</p></div>
        {!editor && <Button ref={addButton} disabled={busy || !options} onClick={() => openEditor({ customerName: user?.fullName, customerPhone: user?.phone, customerEmail: user?.email, shippingAddress: user?.address })}>Thêm địa chỉ</Button>}
      </div>
      {optionsError && <div role="alert" className="text-sm text-danger">{optionsError} <Button variant="ghost" onClick={() => setRetry((value) => value + 1)}>Thử lại</Button></div>}
      {!options && !optionsError && <div role="status"><span className="sr-only">Đang tải cấu hình giao hàng…</span><Skeleton width="100%" height="2rem" /></div>}
      {error && <div role="alert" className="text-sm text-danger">{error} <Button variant="ghost" disabled={busy} onClick={() => { setEditor(null); setError(''); addresses.reload() }}>Tải lại danh sách</Button></div>}
      {editor && <form noValidate onSubmit={save} className="space-y-4">
        <h2 ref={heading} tabIndex={-1} className="text-lg font-semibold">{editor.id ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>
        <fieldset disabled={busy} className="space-y-4">
          <legend className="sr-only">Thông tin địa chỉ nhận hàng</legend>
          <CheckoutRecipientFields value={editor.value} errors={errors} onChange={changeField} carrierEnabled={carrierEnabled} />
          {carrierEnabled && <ShippingAddressFields value={editor.delivery} onChange={(delivery) => setEditor((current) => ({ ...current, delivery }))} disabled={busy} />}
          <div className="flex flex-wrap gap-3"><Button type="submit" loading={busy} loadingLabel="Đang lưu…">Lưu địa chỉ</Button><Button variant="secondary" onClick={() => { closeEditor(); setError('') }}>Hủy</Button></div>
        </fieldset>
      </form>}
      {addresses.loading ? <div role="status" className="space-y-4"><span className="sr-only">Đang tải địa chỉ…</span>{[0, 1].map((key) => <Skeleton key={key} width="100%" height="8rem" />)}</div>
        : addresses.error ? <div role="alert" className="text-sm text-danger">{addresses.error} <Button variant="secondary" onClick={() => addresses.reload()}>Thử lại</Button></div>
        : !addresses.items.length ? <p className="p-6 rounded-xl bg-surface-secondary text-sm text-muted">Chưa có địa chỉ nào. Thêm địa chỉ đầu tiên để dùng khi thanh toán.</p>
        : <div className="space-y-4">{addresses.items.map((address) => <article key={address.id} className="rounded-2xl border border-border p-5 space-y-2 break-words">
          <h2 className="font-semibold text-ink">{address.customerName}</h2>
          <p className="text-sm text-muted">{address.customerPhone} · {address.customerEmail}</p>
          <p className="text-sm">{address.shippingAddress}</p>
          {address.notes && <p className="text-sm text-muted">Ghi chú: {address.notes}</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="secondary" disabled={busy || !options} aria-label={`Sửa địa chỉ của ${address.customerName}`} onClick={() => openEditor(address)}>Sửa</Button>
            <Button variant="ghost" disabled={busy || Boolean(editor)} aria-label={`Xóa địa chỉ của ${address.customerName}`} onClick={() => { setError(''); setDeleting(address) }}>Xóa</Button>
          </div>
        </article>)}<fieldset disabled={busy}><Pagination currentPage={addresses.page + 1} totalPages={addresses.totalPages} onPageChange={(page) => addresses.reload(page - 1)} /></fieldset></div>}
    </div>
    <ConfirmDialog isOpen={Boolean(deleting)} title="Xóa địa chỉ nhận hàng?" description={deleting ? `${deleting.customerName} — ${deleting.shippingAddress}` : ''} confirmLabel="Xóa địa chỉ" isLoading={busy} onCancel={() => setDeleting(null)} onConfirm={remove} />
  </AccountLayout>
}
