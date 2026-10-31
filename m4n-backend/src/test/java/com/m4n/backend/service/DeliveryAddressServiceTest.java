package com.m4n.backend.service;

import com.m4n.backend.dto.request.DeliveryAddressRequest;
import com.m4n.backend.dto.request.SaveDeliveryAddressRequest;
import com.m4n.backend.dto.response.AddressOptionResponse;
import com.m4n.backend.dto.response.ShippingOptionsResponse;
import com.m4n.backend.dto.response.UserResponse;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.SavedDeliveryAddress;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.exception.StaleVersionException;
import com.m4n.backend.repository.SavedDeliveryAddressRepository;
import com.m4n.backend.service.serviceImpl.DeliveryAddressServiceImpl;
import jakarta.validation.Validation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryAddressServiceTest {
    @Mock SavedDeliveryAddressRepository repository;
    @Mock ProfileService profiles;
    @Mock GhnService carrier;
    DeliveryAddressService service;

    @BeforeEach void setup() {
        service = new DeliveryAddressServiceImpl(repository, profiles, carrier);
        lenient().when(profiles.getCurrentProfile()).thenReturn(user(RoleName.CUSTOMER, true));
    }

    @Test void createsAddressForAuthenticatedOwnerAndTrimsFields() {
        when(carrier.getOptions()).thenReturn(new ShippingOptionsResponse(false, false, "LOCAL"));
        when(repository.saveAndFlush(any())).thenAnswer(call -> { SavedDeliveryAddress row = call.getArgument(0); row.setId(9L); row.setVersion(0L); return row; });
        var result = service.create(request(null, null));
        assertThat(result.customerName()).isEqualTo("Người nhận");
        assertThat(result.shippingAddress()).isEqualTo("12 Nguyễn Trãi, Hà Nội");
        assertThat(result.deliveryAddress()).isNull();
        var captured = org.mockito.ArgumentCaptor.forClass(SavedDeliveryAddress.class);
        verify(repository).saveAndFlush(captured.capture());
        assertThat(captured.getValue().getUserId()).isEqualTo(7L);
    }

    @Test void listIsPagedAndScopedToCurrentUser() {
        when(repository.findByUserId(eq(7L), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(row())));
        assertThat(service.list(0).items()).hasSize(1);
        var page = org.mockito.ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findByUserId(eq(7L), page.capture());
        assertThat(page.getValue().getPageSize()).isEqualTo(10);
        assertThat(page.getValue().getSort().getOrderFor("id").isDescending()).isTrue();
    }

    @Test void foreignAddressCannotBeUpdatedOrDeleted() {
        when(repository.findByIdAndUserId(9L, 7L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(9L, request(null, 2L))).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.delete(9L, 2L)).isInstanceOf(ResourceNotFoundException.class);
        verify(repository, never()).saveAndFlush(any());
        verify(repository, never()).delete(any());
    }

    @Test void staleOrMissingVersionCannotMutateAddress() {
        when(repository.findByIdAndUserId(9L, 7L)).thenReturn(Optional.of(row()));
        assertThatThrownBy(() -> service.update(9L, request(null, 1L))).isInstanceOf(StaleVersionException.class);
        assertThatThrownBy(() -> service.update(9L, request(null, null))).isInstanceOf(StaleVersionException.class);
        assertThatThrownBy(() -> service.delete(9L, 1L)).isInstanceOf(StaleVersionException.class);
        verify(repository, never()).saveAndFlush(any());
        verify(repository, never()).delete(any());
    }

    @Test void matchingVersionUpdatesAndDeletesOwnedAddress() {
        var row = row();
        when(repository.findByIdAndUserId(9L, 7L)).thenReturn(Optional.of(row));
        when(carrier.getOptions()).thenReturn(new ShippingOptionsResponse(false, false, "LOCAL"));
        when(repository.saveAndFlush(row)).thenReturn(row);
        assertThat(service.update(9L, request(null, 2L)).customerName()).isEqualTo("Người nhận");
        service.delete(9L, 2L);
        verify(repository).delete(row);
        verify(repository).flush();
    }

    @Test void inactiveAndNonCustomersCannotAccessAddressBook() {
        for (var user : List.of(user(RoleName.CUSTOMER, false), user(RoleName.ADMIN, true))) {
            when(profiles.getCurrentProfile()).thenReturn(user);
            assertThatThrownBy(() -> service.list(0)).isInstanceOf(ResponseStatusException.class);
            assertThatThrownBy(() -> service.create(request(null, null))).isInstanceOf(ResponseStatusException.class);
        }
        verifyNoInteractions(repository);
    }

    @Test void carrierCanonicalizesAddressAndRejectsWardFromDifferentProvince() {
        when(carrier.getOptions()).thenReturn(new ShippingOptionsResponse(true, true, "GHN"));
        when(carrier.provinces()).thenReturn(List.of(new AddressOptionResponse(1, "Hà Nội")));
        when(carrier.wards(1)).thenReturn(List.of(new AddressOptionResponse(2, "Phường A")));
        when(repository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        var result = service.create(request(new DeliveryAddressRequest(1, 2, " 12 Nguyễn Trãi "), null));
        assertThat(result.shippingAddress()).isEqualTo("12 Nguyễn Trãi, Phường A, Hà Nội");
        assertThat(result.deliveryAddress().wardId()).isEqualTo(2);
        assertThatThrownBy(() -> service.create(request(new DeliveryAddressRequest(1, 99, "12"), null)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("không thuộc");
        assertThatThrownBy(() -> service.create(request(null, null))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void requestValidatesEmailPhoneLimitsAndNestedAddress() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertThat(validator.validate(request(null, null))).isEmpty();
            var invalid = new SaveDeliveryAddressRequest(" ", "0123456789", "invalid", "a".repeat(301), "n".repeat(501),
                    new DeliveryAddressRequest(-1, null, " "), -1L);
            assertThat(validator.validate(invalid)).extracting(v -> v.getPropertyPath().toString())
                    .contains("customerName", "customerPhone", "customerEmail", "shippingAddress", "notes", "deliveryAddress.provinceId", "deliveryAddress.wardId", "deliveryAddress.streetAddress", "expectedVersion");
        }
    }

    private static SaveDeliveryAddressRequest request(DeliveryAddressRequest delivery, Long version) {
        return new SaveDeliveryAddressRequest(" Người nhận ", "0912345678", "test@example.com", " 12 Nguyễn Trãi, Hà Nội ", " Gọi trước ", delivery, version);
    }
    private static UserResponse user(RoleName role, boolean active) {
        return new UserResponse(7L, "test@example.com", "User", null, null, role, active, 0L);
    }
    private static SavedDeliveryAddress row() {
        var row = new SavedDeliveryAddress(); row.setId(9L); row.setUserId(7L); row.setVersion(2L); return row;
    }
}
