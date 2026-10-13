package com.m4n.backend.service;

import com.m4n.backend.dto.request.ApplyVoucherRequest;
import com.m4n.backend.dto.response.VoucherValidationResponse;
import com.m4n.backend.entity.Voucher;

import java.math.BigDecimal;

public interface VoucherService {

    VoucherValidationResponse validateAndCalculate(ApplyVoucherRequest request);

    VoucherValidationResponse validateAndCalculate(String voucherCode, BigDecimal orderAmount);

    Voucher getActiveVoucherOrThrow(String voucherCode);
}
