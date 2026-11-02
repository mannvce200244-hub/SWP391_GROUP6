package com.m4n.backend.service;

import com.m4n.backend.entity.Order;

/** Completes a customer cancellation after the caller has locked and validated payment/ownership. */
public interface PendingOrderCancellationService {
    Order complete(Order order, String reason);
}
