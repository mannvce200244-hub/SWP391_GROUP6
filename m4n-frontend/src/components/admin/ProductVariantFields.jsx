import Input from '../ui/Input.jsx'

export default function ProductVariantFields({ group, label, onGroupChange, onLabelChange, error }) {
  return <>
    <div>
      <Input id="product-variant-group" name="variantGroup" label="Nhóm biến thể (tùy chọn)" maxLength={100}
        value={group} onChange={(event) => onGroupChange(event.target.value)}
        placeholder="Ví dụ: Sáo trúc 6 lỗ" helperText="Dùng cùng tên nhóm để các biến thể xuất hiện cùng nhau." />
    </div>
    <div>
      <Input id="product-variant-label" name="variantLabel" label="Tên biến thể" maxLength={100}
        value={label} onChange={(event) => onLabelChange(event.target.value)}
        placeholder="Ví dụ: Tone Đô (C)" error={error} helperText="Mỗi biến thể có SKU, giá và tồn kho riêng." />
    </div>
  </>
}
