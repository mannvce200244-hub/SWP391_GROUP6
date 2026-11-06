package com.m4n.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MomoIpnRequest(
        @NotBlank @Size(max = 2000) String amount,
        @NotNull @Size(max = 2000) String extraData,
        @NotNull @Size(max = 2000) String message,
        @NotBlank @Size(max = 2000) String orderId,
        @NotBlank @Size(max = 2000) String orderInfo,
        @NotBlank @Size(max = 2000) String orderType,
        @NotBlank @Size(max = 2000) String partnerCode,
        @NotNull @Size(max = 2000) String payType,
        @NotBlank @Size(max = 2000) String requestId,
        @NotBlank @Size(max = 2000) String responseTime,
        @NotBlank @Size(max = 2000) String resultCode,
        @NotBlank @Size(max = 2000) String transId,
        @NotBlank @Size(max = 64) String signature) {

    public Map<String, String> signedFields() {
        return Map.ofEntries(Map.entry("amount", amount), Map.entry("extraData", extraData),
                Map.entry("message", message), Map.entry("orderId", orderId), Map.entry("orderInfo", orderInfo),
                Map.entry("orderType", orderType), Map.entry("partnerCode", partnerCode), Map.entry("payType", payType),
                Map.entry("requestId", requestId), Map.entry("responseTime", responseTime),
                Map.entry("resultCode", resultCode), Map.entry("transId", transId), Map.entry("signature", signature));
    }
}
