package com.m4n.backend.service;

import com.m4n.backend.config.VnpayProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VnpayPropertiesTest {

    @Test
    void rejectsNonLiteralAndInvalidIpAddressesWithoutResolvingHostnames() {
        assertThat(VnpayProperties.isLiteralIp("127.0.0.1")).isTrue();
        assertThat(VnpayProperties.isLiteralIp("2001:db8::1")).isTrue();
        assertThat(VnpayProperties.isLiteralIp("aaa")).isFalse();
        assertThat(VnpayProperties.isLiteralIp("999.1.1.1")).isFalse();
        assertThat(VnpayProperties.isLiteralIp("localhost")).isFalse();
        assertThat(VnpayProperties.isLiteralIp("::::")).isFalse();
    }

    @Test
    void incompleteEnabledConfigurationFailsAndDisabledConfigurationIsUnavailable() {
        assertThatThrownBy(() -> new VnpayProperties(true, "", "", "", "", ""))
                .isInstanceOf(IllegalStateException.class);
        assertThat(new VnpayProperties(false, "", "", "", "", "").isAvailable()).isFalse();
    }

    @Test
    void rejectsReturnUrlsThatLeaveNoRoomForOwnedOrderId() {
        assertThatThrownBy(() -> new VnpayProperties(true, "TEST1234", "test-secret",
                "https://m4n.test/" + "a".repeat(230), "https://m4n.test/ipn", "127.0.0.1"))
                .isInstanceOf(IllegalStateException.class);
    }
}
