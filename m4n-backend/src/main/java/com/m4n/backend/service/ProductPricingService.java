package com.m4n.backend.service;

import com.m4n.backend.entity.Product;
import java.util.List;
import java.util.Map;

public interface ProductPricingService {
    Map<Long, ProductPrice> resolvePrices(List<Product> products);
}
