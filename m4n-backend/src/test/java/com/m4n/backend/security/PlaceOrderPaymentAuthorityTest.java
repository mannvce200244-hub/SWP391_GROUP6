package com.m4n.backend.security;

import com.m4n.backend.dto.request.PlaceOrderRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import tools.jackson.databind.ObjectMapper;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class PlaceOrderPaymentAuthorityTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Customer-crafted payment authority fields never enter the place-order contract")
    void craftedPaymentAuthorityFieldsAreIgnoredByTheRequestContract() throws Exception {
        String payload = """
                {
                  "customerName": "Khách hàng",
                  "customerPhone": "0900000000",
                  "customerEmail": "customer@m4n.vn",
                  "shippingAddress": "Hà Nội",
                  "paymentMethod": "COD",
                  "isPaid": true,
                  "paymentStatus": "PAID",
                  "finalAmount": 1,
                  "discount": 999999999
                }
                """;

        PlaceOrderRequest request = objectMapper.readValue(payload, PlaceOrderRequest.class);

        assertThat(request.paymentMethod()).isEqualTo("COD");
        assertThat(Arrays.stream(PlaceOrderRequest.class.getRecordComponents())
                .map(component -> component.getName()))
                .doesNotContain("isPaid", "paymentStatus", "finalAmount", "discount");
    }
}
