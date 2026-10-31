import { useEffect, useState } from 'react'
import Input from '../../components/ui/Input.jsx'
import { searchCustomers } from '../../services/posService.js'
import { sanitizeVietnameseMobile } from '../../utils/phone.js'

export default function PosCustomerFields({ name, phone, selected, error, onChange, onSelect }) {
  const [query, setQuery] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [search, setSearch] = useState({ query: '', loading: false, results: null, error: '' })
  const activeQuery = query === name || query === phone ? query : ''
  useEffect(() => {
    if (selected || activeQuery.trim().length < 2) return
    let active = true
    const timer = setTimeout(async () => {
      setSearch({ query: activeQuery, loading: true, results: null, error: '' })
      try {
        const results = await searchCustomers(activeQuery)
        if (active) setSearch({ query: activeQuery, loading: false, results, error: '' })
      } catch (err) {
        if (active) setSearch({ query: activeQuery, loading: false, results: null, error: err.message || 'Không thể tìm khách hàng.' })
      }
    }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [activeQuery, selected, attempt])

  const showResults = !selected && activeQuery.trim().length >= 2
  const current = search.query === activeQuery ? search : null
  const groups = [['Tài khoản khách hàng', current?.results?.accounts || []], ['Hồ sơ tại quầy', current?.results?.profiles || []]]
  const change = (field, value) => { onChange(field, value); setQuery(value) }
  return (
    <section aria-label="Khách hàng của hóa đơn" className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input id="pos-customer-name" name="customerName" label="Tên khách hàng" value={name} maxLength={150} autoComplete="off"
          placeholder="Ví dụ: Nguyễn Văn An…" onChange={(e) => change('name', e.target.value)} className="h-10 text-xs px-3" />
        <Input id="pos-customer-phone" name="customerPhone" type="tel" label="Số điện thoại" value={phone} maxLength={10} inputMode="numeric" autoComplete="off"
          placeholder="Ví dụ: 0912345678…" error={error} onChange={(e) => change('phone', sanitizeVietnameseMobile(e.target.value))} className="h-10 text-xs px-3" />
      </div>
      {selected ? <div className="flex justify-between items-center gap-2 text-xs break-words border border-border rounded-lg p-2 bg-white">
        <span>Đã chọn: {selected.fullName || 'Khách tại quầy'} · {selected.phone || 'Chưa có SĐT'}</span>
        <button type="button" className="text-brand underline p-1" onClick={() => { onSelect(null); setQuery('') }}>Bỏ chọn</button>
      </div> : <p className="text-xs text-muted">Chọn khách đã có hoặc nhập SĐT để lưu hồ sơ mới. Để trống để bán cho khách lẻ.</p>}
      {showResults && <div aria-live="polite" className="border border-border rounded-lg bg-white p-2 text-xs max-h-48 overflow-y-auto">
        {(!current || current.loading) && <p className="text-muted">Đang tìm khách hàng…</p>}
        {current?.error && <div role="alert"><p className="text-danger">{current.error}</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="underline text-brand p-1">Thử lại</button></div>}
        {current?.results && groups.every(([, entries]) => entries.length === 0) && <p className="text-muted">Chưa có khách phù hợp. Nhập SĐT hợp lệ để lưu hồ sơ khi thanh toán thành công.</p>}
        {groups.map(([label, entries]) => entries.length > 0 && <div key={label}>
          <p className="font-semibold text-muted px-2 py-1">{label}</p>
          {entries.map((customer) => <button type="button" key={`${customer.customerId || 'pos'}-${customer.posCustomerId || ''}`}
            onClick={() => onSelect(customer)} className="block w-full text-left rounded p-2 hover:bg-[#F6F7F8] focus-visible:outline-2 focus-visible:outline-brand">
            <span className="font-medium break-words">{customer.fullName || 'Khách tại quầy'}</span> · {customer.phone || 'Chưa có SĐT'}
          </button>)}
        </div>)}
      </div>}
    </section>
  )
}
