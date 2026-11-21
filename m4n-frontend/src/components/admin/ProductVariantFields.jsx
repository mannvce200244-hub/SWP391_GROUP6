import Input from '../ui/Input.jsx'

export default function ProductVariantFields({ group, label, onGroupChange, onLabelChange, error }) {
  return <>
    <div>
      <Input id="product-variant-group" name="variantGroup" label="Nhóm biến thể (tùy chọn)" maxLength={100}
        value={group} onChange={(event) => onGroupChange(event.target.value)}
        placeholder="Ví dụ: Sáo trúc 6 lỗ" helperText="Tên chung cho các tone hoặc phiên bản của cùng sản phẩm." />
    </div>
    <div>
      <Input id="product-variant-label" name="variantLabel" label="Tên biến thể" maxLength={100}
        value={label} onChange={(event) => onLabelChange(event.target.value)}
        placeholder="Ví dụ: Tone Đô (C)" error={error} helperText="Giá bán ở ô đơn giá thuộc biến thể này; mỗi tone có giá và tồn kho riêng." />
    </div>
  </>
}
