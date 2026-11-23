import { useState } from 'react'
import { Check, Layers, Plus, Trash2, X } from 'lucide-react'
import Input from '../ui/Input.jsx'
import MoneyInput from '../ui/MoneyInput.jsx'
import Button from '../ui/Button.jsx'
import { formatCurrencyVND } from '../../utils/currency.js'

function normalizeKey(value) {
  return String(value || '').trim().normalize('NFC').toLocaleLowerCase('vi')
}

function EditChipGroupInput({ id, label, placeholder, existingValues = [], addedValues = [], onAddedChange }) {
  const [draft, setDraft] = useState('')

  const addValues = () => {
    const parts = draft
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part && part.length <= 48)
    if (!parts.length) return
    const existingKeys = new Set(existingValues.map(normalizeKey))
    const seenAdded = new Set(addedValues.map(normalizeKey))
    const next = [...addedValues]
    for (const clean of parts) {
      const key = normalizeKey(clean)
      if (!existingKeys.has(key) && !seenAdded.has(key)) {
        seenAdded.add(key)
        next.push(clean)
      }
    }
    if (next.length !== addedValues.length) onAddedChange(next)
    setDraft('')
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {existingValues.map((val) => (
          <span
            key={`existing-${val}`}
            title="Giá trị đang có trên hệ thống"
            className="inline-flex items-center gap-1 rounded-full border border-[#E3E6E8] bg-[#FFFFFF] px-3 py-1 text-xs font-medium text-ink"
          >
            <span>{val}</span>
            <span className="text-[11px] text-muted">(đã có)</span>
          </span>
        ))}
        {addedValues.map((val) => (
          <span
            key={`added-${val}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-[#FFFFFF] px-3 py-1 text-xs font-semibold text-brand"
          >
            <span>{val}</span>
            <button
              type="button"
              aria-label={`Bỏ giá trị mới ${val}`}
              onClick={() => onAddedChange(addedValues.filter((item) => item !== val))}
              className="text-muted hover:text-danger cursor-pointer"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
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
              addValues()
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] px-3.5 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <Button type="button" variant="secondary" size="sm" onClick={addValues} disabled={!draft.trim()}>
          <Plus size={15} aria-hidden="true" />Thêm
        </Button>
      </div>
    </div>
  )
}

export default function ProductEditVariantsSection({
  activeProductId,
  activeCode,
  activeLabel,
  siblings = [],
  loadingSiblings = false,
  switchingVariant = false,
  onSelectSibling,
  pendingSwitchTarget = null,
  onConfirmSwitch,
  onCancelSwitch,
  option1Name = '',
  option2Name = '',
  onOption1NameChange,
  onOption2NameChange,
  canToggleStructured = false,
  structuredEnabled = false,
  onToggleStructured,
  canToggleOption2 = false,
  useOption2 = false,
  onToggleOption2,
  existingOption1Values = [],
  existingOption2Values = [],
  addedOption1Values = [],
  addedOption2Values = [],
  onAddedOption1Change,
  onAddedOption2Change,
  pendingNewRows = [],
  onPendingNewRowsChange,
  defaultPrice = '',
  errors = {},
}) {
  const [bulkPrice, setBulkPrice] = useState('')
  const showStructured = structuredEnabled || Boolean(option1Name.trim())

  const updateRow = (index, field, value) => {
    const next = pendingNewRows.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    onPendingNewRowsChange(next, `newVariants[${index}].${field}`)
  }

  const removeRow = (index) => {
    onPendingNewRowsChange(pendingNewRows.filter((_, idx) => idx !== index))
  }

  const applyBulkPrice = () => {
    const target = bulkPrice || defaultPrice
    if (!target) return
    onPendingNewRowsChange(pendingNewRows.map((row) => ({ ...row, price: target })))
  }

  return (
    <section className="rounded-2xl border border-[#E3E6E8] bg-[#FFFFFF] p-6 shadow-2xs space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E3E6E8] pb-3.5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Layers size={17} className="text-brand shrink-0" aria-hidden="true" />
            <h3 className="text-base font-semibold text-ink">
              Phân loại biến thể ({siblings.length > 0 ? `${siblings.length} biến thể hiện có` : 'tùy chọn'})
            </h3>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            {siblings.length > 1
              ? <>Đang sửa SKU <strong className="font-mono text-ink">{activeCode}</strong>{activeLabel ? <> ({activeLabel})</> : ''}. Chọn biến thể khác bên dưới để chuyển nhanh, đổi tên nhóm phân loại chung, hoặc thêm lựa chọn mới để tạo thêm tổ hợp SKU.</>
              : 'Bật phân loại nếu muốn chia sản phẩm thành nhiều phiên bản (VD: Chất liệu × Số dây) với giá và tồn kho riêng.'}
          </p>
        </div>

        {canToggleStructured && (
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={structuredEnabled}
              onChange={(event) => onToggleStructured?.(event.target.checked)}
              className="w-4 h-4 rounded text-brand focus:ring-brand"
            />
            <span>Sản phẩm có nhiều phân loại</span>
          </label>
        )}
      </div>

      {/* Sibling SKU Switcher */}
      {loadingSiblings ? (
        <p role="status" className="text-xs text-muted">Đang tải danh sách biến thể của sản phẩm…</p>
      ) : siblings.length > 1 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink">
              Tất cả biến thể hiện có ({siblings.length} SKU)
            </span>
            <span className="text-xs text-muted">Nhấn vào biến thể để mở chỉnh sửa giá, barcode, hình ảnh riêng</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {siblings.map((variant) => {
              const isCurrent = Number(variant.id) === Number(activeProductId)
              const stock = variant.stockQuantity ?? 0
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => { if (!isCurrent) onSelectSibling?.(variant) }}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                    isCurrent
                      ? 'border-brand bg-[#FFFFFF] ring-2 ring-brand/15'
                      : 'border-[#E3E6E8] bg-[#F6F7F8] hover:border-brand/50 hover:bg-[#FFFFFF]'
                  }`}
                >
                  <div className="flex min-h-6 items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink truncate">
                      {variant.variantLabel || 'Mặc định'}
                    </span>
                    {isCurrent && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
                        {switchingVariant ? 'Đang tải…' : <><Check size={11} aria-hidden="true" />Đang sửa</>}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted">
                    <span className="font-mono truncate">{variant.code}</span>
                    <span className="font-semibold tabular-nums text-brand shrink-0">
                      {formatCurrencyVND(variant.price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
                    <span>Kho: <strong className="text-ink tabular-nums">{stock}</strong></span>
                    {variant.isActive === false && (
                      <span className="rounded bg-[#E3E6E8] px-1.5 py-0.5 font-medium text-ink">Tạm ngừng</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {pendingSwitchTarget && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-[#F6F7F8] px-4 py-3 text-xs text-ink">
              <span>
                Bạn có thay đổi chưa lưu ở <strong className="font-mono">{activeCode}</strong>. Chuyển sang <strong className="font-mono">{pendingSwitchTarget.code}</strong> ({pendingSwitchTarget.variantLabel || 'Mặc định'}) sẽ bỏ các thay đổi chưa lưu.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <Button type="button" variant="quiet" size="sm" onClick={onCancelSwitch}>
                  Ở lại
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={onConfirmSwitch}>
                  Chuyển biến thể
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Structured Option Groups & New Combination Builder */}
      {showStructured && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Group 1 */}
            <div className="rounded-xl border border-[#E3E6E8] bg-[#F6F7F8] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink">Nhóm phân loại 1</span>
                <span className="text-[11px] text-muted">Áp dụng chung toàn sản phẩm</span>
              </div>
              <Input
                id="edit-variant-opt1-name"
                name="option1Name"
                label="Tên nhóm 1"
                required
                maxLength={48}
                value={option1Name}
                onChange={(event) => onOption1NameChange?.(event.target.value)}
                placeholder="VD: Chất liệu, Tone..."
                error={errors.option1Name}
              />
              <EditChipGroupInput
                id="edit-variant-opt1-values"
                label="Các lựa chọn của nhóm 1"
                placeholder="Thêm lựa chọn mới rồi bấm Enter (VD: Gỗ hương)"
                existingValues={existingOption1Values}
                addedValues={addedOption1Values}
                onAddedChange={onAddedOption1Change}
              />
            </div>

            {/* Group 2 */}
            {(useOption2 || canToggleOption2) && (
              <div className="rounded-xl border border-[#E3E6E8] bg-[#F6F7F8] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink">
                    Nhóm phân loại 2 {!useOption2 ? '(tùy chọn)' : ''}
                  </span>
                  {canToggleOption2 && (useOption2 ? (
                    <button
                      type="button"
                      onClick={() => onToggleOption2?.(false)}
                      className="text-xs font-semibold text-danger hover:underline cursor-pointer"
                    >
                      Bỏ nhóm 2
                    </button>
                  ) : (
                    <Button type="button" variant="secondary" size="sm" onClick={() => onToggleOption2?.(true)}>
                      <Plus size={14} aria-hidden="true" />Thêm nhóm 2
                    </Button>
                  ))}
                </div>
                {useOption2 ? (
                  <>
                    <Input
                      id="edit-variant-opt2-name"
                      name="option2Name"
                      label="Tên nhóm 2"
                      required
                      maxLength={48}
                      value={option2Name}
                      onChange={(event) => onOption2NameChange?.(event.target.value)}
                      placeholder="VD: Số dây, Kích cỡ..."
                      error={errors.option2Name}
                    />
                    <EditChipGroupInput
                      id="edit-variant-opt2-values"
                      label="Các lựa chọn của nhóm 2"
                      placeholder="Thêm lựa chọn mới rồi bấm Enter (VD: 21 dây)"
                      existingValues={existingOption2Values}
                      addedValues={addedOption2Values}
                      onAddedChange={onAddedOption2Change}
                    />
                  </>
                ) : (
                  <p className="text-xs text-muted leading-relaxed">
                    Thêm nhóm phân loại thứ 2 nếu sản phẩm kết hợp 2 thuộc tính (ví dụ: <strong>Chất liệu</strong> × <strong>Số dây</strong>).
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Pending New Combinations generated from newly added option values */}
          {pendingNewRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-[#E3E6E8] bg-[#F6F7F8] p-3.5">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Tổ hợp SKU mới sẽ tạo thêm ({pendingNewRows.length} biến thể)
                  </p>
                  <p className="text-xs text-muted">
                    Các tổ hợp mới có tồn kho ban đầu = 0 và kế thừa thông tin chung của sản phẩm. Các SKU đã có được giữ nguyên.
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  <div className="w-44">
                    <MoneyInput
                      id="edit-variant-bulk-price"
                      name="editBulkPrice"
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
                {pendingNewRows.map((row, index) => (
                  <div key={row.id} className="rounded-xl border border-[#E3E6E8] bg-[#FFFFFF] p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {row.option1Value}{useOption2 && row.option2Value ? ` · ${row.option2Value}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:underline cursor-pointer"
                        aria-label={`Bỏ tổ hợp mới ${row.label}`}
                      >
                        <Trash2 size={14} aria-hidden="true" />Bỏ tổ hợp
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <MoneyInput
                        id={`edit-matrix-${index}-price`}
                        name={`newVariants[${index}].price`}
                        label="Giá bán (VND)"
                        required
                        placeholder="VD: 5.500.000"
                        value={row.price}
                        onValueChange={(val) => updateRow(index, 'price', val)}
                        error={errors[`newVariants[${index}].price`]}
                      />
                      <Input
                        id={`edit-matrix-${index}-code`}
                        name={`newVariants[${index}].code`}
                        label="SKU (tự tạo nếu trống)"
                        maxLength={50}
                        value={row.code}
                        onChange={(event) => updateRow(index, 'code', event.target.value.toUpperCase())}
                        error={errors[`newVariants[${index}].code`]}
                      />
                      <Input
                        id={`edit-matrix-${index}-barcode`}
                        name={`newVariants[${index}].barcode`}
                        label="Barcode (tự tạo nếu trống)"
                        maxLength={100}
                        value={row.barcode}
                        onChange={(event) => updateRow(index, 'barcode', event.target.value)}
                        error={errors[`newVariants[${index}].barcode`]}
                      />
                    </div>
                    {errors[`newVariants[${index}].variantLabel`] && (
                      <p role="alert" className="text-xs text-danger">{errors[`newVariants[${index}].variantLabel`]}</p>
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
