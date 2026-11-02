package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.DeliveryAddressRequest;
import com.m4n.backend.dto.request.SaveDeliveryAddressRequest;
import com.m4n.backend.dto.response.*;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.SavedDeliveryAddress;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.exception.StaleVersionException;
import com.m4n.backend.repository.SavedDeliveryAddressRepository;
import com.m4n.backend.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class DeliveryAddressServiceImpl implements DeliveryAddressService {
    private final SavedDeliveryAddressRepository addresses;
    private final ProfileService profiles;
    private final GhnService carrier;

    @Override @Transactional(readOnly = true)
    public DeliveryAddressPageResponse list(int page) {
        if (page < 0 || (long) page * 10 > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Trang yêu cầu vượt giới hạn phân trang. Vui lòng chọn trang nhỏ hơn.");
        }
        var result = addresses.findByUserId(customerId(), PageRequest.of(page, 10, Sort.by("id").descending()));
        return new DeliveryAddressPageResponse(result.map(this::response).getContent(), page,
                result.getTotalPages(), result.getTotalElements());
    }

    @Override @Transactional
    public SavedDeliveryAddressResponse create(SaveDeliveryAddressRequest request) {
        var address = new SavedDeliveryAddress();
        address.setUserId(customerId());
        apply(address, request);
        return response(addresses.saveAndFlush(address));
    }

    @Override @Transactional
    public SavedDeliveryAddressResponse update(Long id, SaveDeliveryAddressRequest request) {
        var address = owned(id);
        checkVersion(address, request.expectedVersion());
        apply(address, request);
        return response(addresses.saveAndFlush(address));
    }

    @Override @Transactional
    public void delete(Long id, Long expectedVersion) {
        var address = owned(id);
        checkVersion(address, expectedVersion);
        addresses.delete(address);
        addresses.flush();
    }

    private Long customerId() {
        var user = profiles.getCurrentProfile();
        if (!user.isActive() || user.role() != RoleName.CUSTOMER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ khách hàng được quản lý địa chỉ nhận hàng.");
        }
        return user.id();
    }

    private SavedDeliveryAddress owned(Long id) {
        return addresses.findByIdAndUserId(id, customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ nhận hàng."));
    }

    private void checkVersion(SavedDeliveryAddress address, Long expectedVersion) {
        if (expectedVersion == null || !Objects.equals(address.getVersion(), expectedVersion)) {
            throw new StaleVersionException("Địa chỉ đã thay đổi. Vui lòng tải lại trước khi tiếp tục.");
        }
    }

    private void apply(SavedDeliveryAddress target, SaveDeliveryAddressRequest request) {
        target.setCustomerName(request.customerName().trim());
        target.setCustomerPhone(request.customerPhone().trim());
        target.setCustomerEmail(request.customerEmail().trim());
        target.setNotes(request.notes() == null ? null : request.notes().trim());
        var delivery = request.deliveryAddress();
        if (carrier.getOptions().carrierEnabled()) {
            if (delivery == null) throw new IllegalArgumentException("Vui lòng chọn tỉnh/thành, phường/xã và địa chỉ chi tiết.");
            String province = carrier.provinces().stream().filter(row -> row.id() == delivery.provinceId())
                    .findFirst().orElseThrow(() -> new IllegalArgumentException("Tỉnh/thành không hợp lệ.")).name();
            String ward = carrier.wards(delivery.provinceId()).stream().filter(row -> row.id() == delivery.wardId())
                    .findFirst().orElseThrow(() -> new IllegalArgumentException("Phường/xã không thuộc tỉnh/thành đã chọn.")).name();
            String fullAddress = delivery.streetAddress().trim() + ", " + ward + ", " + province;
            if (fullAddress.length() > 300) throw new IllegalArgumentException("Địa chỉ đầy đủ tối đa 300 ký tự.");
            target.setShippingAddress(fullAddress);
            target.setProvinceId(delivery.provinceId());
            target.setWardId(delivery.wardId());
            target.setStreetAddress(delivery.streetAddress().trim());
        } else {
            if (request.shippingAddress() == null || request.shippingAddress().isBlank()) {
                throw new IllegalArgumentException("Vui lòng nhập địa chỉ nhận hàng.");
            }
            target.setShippingAddress(request.shippingAddress().trim());
            target.setProvinceId(null);
            target.setWardId(null);
            target.setStreetAddress(null);
        }
    }

    private SavedDeliveryAddressResponse response(SavedDeliveryAddress address) {
        var delivery = address.getProvinceId() == null ? null : new DeliveryAddressRequest(address.getProvinceId(),
                address.getWardId(), address.getStreetAddress());
        return new SavedDeliveryAddressResponse(address.getId(), address.getCustomerName(), address.getCustomerPhone(),
                address.getCustomerEmail(), address.getShippingAddress(), address.getNotes(), delivery, address.getVersion());
    }
}
