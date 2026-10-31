package com.m4n.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.m4n.backend.repository.SavedDeliveryAddressRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
class DeliveryAddressIntegrationTest {
    private static final String PATH = "/api/v1/profile/delivery-addresses";
    @Autowired WebApplicationContext context;
    @Autowired SavedDeliveryAddressRepository addresses;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    MockMvc http;
    final ObjectMapper json = new ObjectMapper();
    String owner;
    String other;

    @BeforeEach void setup() {
        http = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        String suffix = java.util.UUID.randomUUID().toString();
        owner = "address-owner-" + suffix + "@example.test";
        other = "address-other-" + suffix + "@example.test";
        var role = roles.findByName(RoleName.CUSTOMER).orElseThrow();
        for (String email : java.util.List.of(owner, other)) {
            users.saveAndFlush(User.builder().email(email).fullName("Address fixture")
                    .password("fixture-only").role(role).build());
        }
    }

    @Test void crudPersistsMultipleEntriesAndDetectsStaleVersion() throws Exception {
        long first = create("Người nhận A");
        long second = create("Người nhận B");
        http.perform(get(PATH).with(user(owner).roles("CUSTOMER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.items[0].id").value(second));
        http.perform(put(PATH + "/" + first).with(user(owner).roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content(payload("Tên đã sửa", 0)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.version").value(1));
        http.perform(put(PATH + "/" + first).with(user(owner).roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content(payload("Sửa cũ", 0)))
                .andExpect(status().isConflict());
        http.perform(delete(PATH + "/" + first).param("expectedVersion", "0").with(user(owner).roles("CUSTOMER")))
                .andExpect(status().isConflict());
        http.perform(delete(PATH + "/" + first).param("expectedVersion", "1").with(user(owner).roles("CUSTOMER")))
                .andExpect(status().isNoContent());
        assertThat(addresses.findById(first)).isEmpty();
        assertThat(addresses.findById(second)).isPresent();
    }

    @Test void foreignAccountCannotReadModifyOrDeleteAddress() throws Exception {
        long id = create("Người nhận riêng");
        http.perform(get(PATH).with(user(other).roles("CUSTOMER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        http.perform(put(PATH + "/" + id).with(user(other).roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content(payload("Thay đổi", 0)))
                .andExpect(status().isNotFound());
        http.perform(delete(PATH + "/" + id).param("expectedVersion", "0").with(user(other).roles("CUSTOMER")))
                .andExpect(status().isNotFound());
        assertThat(addresses.findById(id).orElseThrow().getCustomerName()).isEqualTo("Người nhận riêng");
    }

    @Test void rejectsUnauthenticatedRolesDisabledUsersAndInvalidInput() throws Exception {
        http.perform(get(PATH)).andExpect(status().isUnauthorized());
        http.perform(get(PATH).with(user("admin@m4n.vn").roles("ADMIN"))).andExpect(status().isForbidden());
        http.perform(get(PATH).with(user("locked@m4n.vn").roles("CUSTOMER"))).andExpect(status().isForbidden());
        http.perform(post(PATH).with(user(owner).roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.customerName").exists());
        http.perform(get(PATH).param("page", "-1").with(user(owner).roles("CUSTOMER")))
                .andExpect(status().isBadRequest());
        assertThat(addresses.findByUserId(users.findByEmailIgnoreCase(owner).orElseThrow().getId(),
                org.springframework.data.domain.PageRequest.of(0, 10))).isEmpty();
    }

    private long create(String name) throws Exception {
        var response = http.perform(post(PATH).with(user(owner).roles("CUSTOMER"))
                .contentType(MediaType.APPLICATION_JSON).content(payload(name, 0)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.version").value(0)).andReturn();
        return json.readTree(response.getResponse().getContentAsString()).get("id").asLong();
    }
    private String payload(String name, long version) throws Exception {
        return json.writeValueAsString(java.util.Map.of("customerName", name, "customerPhone", "0912345678",
                "customerEmail", "recipient@example.test", "shippingAddress", "12 Nguyễn Trãi, Hà Nội", "notes", "Gọi trước", "expectedVersion", version));
    }
}
