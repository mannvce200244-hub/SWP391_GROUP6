import Input from '../../components/ui/Input.jsx'

export default function ResetPasswordFields({ inputRef, newPassword, confirmPassword, errors, disabled,
  onNewPasswordChange, onConfirmPasswordChange }) {
  return <>
    <Input
      ref={inputRef}
      id="reset-new-password"
      name="new-password"
      type="password"
      label="Mật khẩu mới"
      autoComplete="new-password"
      required
      allowTogglePassword
      helperText="Tối thiểu 8 ký tự."
      placeholder="Nhập mật khẩu mới…"
      value={newPassword}
      error={errors.newPassword}
      disabled={disabled}
      onChange={(event) => onNewPasswordChange(event.target.value)}
    />
    <Input
      id="reset-confirm-password"
      name="confirm-password"
      type="password"
      label="Xác nhận mật khẩu mới"
      autoComplete="new-password"
      required
      allowTogglePassword
      placeholder="Nhập lại mật khẩu mới…"
      value={confirmPassword}
      error={errors.confirmPassword}
      disabled={disabled}
      onChange={(event) => onConfirmPasswordChange(event.target.value)}
    />
  </>
}
