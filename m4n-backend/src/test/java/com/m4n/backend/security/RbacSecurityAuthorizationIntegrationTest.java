package com.m4n.backend.security;

import com.m4n.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class RbacSecurityAuthorizationIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    // ==========================================
    // 1. CUSTOMER ROLE ACCESS CONTROL
    // ==========================================

    @Test
    @DisplayName("CUSTOMER must be DENIED from all Admin endpoints (403 Forbidden)")
    @WithMockUser(username = "customer@m4n.vn", roles = {"CUSTOMER"})
    void customer_shouldBeDeniedFromAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/products")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/categories")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/artisans")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/craft-villages")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/vouchers/search")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/orders")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/admin/orders/1/ship")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/admin/orders/1/mark-delivered")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/users/1/orders")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/dashboard")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("CUSTOMER must be DENIED from POS endpoints (403 Forbidden)")
    @WithMockUser(username = "customer@m4n.vn", roles = {"CUSTOMER"})
    void customer_shouldBeDeniedFromPosEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/pos/products/search")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/pos/invoices")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("CUSTOMER must be DENIED from Inventory list endpoint (403 Forbidden)")
    @WithMockUser(username = "customer@m4n.vn", roles = {"CUSTOMER"})
    void customer_shouldBeDeniedFromInventory() throws Exception {
        mockMvc.perform(get("/api/v1/inventory")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("CUSTOMER is ALLOWED to browse public Catalog and check reviews")
    @WithMockUser(username = "customer@m4n.vn", roles = {"CUSTOMER"})
    void customer_shouldBeAllowedToBrowseCatalog() throws Exception {
        mockMvc.perform(get("/api/v1/products")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/categories")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/artisans")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/craft-villages")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "customer@m4n.vn", roles = {"CUSTOMER"})
    void checkoutPreviewRejectsOversizedPriceAndShippingVoucherCodes() throws Exception {
        for (String field : new String[]{"voucherCode", "shippingVoucherCode"}) {
            mockMvc.perform(post("/api/v1/checkout/preview")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"" + field + "\":\"" + "X".repeat(51) + "\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors." + field).exists());
        }
    }

    @Test
    @WithMockUser(username = "customer@m4n.vn", roles = {"CUSTOMER"})
    void directPurchaseRequiresPositiveProductAndQuantityOnPreviewAndOrder() throws Exception {
        for (String direct : new String[]{"{}", "{\"productId\":1,\"quantity\":0}",
                "{\"productId\":0,\"quantity\":1}", "{\"productId\":1,\"quantity\":-1}"}) {
            mockMvc.perform(post("/api/v1/checkout/preview").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"directPurchase\":" + direct + "}"))
                    .andExpect(status().isBadRequest());
            mockMvc.perform(post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"customerName":"Test customer","customerPhone":"0900000000",
                             "customerEmail":"test@example.test","shippingAddress":"Test address",
                             "paymentMethod":"COD","directPurchase":%s}
                            """.formatted(direct)))
                    .andExpect(status().isBadRequest());
        }
    }

    // ==========================================
    // 2. ONLINE_STAFF ROLE ACCESS CONTROL
    // ==========================================

    @Test
    @DisplayName("ONLINE_STAFF can view online orders but cannot browse back-office inventory")
    @WithMockUser(username = "staff@m4n.vn", roles = {"ONLINE_STAFF"})
    void onlineStaff_shouldBeAllowedToViewOrdersAndInventory() throws Exception {
        mockMvc.perform(get("/api/v1/admin/orders")).andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/orders/1/confirm-received")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/inventory")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/cart")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ONLINE_STAFF must be DENIED from Product/Category/Voucher/User Master CRUD (403 Forbidden)")
    @WithMockUser(username = "staff@m4n.vn", roles = {"ONLINE_STAFF"})
    void onlineStaff_shouldBeDeniedFromAdminMasterCrud() throws Exception {
        mockMvc.perform(get("/api/v1/admin/products")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/admin/products").contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/categories")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/artisans")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/craft-villages")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/vouchers/search")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/users/1/orders")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/dashboard")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ONLINE_STAFF must be DENIED from Stock Import (403 Forbidden)")
    @WithMockUser(username = "staff@m4n.vn", roles = {"ONLINE_STAFF"})
    void onlineStaff_shouldBeDeniedFromStockImport() throws Exception {
        mockMvc.perform(post("/api/v1/inventory/1/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":10}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ONLINE_STAFF must be DENIED from POS endpoints (403 Forbidden)")
    @WithMockUser(username = "staff@m4n.vn", roles = {"ONLINE_STAFF"})
    void onlineStaff_shouldBeDeniedFromPos() throws Exception {
        mockMvc.perform(get("/api/v1/pos/products/search")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/pos/sales").contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
    }

    // ==========================================
    // 3. POS_STAFF ROLE ACCESS CONTROL
    // ==========================================

    @Test
    @DisplayName("POS_STAFF can use POS product lookup but cannot browse back-office inventory")
    @WithMockUser(username = "pos@m4n.vn", roles = {"POS_STAFF"})
    void posStaff_shouldBeAllowedToUsePos() throws Exception {
        mockMvc.perform(get("/api/v1/pos/products/search")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/pos/invoices")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/inventory")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/cart")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POS_STAFF must be DENIED from Admin Online Orders (403 Forbidden)")
    @WithMockUser(username = "pos@m4n.vn", roles = {"POS_STAFF"})
    void posStaff_shouldBeDeniedFromAdminOrders() throws Exception {
        mockMvc.perform(get("/api/v1/admin/orders")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/admin/orders/1/ship")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/admin/orders/1/mark-delivered")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POS_STAFF must be DENIED from Stock Import (403 Forbidden)")
    @WithMockUser(username = "pos@m4n.vn", roles = {"POS_STAFF"})
    void posStaff_shouldBeDeniedFromStockImport() throws Exception {
        mockMvc.perform(post("/api/v1/inventory/1/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":10}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POS_STAFF must be DENIED from Admin Master CRUD (403 Forbidden)")
    @WithMockUser(username = "pos@m4n.vn", roles = {"POS_STAFF"})
    void posStaff_shouldBeDeniedFromAdminMasterCrud() throws Exception {
        mockMvc.perform(get("/api/v1/admin/products")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/categories")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/artisans")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/craft-villages")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/vouchers/search")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/users/1/orders")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/dashboard")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POS_STAFF must be DENIED from Staff Chat Queue (403 Forbidden)")
    @WithMockUser(username = "pos@m4n.vn", roles = {"POS_STAFF"})
    void posStaff_shouldBeDeniedFromSupportChatQueue() throws Exception {
        mockMvc.perform(get("/api/v1/chat/staff/conversations")).andExpect(status().isForbidden());
    }

    // ==========================================
    // 4. ADMIN ROLE ACCESS CONTROL
    // ==========================================

    @Test
    @DisplayName("ADMIN is ALLOWED to access Back Office modules")
    @WithMockUser(username = "admin@m4n.vn", roles = {"ADMIN"})
    void admin_shouldBeAllowedToAccessBackOffice() throws Exception {
        long customerId = userRepository.findByEmailIgnoreCase("customer@m4n.vn").orElseThrow().getId();

        mockMvc.perform(get("/api/v1/admin/products")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/categories")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/artisans")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/craft-villages")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/vouchers/search")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/orders")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/users/{id}/orders", customerId)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/dashboard")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/pos/invoices")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/pos/products/search")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/chat/staff/conversations")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/cart")).andExpect(status().isForbidden());
    }

    // ==========================================
    // 5. SUPER_ADMIN ROLE ACCESS CONTROL
    // ==========================================

    @Test
    @DisplayName("SUPER_ADMIN is ALLOWED to access all Back Office modules and User Management")
    @WithMockUser(username = "superadmin@m4n.vn", roles = {"SUPER_ADMIN"})
    void superAdmin_shouldBeAllowedToAccessAllModules() throws Exception {
        long customerId = userRepository.findByEmailIgnoreCase("customer@m4n.vn").orElseThrow().getId();

        mockMvc.perform(get("/api/v1/admin/products")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/categories")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/users/{id}/orders", customerId)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/dashboard")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/pos/invoices")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/pos/products/search")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/chat/staff/conversations")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/cart")).andExpect(status().isForbidden());
    }
}
