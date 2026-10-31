# Deploy bản demo MoMo: Vercel + Railway

Đây là hướng dẫn cho **MoMo sandbox/thẻ thử nghiệm** đã được người dùng chọn.
Deploy lên Internet vẫn dùng sandbox; mã hiện tại chưa hỗ trợ thu tiền thật.
Tên miền bên dưới là ví dụ: thay bằng tên miền thực tế của hai project.

## 1. Luồng chạy

```text
Trình duyệt → https://<frontend>.vercel.app/api/v1/...
           → Vercel rewrite → https://<backend>.up.railway.app/api/v1/...

MoMo → trình duyệt quay về https://<frontend>.vercel.app/payment-return
MoMo → IPN trực tiếp https://<backend>.up.railway.app/api/v1/payments/momo/ipn
```

API qua Vercel giúp cookie HttpOnly/SameSite=Lax thuộc cùng tên miền với trang
đăng nhập. Không đặt `VITE_API_BASE_URL` trỏ thẳng sang Railway: hai tên miền
này khác site và cookie refresh có thể không được gửi sau khi quay về từ MoMo.
Không đổi SameSite, bỏ kiểm tra Origin hay đưa JWT vào URL để khắc phục.

## 2. Backend Railway

1. Tạo dịch vụ PostgreSQL và backend; đặt Root Directory là `m4n-backend`.
2. Chọn config file `/m4n-backend/railway.json` nếu Railway không tự nhận.
   File có build Maven, start JAR và healthcheck `/api/v1/health`.
3. Đặt `RAILPACK_JDK_VERSION=21`. Backend đọc `PORT` Railway cấp, mặc định
   8080 khi chạy local. Generate Domain cho backend, dùng tên miền HTTPS ổn định.
  4. Với database mới: áp dụng baseline rồi **toàn bộ upgrade hiện có** theo
   [migrations/README.md](migrations/README.md). Với database đã có dữ liệu,
   backup và chỉ chạy các upgrade chưa áp dụng. Không dùng `ddl-auto=update`
   để bỏ qua migration khi deploy.
5. Điền Railway Variables dưới đây. Biến bí mật chỉ nằm ở backend.

| Biến | Giá trị |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DB_URL` | `jdbc:postgresql://<postgres-private-host>:5432/<database>` |
| `DB_USERNAME`, `DB_PASSWORD` | Thông tin PostgreSQL của Railway |
| `JWT_SECRET` | Chuỗi ngẫu nhiên riêng, ít nhất 32 byte |
| `FRONTEND_URL` | `https://<frontend>.vercel.app` — không có `/` cuối |
| `CORS_ALLOWED_ORIGINS` | Chính xác cùng origin với `FRONTEND_URL` |
| `COOKIE_SECURE` | `true` (`prod` cũng bắt buộc Secure) |
| `SEED_DEV_ACCOUNTS` | `false` |
| `OTP_EMAIL_ENABLED` | `true` |
| `GMAIL_USERNAME`, `GMAIL_APP_PASSWORD` | SMTP sender và Google app password |
| `POS_INVOICE_EMAIL_ENABLED` | `true` — gửi hóa đơn PDF sau khi POS MoMo xuất hóa đơn thành công |
| `INVOICE_PDF_FONT_PATH` | Đường dẫn font TTF hỗ trợ tiếng Việt có sẵn trong container Railway |
| `MOMO_ENABLED` | `true` |
| `MOMO_SANDBOX_DEPLOYMENT_ENABLED` | `true` — opt-in cho demo deploy |
| `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` | Bộ khóa **sandbox** đã cấu hình, không đưa vào frontend |
| `MOMO_REDIRECT_URL` | `https://<frontend>.vercel.app/payment-return` |
| `MOMO_IPN_URL` | `https://<backend>.up.railway.app/api/v1/payments/momo/ipn` |
| `VNPAY_ENABLED` | `false` |
| `GHN_ENABLED` | `false` nếu demo dùng phí ship nội bộ đã cấu hình |
| `PRODUCT_IMAGE_DIRECTORY` | Ví dụ `/data/product-images`, trên Railway Volume bền vững |
| `PRODUCT_IMAGE_PUBLIC_BASE_URL` | `https://<backend>.up.railway.app/api/v1/media` |

`DB_URL` cần định dạng **JDBC**, không dán nguyên URL `postgresql://...` vào đó.
Có thể dùng Railway reference variables cho host/user/password theo tên dịch vụ
PostgreSQL thực tế. Không commit file `.env` chứa khóa vào repository.

`prod` kiểm tra cấu hình trước khi khởi tạo database: MoMo mặc định vẫn bị chặn
trừ khi bật opt-in demo và đủ khóa/callback HTTPS. Callback không được dùng
localhost, IP riêng, URL tunnel tạm, sai đường dẫn hoặc sai frontend return site.
Các kiểm tra TLS/cookie/OTP/schema/seeding của `prod` vẫn được giữ.

Railway không tự cung cấp SMTP hay credentials MoMo. Theo
[chính sách outbound Railway](https://docs.railway.com/networking/outbound-networking),
SMTP chỉ mở ở **Pro trở lên**; Free/Trial/Hobby chặn SMTP. OTP Gmail hiện tại
cần Pro, hoặc một thay đổi riêng sang provider email HTTPS API được phê duyệt.
Không tắt xác thực OTP để vượt qua giới hạn hosting. Thử OTP trên host trước khi mở đăng ký. Nếu bật
GHN trong `prod`, cấu hình production GHN hợp lệ theo hướng dẫn hiện có.

## 3. Frontend Vercel

1. Root Directory: `m4n-frontend`; Node.js **22.x**; Framework: Vite.
2. Cấu hình `vercel.mjs` đã khai báo `npm run build`, output `dist`, rewrite API
   và SPA fallback cho `/payment-return`, `/checkout`, `/account/orders`.
   Dùng Vercel có hỗ trợ programmatic config; không tạo thêm `vercel.json`.
3. Điền Environment Variables cho môi trường **Production**:

```dotenv
VITE_API_BASE_URL=/api/v1
M4N_BACKEND_ORIGIN=https://<backend>.up.railway.app
```

`M4N_BACKEND_ORIGIN` là origin HTTPS, không có `/` cuối, không thêm `/api/v1`.
Config sẽ từ chối thiếu origin, localhost/tunnel hoặc API browser trỏ khác site.
Không cần cài thêm thư viện. Không bật cache cho API có đăng nhập.

4. Redeploy frontend sau khi đổi biến build. Vite nhúng cấu hình lúc build;
   đổi biến trên dashboard không sửa được deployment cũ.
5. Chọn một tên miền production ổn định để đăng nhập và thanh toán. Không chuyển
   qua lại giữa preview URL, localhost và production trong cùng phiên checkout.
   Nếu dùng preview, cần backend/database demo riêng và allowlist origin cụ thể.
6. Cho phép truy cập công khai website demo và endpoint IPN; không để Deployment
   Protection/challenge chặn khách quay về. IPN dùng trực tiếp Railway nên không
   phụ thuộc vào bảo vệ preview Vercel.

Nếu đổi domain, cập nhật đồng thời `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`,
`MOMO_REDIRECT_URL`; đổi backend domain thì cập nhật `MOMO_IPN_URL` và
`M4N_BACKEND_ORIGIN`, sau đó redeploy cả hai. Không đưa link trycloudflare local
lên hosting.

## 4. Kiểm tra sau deploy

Trước khi deploy, có thể chạy gate khởi động bằng cấu hình demo tổng hợp:

```powershell
# DB_URL/DB_USERNAME/DB_PASSWORD phải trỏ đến database kiểm thử đã tạo schema/migrate.
# Tuyệt đối không dùng database production cho Maven tests.
.\mvnw.cmd -Dtest=HostedDemoDeploymentSmoke test
```

Chạy từ `m4n-backend`. Gate này chủ động dùng `prod`, cổng tự cấp, khóa giả và
HTTP local để kiểm tra health/options; không gọi MoMo/SMTP và không tạo giao dịch.
Đây là gate chạy riêng sau bước chuẩn bị schema, không thuộc `mvnw test` mặc định
vì `prod` cố ý từ chối tự tạo schema. Bộ regression mặc định vẫn chạy độc lập.

- Mở `https://<backend>.up.railway.app/api/v1/health`: HTTP 200, `status=UP`.
- Mở `https://<frontend>.vercel.app/api/v1/health`: cùng JSON backend, **không**
  phải HTML SPA. Nếu sai, kiểm tra `M4N_BACKEND_ORIGIN` và rewrite.
- `/api/v1/payments/options` trên frontend trả `momoAvailable=true`.
- Đăng nhập trên frontend, tải lại trang; Network gọi `/api/v1/auth/refresh`
  trên **Vercel**, cookie HttpOnly/Secure còn hoạt động.
- Tạo đơn demo hợp lệ từ 1.000–10.000.000 đồng, mở MoMo và dùng thẻ thử nghiệm
  chính thức. Quay về **cùng origin Vercel**, trạng thái đọc từ backend.
- Kiểm tra IPN được MoMo gửi tới Railway; endpoint không đòi login/cookie nhưng
  từ chối chữ ký giả. Không đánh dấu đã trả tiền dựa trên `resultCode` trong URL.
- Thử thất bại/quay lại, đối soát giao dịch chờ và tải lại trang return. Thử
  hoàn tiền/hủy trên **đơn demo riêng**; chỉ hủy sau khi provider xác nhận hoàn.
- Kiểm tra database/payment attempts vẫn còn sau khi restart/redeploy backend.
  Không để dịch vụ tự ngủ khi cần nhận callback demo ổn định; timeout gateway
  phải đáp ứng outbound MoMo hiện có (read timeout 35 giây).

Chưa có URL và tài khoản hosting thực tế thì chưa thể xác nhận bước nghiệm thu
online. Kiểm thử local/config không thay thế một giao dịch sandbox trên host.

## Nguồn chính thức

- [Vercel programmatic config, gồm vercel.mjs](https://vercel.com/docs/project-configuration/vercel-ts)
- [Vercel external rewrites](https://vercel.com/docs/routing/rewrites)
- [Railway config as code](https://docs.railway.com/config-as-code)
- [Railway healthcheck và PORT](https://docs.railway.com/deployments/healthchecks)
- [Railway outbound SMTP](https://docs.railway.com/networking/outbound-networking)
- [Railpack Java/JDK](https://railpack.com/languages/java/)
- [MoMo môi trường test/production](https://developers.momo.vn/v3/vi/docs/payment/onboarding/integration-process/)
- [MoMo thẻ thử nghiệm](https://developers.momo.vn/v3/docs/payment/onboarding/test-instructions/)
