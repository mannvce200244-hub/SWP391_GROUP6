package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.config.VnpayProperties;
import com.m4n.backend.dto.response.PaymentOptionsResponse;
import com.m4n.backend.dto.response.PaymentStatusResponse;
import com.m4n.backend.dto.response.PaymentUrlResponse;
import com.m4n.backend.dto.response.VnpayIpnResponse;
import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.entity.PaymentAttempt;
import com.m4n.backend.entity.PaymentState;
import com.m4n.backend.entity.RefundState;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.PaymentProviderException;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.PaymentAttemptRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.PaymentService;
import com.m4n.backend.service.VnpayGateway;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class PaymentServiceImpl implements PaymentService {
    private static final DateTimeFormatter PROVIDER_DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
    private static final Set<OrderStatus> REFUNDABLE_STATUSES = Set.of(OrderStatus.PENDING_CONFIRMATION,
            OrderStatus.CONFIRMED, OrderStatus.OUT_OF_STOCK_WAITING, OrderStatus.CANCELLED);
    private final OrderRepository orderRepository;
    private final PaymentAttemptRepository paymentRepository;
    private final UserRepository userRepository;
    private final VnpayProperties properties;
    private final VnpayGateway gateway;
    private final TransactionTemplate transaction;

    public PaymentServiceImpl(OrderRepository orderRepository, PaymentAttemptRepository paymentRepository,
            UserRepository userRepository, VnpayProperties properties, VnpayGateway gateway,
            PlatformTransactionManager transactionManager) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.properties = properties;
        this.gateway = gateway;
        this.transaction = new TransactionTemplate(transactionManager);
    }

    @Override public boolean isAvailable() { return properties.isAvailable(); }
    @Override public PaymentOptionsResponse getOptions() { return new PaymentOptionsResponse(isAvailable()); }
    @Override public boolean hasVerifiedFullRefund(Long id) {
        return paymentRepository.existsByOrderIdAndRefundState(id, RefundState.SUCCEEDED);
    }
    @Override public boolean isRefundPending(Long id) {
        return paymentRepository.existsByOrderIdAndRefundState(id, RefundState.PENDING);
    }
    @Override public boolean isPaymentPending(Long id) {
        return paymentRepository.existsByOrderIdAndState(id, PaymentState.PENDING);
    }
    @Override public void validatePaymentAmount(BigDecimal amount) {
        if (amount == null || amount.stripTrailingZeros().scale() > 0 || amount.compareTo(new BigDecimal("5000")) < 0
                || amount.movePointRight(2).compareTo(new BigDecimal("999999999999")) > 0) {
            throw new IllegalArgumentException("VNPay yêu cầu số tiền nguyên VND từ 5.000 đến 9.999.999.999 đồng. Vui lòng chọn COD cho số tiền không phù hợp.");
        }
    }

    @Override
    @Transactional
    public PaymentUrlResponse createPayment(Long id, String email, String ipAddress) {
        requireAvailable();
        Order order = lockOrder(id);
        User actor = actor(email);
        requireOwner(order, actor);
        if (actor.getRole().getName() != RoleName.CUSTOMER) {
            throw new AccessDeniedException("Chỉ khách hàng được khởi tạo thanh toán đơn hàng.");
        }
        if (!"VNPAY".equals(order.getPaymentMethod()) || order.isPaid() || order.getStatus() != OrderStatus.PENDING_CONFIRMATION) {
            throw new IllegalStateException("Đơn hàng không đủ điều kiện thanh toán VNPay.");
        }
        validatePaymentAmount(order.getFinalAmount());
        PaymentAttempt attempt = paymentRepository.findFirstByOrderIdOrderByIdDesc(id).orElse(null);
        if (attempt != null && attempt.getState() != PaymentState.FAILED) {
            if (attempt.getState() == PaymentState.SUCCEEDED || !attempt.getExpiresAt().isAfter(Instant.now())) {
                throw new IllegalStateException("Giao dịch cần được đối soát trước khi thử thanh toán lại.");
            }
        } else {
            Instant now = Instant.now();
            attempt = paymentRepository.saveAndFlush(PaymentAttempt.builder().order(order)
                    .transactionReference(UUID.randomUUID().toString().replace("-", ""))
                    .amount(order.getFinalAmount()).providerCreateDate(PROVIDER_DATE.format(now))
                    .expiresAt(now.plusSeconds(900)).state(PaymentState.PENDING).refundState(RefundState.NONE).build());
        }
        Map<String, String> params = base("pay");
        params.put("vnp_Amount", providerAmount(attempt.getAmount()));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", attempt.getTransactionReference());
        params.put("vnp_OrderInfo", "Thanh toan don hang " + order.getId());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_IpAddr", literalIp(ipAddress));
        params.put("vnp_CreateDate", attempt.getProviderCreateDate());
        params.put("vnp_ExpireDate", PROVIDER_DATE.format(attempt.getExpiresAt()));
        params.put("vnp_ReturnUrl", properties.returnUrl() + "?orderId=" + order.getId());
        return new PaymentUrlResponse(gateway.paymentUrl(params), attempt.getTransactionReference());
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentStatusResponse getStatus(Long id, String email) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng."));
        User user = actor(email);
        requireCanRead(order, user);
        return response(order, latest(id), user, null);
    }

    @Override
    @Transactional
    public VnpayIpnResponse processIpn(MultiValueMap<String, String> values) {
        if (!isAvailable()) return new VnpayIpnResponse("99", "Provider unavailable");
        Map<String, String> params = uniqueParameters(values);
        if (params == null || !gateway.verifyIpn(params)) return new VnpayIpnResponse("97", "Invalid signature");
        if (!properties.merchantCode().equals(params.get("vnp_TmnCode"))) return new VnpayIpnResponse("97", "Invalid merchant");
        Long id = paymentRepository.findOrderIdByTransactionReference(params.get("vnp_TxnRef")).orElse(null);
        if (id == null) return new VnpayIpnResponse("01", "Order not found");
        Order order = lockOrder(id);
        PaymentAttempt attempt = paymentRepository.findByTransactionReference(params.get("vnp_TxnRef")).orElseThrow();
        if (!validAmount(order, attempt, params)) return new VnpayIpnResponse("04", "Invalid amount");
        if (attempt.getState() != PaymentState.PENDING) return new VnpayIpnResponse("02", "Order already confirmed");
        if (!validPaymentResult(params)) return new VnpayIpnResponse("99", "Invalid result");
        applyPayment(order, attempt, params);
        return new VnpayIpnResponse("00", "Confirm success");
    }

    @Override
    public PaymentStatusResponse reconcilePayment(Long id, String email, String ipAddress) {
        requireAvailable();
        Snapshot snapshot = transaction.execute(status -> {
            Order order = lockOrder(id);
            requireCanRead(order, actor(email));
            return snapshot(latest(id));
        });
        if (snapshot == null) return getStatus(id, email);
        Map<String, String> result;
        try { result = gateway.query(queryRequest(snapshot)); }
        catch (PaymentProviderException ex) { return getStatusWithMessage(id, email, "Chưa xác minh được kết quả VNPay. Vui lòng đối soát lại."); }
        return transaction.execute(status -> {
            Order order = lockOrder(id);
            User currentActor = actor(email);
            requireCanRead(order, currentActor);
            PaymentAttempt attempt = paymentRepository.findByTransactionReference(snapshot.reference()).orElseThrow();
            if (!matchesResult(order, attempt, result, "querydr")) throw new PaymentProviderException();
            if (attempt.getState() == PaymentState.PENDING && "00".equals(result.get("vnp_ResponseCode"))
                    && "01".equals(result.get("vnp_TransactionType")) && validPaymentResult(result)) {
                applyPayment(order, attempt, result);
            }
            return response(order, attempt, currentActor, "Kết quả được lấy từ đối soát VNPay.");
        });
    }

    @Override
    public PaymentStatusResponse refund(Long id, String reason, String email, String ipAddress) {
        requireAvailable();
        Snapshot snapshot = transaction.execute(status -> {
            Order order = lockOrder(id);
            User admin = requireAdmin(email);
            PaymentAttempt attempt = successful(id);
            if (!refundEligible(order, attempt)) throw new IllegalStateException("Đơn hàng không đủ điều kiện hoàn tiền toàn phần.");
            if (reason == null || reason.isBlank() || reason.length() > 500) throw new IllegalArgumentException("Lý do hoàn tiền bắt buộc và tối đa 500 ký tự.");
            attempt.setRefundState(RefundState.PENDING);
            attempt.setRefundRequestId(UUID.randomUUID().toString().replace("-", ""));
            attempt.setRefundCreateDate(PROVIDER_DATE.format(Instant.now()));
            attempt.setRefundReason(reason.trim());
            attempt.setRefundCreateBy("admin" + admin.getId());
            paymentRepository.flush();
            return snapshot(attempt);
        });
        Map<String, String> request = base("refund");
        request.put("vnp_RequestId", snapshot.refundRequestId());
        request.put("vnp_TransactionType", "02");
        request.put("vnp_TxnRef", snapshot.reference());
        request.put("vnp_Amount", providerAmount(snapshot.amount()));
        request.put("vnp_TransactionNo", snapshot.transactionNo());
        request.put("vnp_TransactionDate", snapshot.createDate());
        request.put("vnp_CreateBy", snapshot.refundCreateBy());
        request.put("vnp_CreateDate", snapshot.refundCreateDate());
        request.put("vnp_IpAddr", properties.serverIp());
        request.put("vnp_OrderInfo", asciiReason(snapshot.reason()));
        try { return persistRefundResult(id, email, snapshot, gateway.refund(request), "refund"); }
        catch (PaymentProviderException ex) {
            log.warn("VNPay refund result was not verified for order {}; reconciliation required.", id);
            return getStatusWithMessage(id, email, "Chưa xác minh được hoàn tiền. Yêu cầu đang chờ đối soát; không gửi lại để tránh hoàn trùng.");
        }
    }

    @Override
    public PaymentStatusResponse reconcileRefund(Long id, String email, String ipAddress) {
        requireAvailable();
        Snapshot snapshot = transaction.execute(status -> {
            lockOrder(id);
            requireAdmin(email);
            PaymentAttempt attempt = successful(id);
            if (attempt.getRefundState() == RefundState.NONE) throw new IllegalStateException("Chưa có yêu cầu hoàn tiền để đối soát.");
            return snapshot(attempt);
        });
        try { return persistRefundResult(id, email, snapshot, gateway.query(queryRequest(snapshot)), "querydr"); }
        catch (PaymentProviderException ex) { return getStatusWithMessage(id, email, "Chưa xác minh được hoàn tiền từ VNPay. Vui lòng đối soát lại."); }
    }

    private PaymentStatusResponse persistRefundResult(Long id, String email, Snapshot snapshot, Map<String, String> result, String command) {
        return transaction.execute(status -> {
            Order order = lockOrder(id);
            PaymentAttempt attempt = paymentRepository.findByTransactionReference(snapshot.reference()).orElseThrow();
            if (!Objects.equals(attempt.getRefundRequestId(), snapshot.refundRequestId())) {
                return response(order, attempt, requireAdmin(email), "Yêu cầu hoàn tiền đã thay đổi. Vui lòng đối soát yêu cầu hiện tại.");
            }
            if (!matchesResult(order, attempt, result, command) || !result.getOrDefault("vnp_ResponseId", "").matches("[A-Za-z0-9]{1,32}")) {
                throw new PaymentProviderException();
            }
            if (attempt.getRefundState() != RefundState.SUCCEEDED) {
                String responseCode = result.get("vnp_ResponseCode");
                String providerStatus = result.get("vnp_TransactionStatus");
                attempt.setRefundResponseCode(responseCode);
                if ("00".equals(responseCode) && "02".equals(result.get("vnp_TransactionType"))
                        && "00".equals(providerStatus) && result.getOrDefault("vnp_TransactionNo", "").matches("[0-9]{1,15}")) {
                    attempt.setRefundState(RefundState.SUCCEEDED);
                    attempt.setRefundResponseId(result.get("vnp_ResponseId"));
                    attempt.setRefundTransactionNo(result.get("vnp_TransactionNo"));
                } else if (("refund".equals(command) && Set.of("02", "03", "91", "95", "97").contains(responseCode))
                        || ("02".equals(result.get("vnp_TransactionType")) && "09".equals(providerStatus))) {
                    attempt.setRefundState(RefundState.FAILED);
                }
            }
            return response(order, attempt, requireAdmin(email), null);
        });
    }

    private Map<String, String> queryRequest(Snapshot data) {
        Map<String, String> request = base("querydr");
        request.put("vnp_RequestId", UUID.randomUUID().toString().replace("-", ""));
        request.put("vnp_TxnRef", data.reference());
        request.put("vnp_TransactionDate", data.createDate());
        request.put("vnp_CreateDate", PROVIDER_DATE.format(Instant.now()));
        request.put("vnp_IpAddr", properties.serverIp());
        request.put("vnp_OrderInfo", "Doi soat giao dich " + data.reference());
        return request;
    }
    private Map<String, String> base(String command) {
        Map<String, String> values = new HashMap<>();
        values.put("vnp_Version", "2.1.0"); values.put("vnp_Command", command);
        values.put("vnp_TmnCode", properties.merchantCode()); return values;
    }
    private void applyPayment(Order order, PaymentAttempt attempt, Map<String, String> params) {
        String status = params.get("vnp_TransactionStatus");
        if ("00".equals(params.get("vnp_ResponseCode")) && "00".equals(status)) {
            attempt.setState(PaymentState.SUCCEEDED); order.setPaid(true);
            attempt.setTransactionNo(params.get("vnp_TransactionNo"));
            attempt.setBankCode(params.get("vnp_BankCode")); attempt.setPayDate(params.get("vnp_PayDate"));
        } else if (Set.of("02", "09").contains(status)) { attempt.setState(PaymentState.FAILED); }
        attempt.setResponseCode(params.get("vnp_ResponseCode"));
    }
    private boolean validPaymentResult(Map<String, String> params) {
        return params.getOrDefault("vnp_ResponseCode", "").matches("[0-9]{2}")
                && Set.of("00", "01", "02", "04", "05", "06", "07", "09").contains(params.getOrDefault("vnp_TransactionStatus", ""))
                && (!"00".equals(params.get("vnp_TransactionStatus"))
                || params.getOrDefault("vnp_TransactionNo", "").matches("[0-9]{1,15}"));
    }
    private boolean matchesResult(Order order, PaymentAttempt attempt, Map<String, String> result, String command) {
        return command.equals(result.get("vnp_Command")) && properties.merchantCode().equals(result.get("vnp_TmnCode"))
                && attempt.getTransactionReference().equals(result.get("vnp_TxnRef")) && validAmount(order, attempt, result);
    }
    private boolean validAmount(Order order, PaymentAttempt attempt, Map<String, String> params) {
        return "VNPAY".equals(order.getPaymentMethod()) && attempt.getAmount().compareTo(order.getFinalAmount()) == 0
                && providerAmount(attempt.getAmount()).equals(params.get("vnp_Amount"))
                && (!params.containsKey("vnp_CurrCode") || "VND".equals(params.get("vnp_CurrCode")));
    }
    private PaymentStatusResponse response(Order order, PaymentAttempt attempt, User user, String message) {
        String state = attempt == null ? "NONE" : attempt.getState().name();
        String refund = attempt == null ? "NONE" : attempt.getRefundState().name();
        boolean canPay = user.getRole().getName() == RoleName.CUSTOMER && order.getUser() != null
                && order.getUser().getId().equals(user.getId()) && isAvailable()
                && order.getStatus() == OrderStatus.PENDING_CONFIRMATION && !order.isPaid()
                && "VNPAY".equals(order.getPaymentMethod()) && (attempt == null || attempt.getState() == PaymentState.FAILED
                || attempt.getState() == PaymentState.PENDING && attempt.getExpiresAt().isAfter(Instant.now()));
        if (message == null) message = switch (refund) {
            case "SUCCEEDED" -> "VNPay đã xác nhận hoàn tiền toàn phần. Có thể hủy đơn theo quy tắc hiện hành.";
            case "PENDING" -> "Hoàn tiền đang chờ xác nhận từ VNPay. Vui lòng đối soát.";
            case "FAILED" -> "VNPay chưa hoàn tiền thành công. Đơn vẫn giữ trạng thái thanh toán.";
            default -> switch (state) {
                case "SUCCEEDED" -> "VNPay đã xác minh thanh toán.";
                case "FAILED" -> "Giao dịch VNPay không thành công.";
                case "PENDING" -> "Chưa có kết quả thanh toán đã xác minh. Vui lòng đối soát.";
                default -> "Chưa tạo giao dịch VNPay.";
            };
        };
        return new PaymentStatusResponse(order.getId(), order.getPaymentMethod(), order.isPaid(), state, refund,
                isAvailable() && isAdmin(user) && refundEligible(order, attempt), canPay,
                attempt == null ? null : attempt.getExpiresAt(), message);
    }
    private boolean refundEligible(Order order, PaymentAttempt attempt) {
        return order.isPaid() && "VNPAY".equals(order.getPaymentMethod()) && REFUNDABLE_STATUSES.contains(order.getStatus())
                && attempt != null && attempt.getState() == PaymentState.SUCCEEDED
                && Set.of(RefundState.NONE, RefundState.FAILED).contains(attempt.getRefundState());
    }
    private PaymentStatusResponse getStatusWithMessage(Long id, String email, String message) {
        return transaction.execute(status -> { Order order = lockOrder(id); User user = actor(email);
            requireCanRead(order, user); return response(order, latest(id), user, message); });
    }
    private Order lockOrder(Long id) { return orderRepository.findByIdWithLock(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng.")); }
    private PaymentAttempt latest(Long id) { return paymentRepository.findFirstByOrderIdOrderByIdDesc(id).orElse(null); }
    private PaymentAttempt successful(Long id) { return paymentRepository.findFirstByOrderIdAndStateOrderByIdDesc(id, PaymentState.SUCCEEDED)
            .orElseThrow(() -> new IllegalStateException("Không có thanh toán VNPay đã xác minh để hoàn tiền.")); }
    private User actor(String email) { User user = userRepository.findByEmailIgnoreCase(email).orElseThrow(() -> new AccessDeniedException("Tài khoản không khả dụng."));
        if (!user.isActive()) throw new AccessDeniedException("Tài khoản đã bị vô hiệu hóa."); return user; }
    private User requireAdmin(String email) { User user = actor(email); if (!isAdmin(user)) throw new AccessDeniedException("Chỉ quản trị viên được hoàn tiền."); return user; }
    private boolean isAdmin(User user) { return user.getRole().getName() == RoleName.ADMIN || user.getRole().getName() == RoleName.SUPER_ADMIN; }
    private void requireOwner(Order order, User user) { if (order.getUser() == null || !order.getUser().getId().equals(user.getId())) throw new AccessDeniedException("Bạn không có quyền truy cập đơn hàng này."); }
    private void requireCanRead(Order order, User user) { if (!isAdmin(user) && user.getRole().getName() != RoleName.ONLINE_STAFF) requireOwner(order, user); }
    private void requireAvailable() { if (!isAvailable()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "VNPay chưa được cấu hình. Vui lòng chọn COD."); }
    private String providerAmount(BigDecimal amount) { return amount.movePointRight(2).toBigIntegerExact().toString(); }
    private String literalIp(String value) { return VnpayProperties.isLiteralIp(value) ? value : properties.serverIp(); }
    private String asciiReason(String reason) { String ascii = Normalizer.normalize(reason, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
            .replace('đ', 'd').replace('Đ', 'D').replaceAll("[^A-Za-z0-9 ]", " ").trim();
        return "Hoan tien " + (ascii.isEmpty() ? "don hang" : ascii.substring(0, Math.min(ascii.length(), 220))); }
    private Map<String, String> uniqueParameters(MultiValueMap<String, String> values) { if (values.size() > 50) return null;
        Map<String, String> params = new HashMap<>(); for (var entry : values.entrySet()) {
            if (entry.getValue().size() != 1 || entry.getValue().getFirst() == null || entry.getValue().getFirst().length() > 1024) return null;
            params.put(entry.getKey(), entry.getValue().getFirst()); } return params; }
    private Snapshot snapshot(PaymentAttempt attempt) { return attempt == null ? null : new Snapshot(attempt.getTransactionReference(), attempt.getAmount(),
            attempt.getProviderCreateDate(), attempt.getTransactionNo(), attempt.getRefundRequestId(), attempt.getRefundCreateDate(), attempt.getRefundCreateBy(), attempt.getRefundReason()); }
    private record Snapshot(String reference, BigDecimal amount, String createDate, String transactionNo,
                            String refundRequestId, String refundCreateDate, String refundCreateBy, String reason) {}
}
