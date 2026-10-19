package com.m4n.backend.entity;

/**
 * Approved order lifecycle statuses defined by M4N business rules.
 */
public enum OrderStatus {
    PENDING_CONFIRMATION,
    CONFIRMED,
    OUT_OF_STOCK_WAITING,
    COMPLETED,
    CANCELLED
}
