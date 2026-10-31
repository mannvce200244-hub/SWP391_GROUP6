package com.m4n.backend.service;

import com.m4n.backend.dto.request.*;
import com.m4n.backend.entity.*;
import com.m4n.backend.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class PosCustomerIntegrationTest {
    @Autowired PosService pos;
    @Autowired PosCustomerService customers;
    @Autowired PosCustomerRepository profiles;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired InvoiceRepository invoices;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired InventoryRepository inventories;
    @Autowired WebApplicationContext context;
    User staff;
    Product product;
    String phone, suffix;

    @BeforeEach void setup() {
        suffix = UUID.randomUUID().toString().replace("-", "");
        phone = "08" + String.format("%08d", Integer.toUnsignedLong(suffix.hashCode()) % 100000000);
        staff = account(RoleName.POS_STAFF, "Cashier", null);
        var category = categories.saveAndFlush(Category.builder().code("PC-" + suffix).name("Customer fixture").build());
        product = products.saveAndFlush(Product.builder().code("PC-" + suffix).name("Instrument")
                .price(BigDecimal.valueOf(100000)).category(category).build());
        inventories.saveAndFlush(Inventory.builder().product(product).quantity(10).build());
        authenticate();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test void newPhoneCreatesOnlyProfileAndRepeatedSaleReusesItWithoutOverwritingName() {
        long userCount = users.count();
        var first = pos.finalizeSale(sale("Buyer", phone));
        assertThat(first.getCustomerId()).isNull();
        assertThat(first.getPosCustomerId()).isNotNull();
        assertThat(profiles.findByPhone(phone).orElseThrow().getFullName()).isEqualTo("Buyer");
        var second = pos.finalizeSale(sale("Different name", phone));
        assertThat(second.getPosCustomerId()).isEqualTo(first.getPosCustomerId());
        assertThat(second.getCustomerName()).isEqualTo("Buyer");
        assertThat(users.count()).isEqualTo(userCount);
        assertThat(invoices.findById(first.getInvoiceId()).orElseThrow().getPosCustomer()).isNotNull();
    }
    @Test void exactAccountPhoneLinksUserInsteadOfCreatingProfile() {
        var customer = account(RoleName.CUSTOMER, "Online buyer", phone);
        var result = pos.finalizeSale(sale("Typed name", phone));
        assertThat(result.getCustomerId()).isEqualTo(customer.getId());
        assertThat(result.getPosCustomerId()).isNull();
        assertThat(result.getCustomerName()).isEqualTo("Online buyer");
        assertThat(profiles.findByPhone(phone)).isEmpty();
    }
    @Test void duplicateAccountPhonesRequireExplicitChoiceAndStaffCannotBeSelected() {
        account(RoleName.CUSTOMER, "First", phone);
        var second = account(RoleName.CUSTOMER, "Second", phone);
        assertThatThrownBy(() -> pos.finalizeSale(sale("Buyer", phone))).isInstanceOf(IllegalArgumentException.class);
        var request = sale("Second", phone); request.setCustomerId(second.getId());
        assertThat(pos.finalizeSale(request).getCustomerId()).isEqualTo(second.getId());
        request.setCustomerId(staff.getId());
        assertThatThrownBy(() -> pos.finalizeSale(request)).isInstanceOf(com.m4n.backend.exception.ResourceNotFoundException.class);
    }
    @Test void nameOnlyRequiresSelectionButSelectedAccountWithoutPhoneWorks() {
        var customer = account(RoleName.CUSTOMER, "Same name", null);
        assertThatThrownBy(() -> pos.finalizeSale(sale("Same name", null))).isInstanceOf(IllegalArgumentException.class);
        var request = sale("Same name", null); request.setCustomerId(customer.getId());
        assertThat(pos.finalizeSale(request).getCustomerId()).isEqualTo(customer.getId());
    }
    @Test void selectedProfileCannotBeReassignedByChangingPhoneOrCombiningIds() {
        var result = pos.finalizeSale(sale("Buyer", phone));
        var request = sale("Buyer", phone); request.setPosCustomerId(result.getPosCustomerId());
        assertThat(pos.finalizeSale(request).getPosCustomerId()).isEqualTo(result.getPosCustomerId());
        request.setCustomerPhone("0900000000");
        assertThatThrownBy(() -> pos.finalizeSale(request)).isInstanceOf(IllegalArgumentException.class);
        request.setCustomerPhone(phone); request.setCustomerId(staff.getId());
        assertThatThrownBy(() -> pos.finalizeSale(request)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void guestRemainsGuestAndInvalidOrInsufficientSaleCreatesNoProfile() {
        var result = pos.finalizeSale(sale(null, null));
        assertThat(result.getCustomerId()).isNull(); assertThat(result.getPosCustomerId()).isNull();
        assertThatThrownBy(() -> pos.finalizeSale(sale("Buyer", "123"))).isInstanceOf(IllegalArgumentException.class);
        var request = sale("Buyer", phone); request.getItems().getFirst().setQuantity(100);
        assertThatThrownBy(() -> pos.finalizeSale(request)).isInstanceOf(com.m4n.backend.exception.InsufficientStockException.class);
        assertThat(profiles.findByPhone(phone)).isEmpty();
    }
    @Test void concurrentCashSalesCreateOneProfileEvenWithoutSharedInventoryLock() throws Exception {
        var secondProduct = products.saveAndFlush(Product.builder().code("PC2-" + suffix).name("Other instrument")
                .price(BigDecimal.valueOf(100000)).category(product.getCategory()).build());
        inventories.saveAndFlush(Inventory.builder().product(secondProduct).quantity(10).build());
        var gate = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var results = new ArrayList<Future<Long>>();
            for (Long productId : List.of(product.getId(), secondProduct.getId())) {
                results.add(pool.submit(() -> {
                    authenticate();
                    try {
                        gate.await();
                        var request = sale("Buyer", phone); request.getItems().getFirst().setProductId(productId);
                        return pos.finalizeSale(request).getPosCustomerId();
                    } finally { SecurityContextHolder.clearContext(); }
                }));
            }
            gate.countDown();
            assertThat(results.getFirst().get(20, TimeUnit.SECONDS)).isEqualTo(results.getLast().get(20, TimeUnit.SECONDS));
        }
        assertThat(inventories.findByProductId(product.getId()).orElseThrow().getQuantity()).isEqualTo(9);
        assertThat(inventories.findByProductId(secondProduct.getId()).orElseThrow().getQuantity()).isEqualTo(9);
    }
    @Test void searchIsBoundedAndTreatsSqlWildcardsAsLiteralText() {
        for (int i = 0; i < 12; i++) account(RoleName.CUSTOMER, "Bounded " + suffix, null);
        var special = account(RoleName.CUSTOMER, "Literal %_" + suffix, null);
        assertThat(customers.searchCustomers("Bounded " + suffix).accounts()).hasSize(10);
        assertThat(customers.searchCustomers("%_" + suffix).accounts()).extracting(c -> c.customerId()).containsExactly(special.getId());
        assertThatThrownBy(() -> customers.searchCustomers("a".repeat(151))).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void searchByNameOrPhoneExcludesStaffAndEndpointRequiresCashier() throws Exception {
        var customer = account(RoleName.CUSTOMER, "Buyer " + suffix, phone);
        pos.finalizeSale(sale("Showroom " + suffix, "07" + phone.substring(2)));
        assertThat(customers.searchCustomers(phone).accounts()).extracting(c -> c.customerId()).containsExactly(customer.getId());
        assertThat(customers.searchCustomers(suffix).profiles()).hasSize(1);
        assertThat(customers.searchCustomers(suffix).accounts()).hasSize(1);
        assertThat(customers.searchCustomers("%").accounts()).isEmpty();
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        SecurityContextHolder.clearContext();
        mvc.perform(get("/api/v1/pos/customers").param("q", phone)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/pos/customers").param("q", phone).with(user("customer").roles("CUSTOMER"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/pos/customers").param("q", phone).with(user(staff.getEmail()).roles("POS_STAFF")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.accounts[0].customerId").value(customer.getId()))
                .andExpect(jsonPath("$.accounts[0].email").doesNotExist()).andExpect(jsonPath("$.accounts[0].password").doesNotExist());
    }
    private PosSaleRequest sale(String name, String number) {
        return PosSaleRequest.builder().items(List.of(PosSaleItemRequest.builder().productId(product.getId()).quantity(1).build()))
                .paymentMethod("CASH").amountReceived(BigDecimal.valueOf(100000)).customerName(name).customerPhone(number).build();
    }
    private User account(RoleName role, String name, String number) {
        return users.saveAndFlush(User.builder().email(UUID.randomUUID() + "@example.test").password("fixture-only")
                .fullName(name).phone(number).role(roles.findByName(role).orElseThrow()).build());
    }
    private void authenticate() { SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(staff.getEmail(), null, List.of())); }
}
