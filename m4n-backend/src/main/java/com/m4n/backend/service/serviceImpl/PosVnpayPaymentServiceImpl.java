package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.config.VnpayProperties;
import com.m4n.backend.dto.request.PosSalePreviewRequest;
import com.m4n.backend.dto.request.PosVnpayPaymentRequest;
import com.m4n.backend.dto.response.PosMomoPaymentResponse;
import com.m4n.backend.dto.response.VnpayIpnResponse;
import com.m4n.backend.entity.PaymentState;
import com.m4n.backend.entity.PosMomoPayment;
import com.m4n.backend.entity.RefundState;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.InsufficientStockException;
import com.m4n.backend.exception.PaymentProviderException;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.PosMomoPaymentRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.PosCustomerService;
import com.m4n.backend.service.PosService;
import com.m4n.backend.service.PosVnpayPaymentService;
import com.m4n.backend.service.VnpayGateway;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class PosVnpayPaymentServiceImpl implements PosVnpayPaymentService {
    private static final DateTimeFormatter PROVIDER_DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
    private static final String REFUND_REASON = "Hoan tien toan phan hoa don POS khong the hoan tat";
    private static final String CANCEL_REFUND_REASON = "Hoan tien toan phan do huy hoa don POS";

    private final PosMomoPaymentRepository payments;
    private final UserRepository users;
    private final PosService pos;
    private final VnpayProperties properties;
    private final VnpayGateway gateway;
    private final ObjectMapper json;
    private final TransactionTemplate transaction;
    private final PosCustomerService customers;

    public PosVnpayPaymentServiceImpl(PosMomoPaymentRepository payments, UserRepository users, PosService pos,
            VnpayProperties properties, VnpayGateway gateway, ObjectMapper json,
            PlatformTransactionManager manager, PosCustomerService customers) {
        this.payments = payments;
        this.users = users;
        this.pos = pos;
        this.properties = properties;
        this.gateway = gateway;
        this.json = json;
        this.transaction = new TransactionTemplate(manager);
        this.customers = customers;
    }

    @Override
    public PosMomoPaymentResponse create(PosVnpayPaymentRequest request, String email, String ipAddress, String origin) {
        available();
        String posReturnBase = properties.posReturnUrlFor(origin);
        return transaction.execute(tx -> {
            User staff = users.findByEmailIgnoreCaseWithLock(email)
                    .orElseThrow(() -> new AccessDeniedException("Tài khoản không khả dụng."));
            requireStaff(staff);
            var existing = payments.findByIdWithLock(request.id()).orElse(null);
            if (existing != null) {
                owner(existing, staff);
                if (!"VNPAY".equals(existing.getProvider())) {
                    throw new IllegalArgumentException("Mã giao dịch đã được sử dụng cho phương thức khác.");
                }
                return response(existing, null);
            }
            var sale = request.sale();
            customers.validateCustomer(sale);
            if (!"VNPAY".equals(sale.getPaymentMethod())) {
                throw new IllegalArgumentException("Hóa đơn phải chọn VNPay.");
            }
            String normalizedEmail = normalizeOptionalEmail(request.customerEmail());
            var preview = pos.previewSale(PosSalePreviewRequest.builder()
                    .items(sale.getItems())
                    .voucherCode(sale.getVoucherCode())
                    .build());
            if (!preview.getStockWarnings().isEmpty()) {
                throw new InsufficientStockException(String.join(" ", preview.getStockWarnings()));
            }
            if (sale.getVoucherCode() != null && !sale.getVoucherCode().isBlank() && !preview.isVoucherApplied()) {
                throw new IllegalArgumentException(preview.getVoucherMessage());
            }
            BigDecimal amount = preview.getFinalAmount();
            validateAmount(amount);
            if (amount.compareTo(request.expectedAmount()) != 0) {
                throw new IllegalStateException("Giá đã thay đổi. Vui lòng tải lại hóa đơn trước khi thanh toán.");
            }
            Instant now = Instant.now().truncatedTo(ChronoUnit.MICROS);
            Instant expiresAt = now.plusSeconds(900);
            String createDate = PROVIDER_DATE.format(now);
            Map<String, String> params = base("pay");
            params.put("vnp_Amount", providerAmount(amount));
            params.put("vnp_CurrCode", "VND");
            params.put("vnp_TxnRef", request.id());
            params.put("vnp_OrderInfo", "Thanh toan POS " + request.id());
            params.put("vnp_OrderType", "other");
            params.put("vnp_Locale", "vn");
            params.put("vnp_BankCode", "NCB");
            params.put("vnp_IpAddr", literalIp(ipAddress));
            params.put("vnp_CreateDate", createDate);
            params.put("vnp_ExpireDate", PROVIDER_DATE.format(expiresAt));
            params.put("vnp_ReturnUrl", posReturnBase + "?m4nPosPaymentId=" + request.id());
            String url = gateway.paymentUrl(params);
            var created = payments.saveAndFlush(PosMomoPayment.builder()
                    .id(request.id())
                    .staff(staff)
                    .bill(json.writeValueAsString(sale))
                    .customerEmail(normalizedEmail)
                    .provider("VNPAY")
                    .providerCreateDate(createDate)
                    .amount(amount)
                    .state(PaymentState.PENDING)
                    .refundState(RefundState.NONE)
                    .paymentUrl(url)
                    .createdAt(now)
                    .expiresAt(expiresAt)
                    .build());
            return response(created, null);
        });
    }

    @Override
    public PosMomoPaymentResponse status(String id, String email) {
        return transaction.execute(tx -> {
            var p = lock(id);
            owner(p, actor(email));
            return response(p, null);
        });
    }

    @Override
    public Page<PosMomoPaymentResponse> recent(String email, int page) {
        if (page < 0 || (long) page * 10 > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Trang yêu cầu vượt giới hạn phân trang. Vui lòng chọn trang nhỏ hơn.");
        }
        return transaction.execute(tx -> payments.findByStaffIdAndProviderAndInvoiceIsNullOrderByCreatedAtDesc(
                actor(email).getId(), "VNPAY", PageRequest.of(page, 10)).map(p -> response(p, null)));
    }

    @Override
    public PosMomoPaymentResponse reconcile(String id, String email) {
        available();
        Snapshot before = transaction.execute(tx -> {
            var p = lock(id);
            owner(p, actor(email));
            return snapshot(p);
        });
        if (before.state() == PaymentState.PENDING) {
            Map<String, String> result;
            try {
                result = gateway.query(queryRequest(before));
            } catch (PaymentProviderException ex) {
                return statusWithMessage(id, email,
                        "Chưa có xác nhận thanh toán từ VNPay. Nếu khách chưa thanh toán xong, bạn có thể mở lại cổng VNPay hoặc hủy hóa đơn.");
            }
            try {
                transaction.executeWithoutResult(tx -> {
                    var p = lock(id);
                    owner(p, actor(email));
                    if (!matchesResult(p, result, "querydr")) throw new PaymentProviderException();
                    if (p.getState() == PaymentState.PENDING && "00".equals(result.get("vnp_ResponseCode"))
                            && "01".equals(result.get("vnp_TransactionType")) && validPaymentResult(result)) {
                        applyPayment(p, result);
                    }
                });
            } catch (PaymentProviderException ex) {
                return statusWithMessage(id, email,
                        "Chưa xác minh được kết quả giao dịch từ VNPay. Vui lòng kiểm tra lại.");
            }
        }
        settleOrRefund(id, true);
        return status(id, email);
    }

    @Override
    public PosMomoPaymentResponse cancel(String id, String email) {
        transaction.executeWithoutResult(tx -> {
            var p = lock(id);
            owner(p, actor(email));
            if (p.getInvoice() != null) {
                throw new IllegalStateException("Hóa đơn đã được xuất. Không thể hủy phiên thanh toán đang chờ.");
            }
            p.setCancelRequested(true);
            refundCancelledCharge(p);
        });
        if (properties.isAvailable()) {
            try {
                return reconcile(id, email);
            } catch (PaymentProviderException ignored) {
                // Persisted cancellation remains durable for later reconciliation.
            }
        }
        return status(id, email);
    }

    @Override
    public VnpayIpnResponse processIpn(Map<String, String> params) {
        if (!properties.isAvailable()) return new VnpayIpnResponse("99", "Provider unavailable");
        if (params == null || !gateway.verifyIpn(params)) return new VnpayIpnResponse("97", "Invalid signature");
        if (!properties.merchantCode().equals(params.get("vnp_TmnCode"))) return new VnpayIpnResponse("97", "Invalid merchant");
        String id = params.get("vnp_TxnRef");
        if (id == null || !id.matches("pos-[0-9a-f]{32}")) return new VnpayIpnResponse("01", "Order not found");
        if (params.containsKey("vnp_OrderInfo") && !("Thanh toan POS " + id).equals(params.get("vnp_OrderInfo"))) {
            return new VnpayIpnResponse("99", "Invalid order info");
        }
        VnpayIpnResponse ipnResponse = transaction.execute(tx -> {
            var p = payments.findByIdWithLock(id).orElse(null);
            if (p == null || !"VNPAY".equals(p.getProvider())) return new VnpayIpnResponse("01", "Order not found");
            if (!validAmount(p, params)) return new VnpayIpnResponse("04", "Invalid amount");
            if (!validPaymentResult(params)) return new VnpayIpnResponse("99", "Invalid result");
            if (p.getState() != PaymentState.PENDING) return new VnpayIpnResponse("02", "Order already confirmed");
            applyPayment(p, params);
            return new VnpayIpnResponse("00", "Confirm success");
        });
        if (ipnResponse != null && ("00".equals(ipnResponse.rspCode()) || "02".equals(ipnResponse.rspCode()))) {
            settleOrRefund(id, false);
        }
        return ipnResponse;
    }

    private void settleOrRefund(String id, boolean retryFailedRefund) {
        try {
            pos.completeMomoSale(id);
        } catch (InsufficientStockException | ResourceNotFoundException | IllegalArgumentException | IllegalStateException ex) {
            transaction.executeWithoutResult(tx -> {
                var p = lock(id);
                if (p.getState() == PaymentState.SUCCEEDED && p.getInvoice() == null && p.getRefundState() == RefundState.NONE) {
                    p.setFailureReason(ex.getMessage() == null ? "Không thể hoàn tất hóa đơn POS."
                            : ex.getMessage().substring(0, Math.min(500, ex.getMessage().length())));
                    allocateRefund(p);
                }
            });
        }
        RefundAction action = transaction.execute(tx -> {
            var p = lock(id);
            if (p.getInvoice() != null || p.getState() != PaymentState.SUCCEEDED) return null;
            if (p.getRefundState() == RefundState.FAILED && retryFailedRefund) allocateRefund(p);
            if (p.getRefundState() != RefundState.PENDING) return null;
            if (p.getRefundResponseCode() == null) {
                p.setRefundResponseCode("SENT");
                return new RefundAction(true, snapshot(p));
            }
            return retryFailedRefund ? new RefundAction(false, snapshot(p)) : null;
        });
        if (action == null) return;
        Map<String, String> result;
        String command = action.sendRefund() ? "refund" : "querydr";
        try {
            result = action.sendRefund()
                    ? gateway.refund(refundRequest(action.snapshot()))
                    : gateway.query(queryRequest(action.snapshot()));
        } catch (PaymentProviderException ex) {
            return;
        }
        transaction.executeWithoutResult(tx -> {
            var p = lock(id);
            if (!Objects.equals(p.getRefundReference(), action.snapshot().refundReference())
                    || p.getRefundState() != RefundState.PENDING) return;
            if (!matchesResult(p, result, command)
                    || !result.getOrDefault("vnp_ResponseId", "").matches("[A-Za-z0-9]{1,32}")) return;
            String responseCode = result.get("vnp_ResponseCode");
            String providerStatus = result.get("vnp_TransactionStatus");
            if (responseCode != null && responseCode.length() <= 10) {
                p.setRefundResponseCode(responseCode);
            }
            if ("00".equals(responseCode) && "02".equals(result.get("vnp_TransactionType"))
                    && "00".equals(providerStatus)
                    && result.getOrDefault("vnp_TransactionNo", "").matches("[0-9]{1,15}")) {
                p.setRefundState(RefundState.SUCCEEDED);
                p.setRefundTransactionNo(result.get("vnp_TransactionNo"));
            } else if (("refund".equals(command) && Set.of("02", "03", "91", "95", "97").contains(responseCode))
                    || ("02".equals(result.get("vnp_TransactionType")) && "09".equals(providerStatus))) {
                p.setRefundState(RefundState.FAILED);
            }
        });
    }

    private void applyPayment(PosMomoPayment p, Map<String, String> params) {
        String status = params.get("vnp_TransactionStatus");
        String responseCode = params.get("vnp_ResponseCode");
        if ("00".equals(responseCode) && "00".equals(status)) {
            p.setState(PaymentState.SUCCEEDED);
            p.setTransactionNo(params.get("vnp_TransactionNo"));
        } else if (Set.of("02", "09").contains(status) || !"00".equals(responseCode)) {
            p.setState(PaymentState.FAILED);
        }
        p.setResponseCode(responseCode);
        refundCancelledCharge(p);
    }

    private void refundCancelledCharge(PosMomoPayment p) {
        if (p.isCancelRequested() && p.getState() == PaymentState.SUCCEEDED
                && p.getInvoice() == null && p.getRefundState() == RefundState.NONE) {
            allocateRefund(p);
        }
    }

    private void allocateRefund(PosMomoPayment p) {
        p.setRefundState(RefundState.PENDING);
        p.setRefundReference(UUID.randomUUID().toString().replace("-", ""));
        p.setRefundCreateDate(PROVIDER_DATE.format(Instant.now()));
        p.setRefundResponseCode(null);
    }

    private Map<String, String> queryRequest(Snapshot data) {
        Map<String, String> request = base("querydr");
        request.put("vnp_RequestId", UUID.randomUUID().toString().replace("-", ""));
        request.put("vnp_TxnRef", data.id());
        request.put("vnp_TransactionDate", data.providerCreateDate());
        request.put("vnp_CreateDate", PROVIDER_DATE.format(Instant.now()));
        request.put("vnp_IpAddr", properties.serverIp());
        request.put("vnp_OrderInfo", "Doi soat giao dich " + data.id());
        return request;
    }

    private Map<String, String> refundRequest(Snapshot data) {
        Map<String, String> request = base("refund");
        request.put("vnp_RequestId", data.refundReference());
        request.put("vnp_TransactionType", "02");
        request.put("vnp_TxnRef", data.id());
        request.put("vnp_Amount", providerAmount(data.amount()));
        request.put("vnp_TransactionNo", data.transactionNo());
        request.put("vnp_TransactionDate", data.providerCreateDate());
        request.put("vnp_CreateBy", data.staffCreateBy());
        request.put("vnp_CreateDate", data.refundCreateDate());
        request.put("vnp_IpAddr", properties.serverIp());
        request.put("vnp_OrderInfo", data.cancelRequested() ? CANCEL_REFUND_REASON : REFUND_REASON);
        return request;
    }

    private Map<String, String> base(String command) {
        Map<String, String> values = new HashMap<>();
        values.put("vnp_Version", "2.1.0");
        values.put("vnp_Command", command);
        values.put("vnp_TmnCode", properties.merchantCode());
        return values;
    }

    private boolean validPaymentResult(Map<String, String> params) {
        String code = params.getOrDefault("vnp_ResponseCode", "");
        String status = params.getOrDefault("vnp_TransactionStatus", "");
        if (!code.matches("[0-9]{2}")) return false;
        if (!status.isEmpty() && !Set.of("00", "01", "02", "04", "05", "06", "07", "09").contains(status)) return false;
        return !"00".equals(code) || ("00".equals(status) && params.getOrDefault("vnp_TransactionNo", "").matches("[0-9]{1,15}"));
    }

    private boolean matchesResult(PosMomoPayment p, Map<String, String> result, String command) {
        return command.equals(result.get("vnp_Command")) && properties.merchantCode().equals(result.get("vnp_TmnCode"))
                && p.getId().equals(result.get("vnp_TxnRef")) && validAmount(p, result);
    }

    private boolean validAmount(PosMomoPayment p, Map<String, String> params) {
        return "VNPAY".equals(p.getProvider()) && providerAmount(p.getAmount()).equals(params.get("vnp_Amount"))
                && (!params.containsKey("vnp_CurrCode") || "VND".equals(params.get("vnp_CurrCode")));
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.stripTrailingZeros().scale() > 0 || amount.compareTo(new BigDecimal("5000")) < 0
                || amount.movePointRight(2).compareTo(new BigDecimal("999999999999")) > 0) {
            throw new IllegalArgumentException("VNPay hỗ trợ số tiền nguyên VND từ 5.000 đến 9.999.999.999 đồng. Vui lòng chọn tiền mặt cho số tiền không phù hợp.");
        }
    }

    private String normalizeOptionalEmail(String email) {
        if (email == null || email.isBlank()) return "";
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (!normalized.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") || normalized.length() > 255) {
            throw new IllegalArgumentException("Email nhận hóa đơn không hợp lệ.");
        }
        return normalized;
    }

    private PosMomoPaymentResponse statusWithMessage(String id, String email, String customMessage) {
        return transaction.execute(tx -> {
            var p = lock(id);
            owner(p, actor(email));
            return response(p, customMessage);
        });
    }

    private PosMomoPayment lock(String id) {
        PosMomoPayment p = payments.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên VNPay POS."));
        if (!"VNPAY".equals(p.getProvider())) {
            throw new ResourceNotFoundException("Không tìm thấy phiên VNPay POS.");
        }
        return p;
    }

    private User actor(String email) {
        User user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new AccessDeniedException("Tài khoản không khả dụng."));
        requireStaff(user);
        return user;
    }

    private void requireStaff(User staff) {
        if (!staff.isActive() || !staff.isEmailVerified() || staff.getRole().getName() != RoleName.POS_STAFF) {
            throw new AccessDeniedException("Chỉ nhân viên POS đang hoạt động được thực hiện thanh toán tại quầy.");
        }
    }

    private void owner(PosMomoPayment payment, User staff) {
        if (!payment.getStaff().getId().equals(staff.getId())) {
            throw new AccessDeniedException("Không có quyền truy cập giao dịch POS này.");
        }
    }

    private void available() {
        if (!properties.isAvailable()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "VNPay chưa được cấu hình cho POS.");
        }
    }

    private String providerAmount(BigDecimal amount) {
        return amount.movePointRight(2).toBigIntegerExact().toString();
    }

    private String literalIp(String value) {
        return VnpayProperties.isLiteralIp(value) && !value.contains(":") ? value : properties.serverIp();
    }

    private PosMomoPaymentResponse response(PosMomoPayment p, String customMessage) {
        String message = customMessage != null ? customMessage
                : p.getInvoice() != null ? "Thanh toán VNPay thành công. Hóa đơn POS đã được xuất."
                : switch (p.getRefundState()) {
                    case SUCCEEDED -> "VNPay đã xác nhận hoàn tiền toàn phần. Không xuất hóa đơn; không trừ kho.";
                    case PENDING -> "Không thể xuất hóa đơn. Đang chờ VNPay xác nhận hoàn tiền; vui lòng kiểm tra lại.";
                    case FAILED -> "VNPay chưa hoàn tiền thành công. Vui lòng thử lại hoàn tiền hoặc liên hệ quản trị viên.";
                    default -> switch (p.getState()) {
                        case SUCCEEDED -> "Đã nhận thanh toán VNPay. Cần kiểm tra lại để hoàn tất hóa đơn; không thu tiền thêm.";
                        case FAILED -> "Giao dịch VNPay đã hủy hoặc không thành công. Chưa xuất hóa đơn.";
                        default -> p.isCancelRequested()
                                ? "Đã hủy hóa đơn. Đang chờ xác minh giao dịch VNPay; nếu đã thu tiền, hệ thống sẽ yêu cầu hoàn tiền toàn phần."
                                : "Chưa có kết quả thanh toán đã xác minh. Không thu tiền thêm trước khi kiểm tra giao dịch.";
                    };
                };
        return new PosMomoPaymentResponse(
                p.getId(),
                p.getAmount(),
                p.getState().name(),
                p.getRefundState().name(),
                !p.isCancelRequested() && p.getState() == PaymentState.PENDING && p.getExpiresAt().isAfter(Instant.now())
                        ? p.getPaymentUrl() : null,
                p.getExpiresAt(),
                p.getInvoice() == null ? null : p.getInvoice().getId(),
                message,
                p.isCancelRequested());
    }

    private Snapshot snapshot(PosMomoPayment p) {
        return new Snapshot(p.getId(), p.getAmount(), p.getState(), p.getProviderCreateDate(),
                p.getTransactionNo(), p.getRefundReference(), p.getRefundCreateDate(),
                "pos" + p.getStaff().getId(), p.isCancelRequested());
    }

    private record Snapshot(String id, BigDecimal amount, PaymentState state, String providerCreateDate,
                            String transactionNo, String refundReference, String refundCreateDate,
                            String staffCreateBy, boolean cancelRequested) {}

    private record RefundAction(boolean sendRefund, Snapshot snapshot) {}
}

