package com.m4n.backend.controller;

import com.m4n.backend.config.OpenApiConfig;
import com.m4n.backend.dto.response.CategorySummaryResponse;
import com.m4n.backend.dto.response.ProductDetailResponse;
import com.m4n.backend.dto.response.ProductMediaResponse;
import com.m4n.backend.exception.ProductNotFoundException;
import com.m4n.backend.security.CustomUserDetailsService;
import com.m4n.backend.security.JwtAccessDeniedHandler;
import com.m4n.backend.security.JwtAuthenticationEntryPoint;
import com.m4n.backend.security.JwtAuthenticationFilter;
import com.m4n.backend.security.JwtService;
import com.m4n.backend.security.SecurityConfig;
import com.m4n.backend.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
@Import({
        SecurityConfig.class,
        OpenApiConfig.class,
        JwtAuthenticationFilter.class,
        JwtService.class,
        JwtAuthenticationEntryPoint.class,
        JwtAccessDeniedHandler.class
})
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @MockitoBean
    private ProductService productService;

    @Test
    void shouldGetProductDetailSuccessfully() throws Exception {
        ProductDetailResponse response = new ProductDetailResponse(
                1L,
                "TRN-001",
                "Đàn Tranh 16 Dây",
                new BigDecimal("8500000"),
                "8.500.000 ₫",
                "Mô tả đàn tranh",
                new CategorySummaryResponse(1L, "DAY", "Nhạc cụ dây"),
                "Gỗ cẩm lai",
                "115 cm",
                "3 quãng tám",
                "Việt Nam",
                null,
                null,
                List.of(
                        new ProductMediaResponse(10L, "IMAGE", "/assets/images/prod-dan-tranh.jpg", "Ảnh chính", 1),
                        new ProductMediaResponse(11L, "IMAGE", "/assets/images/hero-dan-tranh.jpg", "Ảnh góc nghiêng", 2)
                ),
                "IN_STOCK",
                10
        );

        when(productService.getProductDetail(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/products/1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.code").value("TRN-001"))
                .andExpect(jsonPath("$.name").value("Đàn Tranh 16 Dây"))
                .andExpect(jsonPath("$.price").value(8500000))
                .andExpect(jsonPath("$.availability").value("IN_STOCK"))
                .andExpect(jsonPath("$.stockQuantity").value(10))
                .andExpect(jsonPath("$.media").isArray())
                .andExpect(jsonPath("$.media.length()").value(2))
                .andExpect(jsonPath("$.media[0].id").value(10))
                .andExpect(jsonPath("$.media[0].type").value("IMAGE"))
                .andExpect(jsonPath("$.media[0].url").value("/assets/images/prod-dan-tranh.jpg"))
                .andExpect(jsonPath("$.media[0].sortOrder").value(1))
                .andExpect(jsonPath("$.media[1].id").value(11))
                .andExpect(jsonPath("$.media[1].type").value("IMAGE"))
                .andExpect(jsonPath("$.media[1].url").value("/assets/images/hero-dan-tranh.jpg"))
                .andExpect(jsonPath("$.media[1].sortOrder").value(2));
    }

    @Test
    void shouldReturn404WhenProductNotFound() throws Exception {
        when(productService.getProductDetail(999L)).thenThrow(new ProductNotFoundException(999L));

        mockMvc.perform(get("/api/v1/products/999")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldListProductsPublicly() throws Exception {
        when(productService.listProducts(any(), any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/products")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
