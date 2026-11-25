import Input from '../ui/Input.jsx'

function SuggestionChips({ label, suggestions = [], selectedValue = '', onPick }) {
  if (!suggestions.length) return null
  const normalizedSelected = selectedValue.trim().normalize('NFC').toLocaleLowerCase('vi')
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-secondary">{label}:</span>
      {suggestions.map((item) => {
        const active = item.trim().normalize('NFC').toLocaleLowerCase('vi') === normalizedSelected
        return (
          <button
            key={item}
            type="button"
            onClick={() => onPick(item)}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer ${
              active
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-[#E3E6E8] bg-[#F6F7F8] text-ink hover:border-brand/50 hover:bg-[#FFFFFF]'
            }`}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}

export default function ProductVariantFields({
  label,
  labelCaption = 'Tên biến thể',
  onLabelChange,
  error,
  required = false,
  option1Name = '',
  option2Name = '',
  option1Value = '',
  option2Value = '',
  onOption1ValueChange,
  onOption2ValueChange,
  option1Error,
  option2Error,
  option1Suggestions = [],
  option2Suggestions = [],
  existingComboWarning = '',
}) {
  if (option1Name) {
    return (
      <>
        <div>
          <Input
            id="product-variant-opt1"
            name="option1Value"
            label={option1Name}
            required={required}
            maxLength={48}
            value={option1Value}
            onChange={(event) => onOption1ValueChange?.(event.target.value)}
            placeholder={option1Suggestions.length ? `Chọn bên dưới hoặc nhập ${option1Name.toLowerCase()} mới…` : `Nhập ${option1Name.toLowerCase()}…`}
            error={option1Error || error}
          />
          <SuggestionChips
            label="Đã có"
            suggestions={option1Suggestions}
            selectedValue={option1Value}
            onPick={(value) => onOption1ValueChange?.(value)}
          />
        </div>
        {option2Name && (
          <div>
            <Input
              id="product-variant-opt2"
              name="option2Value"
              label={option2Name}
              required={required}
              maxLength={48}
              value={option2Value}
              onChange={(event) => onOption2ValueChange?.(event.target.value)}
              placeholder={option2Suggestions.length ? `Chọn bên dưới hoặc nhập ${option2Name.toLowerCase()} mới…` : `Nhập ${option2Name.toLowerCase()}…`}
              error={option2Error}
            />
            <SuggestionChips
              label="Đã có"
              suggestions={option2Suggestions}
              selectedValue={option2Value}
              onPick={(value) => onOption2ValueChange?.(value)}
            />
          </div>
        )}
        {existingComboWarning && !error && (
          <p role="status" className="sm:col-span-2 lg:col-span-4 rounded-xl border border-rose-200 bg-[#F6F7F8] px-3.5 py-2 text-xs font-medium text-rose-700">
            {existingComboWarning}
          </p>
        )}
      </>
    )
  }

  return (
    <div>
      <Input
        id="product-variant-label"
        name="variantLabel"
        label={labelCaption}
        required={required}
        maxLength={100}
        value={label}
        onChange={(event) => onLabelChange(event.target.value)}
        placeholder="Ví dụ: Tone Đô (C) hoặc Bản tiêu chuẩn"
        error={error}
        helperText="Giá bán ở ô đơn giá thuộc biến thể này; mỗi biến thể có giá và tồn kho riêng."
      />
      {existingComboWarning && !error && (
        <p role="status" className="mt-1.5 text-xs font-medium text-rose-700">
          {existingComboWarning}
        </p>
      )}
    </div>
  )
}
