import { useEffect, useState } from 'react'
import PRODUCT_GROUPS from '../../constants/productGroups.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import validateProductFilters from './productFilterValidation.js'

const EDITABLE_FILTERS = new Set([
  'keyword',
  'group',
  'artisan',
  'craftVillage',
  'minPrice',
  'maxPrice',
])

const FILTER_FIELD_IDS = Object.freeze({
  minPrice: 'catalog-min-price',
  maxPrice: 'catalog-max-price',
})

const COMPACT_FILTERS_QUERY = '(max-width: 52rem)'

function ProductFilters({ busy, onApply, onChange, onReset, value }) {
  const [errors, setErrors] = useState({})
  const [filtersOpen, setFiltersOpen] = useState(
    () => !window.matchMedia(COMPACT_FILTERS_QUERY).matches,
  )

  useEffect(() => {
    const compactFilters = window.matchMedia(COMPACT_FILTERS_QUERY)
    const handleViewportChange = (event) => setFiltersOpen(!event.matches)

    compactFilters.addEventListener('change', handleViewportChange)

    return () => {
      compactFilters.removeEventListener('change', handleViewportChange)
    }
  }, [])

  const handleChange = (event) => {
    const { name, value: nextValue } = event.currentTarget

    if (!EDITABLE_FILTERS.has(name)) {
      return
    }

    onChange({ ...value, [name]: nextValue })

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validation = validateProductFilters(value)
    const firstError = Object.keys(validation.errors)[0]

    if (firstError) {
      setErrors(validation.errors)
      document.getElementById(FILTER_FIELD_IDS[firstError])?.focus()
      return
    }

    setErrors({})
    onApply(validation.normalizedFilters)
  }

  const handleReset = () => {
    setErrors({})
    onReset()
  }

  return (
    <form className="catalog-filters" noValidate onSubmit={handleSubmit}>
      <details
        className="catalog-filters__disclosure"
        onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
        open={filtersOpen}
      >
        <summary className="catalog-filters__summary">Bộ lọc sản phẩm</summary>
        <div className="catalog-filters__content">
          <div className="catalog-filters__heading">
            <div>
              <p className="eyebrow">Bộ lọc</p>
              <h2>Tìm sản phẩm phù hợp</h2>
            </div>
            <Button disabled={busy} onClick={handleReset} variant="quiet">
              Xóa bộ lọc
            </Button>
          </div>

          <div className="catalog-filters__fields">
            <Input
              autoComplete="off"
              id="catalog-keyword"
              label="Từ khóa"
              name="keyword"
              onChange={handleChange}
              placeholder="Tên sản phẩm…"
              type="search"
              value={value.keyword}
            />

            <Select
              autoComplete="off"
              id="catalog-group"
              label="Nhóm nhạc cụ"
              name="group"
              onChange={handleChange}
              value={value.group}
            >
              <option value="">Tất cả nhóm</option>
              {PRODUCT_GROUPS.map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </Select>

            <Input
              autoComplete="off"
              id="catalog-artisan"
              label="Nghệ nhân"
              name="artisan"
              onChange={handleChange}
              placeholder="Tên nghệ nhân…"
              value={value.artisan}
            />

            <Input
              autoComplete="off"
              id="catalog-craft-village"
              label="Làng nghề"
              name="craftVillage"
              onChange={handleChange}
              placeholder="Tên làng nghề…"
              value={value.craftVillage}
            />

            <Input
              autoComplete="off"
              error={errors.minPrice}
              id="catalog-min-price"
              inputMode="decimal"
              label="Giá từ"
              min="0"
              name="minPrice"
              onChange={handleChange}
              placeholder="Mức thấp nhất…"
              step="any"
              type="number"
              value={value.minPrice}
            />

            <Input
              autoComplete="off"
              error={errors.maxPrice}
              id="catalog-max-price"
              inputMode="decimal"
              label="Giá đến"
              min="0"
              name="maxPrice"
              onChange={handleChange}
              placeholder="Mức cao nhất…"
              step="any"
              type="number"
              value={value.maxPrice}
            />
          </div>

          <p className="catalog-filters__note">
            Đơn vị tiền và cách gửi bộ lọc sẽ theo API contract sau khi được thống
            nhất.
          </p>
          <Button loading={busy} loadingLabel="Đang tìm…" type="submit">
            Tìm sản phẩm
          </Button>
        </div>
      </details>
    </form>
  )
}

export default ProductFilters
