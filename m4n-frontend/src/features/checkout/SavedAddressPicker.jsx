import { useState } from 'react'
import useSavedAddresses from './useSavedAddresses.js'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'
import Button from '../../components/ui/Button.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import Pagination from '../catalog/Pagination.jsx'

export default function SavedAddressPicker({ onSelect, disabled }) {
  const addresses = useSavedAddresses()
  const [selected, setSelected] = useState(null)
  return <section className="rounded-[28px] bg-white border border-border p-6 sm:p-7 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-base font-bold text-ink">Địa chỉ đã lưu</h2>
      <RouterLink href={CUSTOMER_ROUTES.addresses} className="text-sm text-brand underline underline-offset-4">Quản lý địa chỉ</RouterLink>
    </div>
    {selected && <p role="status" className="text-sm text-muted break-words">Đã điền: {selected.customerName} — {selected.shippingAddress}. Bạn có thể sửa thông tin bên dưới cho đơn này.</p>}
    {addresses.loading ? <div role="status"><span className="sr-only">Đang tải địa chỉ…</span><Skeleton width="100%" height="3rem" /></div>
      : addresses.error ? <div role="alert" className="text-sm text-danger">{addresses.error} <Button variant="ghost" onClick={() => addresses.reload()}>Thử lại</Button></div>
      : !addresses.items.length ? <p className="text-sm text-muted">Bạn chưa lưu địa chỉ. Thêm trong Tài khoản hoặc nhập thông tin bên dưới.</p>
      : <fieldset disabled={disabled} className="space-y-3">
        <legend className="sr-only">Chọn địa chỉ nhận hàng</legend>
        {addresses.items.map((address) => <label key={address.id} className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer has-checked:border-brand has-checked:bg-surface-secondary">
          <input type="radio" name="savedDeliveryAddress" className="mt-1 accent-brand" checked={selected?.id === address.id} onChange={() => { setSelected(address); onSelect(address) }} />
          <span className="min-w-0 text-sm break-words"><strong>{address.customerName}</strong><span className="text-muted"> · {address.customerPhone}</span><span className="block mt-1">{address.shippingAddress}</span></span>
        </label>)}
        <Pagination currentPage={addresses.page + 1} totalPages={addresses.totalPages} onPageChange={(page) => addresses.reload(page - 1)} />
      </fieldset>}
  </section>
}
