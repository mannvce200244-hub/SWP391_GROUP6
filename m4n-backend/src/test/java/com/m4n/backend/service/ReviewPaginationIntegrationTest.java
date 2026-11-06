package com.m4n.backend.service;

import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.Review;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.CategoryRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.ReviewRepository;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class ReviewPaginationIntegrationTest {

    @Autowired private ReviewService service;
    @Autowired private ReviewRepository reviews;
    @Autowired private OrderRepository orders;
    @Autowired private ProductRepository products;
    @Autowired private UserRepository users;
    @Autowired private RoleRepository roles;
    @Autowired private CategoryRepository categories;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private WebApplicationContext context;
    private MockMvc mvc;
    private Product product;
    private Product emptyProduct;
    private Review first;
    private Review second;
    private Category category;

    @BeforeEach
    void createIsolatedRollbackFixtures() {
        String suffix = UUID.randomUUID().toString();
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        category = categories.saveAndFlush(Category.builder().code("REV-CAT-" + suffix).name("Review fixture").build());
        User user = users.saveAndFlush(User.builder().email("reviews-" + suffix + "@m4n.test")
                .fullName("Review fixture").password("encoded-test-only").isActive(true)
                .role(roles.findByName(RoleName.CUSTOMER).orElseThrow()).build());
        product = product("REV-" + suffix);
        emptyProduct = product("EMPTY-" + suffix);
        Order one = order(user, "REVIEW-1-" + suffix);
        Order two = order(user, "REVIEW-2-" + suffix);
        first = reviews.saveAndFlush(Review.builder().product(product).user(user).order(one).rating(1).comment("First").build());
        second = reviews.saveAndFlush(Review.builder().product(product).user(user).order(two).rating(5).comment("Second").build());
        Instant sameTimestamp = Instant.parse("2026-10-10T00:00:00Z");
        first.setCreatedAt(sameTimestamp);
        second.setCreatedAt(sameTimestamp);
        jdbc.update("UPDATE reviews SET created_at = ? WHERE id IN (?, ?)",
                java.sql.Timestamp.from(sameTimestamp), first.getId(), second.getId());
        reviews.flush();
    }

    @Test
    void pagesUseGlobalAverageAndStableRatingTieBreakWithoutOtherProducts() {
        Product other = product("OTHER-" + UUID.randomUUID());
        reviews.saveAndFlush(Review.builder().product(other).user(first.getUser()).order(first.getOrder()).rating(5).build());
        var page = service.getProductReviewPage(product.getId(), PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createdAt")));
        var next = service.getProductReviewPage(product.getId(), PageRequest.of(1, 1, Sort.by(Sort.Direction.DESC, "createdAt")));
        assertThat(page.content()).hasSize(1);
        assertThat(page.totalElements()).isEqualTo(2);
        assertThat(page.totalPages()).isEqualTo(2);
        assertThat(page.averageRating()).isEqualTo(3.0);
        assertThat(next.averageRating()).isEqualTo(3.0);
        assertThat(page.content().getFirst().id()).isEqualTo(second.getId());
        assertThat(next.content().getFirst().id()).isEqualTo(first.getId());
        first.setRating(5);
        reviews.flush();
        var tie = service.getProductReviewPage(product.getId(), PageRequest.of(0, 1, Sort.by("rating")));
        assertThat(tie.content().getFirst().id()).isEqualTo(second.getId());
    }

    @Test
    void serverBoundsPageSizeAndRepresentsEmptyAverageAsNull() {
        var page = service.getProductReviewPage(product.getId(), PageRequest.of(0, 1000));
        assertThat(page.size()).isEqualTo(100);
        assertThat(page.content()).hasSize(2);
        var empty = service.getProductReviewPage(emptyProduct.getId(), PageRequest.of(0, 5));
        assertThat(empty.totalElements()).isZero();
        assertThat(empty.averageRating()).isNull();
    }

    @Test
    void anonymousHttpPageUsesApprovedShapeAndRejectsUnsupportedSortAndMissingProduct() throws Exception {
        mvc.perform(get("/api/v1/reviews/product/{id}/page", product.getId()).param("size", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(2)).andExpect(jsonPath("$.averageRating").value(3.0));
        mvc.perform(get("/api/v1/reviews/product/{id}/page", product.getId()).param("sort", "user.email,asc"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/reviews/product/{id}/page", product.getId()).param("page", "2147483647").param("size", "100"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/reviews/product/{id}/page", Long.MAX_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    void existingPublicArrayContractRemainsCompatible() throws Exception {
        mvc.perform(get("/api/v1/reviews/product/{id}", product.getId()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
    }

    private Product product(String code) {
        return products.saveAndFlush(Product.builder().code(code).name("Review product")
                .price(new BigDecimal("5000")).category(category).isActive(true).build());
    }

    private Order order(User user, String code) {
        return orders.saveAndFlush(Order.builder().orderCode(code).user(user).customerName(user.getFullName())
                .customerEmail(user.getEmail()).customerPhone("0900000000").shippingAddress("Test address")
                .totalAmount(new BigDecimal("5000")).finalAmount(new BigDecimal("5000"))
                .paymentMethod("COD").isPaid(true).status(OrderStatus.COMPLETED).build());
    }
}
