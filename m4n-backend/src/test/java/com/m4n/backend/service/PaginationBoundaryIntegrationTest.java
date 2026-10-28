package com.m4n.backend.service;

import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class PaginationBoundaryIntegrationTest {
    @Autowired WebApplicationContext context;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired ChatService chat;
    MockMvc http;

    @BeforeEach void setup() {
        http = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @ParameterizedTest
    @CsvSource({
        "/api/v1/orders/me,CUSTOMER",
        "/api/v1/admin/orders,ADMIN",
        "/api/v1/admin/users,ADMIN",
        "/api/v1/notifications,CUSTOMER",
        "/api/v1/inventory,ADMIN",
        "/api/v1/inventory/movements,ADMIN",
        "/api/v1/inventory/documents,ADMIN",
        "/api/v1/pos/invoices,POS_STAFF",
        "/api/v1/pos/payments/momo,POS_STAFF",
        "/api/v1/profile/delivery-addresses,CUSTOMER",
        "/api/v1/chat/staff/conversations,ONLINE_STAFF"
    })
    void excessivePageIsClientErrorInsteadOfJpaServerError(String path, RoleName role) throws Exception {
        String email = "pagination-" + java.util.UUID.randomUUID() + "@example.test";
        users.saveAndFlush(User.builder().email(email).password("fixture-only").fullName("Pagination fixture")
                .role(roles.findByName(role).orElseThrow()).build());
        http.perform(get(path).param("page", "2147483647").with(user(email).roles(role.name())))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
        http.perform(get(path).param("page", "0").with(user(email).roles(role.name())))
                .andExpect(status().isOk());
    }

    @Test void messagePaginationValidatesTheEffectiveBoundedPageBeforeQueryingJpa() throws Exception {
        String email = "message-page-" + java.util.UUID.randomUUID() + "@example.test";
        users.saveAndFlush(User.builder().email(email).password("fixture-only").fullName("Message pagination fixture")
                .role(roles.findByName(RoleName.CUSTOMER).orElseThrow()).build());
        var conversation = chat.startMyCustomerConversation(email);
        String path = "/api/v1/chat/conversations/" + conversation.id() + "/messages";
        http.perform(get(path).param("page", "2147483647").with(user(email).roles("CUSTOMER")))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
        http.perform(get(path).param("page", "0").with(user(email).roles("CUSTOMER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content").isEmpty());
    }
}
