package com.m4n.backend.service;

import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductPromotion;
import com.m4n.backend.repository.ProductPromotionRepository;
import com.m4n.backend.repository.ShippingSettingsRepository;
import com.m4n.backend.service.serviceImpl.ProductPricingServiceImpl;
import com.m4n.backend.service.serviceImpl.ShippingServiceImpl;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

class PricingCalculationTest {
    @Test
    void absentShippingSettingsReturnDisabledQuoteWithoutWritingDefaultConfiguration() {
        ShippingSettingsRepository repository = mock(ShippingSettingsRepository.class);
        when(repository.findById(1L)).thenReturn(Optional.empty());
        Product product = Product.builder().id(1L).name("No configured weight").build();

        ShippingQuote quote = new ShippingServiceImpl(repository, org.mockito.Mockito.mock(com.m4n.backend.service.GhnService.class))
                .calculateShipping(List.of(new ShippingLine(product, 1)), BigDecimal.TEN);

        assertThat(quote.baseShippingFee()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(quote.shippingFee()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(quote.freeShippingApplied()).isFalse();
        verify(repository).findById(1L);
        verifyNoMoreInteractions(repository);
    }

    @Test
    void zeroPercentageCannotRoundDownFractionalListedPrice() {
        ProductPromotionRepository repository = mock(ProductPromotionRepository.class);
        Product product = Product.builder().id(1L).price(new BigDecimal("100.40")).build();
        ProductPromotion zero = ProductPromotion.builder().id(1L).product(product)
                .discountRate(BigDecimal.ZERO).isActive(true).build();
        when(repository.findApplicablePromotions(any(), any())).thenReturn(List.of(zero));

        ProductPrice price = new ProductPricingServiceImpl(repository).resolvePrices(List.of(product)).get(1L);

        assertThat(price.chargedUnitPrice()).isEqualByComparingTo("100.40");
        assertThat(price.productDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(price.productPromotionId()).isNull();
    }
}
