import Input from '../ui/Input.jsx'

export default function ProductVariantFields({ label, onLabelChange, error, required = false }) {
  return <>
    <div>
      <Input id="product-variant-label" name="variantLabel" label="Tên biến thể" required={required} maxLength={100}
        value={label} onChange={(event) => onLabelChange(event.target.value)}
        placeholder="Ví dụ: Tone Đô (C)" error={error} helperText="Giá bán ở ô đơn giá thuộc biến thể này; mỗi tone có giá và tồn kho riêng." />
    </div>
  </>
}
