# Đăng nhập Google

Status: implemented with user approval on 2026-10-26. User completed real Google
login locally; browser verification confirmed authenticated navigation and
session persistence after reload. Hosted consent/callback acceptance remains
required after configuring the production frontend domain.

## Quy tắc tài khoản

- Dùng official `spring-boot-starter-oauth2-client`; chỉ yêu cầu `openid`,
  `email`, `profile`. Không xin quyền Gmail hoặc offline access.
- Backend kiểm tra chữ ký, issuer, audience, hạn dùng, nonce, state và PKCE S256.
- Chỉ CUSTOMER đang hoạt động được đăng nhập Google; nhân viên/Admin dùng mật khẩu.
- Email phải được Google xác minh. Email mới tạo CUSTOMER; email trùng chỉ tự
  liên kết khi Google có thẩm quyền (Gmail hoặc domain Workspace khớp `hd`).
  Email bên thứ ba trùng tài khoản cũ phải dùng mật khẩu.
- Lưu `google_subject` duy nhất; lần đăng nhập tiếp theo dùng `sub`, không tự đổi
  email/hồ sơ đã lưu khi Google trả email khác.
- Khi nhận quyền sở hữu đăng ký chưa xác minh, vô hiệu mật khẩu cũ bằng hash
  BCrypt ngẫu nhiên và tăng session generation. Không giữ mật khẩu có thể do
  người khác đặt trước khi chủ email xác minh.
- Tài khoản Google mới dùng hash mật khẩu ngẫu nhiên không được công bố. Khách
  có thể dùng luồng quên mật khẩu/OTP hiện có để đặt mật khẩu đăng nhập sau này.

## Cấu hình backend

Chỉ lưu secret trong backend `.env` được ignore hoặc Railway Variables. Secret
đã gửi qua chat phải được thay trước deploy. Google login độc lập Gmail SMTP.

```dotenv
GOOGLE_LOGIN_ENABLED=true
GOOGLE_CLIENT_ID=<Google web client ID>
GOOGLE_CLIENT_SECRET=<secret mới, backend only>
GOOGLE_FRONTEND_URL=http://localhost:5173
GOOGLE_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google
```

Callback localhost8080 ở trên tương thích cấu hình Google Cloud người dùng đã
có. Trình duyệt phải bắt đầu ở `localhost:5173` (không đổi sang `127.0.0.1` hoặc
tunnel); cookie phiên OAuth dùng cùng hostname, path `/`, HttpOnly/Lax, 10 phút.

Callback ưu tiên nếu cập nhật Google Cloud, và bắt buộc khi deploy:
`https://<frontend>/api/v1/auth/google/callback/google`. Đặt
`GOOGLE_FRONTEND_URL=https://<frontend>` và đăng ký URI chính xác đó trong
Google Cloud. Callback HTTPS phải cùng origin với frontend; không dùng URL
Railway làm callback vì cookie sẽ khác site. Vercel rewrite `/api/v1/:path*`
đã chuyển request đến backend. `prod` bật Secure cho cả cookie refresh và OAuth.

`GOOGLE_FRONTEND_URL` mặc định theo `FRONTEND_URL`; có thể tách riêng khi thử
Google localhost và MoMo tunnel. Restart backend sau khi đổi `.env`.
Thiếu ID/secret hoặc callback không hợp lệ khi bật Google sẽ chặn khởi động.
Khi tắt, giao diện hiển thị trạng thái chưa khả dụng.

## Database và API

Áp dụng [20261026_google_login.sql](migrations/20261026_google_login.sql) trước
schema validation/deploy; giữ unique email chuẩn hóa hiện có. Migration chỉ
thêm nullable subject và unique index, không tự liên kết dữ liệu lịch sử.

- `GET /api/v1/auth/google/options`: `{available: boolean}`, không cache.
- `GET /api/v1/auth/google/authorization/google`: bắt đầu OAuth từ frontend.
- Callback: đường đã cấu hình, chỉ xử lý response đã xác minh.
- Thành công: cookie refresh HttpOnly hiện có, redirect cố định về
  `/login?google=success`; AuthContext gọi `/auth/refresh` để lấy phiên M4N.
- Không có provider/M4N token trong URL hoặc browser storage. OAuth session
  không xác thực JWT API, và bị hủy sau thành công/thất bại. Provider token
  không lưu ngoài phiên OAuth tạm thời.
- Lỗi/hủy: thông báo an toàn, có thể thử lại hoặc đăng nhập mật khẩu.

## Kiểm tra

Backend tests cover customer creation/linking, disabled/privileged accounts,
signup pre-hijacking, concurrent unique identity, real refresh/JWT lifecycle,
signed OIDC tokens, state/nonce/replay/issuer/audience/expiry/signature rejection,
PKCE and stateless API isolation. Both same-origin and legacy local callbacks
are exercised. Run Maven verify against a disposable PostgreSQL database.

Frontend: existing native Node tests, lint, build; browser check the visible
button, keyboard, responsive layout, cancellation and redirect to Google.
User completes Google account/consent when live acceptance requires it.

## Nguồn chính thức

- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
- [Spring OAuth2 Login](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html)
