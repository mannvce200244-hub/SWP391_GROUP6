package com.m4n.backend.controller;

import com.m4n.backend.config.OpenApiConfig;
import com.m4n.backend.dto.response.DashboardSummaryResponse;
import com.m4n.backend.dto.response.InventorySummaryResponse;
import com.m4n.backend.security.CustomUserDetailsService;
import com.m4n.backend.security.JwtAccessDeniedHandler;
import com.m4n.backend.security.JwtAuthenticationEntryPoint;
import com.m4n.backend.security.JwtAuthenticationFilter;
import com.m4n.backend.security.JwtService;
import com.m4n.backend.security.SecurityConfig;
import com.m4n.backend.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DashboardController.class)
@Import({
        SecurityConfig.class,
        OpenApiConfig.class,
        JwtAuthenticationFilter.class,
        JwtService.class,
        JwtAuthenticationEntryPoint.class,
        JwtAccessDeniedHandler.class
})
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @MockitoBean
    private DashboardService dashboardService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void getDashboard_whenAdmin_shouldReturn200AndMetrics() throws Exception {
        DashboardSummaryResponse response = DashboardSummaryResponse.builder()
                .period("month")
                .kpi(DashboardSummaryResponse.KpiSummary.builder()
                        .totalRevenue(new BigDecimal("21150000"))
                        .totalOrders(7L)
                        .completedOrders(3L)
                        .cancelledOrders(1L)
                        .build())
                .inventory(InventorySummaryResponse.builder()
                        .totalItems(75L)
                        .availableCount(4L)
                        .lowStockCount(1L)
                        .outOfStockCount(0L)
                        .build())
                .revenueTrend(Collections.emptyList())
                .topProducts(Collections.emptyList())
                .recentOrders(Collections.emptyList())
                .build();

        when(dashboardService.getDashboardSummary("month")).thenReturn(response);

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .param("period", "month")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period").value("month"))
                .andExpect(jsonPath("$.kpi.totalRevenue").value(21150000))
                .andExpect(jsonPath("$.kpi.totalOrders").value(7))
                .andExpect(jsonPath("$.kpi.completedOrders").value(3))
                .andExpect(jsonPath("$.kpi.cancelledOrders").value(1))
                .andExpect(jsonPath("$.inventory.totalItems").value(75));
    }

    @Test
    void getDashboard_whenUnauthenticated_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getDashboard_whenCustomer_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
