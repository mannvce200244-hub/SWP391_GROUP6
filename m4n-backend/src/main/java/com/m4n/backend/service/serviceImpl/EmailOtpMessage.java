package com.m4n.backend.service.serviceImpl;

/** The same Vietnamese message is used by SMTP and HTTPS delivery. */
final class EmailOtpMessage {
    private EmailOtpMessage() {}

    static String action(String purpose) {
        return purpose.equals("REGISTER") ? "đăng ký tài khoản" : "đặt lại mật khẩu";
    }

    static String subject(String action) { return "M4N — Mã xác thực " + action; }

    static String text(String code, String action) {
        return "M4N — Xác thực " + action + "\n\nMã OTP của bạn: " + code
                + "\nMã có hiệu lực 10 phút và chỉ dùng một lần. Khi yêu cầu mã mới, mã cũ sẽ hết hiệu lực."
                + "\nKhông chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu, hãy bỏ qua email này.";
    }

    static String html(String code, String action) {
        // Both substitutions are generated internally, never recipient-provided HTML.
        return """
                <!doctype html>
                <html lang="vi">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="margin:0;padding:0;background-color:#F6F7F8;color:#17191B;font-family:Arial,Helvetica,sans-serif;">
                  <div style="display:none;max-height:0;overflow:hidden;">Hoàn tất xác thực với M4N. Mã có hiệu lực trong 10 phút.</div>
                  <table role="presentation" style="width:100%%;border-collapse:collapse;background-color:#F6F7F8;">
                    <tr><td align="center" style="padding:32px 16px;">
                      <table role="presentation" style="width:100%%;max-width:560px;border-collapse:collapse;background-color:#FFFFFF;border:1px solid #E2E5E8;">
                        <tr><td style="padding:28px 28px 24px;border-top:4px solid #A62F25;border-bottom:1px solid #E2E5E8;">
                          <span style="font-size:28px;font-weight:700;letter-spacing:2px;color:#A62F25;">M4N</span>
                          <p style="margin:8px 0 0;font-size:12px;letter-spacing:1px;color:#626970;">NHẠC CỤ TRUYỀN THỐNG VIỆT NAM</p>
                        </td></tr>
                        <tr><td style="padding:28px;">
                          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.35;font-weight:700;">Xác thực %s</h1>
                          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#626970;">Xin chào,<br>Nhập mã dưới đây vào màn hình xác thực M4N để tiếp tục.</p>
                          <table role="presentation" style="width:100%%;border-collapse:collapse;background-color:#F6F7F8;">
                            <tr><td align="center" style="padding:24px 12px;">
                              <p style="margin:0 0 12px;font-size:12px;letter-spacing:1px;color:#626970;">MÃ XÁC THỰC CỦA BẠN</p>
                              <p style="margin:0;font-family:Consolas,'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:6px;color:#17191B;">%s</p>
                              <p style="margin:12px 0 0;font-size:13px;color:#626970;">Có hiệu lực trong <strong style="color:#17191B;">10 phút</strong> · Chỉ dùng một lần</p>
                            </td></tr>
                          </table>
                          <p style="margin:24px 0 12px;font-size:14px;line-height:1.7;color:#626970;">Nếu bạn yêu cầu gửi lại, hãy dùng mã trong <strong style="color:#17191B;">email mới nhất</strong>. Mã trước đó sẽ không còn hiệu lực.</p>
                          <p style="margin:0;font-size:14px;line-height:1.7;color:#626970;">Không chia sẻ mã xác thực với bất kỳ ai, kể cả người tự nhận là nhân viên hỗ trợ M4N.</p>
                        </td></tr>
                        <tr><td style="padding:20px 28px;border-top:1px solid #E2E5E8;">
                          <p style="margin:0;font-size:12px;line-height:1.7;color:#626970;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.<br>Đây là email tự động từ M4N. Vui lòng không trả lời.</p>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </body></html>
                """.formatted(action, code);
    }

}
