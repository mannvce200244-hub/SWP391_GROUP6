import { useState } from 'react'
import PRODUCT_GROUPS from '../../constants/productGroups.js'
import Button from '../../components/ui/Button.jsx'
import { IconX } from '../../components/ui/Icons.jsx'
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
  { label: '2 – 5 triệu', min: '2000000', max: '5000000' },
  { label: '5 – 10 triệu', min: '5000000', max: '10000000' },
  { label: 'Trên 10 triệu', min: '10000000', max: '' },
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

  const handleChange = (name, nextValue) => {
    if (!EDITABLE_FILTERS.has(name)) return
    onChange({ ...value, [name]: nextValue })
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }))
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
      className={`flex flex-col gap-6 text-sm text-ink ${className}`}
      noValidate
      onSubmit={handleSubmit}
    >
      {/* Sidebar Header (desktop only, drawer has its own header) */}
      {!isDrawer && (
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2">
            <span>Bộ lọc</span>
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

      {/* 1. Nhóm nhạc cụ (Danh mục) */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-xs font-bold uppercase tracking-wider text-muted mb-1">
          Danh mục nhạc cụ
        </legend>
        <div className="space-y-1">
          <label className="flex items-center gap-2.5 py-1 px-1.5 rounded-md hover:bg-surface-secondary/70 transition-colors cursor-pointer select-none">
            <input
              checked={!value.group}
              className="w-4 h-4 text-brand border-control-border focus:ring-brand focus:ring-1 cursor-pointer accent-brand"
              name="group"
              onChange={() => handleChange('group', '')}
              type="radio"
              value=""
            />
            <span className={`text-sm ${!value.group ? 'font-semibold text-brand' : 'text-ink'}`}>
              Tất cả nhóm
            </span>
          </label>

          {PRODUCT_GROUPS.map((group) => {
            const isSelected = value.group === group.value
            return (
              <label
                key={group.value}
                className="flex items-center gap-2.5 py-1 px-1.5 rounded-md hover:bg-surface-secondary/70 transition-colors cursor-pointer select-none"
              >
                <input
                  checked={isSelected}
                  className="w-4 h-4 text-brand border-control-border focus:ring-brand focus:ring-1 cursor-pointer accent-brand"
                  name="group"
                  onChange={() => handleChange('group', group.value)}
                  type="radio"
                  value={group.value}
                />
                <span className={`text-sm ${isSelected ? 'font-semibold text-brand' : 'text-ink'}`}>
                  Nhạc cụ {group.label.toLowerCase()}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="border-t border-border/60" />

      {/* 2. Khoảng giá */}
      <fieldset className="flex flex-col gap-3">
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
                className={`px-2.5 py-1.5 text-xs rounded-md border transition-all text-center cursor-pointer ${
                  isActive
                    ? 'border-brand bg-brand-soft font-semibold text-brand shadow-2xs'
                    : 'border-border bg-white hover:bg-surface-secondary hover:border-border-strong text-muted hover:text-ink'
                }`}
                onClick={() => handleApplyPreset(preset)}
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
            <label className="sr-only" htmlFor="catalog-min-price">
              Giá từ
            </label>
            <div className="relative">
              <input
                aria-label="Giá từ"
                autoComplete="off"
                className={`w-full h-9 px-2.5 pr-6 text-xs bg-surface text-ink rounded border transition-colors focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/20 ${
                  errors.minPrice ? 'border-brand' : 'border-control-border'
                }`}
                id="catalog-min-price"
                inputMode="decimal"
                name="minPrice"
                onChange={(e) => handleChange('minPrice', e.target.value)}
                placeholder="Từ (₫)"
                type="number"
                value={value.minPrice}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted pointer-events-none">
                ₫
              </span>
            </div>
          </div>

          <span className="text-muted text-xs shrink-0">—</span>

          <div className="flex-1 min-w-0">
            <label className="sr-only" htmlFor="catalog-max-price">
              Giá đến
            </label>
            <div className="relative">
              <input
                aria-label="Giá đến"
                autoComplete="off"
                className={`w-full h-9 px-2.5 pr-6 text-xs bg-surface text-ink rounded border transition-colors focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/20 ${
                  errors.maxPrice ? 'border-brand' : 'border-control-border'
                }`}
                id="catalog-max-price"
                inputMode="decimal"
                name="maxPrice"
                onChange={(e) => handleChange('maxPrice', e.target.value)}
                placeholder="Đến (₫)"
                type="number"
                value={value.maxPrice}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted pointer-events-none">
                ₫
              </span>
            </div>
          </div>
        </div>

        {(errors.minPrice || errors.maxPrice) && (
          <p className="text-[11px] text-brand leading-tight" role="alert">
            {errors.minPrice || errors.maxPrice}
          </p>
        )}
      </fieldset>

      <div className="border-t border-border/60" />

      {/* 3. Nghệ nhân */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted" htmlFor="catalog-artisan">
          Nghệ nhân
        </label>
        <div className="relative">
          <input
            autoComplete="off"
            className="w-full h-9 px-2.5 pr-7 text-xs bg-surface text-ink rounded border border-control-border placeholder:text-subtle transition-colors focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/20"
            id="catalog-artisan"
            name="artisan"
            onChange={(e) => handleChange('artisan', e.target.value)}
            placeholder="Tên nghệ nhân chế tác…"
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
              <IconX size={13} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border/60" />

      {/* 4. Làng nghề */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted" htmlFor="catalog-craft-village">
          Làng nghề truyền thống
        </label>
        <div className="relative">
          <input
            autoComplete="off"
            className="w-full h-9 px-2.5 pr-7 text-xs bg-surface text-ink rounded border border-control-border placeholder:text-subtle transition-colors focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/20"
            id="catalog-craft-village"
            name="craftVillage"
            onChange={(e) => handleChange('craftVillage', e.target.value)}
            placeholder="Ví dụ: Đào Xá, Trúc Sơn…"
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
              <IconX size={13} />
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
          loadingLabel="Đang lọc…"
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
