package com.m4n.backend.dto.request;

import jakarta.validation.constraints.Size;

/**
 * Optional cancellation reason supplied by Customer or Staff/Admin when cancelling an order.
 */
public record CancelOrderRequest(
        @Size(max = 500, message = "Lý do hủy đơn không được vượt quá 500 ký tự")
        String reason
) {}
