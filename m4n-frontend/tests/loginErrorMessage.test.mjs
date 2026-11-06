import assert from 'node:assert/strict'
import test from 'node:test'
import { loginErrorMessage } from '../src/features/auth/loginErrorMessage.js'

test('a CORS rejection does not claim that an active account is locked', () => {
  assert.equal(loginErrorMessage({ status: 403, data: 'Invalid CORS request' }),
    'Không thể đăng nhập từ địa chỉ trang web này. Vui lòng liên hệ bộ phận hỗ trợ.')
})

test('only the backend inactive-account response produces the locked-account message', () => {
  assert.equal(loginErrorMessage({ status: 403, data: { message: 'Account is inactive.' } }),
    'Tài khoản của bạn đã bị tạm khóa hoặc ngừng hoạt động.')
  assert.equal(loginErrorMessage({ status: 403, data: { message: 'Forbidden' } }),
    'Yêu cầu đăng nhập bị từ chối. Vui lòng thử lại hoặc liên hệ hỗ trợ.')
})

test('invalid credentials and other safe failures retain their login feedback', () => {
  assert.equal(loginErrorMessage({ status: 401, message: 'Invalid email or password.' }),
    'Email hoặc mật khẩu không chính xác.')
  assert.equal(loginErrorMessage({ status: 503, message: 'Máy chủ đang gặp sự cố.' }),
    'Máy chủ đang gặp sự cố.')
  assert.equal(loginErrorMessage(null), 'Đăng nhập không thành công. Vui lòng thử lại.')
})
