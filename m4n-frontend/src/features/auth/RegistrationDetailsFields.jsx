import Input from '../../components/ui/Input.jsx'

export default function RegistrationDetailsFields({ values, errors, disabled, onChange, onEmailBlur }) {
  const { fullName, email, phone, password, confirmPassword } = values
  return <>
    <Input id="reg-fullname" name="name" type="text" label="Họ và tên" autoComplete="name" required
      placeholder="Ví dụ: Nguyễn Văn An" value={fullName} error={errors.fullName} disabled={disabled}
      onChange={(event) => onChange('fullName', event.target.value)} />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Input id="reg-email" name="email" type="email" label="Địa chỉ Email" autoComplete="email" required
        spellCheck={false} placeholder="tenban@m4n.vn" value={email} error={errors.email} disabled={disabled}
        onChange={(event) => onChange('email', event.target.value)} onBlur={onEmailBlur} />
      <Input id="reg-phone" name="tel" type="tel" inputMode="numeric" maxLength={10}
        label="Số điện thoại" autoComplete="tel" placeholder="0901234567"
        helperText="10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09."
        value={phone} error={errors.phone} disabled={disabled}
        onChange={(event) => onChange('phone', event.target.value)} />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Input id="reg-password" name="new-password" type="password" label="Mật khẩu" autoComplete="new-password"
        required allowTogglePassword helperText="Tối thiểu 8 ký tự." placeholder="Ít nhất 8 ký tự"
        value={password} error={errors.password} disabled={disabled}
        onChange={(event) => onChange('password', event.target.value)} />
      <Input id="reg-confirm-password" name="confirm-password" type="password" label="Xác nhận mật khẩu"
        autoComplete="new-password" required allowTogglePassword placeholder="Nhập lại mật khẩu"
        value={confirmPassword} error={errors.confirmPassword} disabled={disabled}
        onChange={(event) => onChange('confirmPassword', event.target.value)} />
    </div>
  </>
}
