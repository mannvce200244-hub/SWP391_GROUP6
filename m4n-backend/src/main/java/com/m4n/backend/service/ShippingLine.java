package com.m4n.backend.service;

import com.m4n.backend.entity.Product;

public record ShippingLine(Product product, int quantity) {}
