package com.m4n.backend.controller;

import com.m4n.backend.config.OpenApiConfig;
import com.m4n.backend.dto.response.StaffDashboardSummaryResponse;
import com.m4n.backend.security.CustomUserDetailsService;
import com.m4n.backend.security.JwtAccessDeniedHandler;
import com.m4n.backend.security.JwtAuthenticationEntryPoint;
import com.m4n.backend.security.JwtAuthenticationFilter;
import com.m4n.backend.security.JwtService;
import com.m4n.backend.security.SecurityConfig;
import com.m4n.backend.service.StaffDashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StaffDashboardController.class)
@Import({
        SecurityConfig.class,
        OpenApiConfig.class,
        JwtAuthenticationFilter.class,
        JwtService.class,
        JwtAuthenticationEntryPoint.class,
        JwtAccessDeniedHandler.class
})
class StaffDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @MockitoBean
    private StaffDashboardService staffDashboardService;

    @Test
    @WithMockUser(username = "staff@m4n.vn", roles = "ONLINE_STAFF")
    void getDashboard_whenOnlineStaff_shouldReturnOperationalMetrics() throws Exception {
        StaffDashboardSummaryResponse response = StaffDashboardSummaryResponse.builder()
                .kpi(StaffDashboardSummaryResponse.KpiSummary.builder()
                        .pendingOrders(4L)
                        .confirmedOrders(3L)
                        .waitingConversations(2L)
                        .unreadMessages(5L)
                        .build())
                .orderTrend(List.of(StaffDashboardSummaryResponse.OrderTrendPoint.builder()
                        .date(LocalDate.of(2026, 9, 21))
                        .orderCount(2L)
                        .build()))
                .orderStatusCounts(Collections.emptyList())
                .build();

        when(staffDashboardService.getDashboardSummary("staff@m4n.vn", 7, null)).thenReturn(response);

        mockMvc.perform(get("/api/v1/staff/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kpi.pendingOrders").value(4))
                .andExpect(jsonPath("$.kpi.confirmedOrders").value(3))
                .andExpect(jsonPath("$.kpi.waitingConversations").value(2))
                .andExpect(jsonPath("$.kpi.unreadMessages").value(5))
                .andExpect(jsonPath("$.orderTrend[0].date").value("2026-09-21"))
                .andExpect(jsonPath("$.orderTrend[0].orderCount").value(2));
    }

    @Test
    @WithMockUser(username = "staff@m4n.vn", roles = "ONLINE_STAFF")
    void getDashboard_withTrendFilters_shouldDelegateValidatedValues() throws Exception {
        when(staffDashboardService.getDashboardSummary(
                "staff@m4n.vn",
                30,
                com.m4n.backend.entity.OrderStatus.COMPLETED
        )).thenReturn(StaffDashboardSummaryResponse.builder().build());

        mockMvc.perform(get("/api/v1/staff/dashboard")
                        .param("days", "30")
                        .param("status", "COMPLETED"))
                .andExpect(status().isOk());

        verify(staffDashboardService).getDashboardSummary(
                "staff@m4n.vn",
                30,
                com.m4n.backend.entity.OrderStatus.COMPLETED
        );
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getDashboard_whenAdmin_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/staff/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getDashboard_whenUnauthenticated_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/staff/dashboard"))
                .andExpect(status().isUnauthorized());
    }
}
