import Input from '../../components/ui/Input.jsx'
import FormField from '../../components/ui/FormField.jsx'

export default function CheckoutRecipientFields({ value, errors, onChange }) {
  return (
    <section className="rounded-[28px] bg-white border border-border/80 p-6 sm:p-7 shadow-xs space-y-5">
      <h2 className="text-base sm:text-lg font-bold text-ink pb-3 border-b border-border/60">
        Thông tin người nhận
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><Input
          id="customerName"
          name="customerName"
          label="Họ và tên người nhận"
          autoComplete="name"
          required
          maxLength={150}
          value={value.customerName}
          error={errors.customerName}
          onChange={onChange}
        /></div>
        <Input
          id="customerPhone"
          name="customerPhone"
          type="tel"
          inputMode="numeric"
          label="Số điện thoại liên hệ"
          autoComplete="tel"
          required
          maxLength={10}
          value={value.customerPhone}
          error={errors.customerPhone}
          onChange={onChange}
        />
        <Input
          id="customerEmail"
          name="customerEmail"
          type="email"
          label="Email nhận thông báo"
          autoComplete="email"
          spellCheck={false}
          required
          maxLength={150}
          value={value.customerEmail}
          error={errors.customerEmail}
          onChange={onChange}
        />
        <div className="sm:col-span-2"><Input
          id="shippingAddress"
          name="shippingAddress"
          label="Địa chỉ nhận hàng chi tiết"
          autoComplete="street-address"
          required
          maxLength={300}
          value={value.shippingAddress}
          error={errors.shippingAddress}
          onChange={onChange}
        /></div>
        <FormField className="sm:col-span-2" id="notes" label="Ghi chú đơn hàng (tùy chọn)" error={errors.notes}>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            maxLength={500}
            value={value.notes}
            onChange={onChange}
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={errors.notes ? 'notes-error' : undefined}
            className="w-full p-3 rounded-lg text-sm bg-white border border-control-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 resize-y"
          />
        </FormField>
      </div>
    </section>
  )
}
