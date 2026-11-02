package com.m4n.backend.dto.response;

public record ShippingOptionsResponse(boolean carrierEnabled, boolean carrierAvailable, String addressModel) {}
