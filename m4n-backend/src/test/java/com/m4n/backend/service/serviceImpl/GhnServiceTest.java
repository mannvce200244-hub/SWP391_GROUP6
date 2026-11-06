package com.m4n.backend.service.serviceImpl;
import com.m4n.backend.config.GhnProperties;
import com.m4n.backend.dto.request.DeliveryAddressRequest;
import com.m4n.backend.entity.Product;
import com.m4n.backend.service.ShippingLine;
import org.junit.jupiter.api.*;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.http.MediaType;
import java.math.BigDecimal;
import java.util.List;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;
import static org.assertj.core.api.Assertions.*;

class GhnServiceTest {
    GhnServiceImpl service; MockRestServiceServer server;
    @BeforeEach void setup() {
        var builder = RestClient.builder().baseUrl("https://dev-online-gateway.ghn.vn/shiip/public-api");
        server = MockRestServiceServer.bindTo(builder).build();
        service = new GhnServiceImpl(new GhnProperties(true, false, "test-token", 1), builder.build());
    }
    @Test void twoLevelAddressAndWeightAreValidatedAndRealProviderFeeReturned() {
        addresses();
        server.expect(requestTo("https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/preview"))
                .andExpect(header("Token", "test-token")).andExpect(header("ShopId", "1"))
                .andExpect(content().json("{\"weight\":2000,\"is_new_to_address\":true,\"to_province_name\":\"Province\",\"to_ward_name\":\"Ward\",\"service_type_id\":2}"))
                .andRespond(withSuccess("{\"code\":200,\"data\":{\"total_fee\":35000}}", MediaType.APPLICATION_JSON));
        var result = service.quote(lines(), new DeliveryAddressRequest(1, 2, "12 Street"), "Customer", "0900000000");
        assertThat(result.fee()).isEqualByComparingTo("35000");
        assertThat(result.fullAddress()).isEqualTo("12 Street, Ward, Province");
        server.verify();
    }
    @Test void foreignWardIsRejectedBeforeFeeRequest() {
        addresses();
        assertThatThrownBy(() -> service.quote(lines(), new DeliveryAddressRequest(1, 3, "12 Street"), "Customer", "0900000000"))
                .isInstanceOf(IllegalArgumentException.class);
        server.verify();
    }
    @Test void providerFailureNeverBecomesFreeShipping() {
        server.expect(anything()).andRespond(withServerError());
        assertThatThrownBy(() -> service.provinces()).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }
    @Test void missingTokenIsUnavailableWithoutCallingProvider() {
        var missing = new GhnServiceImpl(new GhnProperties(true, false, "", 0), RestClient.create());
        assertThat(missing.getOptions().carrierAvailable()).isFalse();
        assertThatThrownBy(missing::provinces).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        server.verify();
    }
    private void addresses() {
        server.expect(requestTo("https://dev-online-gateway.ghn.vn/shiip/public-api/v3/master-data/province/all?offset=0&limit=200"))
                .andRespond(withSuccess("{\"code\":200,\"data\":[{\"_id\":1,\"name\":\"Province\",\"status\":1}]}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://dev-online-gateway.ghn.vn/shiip/public-api/v3/master-data/ward/all-by-province-id?province_id=1&offset=0&limit=200"))
                .andRespond(withSuccess("{\"code\":200,\"data\":[{\"_id\":2,\"name\":\"Ward\",\"parent_id\":1,\"status\":1}]}", MediaType.APPLICATION_JSON));
    }
    private List<ShippingLine> lines() { return List.of(new ShippingLine(Product.builder().name("Instrument")
            .billableWeightKg(BigDecimal.ONE).dimensions("30 x 20 x 10 cm").build(), 2)); }
}
