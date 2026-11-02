package com.m4n.backend.dto.response;

import java.util.List;

public record PosCustomerSearchResponse(List<PosCustomerResponse> accounts, List<PosCustomerResponse> profiles) {}
