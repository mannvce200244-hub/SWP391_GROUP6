package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.PosSaleRequest;
import com.m4n.backend.dto.response.*;
import com.m4n.backend.entity.*;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.PosCustomerRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.PosCustomerService;
import com.m4n.backend.validation.ValidationPatterns;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PosCustomerServiceImpl implements PosCustomerService {
    private final UserRepository users;
    private final PosCustomerRepository customers;

    @Override @Transactional(readOnly = true)
    public PosCustomerSearchResponse searchCustomers(String query) {
        String term = clean(query);
        if (term == null || term.length() < 2) return new PosCustomerSearchResponse(List.of(), List.of());
        if (term.length() > 150) throw new IllegalArgumentException("Từ khóa khách hàng tối đa 150 ký tự.");
        var accounts = users.findAll((root, criteria, cb) -> cb.and(
                cb.equal(root.get("role").get("name"), RoleName.CUSTOMER),
                cb.or(cb.like(cb.lower(root.get("fullName")), contains(term), '\\'),
                        cb.like(root.get("phone"), contains(term), '\\'))), PageRequest.of(0, 10, Sort.by("id")));
        var profiles = customers.findByFullNameContainingIgnoreCaseOrPhoneContainingOrderByIdAsc(term, term, PageRequest.of(0, 10));
        return new PosCustomerSearchResponse(accounts.stream().map(u -> new PosCustomerResponse(u.getId(), null, u.getFullName(), u.getPhone())).toList(),
                profiles.stream().map(p -> new PosCustomerResponse(null, p.getId(), p.getFullName(), p.getPhone())).toList());
    }

    @Override @Transactional(readOnly = true)
    public void validateCustomer(PosSaleRequest request) {
        resolveCustomer(request);
    }

    @Override @Transactional(propagation = Propagation.MANDATORY)
    public void attachCustomer(Invoice invoice, PosSaleRequest request) {
        CustomerSelection selected = resolveCustomer(request);
        if (selected == null) return;
        PosCustomer profile = selected.profile();
        if (selected.account() == null && profile == null) {
            customers.insertIfAbsent(selected.name(), selected.phone());
            profile = customers.findByPhone(selected.phone()).orElseThrow();
        }
        invoice.setCustomer(selected.account());
        invoice.setPosCustomer(profile);
        invoice.setCustomerName(selected.account() != null ? selected.account().getFullName()
                : profile.getFullName() == null ? "Khách tại quầy" : profile.getFullName());
        invoice.setCustomerPhone(selected.account() != null ? selected.account().getPhone() : profile.getPhone());
    }

    private CustomerSelection resolveCustomer(PosSaleRequest request) {
        String name = clean(request.getCustomerName());
        String phone = clean(request.getCustomerPhone());
        if (name != null && name.length() > 150) throw new IllegalArgumentException("Tên khách hàng tối đa 150 ký tự.");
        if (phone != null && !phone.matches(ValidationPatterns.VIETNAMESE_MOBILE)) {
            throw new IllegalArgumentException(ValidationPatterns.VIETNAMESE_MOBILE_MESSAGE);
        }
        if (request.getCustomerId() != null && request.getPosCustomerId() != null) {
            throw new IllegalArgumentException("Vui lòng chỉ chọn một khách hàng.");
        }
        if (request.getCustomerId() != null) {
            User account = users.findById(request.getCustomerId()).filter(u -> u.getRole().getName() == RoleName.CUSTOMER)
                    .orElseThrow(() -> new ResourceNotFoundException("Tài khoản khách hàng không tồn tại."));
            requireMatchingPhone(phone, account.getPhone());
            return new CustomerSelection(account, null, account.getFullName(), account.getPhone());
        }
        if (request.getPosCustomerId() != null) {
            PosCustomer profile = customers.findById(request.getPosCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ khách hàng không tồn tại."));
            requireMatchingPhone(phone, profile.getPhone());
            return new CustomerSelection(null, profile, profile.getFullName(), profile.getPhone());
        }
        if (phone == null) {
            if (name != null) throw new IllegalArgumentException("Chọn khách đã có hoặc nhập SĐT để lưu hồ sơ khách mới.");
            return null;
        }
        var accounts = users.findByRole_NameAndPhoneOrderByIdAsc(RoleName.CUSTOMER, phone, PageRequest.of(0, 2));
        if (accounts.size() > 1) throw new IllegalArgumentException("SĐT khớp nhiều tài khoản. Vui lòng chọn đúng khách hàng từ kết quả tìm kiếm.");
        if (accounts.size() == 1) {
            User account = accounts.getFirst();
            return new CustomerSelection(account, null, account.getFullName(), account.getPhone());
        }
        return new CustomerSelection(null, customers.findByPhone(phone).orElse(null), name, phone);
    }

    private void requireMatchingPhone(String supplied, String stored) {
        if (supplied != null && !supplied.equals(stored)) throw new IllegalArgumentException("SĐT đã thay đổi. Vui lòng chọn lại khách hàng.");
    }

    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    private String contains(String term) {
        return "%" + term.toLowerCase(java.util.Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }

    private record CustomerSelection(User account, PosCustomer profile, String name, String phone) {}
}
