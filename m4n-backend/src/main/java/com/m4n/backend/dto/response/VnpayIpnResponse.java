package com.m4n.backend.dto.response;
import com.fasterxml.jackson.annotation.JsonProperty;
public record VnpayIpnResponse(@JsonProperty("RspCode") String rspCode,
                               @JsonProperty("Message") String message) {}
