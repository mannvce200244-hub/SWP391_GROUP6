package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.config.GhnProperties;
import com.m4n.backend.dto.request.DeliveryAddressRequest;
import com.m4n.backend.dto.response.*;
import com.m4n.backend.service.*;
import com.m4n.backend.validation.ValidationPatterns;
import tools.jackson.databind.JsonNode;
import org.springframework.http.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import java.net.http.HttpClient;
import java.time.Duration;
import java.math.*;
import java.util.*;
import java.util.regex.*;

@Service
public class GhnServiceImpl implements GhnService {
    private final GhnProperties properties;
    private final RestClient client;
    private static final Pattern DIMENSIONS = Pattern.compile("(?i)^\\s*(\\d{1,3})\\s*[x×]\\s*(\\d{1,3})\\s*[x×]\\s*(\\d{1,3})\\s*(cm)?\\s*$");

    @org.springframework.beans.factory.annotation.Autowired
    public GhnServiceImpl(GhnProperties properties) {
        this(properties, createClient(properties));
    }
    GhnServiceImpl(GhnProperties properties, RestClient client) {
        this.properties = properties;
        this.client = client;
    }
    private static RestClient createClient(GhnProperties properties) {
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build());
        factory.setReadTimeout(Duration.ofSeconds(10));
        return RestClient.builder().baseUrl(properties.baseUrl()).requestFactory(factory).build();
    }

    @Override public ShippingOptionsResponse getOptions() {
        return new ShippingOptionsResponse(properties.enabled(), properties.available(), "PROVINCE_WARD");
    }
    @Override public List<AddressOptionResponse> provinces() {
        return options(get("/v3/master-data/province/all?offset=0&limit=200"), null);
    }
    @Override public List<AddressOptionResponse> wards(int provinceId) {
        if (provinceId <= 0) throw new IllegalArgumentException("Mã tỉnh/thành không hợp lệ.");
        return options(get("/v3/master-data/ward/all-by-province-id?province_id=" + provinceId + "&offset=0&limit=200"), provinceId);
    }

    @Override
    public CarrierShippingQuote quote(List<ShippingLine> lines, DeliveryAddressRequest address, String name, String phone) {
        requireAvailable();
        if (address == null || address.provinceId() == null || address.wardId() == null
                || address.streetAddress() == null || address.streetAddress().isBlank()) {
            throw new IllegalArgumentException("Vui lòng chọn tỉnh/thành, phường/xã và nhập số nhà, tên đường.");
        }
        if (name == null || name.isBlank() || phone == null || !phone.matches(ValidationPatterns.VIETNAMESE_MOBILE)) {
            throw new IllegalArgumentException("Vui lòng nhập tên và số điện thoại người nhận để tính phí GHN.");
        }
        String province = provinces().stream().filter(p -> p.id() == address.provinceId()).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Tỉnh/thành không hợp lệ.")).name();
        String ward = wards(address.provinceId()).stream().filter(w -> w.id() == address.wardId()).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Phường/xã không thuộc tỉnh/thành đã chọn.")).name();
        String fullAddress = address.streetAddress().trim() + ", " + ward + ", " + province;
        if (fullAddress.length() > 300) throw new IllegalArgumentException("Địa chỉ đầy đủ tối đa 300 ký tự.");
        long weight = 0, length = 0, width = 0, height = 0;
        List<Map<String, Object>> items = new ArrayList<>();
        for (ShippingLine line : lines) {
            var product = line.product();
            if (product == null || line.quantity() <= 0 || product.getBillableWeightKg() == null
                    || product.getBillableWeightKg().signum() <= 0) throw new IllegalArgumentException("Sản phẩm chưa có khối lượng tính cước.");
            Matcher dimensions = DIMENSIONS.matcher(Objects.toString(product.getDimensions(), ""));
            if (!dimensions.matches()) throw new IllegalArgumentException("Sản phẩm '" + product.getName()
                    + "' cần kích thước đóng gói theo mẫu dài x rộng x cao cm để tính phí GHN.");
            int l = Integer.parseInt(dimensions.group(1)), w = Integer.parseInt(dimensions.group(2)), h = Integer.parseInt(dimensions.group(3));
            if (l < 1 || w < 1 || h < 1 || l > 200 || w > 200 || h > 200) throw new IllegalArgumentException("GHN hỗ trợ mỗi chiều kiện từ 1 đến 200 cm.");
            int grams;
            try { grams = product.getBillableWeightKg().multiply(BigDecimal.valueOf(1000)).setScale(0, RoundingMode.CEILING).intValueExact(); }
            catch (ArithmeticException ex) { throw new IllegalArgumentException("Khối lượng kiện vượt giới hạn GHN."); }
            weight += (long) grams * line.quantity();
            length = Math.max(length, l); width = Math.max(width, w); height += (long) h * line.quantity();
            items.add(Map.of("name", product.getName(), "quantity", line.quantity(), "weight", grams,
                    "length", l, "width", w, "height", h));
        }
        if (weight <= 0 || weight > 50_000 || height > 200) {
            throw new IllegalArgumentException("Kiện hàng vượt giới hạn GHN. Vui lòng tách đơn hoặc liên hệ nhân viên.");
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("to_name", name.trim()); body.put("to_phone", phone); body.put("to_address", fullAddress);
        body.put("to_province_name", province); body.put("to_ward_name", ward); body.put("is_new_to_address", true);
        body.put("weight", weight); body.put("length", length); body.put("width", width); body.put("height", height);
        body.put("service_type_id", weight < 20_000 ? 2 : 5);
        body.put("payment_type_id", 1); body.put("required_note", "CHOXEMHANGKHONGTHU"); body.put("items", items);
        JsonNode data = post("/v2/shipping-order/preview", body);
        JsonNode fee = data.get("total_fee");
        if (fee == null || !fee.isIntegralNumber() || !fee.canConvertToLong() || fee.longValue() < 0) throw unavailable();
        return new CarrierShippingQuote(BigDecimal.valueOf(fee.longValue()), fullAddress);
    }

    private List<AddressOptionResponse> options(JsonNode data, Integer parent) {
        if (!data.isArray()) throw unavailable();
        List<AddressOptionResponse> result = new ArrayList<>();
        for (JsonNode row : data) {
            if (row.path("status").asInt() != 1) continue;
            if (!row.path("_id").canConvertToInt() || row.path("_id").asInt() <= 0
                    || !row.path("name").isTextual() || row.path("name").asText().isBlank()
                    || (parent != null && row.path("parent_id").asInt() != parent)) throw unavailable();
            result.add(new AddressOptionResponse(row.path("_id").asInt(), row.path("name").asText()));
        }
        result.sort(Comparator.comparing(AddressOptionResponse::name));
        return result;
    }

    private JsonNode get(String path) {
        requireAvailable();
        try { return data(client.get().uri(path).header("Token", properties.token())
                .header("ShopId", String.valueOf(properties.shopId())).retrieve().body(JsonNode.class)); }
        catch (org.springframework.web.client.RestClientException ex) { throw unavailable(); }
    }
    private JsonNode post(String path, Object body) {
        try { return data(client.post().uri(path).header("Token", properties.token())
                .header("ShopId", String.valueOf(properties.shopId())).contentType(MediaType.APPLICATION_JSON)
                .body(body).retrieve().body(JsonNode.class)); }
        catch (org.springframework.web.client.RestClientException ex) { throw unavailable(); }
    }
    private JsonNode data(JsonNode response) {
        if (response == null || response.path("code").asInt() != 200 || response.path("data").isNull()
                || response.path("data").isMissingNode()) throw unavailable();
        return response.get("data");
    }
    private void requireAvailable() { if (!properties.available()) throw unavailable(); }
    private ResponseStatusException unavailable() { return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
            "Chưa thể lấy địa chỉ hoặc phí GHN. Vui lòng kiểm tra cấu hình hoặc thử lại sau."); }
}
