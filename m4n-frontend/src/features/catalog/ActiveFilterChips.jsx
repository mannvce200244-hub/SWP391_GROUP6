import { IconX } from '../../components/ui/Icons.jsx'

function formatVndPrice(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return value
  return new Intl.NumberFormat('vi-VN').format(num) + ' ₫'
}

function ActiveFilterChips({ className = '', filters, onClearAll, onRemoveFilter }) {
  const chips = []

  if (filters.keyword && filters.keyword.trim()) {
    chips.push({
      key: 'keyword',
      label: `Từ khóa: "${filters.keyword.trim()}"`,
    })
  }

  if (filters.group && filters.group.trim()) {
    const groupNameMap = {
      DAY: 'Nhạc cụ dây',
      HOI: 'Nhạc cụ hơi',
      GO: 'Nhạc cụ gõ',
      Dây: 'Nhạc cụ dây',
      Hơi: 'Nhạc cụ hơi',
      Gõ: 'Nhạc cụ gõ',
    }
    const displayGroup = groupNameMap[filters.group.trim()] || filters.group.trim()
    chips.push({
      key: 'group',
      label: `Dòng: ${displayGroup}`,
    })
  }

  if (filters.artisan && filters.artisan.trim()) {
    chips.push({
      key: 'artisan',
      label: `Nghệ nhân: ${filters.artisan.trim()}`,
    })
  }

  if (filters.craftVillage && filters.craftVillage.trim()) {
    chips.push({
      key: 'craftVillage',
      label: `Làng nghề: ${filters.craftVillage.trim()}`,
    })
  }

  const hasMinPrice = filters.minPrice !== '' && filters.minPrice !== undefined && filters.minPrice !== null
  const hasMaxPrice = filters.maxPrice !== '' && filters.maxPrice !== undefined && filters.maxPrice !== null

  if (hasMinPrice && hasMaxPrice) {
    chips.push({
      key: 'price',
      label: `Giá: ${formatVndPrice(filters.minPrice)} – ${formatVndPrice(filters.maxPrice)}`,
    })
  } else if (hasMinPrice) {
    chips.push({
      key: 'minPrice',
      label: `Giá từ: ${formatVndPrice(filters.minPrice)}`,
    })
  } else if (hasMaxPrice) {
    chips.push({
      key: 'maxPrice',
      label: `Giá đến: ${formatVndPrice(filters.maxPrice)}`,
    })
  }

  if (chips.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 pt-1 pb-3 ${className}`}>
      <span className="text-xs font-semibold text-muted tracking-wide uppercase">
        Đang lọc:
      </span>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-ink bg-surface border border-control-border rounded-md shadow-2xs transition-colors hover:border-brand/40"
        >
          <span>{chip.label}</span>
          <button
            aria-label={`Bỏ lọc ${chip.label}`}
            className="p-0.5 -mr-1 rounded hover:bg-surface-secondary text-muted hover:text-brand transition-colors cursor-pointer"
            onClick={() => onRemoveFilter(chip.key)}
            type="button"
          >
            <IconX size={13} />
          </button>
        </span>
      ))}

      <button
        className="text-xs font-medium text-brand hover:text-brand-hover hover:underline ml-1 cursor-pointer transition-colors py-1"
        onClick={onClearAll}
        type="button"
      >
        Xóa bộ lọc
      </button>
    </div>
  )
}

export default ActiveFilterChips
