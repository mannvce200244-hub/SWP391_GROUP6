import Input from '../ui/Input.jsx'
import MoneyInput from '../ui/MoneyInput.jsx'
import Button from '../ui/Button.jsx'
import { Plus, Trash2 } from 'lucide-react'

export default function ProductVariantRows({ rows, onChange, errors }) {
  const update = (id, field, value) => onChange(rows.map((row) => row.id === id ? { ...row, [field]: value } : row),
    `variants[${rows.findIndex((row) => row.id === id) + 1}].${field === 'label' ? 'variantLabel' : field}`)
  return <details className="rounded-xl border border-border bg-surface-secondary p-4">
    <summary className="cursor-pointer rounded text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
      Tạo nhiều biến thể cùng lúc (tùy chọn)
      {rows.length > 0 && <span className="ml-2 font-normal">· {rows.length + 1} biến thể mới</span>}
    </summary>
    <div className="mt-4 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-secondary">Thông tin phía trên là biến thể đầu tiên. Mỗi dòng thêm bên dưới sẽ tạo thêm 1 biến thể mới.</p>
      <Button variant="secondary" onClick={() => onChange([...rows, { id: crypto.randomUUID(), label: '', code: '', barcode: '', price: '' }])}>
        <Plus size={16} aria-hidden="true" />Thêm 1 dòng biến thể</Button>
    </div>
    {rows.map((row, index) => <fieldset key={row.id} className="min-w-0 rounded-lg border border-border bg-white p-4">
      <legend className="px-1 text-sm font-semibold">Biến thể mới thứ {index + 2}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input id={`variant-${row.id}-label`} name={`variants[${index + 1}].variantLabel`} label="Tên biến thể" required maxLength={100}
          value={row.label} onChange={(e) => update(row.id, 'label', e.target.value)} error={errors[`variants[${index + 1}].variantLabel`]} placeholder="Ví dụ: Tone Rê (D)" />
        <MoneyInput id={`variant-${row.id}-price`} name={`variants[${index + 1}].price`} label="Giá bán (VND)" required placeholder="Ví dụ: 720.000"
          value={row.price} onValueChange={(value) => update(row.id, 'price', value)} error={errors[`variants[${index + 1}].price`]} />
        <Input id={`variant-${row.id}-code`} name={`variants[${index + 1}].code`} label="SKU (tự tạo nếu để trống)" maxLength={50}
          value={row.code} onChange={(e) => update(row.id, 'code', e.target.value.toUpperCase())} error={errors[`variants[${index + 1}].code`]} />
        <Input id={`variant-${row.id}-barcode`} name={`variants[${index + 1}].barcode`} label="Barcode (tự tạo nếu để trống)" maxLength={100}
          value={row.barcode} onChange={(e) => update(row.id, 'barcode', e.target.value)} error={errors[`variants[${index + 1}].barcode`]} />
      </div>
      <Button variant="ghost" className="mt-2" onClick={() => onChange(rows.filter((item) => item.id !== row.id))} aria-label={`Bỏ biến thể ${index + 2}`}>
        <Trash2 size={16} aria-hidden="true" />Bỏ dòng này</Button>
    </fieldset>)}
    </div>
  </details>
}
