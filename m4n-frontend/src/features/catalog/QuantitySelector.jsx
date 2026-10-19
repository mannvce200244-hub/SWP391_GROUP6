function QuantitySelector({
  disabled = false,
  max = 99,
  min = 1,
  onChange,
  value = 1,
}) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const handleInputChange = (event) => {
    const raw = event.target.value
    if (raw === '') {
      onChange(min)
      return
    }
    const parsed = parseInt(raw, 10)
    if (!Number.isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed))
      onChange(clamped)
    }
  }

  return (
    <div className="flex items-center">
      <div className="inline-flex items-center h-11 bg-surface border border-control-border rounded-lg overflow-hidden shadow-2xs">
        <button
          aria-label="Giảm số lượng"
          className="w-10 h-full flex items-center justify-center text-ink hover:text-brand hover:bg-surface-secondary active:bg-surface-muted transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-lg font-medium select-none"
          disabled={disabled || value <= min}
          onClick={handleDecrement}
          type="button"
        >
          −
        </button>

        <input
          aria-label="Số lượng sản phẩm"
          className="w-12 h-full text-center text-sm font-semibold text-ink bg-transparent focus:outline-none border-x border-border/70 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          disabled={disabled}
          inputMode="numeric"
          max={max}
          min={min}
          onChange={handleInputChange}
          type="number"
          value={value}
        />

        <button
          aria-label="Tăng số lượng"
          className="w-10 h-full flex items-center justify-center text-ink hover:text-brand hover:bg-surface-secondary active:bg-surface-muted transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-lg font-medium select-none"
          disabled={disabled || value >= max}
          onClick={handleIncrement}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default QuantitySelector
