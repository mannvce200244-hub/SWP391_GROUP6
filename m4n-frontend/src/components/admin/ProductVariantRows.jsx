import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import Input from '../ui/Input.jsx'
import MoneyInput from '../ui/MoneyInput.jsx'
import Button from '../ui/Button.jsx'
import { buildVariantMatrix } from '../../features/catalog/variantOptions.js'

function ChipGroupInput({ id, label, placeholder, values, onChange }) {
  const [draft, setDraft] = useState('')
  const addValue = () => {
    const parts = draft
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part && part.length <= 48)
    if (!parts.length) return
    const next = [...values]
    const seen = new Set(values.map((item) => item.trim().normalize('NFC').toLocaleLowerCase('vi')))
    for (const clean of parts) {
      const key = clean.normalize('NFC').toLocaleLowerCase('vi')
      if (!seen.has(key)) {
        seen.add(key)
        next.push(clean)
      }
    }
    if (next.length !== values.length) onChange(next)
    setDraft('')
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">{label}</label>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          maxLength={48}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addValue()
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-border bg-white px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <Button type="button" variant="secondary" size="sm" onClick={addValue} disabled={!draft.trim()}>
          <Plus size={15} aria-hidden="true" />Thêm
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((val) => (
            <span key={val} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-ink">
              <span>{val}</span>
              <button
                type="button"
                aria-label={`Xóa giá trị ${val}`}
                onClick={() => onChange(values.filter((item) => item !== val))}
                className="text-muted hover:text-danger cursor-pointer"
              >
                <X size={13} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductVariantRows({
  mode = 'flat',
  editingExisting = false,
  rows = [],
  onChange,
  matrixConfig,
  matrixRows = [],
  onMatrixChange,
  defaultPrice = '',
  errors = {},
  option1Suggestions = [],
  option2Suggestions = [],
}) {
  const [bulkPrice, setBulkPrice] = useState('')

  if (mode === 'matrix' && matrixConfig && onMatrixChange) {
    const { enabled, option1Name, option1Values, useOption2, option2Name, option2Values } = matrixConfig

    const updateConfig = (patch) => {
      const nextConfig = { ...matrixConfig, ...patch }
      const nextRows = nextConfig.enabled
        ? buildVariantMatrix(
          nextConfig.option1Values,
          nextConfig.useOption2 ? nextConfig.option2Values : [],
          matrixRows,
          defaultPrice,
        )
        : []
      onMatrixChange(nextConfig, nextRows)
    }

    const updateRow = (index, field, value) => {
      const next = matrixRows.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
      onMatrixChange(matrixConfig, next, `variants[${index}].${field}`)
    }

    const removeRow = (index) => {
      onMatrixChange(matrixConfig, matrixRows.filter((_, idx) => idx !== index))
    }

    const applyBulkPrice = () => {
      const target = bulkPrice || defaultPrice
      if (!target) return
      onMatrixChange(matrixConfig, matrixRows.map((row) => ({ ...row, price: target })))
    }

    return (
      <section className="rounded-2xl border border-[#E3E6E8] bg-[#FFFFFF] p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E3E6E8] pb-3">
          <div>
            <h3 className="text-base font-semibold text-ink">Phân loại biến thể (tùy chọn)</h3>
            <p className="text-xs text-secondary mt-0.5">
              Hỗ trợ tối đa 2 nhóm phân loại (VD: Chất liệu × Số dây) để tự động ghép tổ hợp SKU với giá và tồn kho riêng.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => updateConfig({ enabled: event.target.checked })}
              className="w-4 h-4 rounded text-brand focus:ring-brand"
            />
            <span>Sản phẩm có nhiều phân loại</span>
          </label>
        </div>

        {enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Group 1 */}
              <div className="rounded-xl border border-[#E3E6E8] bg-[#F6F7F8] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink">Nhóm phân loại 1</span>
                </div>
                <Input
                  id="variant-opt1-name"
                  name="option1Name"
                  label="Tên nhóm 1"
                  required
                  maxLength={48}
                  value={option1Name}
                  onChange={(event) => updateConfig({ option1Name: event.target.value })}
                  placeholder="VD: Chất liệu, Tone..."
                  error={errors.option1Name}
                />
                <ChipGroupInput
                  id="variant-opt1-values"
                  label="Các lựa chọn của nhóm 1"
                  placeholder="Nhập giá trị rồi bấm Enter (VD: Gỗ trắc)"
                  values={option1Values}
                  onChange={(nextValues) => updateConfig({ option1Values: nextValues })}
                />
              </div>

              {/* Group 2 */}
              <div className="rounded-xl border border-[#E3E6E8] bg-[#F6F7F8] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink">Nhóm phân loại 2 (tùy chọn)</span>
                  {useOption2 ? (
                    <button
                      type="button"
                      onClick={() => updateConfig({ useOption2: false, option2Name: '', option2Values: [] })}
                      className="text-xs font-semibold text-danger hover:underline cursor-pointer"
                    >
                      Bỏ nhóm 2
                    </button>
                  ) : (
                    <Button type="button" variant="secondary" size="sm" onClick={() => updateConfig({ useOption2: true })}>
                      <Plus size={14} aria-hidden="true" />Thêm nhóm 2
                    </Button>
                  )}
                </div>
                {useOption2 ? (
                  <>
                    <Input
                      id="variant-opt2-name"
                      name="option2Name"
                      label="Tên nhóm 2"
                      required
                      maxLength={48}
                      value={option2Name}
                      onChange={(event) => updateConfig({ option2Name: event.target.value })}
                      placeholder="VD: Số dây, Kích cỡ..."
                      error={errors.option2Name}
                    />
                    <ChipGroupInput
                      id="variant-opt2-values"
                      label="Các lựa chọn của nhóm 2"
                      placeholder="Nhập giá trị rồi bấm Enter (VD: 16 dây)"
                      values={option2Values}
                      onChange={(nextValues) => updateConfig({ option2Values: nextValues })}
                    />
                  </>
                ) : (
                  <p className="text-xs text-secondary leading-relaxed">
                    Thêm nhóm phân loại thứ 2 nếu sản phẩm kết hợp 2 thuộc tính (ví dụ: <strong>Chất liệu</strong> × <strong>Số dây</strong> → tự tạo 4 tổ hợp).
                  </p>
                )}
              </div>
            </div>

            {errors.variantMatrix && <p role="alert" className="text-sm text-danger">{errors.variantMatrix}</p>}

            {matrixRows.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#E3E6E8] bg-[#F6F7F8] px-4 py-3 text-xs text-secondary">
                Nhập ít nhất 1 lựa chọn cho nhóm phân loại (có thể gõ nhiều giá trị cách nhau bằng dấu phẩy rồi bấm <strong>Enter</strong> hoặc <strong>+ Thêm</strong>) để bảng tổ hợp SKU và ô thiết lập giá bán hiện ra bên dưới.
              </p>
            )}

            {matrixRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-[#E3E6E8] bg-[#F6F7F8] p-3.5">
                  <div>
                    <p className="text-sm font-semibold text-ink">Danh sách tổ hợp SKU ({matrixRows.length} biến thể)</p>
                    <p className="text-xs text-secondary">Mỗi tổ hợp có giá bán, mã SKU và tồn kho độc lập. Có thể bỏ những tổ hợp không kinh doanh.</p>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="w-44">
                      <MoneyInput
                        id="variant-bulk-price"
                        name="bulkPrice"
                        label="Áp dụng giá nhanh"
                        placeholder="VD: 5.500.000"
                        value={bulkPrice}
                        onValueChange={setBulkPrice}
                      />
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={applyBulkPrice} disabled={!bulkPrice && !defaultPrice}>
                      Áp dụng tất cả
                    </Button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {matrixRows.map((row, index) => (
                    <div key={row.id} className="rounded-xl border border-[#E3E6E8] bg-white p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">
                          {row.option1Value}{useOption2 && row.option2Value ? ` · ${row.option2Value}` : ''}
                        </span>
                        {matrixRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:underline cursor-pointer"
                            aria-label={`Bỏ tổ hợp ${row.label}`}
                          >
                            <Trash2 size={14} aria-hidden="true" />Bỏ tổ hợp
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <MoneyInput
                          id={`matrix-${index}-price`}
                          name={`variants[${index}].price`}
                          label="Giá bán (VND)"
                          required
                          placeholder="VD: 5.500.000"
                          value={row.price}
                          onValueChange={(val) => updateRow(index, 'price', val)}
                          error={errors[`variants[${index}].price`]}
                        />
                        <Input
                          id={`matrix-${index}-code`}
                          name={`variants[${index}].code`}
                          label="SKU (tự tạo nếu trống)"
                          maxLength={50}
                          value={row.code}
                          onChange={(event) => updateRow(index, 'code', event.target.value.toUpperCase())}
                          error={errors[`variants[${index}].code`]}
                        />
                        <Input
                          id={`matrix-${index}-barcode`}
                          name={`variants[${index}].barcode`}
                          label="Barcode (tự tạo nếu trống)"
                          maxLength={100}
                          value={row.barcode}
                          onChange={(event) => updateRow(index, 'barcode', event.target.value)}
                          error={errors[`variants[${index}].barcode`]}
                        />
                      </div>
                      {errors[`variants[${index}].variantLabel`] && (
                        <p role="alert" className="text-xs text-danger">{errors[`variants[${index}].variantLabel`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    )
  }

  // Legacy / Add-more-variants flat mode (supports structured option1/option2 when adding to a structured family)
  const opt1Name = matrixConfig?.option1Name || ''
  const opt2Name = matrixConfig?.option2Name || ''
  const structured = Boolean(opt1Name)
  const update = (id, field, value) => onChange(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    `variants[${rows.findIndex((row) => row.id === id) + 1}].${field === 'label' ? 'variantLabel' : field}`)

  return <details className="rounded-xl border border-border bg-surface-secondary p-4">
    <summary className="cursor-pointer rounded text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
      {editingExisting ? 'Thêm biến thể cho sản phẩm' : 'Tạo nhiều biến thể cùng lúc (tùy chọn)'}
      {rows.length > 0 && <span className="ml-2 font-normal">· {rows.length + (editingExisting ? 0 : 1)} biến thể mới</span>}
    </summary>
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-secondary">{editingExisting
          ? 'Mỗi dòng bên dưới tạo thêm 1 biến thể thuộc sản phẩm đang sửa, có SKU, giá riêng và tồn kho ban đầu bằng 0.'
          : 'Thông tin phía trên là biến thể đầu tiên. Mỗi dòng thêm bên dưới sẽ tạo thêm 1 biến thể mới.'}</p>
        <Button type="button" variant="secondary" onClick={() => onChange([...rows, { id: crypto.randomUUID(), label: '', option1Value: '', option2Value: '', code: '', barcode: '', price: defaultPrice }])}>
          <Plus size={16} aria-hidden="true" />Thêm 1 dòng biến thể</Button>
      </div>
      {structured && option1Suggestions.length > 0 && (
        <datalist id="variant-rows-opt1-suggestions">
          {option1Suggestions.map((item) => <option key={item} value={item} />)}
        </datalist>
      )}
      {structured && opt2Name && option2Suggestions.length > 0 && (
        <datalist id="variant-rows-opt2-suggestions">
          {option2Suggestions.map((item) => <option key={item} value={item} />)}
        </datalist>
      )}
      {rows.map((row, index) => <fieldset key={row.id} className="min-w-0 rounded-lg border border-border bg-white p-4">
        <legend className="px-1 text-sm font-semibold">Biến thể mới thứ {index + (editingExisting ? 1 : 2)}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {structured ? (
            <>
              <Input id={`variant-${row.id}-opt1`} name={`variants[${index + 1}].option1Value`} label={opt1Name} required maxLength={48}
                list={option1Suggestions.length ? 'variant-rows-opt1-suggestions' : undefined}
                value={row.option1Value || ''} onChange={(e) => update(row.id, 'option1Value', e.target.value)} error={errors[`variants[${index + 1}].option1Value`] || errors[`variants[${index + 1}].variantLabel`]} placeholder={`Nhập hoặc chọn ${opt1Name.toLowerCase()}…`} />
              {opt2Name && (
                <Input id={`variant-${row.id}-opt2`} name={`variants[${index + 1}].option2Value`} label={opt2Name} required maxLength={48}
                  list={option2Suggestions.length ? 'variant-rows-opt2-suggestions' : undefined}
                  value={row.option2Value || ''} onChange={(e) => update(row.id, 'option2Value', e.target.value)} error={errors[`variants[${index + 1}].option2Value`]} placeholder={`Nhập hoặc chọn ${opt2Name.toLowerCase()}…`} />
              )}
            </>
          ) : (
            <Input id={`variant-${row.id}-label`} name={`variants[${index + 1}].variantLabel`} label="Tên biến thể" required maxLength={100}
              value={row.label} onChange={(e) => update(row.id, 'label', e.target.value)} error={errors[`variants[${index + 1}].variantLabel`]} placeholder="Ví dụ: Tone Rê (D) hoặc Bản đặc biệt" />
          )}
          <MoneyInput id={`variant-${row.id}-price`} name={`variants[${index + 1}].price`} label="Giá bán (VND)" required placeholder="Ví dụ: 720.000"
            value={row.price} onValueChange={(value) => update(row.id, 'price', value)} error={errors[`variants[${index + 1}].price`]} />
          <Input id={`variant-${row.id}-code`} name={`variants[${index + 1}].code`} label="SKU (tự tạo nếu để trống)" maxLength={50}
            value={row.code} onChange={(e) => update(row.id, 'code', e.target.value.toUpperCase())} error={errors[`variants[${index + 1}].code`]} />
          <Input id={`variant-${row.id}-barcode`} name={`variants[${index + 1}].barcode`} label="Barcode (tự tạo nếu để trống)" maxLength={100}
            value={row.barcode} onChange={(e) => update(row.id, 'barcode', e.target.value)} error={errors[`variants[${index + 1}].barcode`]} />
        </div>
        <Button type="button" variant="ghost" className="mt-2" onClick={() => onChange(rows.filter((item) => item.id !== row.id))} aria-label={`Bỏ biến thể ${index + 2}`}>
          <Trash2 size={16} aria-hidden="true" />Bỏ dòng này</Button>
      </fieldset>)}
    </div>
  </details>
}
