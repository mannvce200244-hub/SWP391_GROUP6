package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.config.MomoProperties;
import com.m4n.backend.dto.response.*;
import com.m4n.backend.entity.*;
import com.m4n.backend.exception.*;
import com.m4n.backend.repository.*;
import com.m4n.backend.service.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class MomoPaymentServiceImpl implements MomoPaymentService {
    private static final Set<OrderStatus> REFUNDABLE = Set.of(OrderStatus.PENDING_CONFIRMATION, OrderStatus.CONFIRMED,
            OrderStatus.OUT_OF_STOCK_WAITING, OrderStatus.CANCELLED);
    private static final Set<String> FINAL_FAILURES = Set.of("98", "99", "1001", "1002", "1003", "1004", "1005",
            "1006", "1007", "1017", "1026", "4001", "4002", "4100");
    private final OrderRepository orders;
    private final PaymentAttemptRepository attempts;
    private final UserRepository users;
    private final MomoProperties properties;
    private final MomoGateway gateway;
    private final PendingOrderCancellationService cancellation;
    private final PosMomoPaymentService posPayments;
    private final TransactionTemplate transaction;

    public MomoPaymentServiceImpl(OrderRepository orders, PaymentAttemptRepository attempts, UserRepository users,
            MomoProperties properties, MomoGateway gateway, PlatformTransactionManager manager,
            PendingOrderCancellationService cancellation, PosMomoPaymentService posPayments) {
        this.orders = orders; this.attempts = attempts; this.users = users; this.properties = properties;
        this.gateway = gateway; this.transaction = new TransactionTemplate(manager);
        this.cancellation = cancellation;
        this.posPayments = posPayments;
    }

    @Override public boolean isAvailable() { return properties.available(); }
    @Override public void validateAmount(BigDecimal amount) {
        if (amount == null || amount.stripTrailingZeros().scale() > 0 || amount.compareTo(BigDecimal.valueOf(1000)) < 0
                || amount.compareTo(BigDecimal.valueOf(10_000_000)) > 0) {
            throw new IllegalArgumentException("Thanh toán thẻ qua MoMo yêu cầu số tiền nguyên VND từ 1.000 đến 10.000.000 đồng.");
        }
    }

    @Override public PaymentUrlResponse create(Long id, String email, String origin) {
        available();
        String redirectUrl = properties.redirectUrlFor(origin);
        Snapshot snapshot = transaction.execute(status -> {
            Order order = lockOrder(id);
            User actor = actor(email);
            owner(order, actor);
            if (actor.getRole().getName() != RoleName.CUSTOMER || order.isPaid()
                    || order.getStatus() != OrderStatus.PENDING_CONFIRMATION) {
                throw new IllegalStateException("Đơn hàng không đủ điều kiện thanh toán MoMo.");
            }
            validateAmount(order.getFinalAmount());
            PaymentAttempt existing = latest(id);
            if (existing != null && existing.getState() != PaymentState.FAILED) {
                if (existing.getState() != PaymentState.PENDING || !existing.getExpiresAt().isAfter(Instant.now())
                        || existing.getPaymentUrl() == null) {
                    throw new IllegalStateException("Cần đối soát MoMo trước khi thanh toán tiếp. Không tạo giao dịch mới khi kết quả chưa rõ.");
                }
                return snapshot(existing);
            }
            Instant now = Instant.now();
            var created = attempts.saveAndFlush(PaymentAttempt.builder().order(order)
                    .transactionReference(UUID.randomUUID().toString().replace("-", ""))
                    .amount(order.getFinalAmount()).providerCreateDate(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
                        .withZone(ZoneOffset.UTC).format(now))
                    .expiresAt(now.plusSeconds(900)).state(PaymentState.PENDING).refundState(RefundState.NONE).build());
            return snapshot(created);
        });
        if (snapshot.url() != null) return new PaymentUrlResponse(snapshot.url(), snapshot.reference());
        // The pending attempt is committed before network I/O, including timeout/crash/IPN races.
        String url;
        try { url = gateway.create(snapshot.reference(), snapshot.amount(), id, snapshot.customerEmail(), redirectUrl); }
        catch (MomoCreateRejectedException ex) {
            if (!FINAL_FAILURES.contains(ex.resultCode())) throw ex;
            transaction.executeWithoutResult(status -> {
                lockOrder(id);
                PaymentAttempt attempt = attempts.findByTransactionReference(snapshot.reference()).orElseThrow();
                if (attempt.getState() == PaymentState.PENDING) {
                    attempt.setState(PaymentState.FAILED);
                    attempt.setResponseCode(ex.resultCode());
                }
            });
            throw new IllegalStateException("MoMo đã xác nhận không tạo được phiên thanh toán. Vui lòng kiểm tra trạng thái đơn trước khi thử lại.");
        }
        return transaction.execute(status -> {
            Order order = lockOrder(id);
            owner(order, actor(email));
            PaymentAttempt attempt = attempts.findByTransactionReference(snapshot.reference()).orElseThrow();
            if (order.isPaid() || order.getStatus() != OrderStatus.PENDING_CONFIRMATION || attempt.getState() != PaymentState.PENDING) {
                throw new IllegalStateException("Trạng thái thanh toán đã thay đổi. Vui lòng kiểm tra đơn hàng.");
            }
            attempt.setPaymentUrl(url);
            return new PaymentUrlResponse(url, snapshot.reference());
        });
    }

    @Override @Transactional(readOnly = true)
    public PaymentStatusResponse status(Long id, String email) {
        Order order = orders.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng."));
        requireMomo(order);
        User actor = actor(email); canRead(order, actor);
        return response(order, latest(id), actor, null);
    }

    @Override public PaymentStatusResponse reconcile(Long id, String email) {
        available();
        Snapshot snapshot = transaction.execute(status -> {
            Order order = lockOrder(id); canRead(order, actor(email)); return snapshot(latest(id));
        });
        if (snapshot == null) return status(id, email);
        Map<String, String> result;
        try { result = gateway.query(snapshot.reference(), snapshot.amount()); }
        catch (PaymentProviderException ex) { return statusWithMessage(id, email, "Chưa xác minh được MoMo. Vui lòng đối soát lại; không thanh toán thêm khi kết quả chưa rõ."); }
        return transaction.execute(status -> {
            Order order = lockOrder(id); User actor = actor(email); canRead(order, actor);
            PaymentAttempt attempt = attempts.findByTransactionReference(snapshot.reference()).orElseThrow();
            applyPayment(order, attempt, result);
            return response(order, latest(id), actor, "Kết quả được lấy từ API đối soát MoMo.");
        });
    }

    @Override
    public void processIpn(Map<String, String> result) {
        if (result != null && Objects.toString(result.get("orderId"), "").startsWith("pos-")) {
            posPayments.processIpn(result);
            return;
        }
        transaction.executeWithoutResult(status -> processOrderIpn(result));
    }

    private void processOrderIpn(Map<String, String> result) {
        available();
        if (result == null || result.size() > 30 || result.values().stream().anyMatch(v -> v == null || v.length() > 2000)
                || !gateway.verifyIpn(result) || !Objects.equals(result.get("requestId"), result.get("orderId"))
                || !"".equals(result.get("extraData"))) throw new IllegalArgumentException("Thông báo MoMo không hợp lệ.");
        Long id = attempts.findOrderIdByTransactionReference(result.get("orderId"))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch."));
        Order order = lockOrder(id);
        PaymentAttempt attempt = attempts.findByTransactionReference(result.get("orderId")).orElseThrow();
        if (!Objects.equals(result.get("orderInfo"), "Thanh toan don hang " + id)) {
            throw new IllegalArgumentException("Thông tin giao dịch không hợp lệ.");
        }
        applyPayment(order, attempt, result);
    }

    @Override public PaymentStatusResponse refund(Long id, String reason, String email) {
        available();
        Snapshot snapshot = transaction.execute(status -> {
            Order order = lockOrder(id); User actor = admin(email);
            PaymentAttempt attempt = successful(id);
            if (!refundEligible(order, attempt)) throw new IllegalStateException("Đơn hàng không đủ điều kiện hoàn tiền toàn phần.");
            if (reason == null || reason.isBlank() || reason.length() > 500) throw new IllegalArgumentException("Lý do hoàn tiền bắt buộc, tối đa 500 ký tự.");
            attempt.setRefundState(RefundState.PENDING);
            attempt.setRefundRequestId(UUID.randomUUID().toString().replace("-", ""));
            attempt.setRefundReason(reason.trim()); attempt.setRefundCreateBy("admin" + actor.getId());
            attempts.flush();
            return snapshot(attempt);
        });
        return executeRefund(id, email, snapshot);
    }

    @Override public PaymentStatusResponse reconcileRefund(Long id, String email) {
        available();
        Snapshot snapshot = transaction.execute(status -> {
            lockOrder(id); admin(email); PaymentAttempt attempt = successful(id);
            return attempt.getRefundState() == RefundState.PENDING ? snapshot(attempt) : null;
        });
        if (snapshot == null) return status(id, email);
        // Retry the identical persisted refund requestId/orderId; MoMo guarantees idempotency for final results.
        return executeRefund(id, email, snapshot);
    }

    @Override public PaymentStatusResponse refundCustomerCancellation(Long id, String reason, String email) {
        available();
        Snapshot snapshot = transaction.execute(status -> {
            Order order = lockOrder(id);
            User customer = actor(email);
            owner(order, customer);
            if (customer.getRole().getName() == RoleName.CUSTOMER && order.getStatus() == OrderStatus.CANCELLED) {
                PaymentAttempt completed = successful(id);
                if (completed.getRefundState() == RefundState.SUCCEEDED
                        && Objects.equals(completed.getRefundCreateBy(), "customer" + customer.getId())) return null;
            }
            if (customer.getRole().getName() != RoleName.CUSTOMER
                    || order.getStatus() != OrderStatus.PENDING_CONFIRMATION || !order.isPaid()) {
                throw new AccessDeniedException("Chỉ chủ đơn MoMo đã thanh toán và đang chờ xác nhận được yêu cầu hoàn tiền để hủy.");
            }
            if (reason != null && reason.length() > 500) throw new IllegalArgumentException("Lý do hủy tối đa 500 ký tự.");
            if (attempts.existsByOrderIdAndState(id, PaymentState.PENDING)) {
                throw new IllegalStateException("Vui lòng đối soát giao dịch thanh toán trước khi hủy.");
            }
            PaymentAttempt attempt = successful(id);
            if (attempt.getRefundState() == RefundState.PENDING) {
                // A customer confirming cancellation also adopts an already pending full refund.
                // Retain its request identifier so a retry cannot create a second refund.
                attempt.setRefundCreateBy("customer" + customer.getId());
            }
            if (attempt.getRefundState() == RefundState.SUCCEEDED) {
                cancellation.complete(order, reason);
                return null;
            }
            if (attempt.getRefundState() != RefundState.PENDING) {
                if (!refundEligible(order, attempt)) throw new IllegalStateException("Đơn hàng không đủ điều kiện hoàn tiền để hủy.");
                attempt.setRefundState(RefundState.PENDING);
                attempt.setRefundRequestId(UUID.randomUUID().toString().replace("-", ""));
                attempt.setRefundReason(reason == null || reason.isBlank() ? "Khách hàng yêu cầu hủy đơn" : reason.trim());
                attempt.setRefundCreateBy("customer" + customer.getId());
                attempts.flush();
            }
            return snapshot(attempt);
        });
        return snapshot == null ? status(id, email) : executeRefund(id, email, snapshot);
    }

    private PaymentStatusResponse executeRefund(Long id, String email, Snapshot snapshot) {
        Map<String, String> result;
        try { result = gateway.refund(snapshot.refundReference(), snapshot.transactionNo(), snapshot.amount(), snapshot.reason()); }
        catch (PaymentProviderException ex) { return statusWithMessage(id, email, "Hoàn tiền chưa có kết quả đã xác minh. Đối soát lại bằng cùng mã yêu cầu; chưa thể hủy đơn."); }
        return transaction.execute(status -> {
            Order order = lockOrder(id); User actor = actor(email);
            PaymentAttempt attempt = attempts.findByTransactionReference(snapshot.reference()).orElseThrow();
            if (!isAdmin(actor)) {
                owner(order, actor);
                if (actor.getRole().getName() != RoleName.CUSTOMER
                        || (order.getStatus() != OrderStatus.PENDING_CONFIRMATION
                            && !(order.getStatus() == OrderStatus.CANCELLED && attempt.getRefundState() == RefundState.SUCCEEDED
                                && Objects.equals(attempt.getRefundCreateBy(), "customer" + actor.getId())))) {
                    throw new AccessDeniedException("Không có quyền hoàn tiền để hủy đơn này.");
                }
            }
            if (!snapshot.refundReference().equals(attempt.getRefundRequestId())) throw new PaymentProviderException();
            if (attempt.getRefundState() == RefundState.PENDING) {
                String code = result.get("resultCode");
                attempt.setRefundResponseCode(code);
                if ("0".equals(code)) {
                    String refundTransaction = result.get("transId");
                    if (!positiveTransaction(refundTransaction)) throw new PaymentProviderException();
                    attempt.setRefundTransactionNo(refundTransaction);
                    attempt.setRefundState(RefundState.SUCCEEDED);
                } else if (Set.of("1080", "1088").contains(code)) attempt.setRefundState(RefundState.FAILED);
            }
            if (attempt.getRefundState() == RefundState.SUCCEEDED
                    && Objects.equals(attempt.getRefundCreateBy(), "customer" + order.getUser().getId())) {
                cancellation.complete(order, attempt.getRefundReason());
            }
            return response(order, attempt, actor, null);
        });
    }

    private void applyPayment(Order order, PaymentAttempt attempt, Map<String, String> result) {
        if (!attempt.getTransactionReference().equals(result.get("orderId"))
                || !attempt.getAmount().toBigIntegerExact().toString().equals(result.get("amount"))
                || attempt.getAmount().compareTo(order.getFinalAmount()) != 0
                || !properties.partnerCode().equals(result.get("partnerCode"))) throw new PaymentProviderException();
        String code = result.get("resultCode");
        if (code == null || !code.matches("[0-9]{1,6}")) throw new PaymentProviderException();
        if (attempt.getState() == PaymentState.SUCCEEDED) return;
        if ("0".equals(code)) {
            if (!positiveTransaction(result.get("transId"))) throw new PaymentProviderException();
            attempt.setState(PaymentState.SUCCEEDED); attempt.setTransactionNo(result.get("transId"));
            order.setPaid(true);
        } else if (attempt.getState() == PaymentState.PENDING && FINAL_FAILURES.contains(code)) {
            attempt.setState(PaymentState.FAILED);
        }
        attempt.setResponseCode(code);
    }

    private PaymentStatusResponse response(Order order, PaymentAttempt attempt, User actor, String message) {
        boolean canPay = isAvailable() && actor.getRole().getName() == RoleName.CUSTOMER
                && order.getUser().getId().equals(actor.getId()) && !order.isPaid()
                && order.getStatus() == OrderStatus.PENDING_CONFIRMATION
                && (attempt == null || attempt.getState() == PaymentState.FAILED
                    || attempt.getState() == PaymentState.PENDING && attempt.getPaymentUrl() != null && attempt.getExpiresAt().isAfter(Instant.now()));
        String payment = attempt == null ? "NONE" : attempt.getState().name();
        String refund = attempt == null ? "NONE" : attempt.getRefundState().name();
        if (message == null) message = switch (refund) {
            case "SUCCEEDED" -> order.getStatus() == OrderStatus.CANCELLED
                    ? "MoMo đã xác nhận hoàn tiền toàn phần. Đơn hàng đã được hủy."
                    : "MoMo đã xác nhận hoàn tiền toàn phần. Có thể hủy đơn theo quy tắc hiện hành.";
            case "PENDING" -> "Hoàn tiền đang chờ xác minh với MoMo. Chưa thể hủy đơn.";
            case "FAILED" -> "MoMo chưa hoàn tiền thành công. Đơn giữ trạng thái thanh toán.";
            default -> switch (payment) {
                case "SUCCEEDED" -> "MoMo đã xác minh thanh toán. Đơn vẫn cần nhân viên xử lý.";
                case "FAILED" -> "Giao dịch MoMo không thành công.";
                case "PENDING" -> "Chưa có kết quả MoMo đã xác minh. Vui lòng đối soát.";
                default -> "Chưa tạo giao dịch MoMo.";
            };
        };
        return new PaymentStatusResponse(order.getId(), "MOMO", order.isPaid(), payment, refund,
                isAvailable() && isAdmin(actor) && refundEligible(order, attempt), canPay,
                attempt == null ? null : attempt.getExpiresAt(), message);
    }
    private boolean refundEligible(Order order, PaymentAttempt attempt) {
        return order.isPaid() && REFUNDABLE.contains(order.getStatus()) && attempt != null
                && attempt.getAmount().compareTo(order.getFinalAmount()) == 0
                && attempt.getState() == PaymentState.SUCCEEDED && positiveTransaction(attempt.getTransactionNo())
                && Set.of(RefundState.NONE, RefundState.FAILED).contains(attempt.getRefundState());
    }
    private boolean positiveTransaction(String value) {
        if (value == null || !value.matches("[1-9][0-9]{0,18}")) return false;
        try { return Long.parseLong(value) > 0; }
        catch (NumberFormatException ex) { return false; }
    }
    private PaymentStatusResponse statusWithMessage(Long id, String email, String message) {
        return transaction.execute(status -> { Order order = lockOrder(id); User actor = actor(email);
            canRead(order, actor); return response(order, latest(id), actor, message); });
    }
    private Order lockOrder(Long id) {
        Order order = orders.findByIdWithLock(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng."));
        requireMomo(order); return order;
    }
    private void requireMomo(Order order) { if (!"MOMO".equals(order.getPaymentMethod())) throw new IllegalArgumentException("Đơn hàng không dùng MoMo."); }
    private User actor(String email) {
        return users.findByEmailIgnoreCase(email).filter(User::isActive).orElseThrow(() -> new AccessDeniedException("Tài khoản không khả dụng."));
    }
    private User admin(String email) { User actor = actor(email); if (!isAdmin(actor)) throw new AccessDeniedException("Chỉ quản trị viên được hoàn tiền."); return actor; }
    private boolean isAdmin(User actor) { return Set.of(RoleName.ADMIN, RoleName.SUPER_ADMIN).contains(actor.getRole().getName()); }
    private void owner(Order order, User actor) { if (order.getUser() == null || !order.getUser().getId().equals(actor.getId())) throw new AccessDeniedException("Bạn không có quyền truy cập đơn này."); }
    private void canRead(Order order, User actor) { if (!isAdmin(actor) && actor.getRole().getName() != RoleName.ONLINE_STAFF) owner(order, actor); }
    private PaymentAttempt latest(Long id) { return attempts.findFirstByOrderIdOrderByIdDesc(id).orElse(null); }
    private PaymentAttempt successful(Long id) { return attempts.findFirstByOrderIdAndStateOrderByIdDesc(id, PaymentState.SUCCEEDED)
            .orElseThrow(() -> new IllegalStateException("Không có giao dịch MoMo đã xác minh để hoàn tiền.")); }
    private void available() { if (!isAvailable()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "MoMo chưa được cấu hình. Vui lòng chọn COD."); }
    private Snapshot snapshot(PaymentAttempt attempt) { return attempt == null ? null : new Snapshot(attempt.getTransactionReference(), attempt.getAmount(),
            attempt.getPaymentUrl(), attempt.getTransactionNo(), attempt.getRefundRequestId(), attempt.getRefundReason(), attempt.getOrder().getCustomerEmail()); }
    private record Snapshot(String reference, BigDecimal amount, String url, String transactionNo, String refundReference, String reason, String customerEmail) {}
}
