package com.m4n.backend.controller;

import com.m4n.backend.config.OpenApiConfig;
import com.m4n.backend.dto.response.DashboardSummaryResponse;
import com.m4n.backend.dto.response.InventorySummaryResponse;
import com.m4n.backend.dto.response.RevenuePointResponse;
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
import java.util.List;

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

        when(dashboardService.getDashboardSummary("month", null)).thenReturn(response);

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
    @WithMockUser(roles = "ADMIN")
    void getDashboard_whenAdminWithYear_shouldPassYearToService() throws Exception {
        DashboardSummaryResponse response = DashboardSummaryResponse.builder()
                .period("quarter")
                .kpi(DashboardSummaryResponse.KpiSummary.builder()
                        .totalRevenue(new BigDecimal("10000000"))
                        .totalOrders(5L)
                        .completedOrders(2L)
                        .cancelledOrders(0L)
                        .build())
                .inventory(InventorySummaryResponse.builder()
                        .totalItems(50L)
                        .availableCount(3L)
                        .lowStockCount(0L)
                        .outOfStockCount(0L)
                        .build())
                .revenueTrend(Collections.emptyList())
                .topProducts(Collections.emptyList())
                .recentOrders(Collections.emptyList())
                .build();

        when(dashboardService.getDashboardSummary("quarter", 2024)).thenReturn(response);

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .param("period", "quarter")
                        .param("year", "2024")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period").value("quarter"))
                .andExpect(jsonPath("$.kpi.totalRevenue").value(10000000));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getDashboard_whenAdminWithYearPeriod_shouldReturn200AndTrend() throws Exception {
        DashboardSummaryResponse response = DashboardSummaryResponse.builder()
                .period("year")
                .kpi(DashboardSummaryResponse.KpiSummary.builder()
                        .totalRevenue(new BigDecimal("500000000"))
                        .totalOrders(100L)
                        .completedOrders(80L)
                        .cancelledOrders(5L)
                        .build())
                .inventory(InventorySummaryResponse.builder()
                        .totalItems(120L)
                        .availableCount(10L)
                        .lowStockCount(2L)
                        .outOfStockCount(1L)
                        .build())
                .revenueTrend(List.of(
                        new RevenuePointResponse("Năm 2025", new BigDecimal("180000000"), 40L),
                        new RevenuePointResponse("Năm 2026", new BigDecimal("200000000"), 50L)
                ))
                .topProducts(Collections.emptyList())
                .recentOrders(Collections.emptyList())
                .build();

        when(dashboardService.getDashboardSummary("year", null)).thenReturn(response);

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .param("period", "year")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period").value("year"))
                .andExpect(jsonPath("$.revenueTrend").isArray())
                .andExpect(jsonPath("$.revenueTrend[1].label").value("Năm 2026"))
                .andExpect(jsonPath("$.revenueTrend[1].revenue").value(200000000))
                .andExpect(jsonPath("$.revenueTrend[1].orderCount").value(50));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getDashboard_whenAdminWithQuarterPeriod_shouldReturn200AndTrend() throws Exception {
        DashboardSummaryResponse response = DashboardSummaryResponse.builder()
                .period("quarter")
                .kpi(DashboardSummaryResponse.KpiSummary.builder()
                        .totalRevenue(new BigDecimal("150000000"))
                        .totalOrders(35L)
                        .completedOrders(30L)
                        .cancelledOrders(2L)
                        .build())
                .inventory(InventorySummaryResponse.builder()
                        .totalItems(90L)
                        .availableCount(8L)
                        .lowStockCount(1L)
                        .outOfStockCount(0L)
                        .build())
                .revenueTrend(List.of(
                        new RevenuePointResponse("Quý 1", new BigDecimal("35000000"), 8L),
                        new RevenuePointResponse("Quý 2", new BigDecimal("45000000"), 10L),
                        new RevenuePointResponse("Quý 3", new BigDecimal("38000000"), 8L),
                        new RevenuePointResponse("Quý 4", new BigDecimal("32000000"), 9L)
                ))
                .topProducts(Collections.emptyList())
                .recentOrders(Collections.emptyList())
                .build();

        when(dashboardService.getDashboardSummary("quarter", 2026)).thenReturn(response);

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .param("period", "quarter")
                        .param("year", "2026")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period").value("quarter"))
                .andExpect(jsonPath("$.revenueTrend").isArray())
                .andExpect(jsonPath("$.revenueTrend[0].label").value("Quý 1"))
                .andExpect(jsonPath("$.revenueTrend[0].revenue").value(35000000))
                .andExpect(jsonPath("$.revenueTrend[0].orderCount").value(8));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getDashboard_whenAdminWithDayPeriod_shouldReturn200AndTrend() throws Exception {
        DashboardSummaryResponse response = DashboardSummaryResponse.builder()
                .period("day")
                .kpi(DashboardSummaryResponse.KpiSummary.builder()
                        .totalRevenue(new BigDecimal("30000000"))
                        .totalOrders(12L)
                        .completedOrders(10L)
                        .cancelledOrders(0L)
                        .build())
                .inventory(InventorySummaryResponse.builder()
                        .totalItems(75L)
                        .availableCount(4L)
                        .lowStockCount(1L)
                        .outOfStockCount(0L)
                        .build())
                .revenueTrend(List.of(
                        new RevenuePointResponse("10/11", new BigDecimal("4000000"), 2L),
                        new RevenuePointResponse("11/11", new BigDecimal("5500000"), 3L)
                ))
                .topProducts(Collections.emptyList())
                .recentOrders(Collections.emptyList())
                .build();

        when(dashboardService.getDashboardSummary("day", null)).thenReturn(response);

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .param("period", "day")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period").value("day"))
                .andExpect(jsonPath("$.revenueTrend").isArray())
                .andExpect(jsonPath("$.revenueTrend[1].label").value("11/11"))
                .andExpect(jsonPath("$.revenueTrend[1].revenue").value(5500000))
                .andExpect(jsonPath("$.revenueTrend[1].orderCount").value(3));
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
