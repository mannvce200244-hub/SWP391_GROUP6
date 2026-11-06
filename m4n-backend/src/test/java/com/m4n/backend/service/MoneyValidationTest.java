package com.m4n.backend.service;

import com.m4n.backend.validation.MoneyValidation;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.*;

class MoneyValidationTest {
    @Test void supportedCurrencyValuesIncludeZeroAndExactStorageMaximum() {
        for (String amount : new String[]{"0", "0.01", "100.00", "999999999999.99"}) {
            assertThatCode(() -> MoneyValidation.requireSupported(new BigDecimal(amount))).doesNotThrowAnyException();
        }
    }
    @Test void oversizedMultiplicationSumNegativeAndExcessPrecisionFailSafely() {
        BigDecimal maximum = new BigDecimal("999999999999.99");
        for (BigDecimal amount : new BigDecimal[]{maximum.multiply(BigDecimal.valueOf(2)), maximum.add(new BigDecimal("0.01")),
                new BigDecimal("-0.01"), new BigDecimal("0.001")}) {
            assertThatThrownBy(() -> MoneyValidation.requireSupported(amount)).isInstanceOf(IllegalArgumentException.class);
        }
    }
}
