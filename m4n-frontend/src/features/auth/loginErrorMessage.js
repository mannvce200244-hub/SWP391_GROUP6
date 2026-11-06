export function loginErrorMessage(error) {
  if (error?.status === 401) return 'Email hoặc mật khẩu không chính xác.'
  if (error?.status === 403) {
    if (error.data?.message === 'Account is inactive.') {
      return 'Tài khoản của bạn đã bị tạm khóa hoặc ngừng hoạt động.'
    }
    if (error.data === 'Invalid CORS request') {
      return 'Không thể đăng nhập từ địa chỉ trang web này. Vui lòng liên hệ bộ phận hỗ trợ.'
    }
    return 'Yêu cầu đăng nhập bị từ chối. Vui lòng thử lại hoặc liên hệ hỗ trợ.'
  }
  return error?.message || 'Đăng nhập không thành công. Vui lòng thử lại.'
}
