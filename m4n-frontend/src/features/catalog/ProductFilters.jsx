import { useId, useState, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'
import PRODUCT_GROUPS from '../../constants/productGroups.js'
import categoryService from '../../services/categoryService.js'
import Button from '../../components/ui/Button.jsx'
import validateProductFilters from './productFilterValidation.js'

const EDITABLE_FILTERS = new Set([
  'keyword',
  'group',
  'artisan',
  'craftVillage',
  'minPrice',
  'maxPrice',
])

const PRICE_PRESETS = Object.freeze([
  { label: 'Dưới 2 triệu', min: '', max: '2000000' },
  { label: '2 - 5 triệu', min: '2000000', max: '5000000' },
  { label: '5 - 10 triệu', min: '5000000', max: '10000000' },
  { label: 'Trên 10 triệu', min: '10000000', max: '' },
])

const POPULAR_VILLAGES = Object.freeze([
  'Làng Đào Xá',
  'Làng Trúc Sơn',
])

function ProductFilters({
  busy = false,
  className = '',
  isDrawer = false,
  onApply,
  onChange,
  onReset,
  value,
}) {
  const [errors, setErrors] = useState({})
  const [categories, setCategories] = useState([])
  const [categoryStatus, setCategoryStatus] = useState('loading')
  const [categoryRetry, setCategoryRetry] = useState(0)
  const fieldId = useId()

  useEffect(() => {
    let active = true
    categoryService.getCategories()
      .then((data) => {
        if (!active) return
        if (!Array.isArray(data)) throw new Error('Danh sách danh mục không hợp lệ.')
        setCategories(data)
        setCategoryStatus(data.length > 0 ? 'success' : 'empty')
      })
      .catch(() => { if (active) setCategoryStatus('error') })
    return () => {
      active = false
    }
  }, [categoryRetry])

  const groupOptions = categories.length > 0
    ? categories.map((c) => ({ value: c.code, label: c.name }))
    : PRODUCT_GROUPS

  const handleChange = (name, nextValue) => {
    if (!EDITABLE_FILTERS.has(name)) return
    onChange({ ...value, [name]: nextValue })
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }))
    }
  }

  const handleGroupChange = (nextGroup) => {
    const nextFilters = {
      ...value,
      group: nextGroup,
    }
    onChange(nextFilters)
    if (errors.group) {
      setErrors((current) => ({ ...current, group: undefined }))
    }
    const validation = validateProductFilters(nextFilters)
    if (Object.keys(validation.errors).length === 0) {
      onApply(validation.normalizedFilters)
    }
  }

  const handleApplyPreset = (preset) => {
    const nextFilters = {
      ...value,
      minPrice: preset.min,
      maxPrice: preset.max,
    }
    onChange(nextFilters)
    setErrors({})
    const validation = validateProductFilters(nextFilters)
    if (Object.keys(validation.errors).length === 0) {
      onApply(validation.normalizedFilters)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validation = validateProductFilters(value)
    if (Object.keys(validation.errors).length > 0) {
      setErrors(validation.errors)
      const field = Object.keys(validation.errors)[0]
      document.getElementById(`${fieldId}-${field === 'minPrice' ? 'min-price' : 'max-price'}`)?.focus()
      return
    }
    setErrors({})
    onApply(validation.normalizedFilters)
  }

  const handleReset = () => {
    setErrors({})
    onReset()
  }

  const hasActiveFilters = Object.values(value).some((val) => val && String(val).trim() !== '')

  return (
    <form
      className={`flex flex-col gap-5 text-sm text-ink ${className}`}
      noValidate
      onSubmit={handleSubmit}
    >
      {/* Sidebar Header (desktop only, drawer has its own header) */}
      {!isDrawer && (
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
            <span>Bộ lọc sản phẩm</span>
          </h2>
          {hasActiveFilters && (
            <button
              className="text-xs font-medium text-brand hover:text-brand-hover hover:underline transition-colors cursor-pointer"
              disabled={busy}
              onClick={handleReset}
              type="button"
            >
              Xóa tất cả
            </button>
          )}
        </div>
      )}

      {/* 1. Dòng nhạc cụ (Dropdown select) */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${fieldId}-group-select`}
          className="text-xs font-bold uppercase tracking-wider text-muted"
        >
          Dòng nhạc cụ
        </label>
        <div className="relative">
          <select
            id={`${fieldId}-group-select`}
            name="group"
            value={value.group || ''}
            onChange={(e) => handleGroupChange(e.target.value)}
            disabled={busy}
            className="w-full appearance-none bg-white border border-border hover:border-border-strong rounded-lg px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand cursor-pointer transition-all pr-8 shadow-2xs disabled:bg-surface-secondary disabled:cursor-not-allowed"
          >
            <option value="">Tất cả dòng nhạc cụ</option>
            {groupOptions.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted">
            <ChevronDown size={16} />
          </div>
        </div>
        {categoryStatus === 'loading' && (
          <p className="text-xs text-muted" role="status">Đang tải danh mục; bạn vẫn có thể dùng các nhóm nhạc cụ mặc định.</p>
        )}
        {categoryStatus === 'empty' && (
          <p className="text-xs text-muted" role="status">Danh mục hiện chưa có dữ liệu. Đang dùng các nhóm nhạc cụ mặc định.</p>
        )}
        {categoryStatus === 'error' && (
          <div className="text-xs text-muted">
            <p role="alert">Không thể tải danh mục. Bạn vẫn có thể dùng các nhóm nhạc cụ mặc định.</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => { setCategoryStatus('loading'); setCategoryRetry((current) => current + 1) }}
              className="min-h-11 cursor-pointer font-semibold text-brand underline underline-offset-2 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Thử tải lại danh mục
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-border/60" />

      {/* 2. Khoảng giá */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-xs font-bold uppercase tracking-wider text-muted">
          Khoảng giá
        </legend>

        {/* Quick price chips */}
        <div className="grid grid-cols-2 gap-1.5">
          {PRICE_PRESETS.map((preset) => {
            const isActive =
              String(value.minPrice) === preset.min && String(value.maxPrice) === preset.max
            return (
              <button
                key={preset.label}
                className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all text-center cursor-pointer ${
                  isActive
                    ? 'border-brand bg-brand text-white font-semibold shadow-2xs'
                    : 'border-border bg-white hover:bg-surface-secondary hover:border-border-strong text-muted hover:text-ink'
                }`}
                onClick={() => handleApplyPreset(preset)}
                disabled={busy}
                type="button"
              >
                {preset.label}
              </button>
            )
          })}
        </div>

        {/* Custom Price Inputs */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 min-w-0">
            <label className="sr-only" htmlFor={`${fieldId}-min-price`}>
              Giá từ
            </label>
            <div className="relative">
              <input
                aria-label="Giá từ"
                autoComplete="off"
                className={`w-full h-9 px-2.5 pr-6 text-xs bg-white text-ink rounded-lg border transition-colors focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/20 ${
                  errors.minPrice ? 'border-brand' : 'border-control-border'
                }`}
                id={`${fieldId}-min-price`}
                aria-invalid={Boolean(errors.minPrice)}
                aria-describedby={errors.minPrice ? `${fieldId}-price-error` : undefined}
                inputMode="decimal"
                name="minPrice"
                onChange={(e) => handleChange('minPrice', e.target.value)}
                placeholder="Từ (đ)"
                type="number"
                value={value.minPrice}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted pointer-events-none">
                đ
              </span>
            </div>
          </div>

          <span className="text-muted text-xs shrink-0">đến</span>

          <div className="flex-1 min-w-0">
            <label className="sr-only" htmlFor={`${fieldId}-max-price`}>
              Giá đến
            </label>
            <div className="relative">
              <input
                aria-label="Giá đến"
                autoComplete="off"
                className={`w-full h-9 px-2.5 pr-6 text-xs bg-white text-ink rounded-lg border transition-colors focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/20 ${
                  errors.maxPrice ? 'border-brand' : 'border-control-border'
                }`}
                id={`${fieldId}-max-price`}
                aria-invalid={Boolean(errors.maxPrice)}
                aria-describedby={errors.maxPrice ? `${fieldId}-price-error` : undefined}
                inputMode="decimal"
                name="maxPrice"
                onChange={(e) => handleChange('maxPrice', e.target.value)}
                placeholder="Đến (đ)"
                type="number"
                value={value.maxPrice}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted pointer-events-none">
                đ
              </span>
            </div>
          </div>
        </div>

        {(errors.minPrice || errors.maxPrice) && (
          <p id={`${fieldId}-price-error`} className="text-xs text-brand leading-tight" role="alert">
            {errors.minPrice || errors.maxPrice}
          </p>
        )}
      </fieldset>

      <div className="border-t border-border/60" />

      {/* 3. Làng nghề truyền thống */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted" htmlFor={`${fieldId}-craft-village`}>
          Làng nghề truyền thống
        </label>
        <div className="relative">
          <input
            autoComplete="off"
            className="w-full h-9 px-2.5 pr-7 text-xs bg-white text-ink rounded-lg border border-control-border placeholder:text-subtle transition-colors focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/20"
            id={`${fieldId}-craft-village`}
            name="craftVillage"
            onChange={(e) => handleChange('craftVillage', e.target.value)}
            placeholder="Ví dụ: Đào Xá, Trúc Sơn..."
            type="text"
            value={value.craftVillage}
          />
          {value.craftVillage ? (
            <button
              aria-label="Xóa làng nghề"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink cursor-pointer"
              onClick={() => handleChange('craftVillage', '')}
              type="button"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        {/* Quick Village Chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {POPULAR_VILLAGES.map((village) => (
            <button
              key={village}
              type="button"
              onClick={() => handleChange('craftVillage', value.craftVillage === village ? '' : village)}
              className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer border ${
                value.craftVillage === village
                  ? 'bg-brand text-white border-brand font-medium'
                  : 'bg-surface-secondary text-muted hover:text-ink border-border/80'
              }`}
            >
              {village}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border/60" />

      {/* 4. Nghệ nhân chế tác */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted" htmlFor={`${fieldId}-artisan`}>
          Nghệ nhân chế tác
        </label>
        <div className="relative">
          <input
            autoComplete="off"
            className="w-full h-9 px-2.5 pr-7 text-xs bg-white text-ink rounded-lg border border-control-border placeholder:text-subtle transition-colors focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/20"
            id={`${fieldId}-artisan`}
            name="artisan"
            onChange={(e) => handleChange('artisan', e.target.value)}
            placeholder="Tên nghệ nhân..."
            type="text"
            value={value.artisan}
          />
          {value.artisan ? (
            <button
              aria-label="Xóa nghệ nhân"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink cursor-pointer"
              onClick={() => handleChange('artisan', '')}
              type="button"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          className="w-full"
          disabled={busy}
          loading={busy}
          loadingLabel="Đang lọc..."
          size="sm"
          type="submit"
        >
          Áp dụng bộ lọc
        </Button>
      </div>
    </form>
  )
}

export default ProductFilters
