package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.config.MomoProperties;
import com.m4n.backend.dto.request.*;
import com.m4n.backend.dto.response.PosMomoPaymentResponse;
import com.m4n.backend.entity.*;
import com.m4n.backend.exception.*;
import com.m4n.backend.repository.PosMomoPaymentRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.*;
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
import java.net.URI;
import java.time.Instant;
import java.util.*;

@Service
public class PosMomoPaymentServiceImpl implements PosMomoPaymentService {
    private static final Set<String> FINAL_FAILURES = Set.of("98", "99", "1001", "1002", "1003", "1004",
            "1005", "1006", "1007", "1017", "1026", "4001", "4002", "4100");
    private static final String REFUND_REASON = "Khong the hoan tat hoa don POS; hoan tien toan phan";
    private static final String CANCEL_REFUND_REASON = "Khach huy hoa don POS; hoan tien toan phan";
    private final PosMomoPaymentRepository payments;
    private final UserRepository users;
    private final PosService pos;
    private final MomoProperties properties;
    private final MomoGateway gateway;
    private final ObjectMapper json;
    private final TransactionTemplate transaction;
    private final PosCustomerService customers;

    public PosMomoPaymentServiceImpl(PosMomoPaymentRepository payments, UserRepository users, PosService pos,
            MomoProperties properties, MomoGateway gateway, ObjectMapper json, PlatformTransactionManager manager, PosCustomerService customers) {
        this.payments = payments; this.users = users; this.pos = pos; this.properties = properties;
        this.gateway = gateway; this.json = json; this.transaction = new TransactionTemplate(manager);
        this.customers = customers;
    }

    @Override public PosMomoPaymentResponse create(PosMomoPaymentRequest request, String email, String origin) {
        available();
        URI returnUri = URI.create(properties.redirectUrlFor(origin));
        String returnUrl = returnUri.getScheme() + "://" + returnUri.getRawAuthority() + "/pos";
        boolean[] allocated = { false };
        var payment = transaction.execute(tx -> {
            // Serialize repeated creation from this cashier, including requests racing on the same client id.
            User staff = users.findByEmailIgnoreCaseWithLock(email).orElseThrow(() -> new AccessDeniedException("Tài khoản không khả dụng."));
            requireStaff(staff);
            var existing = payments.findByIdWithLock(request.id()).orElse(null);
            if (existing != null) { owner(existing, staff); return response(existing); }
            var sale = request.sale();
            customers.validateCustomer(sale);
            if (!"MOMO".equals(sale.getPaymentMethod())) throw new IllegalArgumentException("Hóa đơn phải chọn MoMo.");
            var preview = pos.previewSale(PosSalePreviewRequest.builder().items(sale.getItems()).voucherCode(sale.getVoucherCode()).build());
            if (!preview.getStockWarnings().isEmpty()) throw new InsufficientStockException(String.join(" ", preview.getStockWarnings()));
            if (sale.getVoucherCode() != null && !sale.getVoucherCode().isBlank() && !preview.isVoucherApplied()) {
                throw new IllegalArgumentException(preview.getVoucherMessage());
            }
            BigDecimal amount = preview.getFinalAmount();
            if (amount.compareTo(BigDecimal.valueOf(1000)) < 0 || amount.compareTo(BigDecimal.valueOf(10_000_000)) > 0
                    || amount.stripTrailingZeros().scale() > 0) {
                throw new IllegalArgumentException("MoMo hỗ trợ thanh toán thẻ từ 1.000 đến 10.000.000 đồng.");
            }
            if (amount.compareTo(request.expectedAmount()) != 0) throw new IllegalStateException("Giá đã thay đổi. Vui lòng tải lại hóa đơn trước khi thanh toán.");
            var now = Instant.now();
            var created = payments.saveAndFlush(PosMomoPayment.builder().id(request.id()).staff(staff)
                    .bill(json.writeValueAsString(sale)).customerEmail(request.customerEmail().trim().toLowerCase(Locale.ROOT))
                    .amount(amount).state(PaymentState.PENDING).refundState(RefundState.NONE)
                    .createdAt(now).expiresAt(now.plusSeconds(900)).build());
            allocated[0] = true;
            return response(created);
        });
        if (!allocated[0]) return payment; // Unknown outcome must be reconciled, never create another charge.
        String url;
        try { url = gateway.createPos(payment.id(), payment.amount(), request.customerEmail().trim(), returnUrl); }
        catch (MomoCreateRejectedException ex) {
            if (FINAL_FAILURES.contains(ex.resultCode())) transaction.executeWithoutResult(tx -> {
                var p = lock(payment.id());
                if (p.getState() == PaymentState.PENDING) { p.setState(PaymentState.FAILED); p.setResponseCode(ex.resultCode()); }
            });
            throw ex;
        }
        return transaction.execute(tx -> {
            var p = lock(payment.id());
            if (p.getState() == PaymentState.PENDING) p.setPaymentUrl(url);
            return response(p);
        });
    }

    @Override public PosMomoPaymentResponse status(String id, String email) {
        return transaction.execute(tx -> { var p = lock(id); owner(p, actor(email)); return response(p); });
    }

    @Override public Page<PosMomoPaymentResponse> recent(String email, int page) {
        if (page < 0 || (long) page * 10 > Integer.MAX_VALUE) throw new IllegalArgumentException("Trang yêu cầu vượt giới hạn phân trang. Vui lòng chọn trang nhỏ hơn.");
        return transaction.execute(tx -> payments.findByStaffIdAndInvoiceIsNullOrderByCreatedAtDesc(
                actor(email).getId(), PageRequest.of(page, 10)).map(this::response));
    }

    @Override public PosMomoPaymentResponse reconcile(String id, String email) {
        available();
        var before = status(id, email);
        if ("PENDING".equals(before.status())) {
            Map<String, String> result = gateway.query(id, before.amount());
            transaction.executeWithoutResult(tx -> applyResult(lock(id), result));
        }
        settleOrRefund(id, true);
        return status(id, email);
    }

    @Override public PosMomoPaymentResponse cancel(String id, String email) {
        transaction.executeWithoutResult(tx -> {
            var p = lock(id);
            owner(p, actor(email));
            if (p.getInvoice() != null) throw new IllegalStateException("Hóa đơn đã được xuất. Không thể hủy phiên thanh toán đang chờ.");
            p.setCancelRequested(true);
            refundCancelledCharge(p);
        });
        // The cancellation survives a provider timeout; late IPNs still refund instead of settling.
        if (properties.available()) {
            try { return reconcile(id, email); }
            catch (PaymentProviderException ex) { /* Persisted status stays available for reconciliation. */ }
        }
        return status(id, email);
    }

    @Override public void processIpn(Map<String, String> result) {
        available();
        if (result == null || result.size() > 30 || result.values().stream().anyMatch(v -> v == null || v.length() > 2000)
                || !gateway.verifyIpn(result) || !Objects.equals(result.get("requestId"), result.get("orderId"))
                || !"".equals(result.get("extraData"))) throw new IllegalArgumentException("Thông báo MoMo không hợp lệ.");
        String id = result.get("orderId");
        if (!Objects.equals(result.get("orderInfo"), "Thanh toan POS " + id)) throw new IllegalArgumentException("Thông tin giao dịch POS không hợp lệ.");
        transaction.executeWithoutResult(tx -> applyResult(lock(id), result));
        settleOrRefund(id, false);
    }

    private void applyResult(PosMomoPayment p, Map<String, String> result) {
        if (!p.getId().equals(result.get("orderId")) || !properties.partnerCode().equals(result.get("partnerCode"))
                || !p.getAmount().toBigIntegerExact().toString().equals(result.get("amount"))) throw new PaymentProviderException();
        String code = result.get("resultCode");
        if (code == null || !code.matches("[0-9]{1,6}")) throw new PaymentProviderException();
        if (p.getState() == PaymentState.SUCCEEDED) return;
        if ("0".equals(code)) {
            if (!positiveTransaction(result.get("transId"))) throw new PaymentProviderException();
            p.setState(PaymentState.SUCCEEDED); p.setTransactionNo(result.get("transId"));
        } else if (p.getState() == PaymentState.PENDING && FINAL_FAILURES.contains(code)) p.setState(PaymentState.FAILED);
        p.setResponseCode(code);
        refundCancelledCharge(p);
    }

    private void refundCancelledCharge(PosMomoPayment p) {
        if (p.isCancelRequested() && p.getState() == PaymentState.SUCCEEDED
                && p.getInvoice() == null && p.getRefundState() == RefundState.NONE) allocateRefund(p);
    }

    private void settleOrRefund(String id, boolean retryFailedRefund) {
        try { pos.completeMomoSale(id); }
        catch (InsufficientStockException | ResourceNotFoundException | IllegalArgumentException | IllegalStateException ex) {
            // Settlement rolled back in its own service transaction: no invoice, stock or voucher usage survives.
            transaction.executeWithoutResult(tx -> {
                var p = lock(id);
                if (p.getState() == PaymentState.SUCCEEDED && p.getInvoice() == null && p.getRefundState() == RefundState.NONE) {
                    p.setFailureReason(ex.getMessage() == null ? "Không thể hoàn tất hóa đơn POS." : ex.getMessage().substring(0, Math.min(500, ex.getMessage().length())));
                    allocateRefund(p);
                }
            });
        }
        var snapshot = transaction.execute(tx -> {
            var p = lock(id);
            if (p.getInvoice() != null || p.getState() != PaymentState.SUCCEEDED) return null;
            if (p.getRefundState() == RefundState.FAILED && retryFailedRefund) allocateRefund(p);
            return p.getRefundState() == RefundState.PENDING
                    ? new Refund(p.getRefundReference(), p.getTransactionNo(), p.getAmount(),
                        p.isCancelRequested() ? CANCEL_REFUND_REASON : REFUND_REASON) : null;
        });
        if (snapshot == null) return;
        Map<String, String> result;
        try { result = gateway.refund(snapshot.id(), snapshot.transaction(), snapshot.amount(), snapshot.reason()); }
        catch (PaymentProviderException ex) { return; } // Durable pending refund remains recoverable using the same id.
        transaction.executeWithoutResult(tx -> {
            var p = lock(id);
            if (!snapshot.id().equals(p.getRefundReference()) || p.getRefundState() != RefundState.PENDING) return;
            String code = result.get("resultCode");
            p.setRefundResponseCode(code);
            if ("0".equals(code)) {
                if (!positiveTransaction(result.get("transId"))) throw new PaymentProviderException();
                p.setRefundState(RefundState.SUCCEEDED); p.setRefundTransactionNo(result.get("transId"));
            } else if (Set.of("1080", "1088").contains(code)) p.setRefundState(RefundState.FAILED);
        });
    }

    private void allocateRefund(PosMomoPayment p) {
        p.setRefundState(RefundState.PENDING);
        p.setRefundReference("pr-" + UUID.randomUUID().toString().replace("-", ""));
    }
    private PosMomoPayment lock(String id) {
        return payments.findByIdWithLock(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên MoMo POS."));
    }
    private User actor(String email) {
        User user = users.findByEmailIgnoreCase(email).orElseThrow(() -> new AccessDeniedException("Tài khoản không khả dụng."));
        requireStaff(user); return user;
    }
    private void requireStaff(User staff) {
        if (!staff.isActive() || !staff.isEmailVerified() || staff.getRole().getName() != RoleName.POS_STAFF) {
            throw new AccessDeniedException("Chỉ nhân viên POS đang hoạt động được thực hiện thanh toán tại quầy.");
        }
    }
    private void owner(PosMomoPayment payment, User staff) {
        if (!payment.getStaff().getId().equals(staff.getId())) throw new AccessDeniedException("Không có quyền truy cập giao dịch POS này.");
    }
    private void available() {
        if (!properties.available()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "MoMo chưa được cấu hình cho POS.");
    }
    private boolean positiveTransaction(String value) {
        if (value == null || !value.matches("[1-9][0-9]{0,18}")) return false;
        try { return Long.parseLong(value) > 0; } catch (NumberFormatException ex) { return false; }
    }
    private PosMomoPaymentResponse response(PosMomoPayment p) {
        String message = p.getInvoice() != null ? "Thanh toán thành công. Hóa đơn POS đã được xuất."
                : switch (p.getRefundState()) {
                    case SUCCEEDED -> "MoMo đã xác nhận hoàn tiền toàn phần. Không xuất hóa đơn; không trừ kho.";
                    case PENDING -> "Không thể xuất hóa đơn. Đang chờ MoMo xác nhận hoàn tiền; vui lòng kiểm tra lại.";
                    case FAILED -> "MoMo chưa hoàn tiền thành công. Vui lòng thử lại hoàn tiền hoặc liên hệ quản trị viên.";
                    default -> switch (p.getState()) {
                        case SUCCEEDED -> "Đã nhận thanh toán. Cần kiểm tra lại để hoàn tất hóa đơn; không thu tiền thêm.";
                        case FAILED -> "MoMo xác nhận giao dịch không thành công. Chưa xuất hóa đơn.";
                        default -> p.isCancelRequested()
                            ? "Đã hủy hóa đơn. Đang chờ xác minh giao dịch MoMo; nếu đã thu tiền, hệ thống sẽ yêu cầu hoàn tiền toàn phần."
                            : "Chưa có kết quả thanh toán đã xác minh. Không thu tiền thêm trước khi kiểm tra giao dịch.";
                    };
                };
        return new PosMomoPaymentResponse(p.getId(), p.getAmount(), p.getState().name(), p.getRefundState().name(),
                !p.isCancelRequested() && p.getState() == PaymentState.PENDING && p.getExpiresAt().isAfter(Instant.now()) ? p.getPaymentUrl() : null,
                p.getExpiresAt(), p.getInvoice() == null ? null : p.getInvoice().getId(), message, p.isCancelRequested());
    }
    private record Refund(String id, String transaction, BigDecimal amount, String reason) {}
}
