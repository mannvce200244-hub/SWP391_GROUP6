package com.m4n.backend.dto.response;

public record PosCustomerResponse(Long customerId, Long posCustomerId, String fullName, String phone) {}
