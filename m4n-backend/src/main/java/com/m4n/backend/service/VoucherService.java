package com.m4n.backend.service;

import com.m4n.backend.dto.request.CreateVoucherRequest;
import com.m4n.backend.dto.request.UpdateVoucherRequest;
import com.m4n.backend.dto.response.VoucherResponse;
import com.m4n.backend.dto.response.VoucherValidationResponse;
import com.m4n.backend.entity.Voucher;

import java.math.BigDecimal;
import java.util.List;

public interface VoucherService {

    VoucherValidationResponse validateAndCalculate(String voucherCode, BigDecimal orderAmount);

    VoucherValidationResponse validateAndConsume(String voucherCode, BigDecimal orderAmount);

    void releaseUsage(String voucherCode);

    Voucher getActiveVoucherOrThrow(String voucherCode);

    List<VoucherResponse> getAllVouchers();

    VoucherResponse createVoucher(CreateVoucherRequest request);

    VoucherResponse updateVoucher(Long id, UpdateVoucherRequest request);

    void deleteVoucher(Long id);
}
