package com.m4n.backend.service;

import com.m4n.backend.dto.request.CreateReviewRequest;
import com.m4n.backend.dto.response.ReviewEligibilityResponse;
import com.m4n.backend.dto.response.ReviewResponse;
import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderItem;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.Review;
import com.m4n.backend.entity.User;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.ReviewRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.serviceImpl.ReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private User testUser;
    private Product testProduct;

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @BeforeEach
    void setUp() {
        Role customerRole = Role.builder().id(1L).name(RoleName.CUSTOMER).build();

        testUser = User.builder()
                .id(1L)
                .email("customer@m4n.vn")
                .fullName("Khách hàng A")
                .role(customerRole)
                .isActive(true)
                .build();

        testProduct = Product.builder()
                .id(10L)
                .code("TRN-001")
                .name("Đàn Tranh 16 Dây")
                .price(new BigDecimal("8500000.00"))
                .isActive(true)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser.getEmail(), null, List.of())
        );
    }

    @Test
    @DisplayName("BR-REVIEW-01: Customer can review product when order is COMPLETED and contains the product")
    void createReview_whenEligible_shouldSucceed() {
        Order completedOrder = Order.builder()
                .id(100L)
                .user(testUser)
                .orderCode("M4N-2026-100")
                .status(OrderStatus.COMPLETED)
                .items(new ArrayList<>())
                .build();

        OrderItem item = OrderItem.builder()
                .id(1001L)
                .order(completedOrder)
                .product(testProduct)
                .quantity(1)
                .price(testProduct.getPrice())
                .build();
        completedOrder.getItems().add(item);

        when(userRepository.findByEmailIgnoreCase(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(orderRepository.findByIdWithLock(100L)).thenReturn(Optional.of(completedOrder));
        when(reviewRepository.existsByOrderIdAndProductId(100L, 10L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(i -> {
            Review r = i.getArgument(0);
            r.setId(55L);
            return r;
        });

        CreateReviewRequest request = new CreateReviewRequest(100L, 10L, 5, "Đàn rất đẹp, âm sắc thanh tao.");
        ReviewResponse response = reviewService.createReview(request);

        assertThat(response).isNotNull();
        assertThat(response.rating()).isEqualTo(5);
        assertThat(response.comment()).isEqualTo("Đàn rất đẹp, âm sắc thanh tao.");
    }

    @Test
    void disabledCustomerCannotSubmitOrCheckEligibilityThroughService() {
        testUser.setActive(false);
        when(userRepository.findByEmailIgnoreCase(testUser.getEmail())).thenReturn(Optional.of(testUser));
        assertThatThrownBy(() -> reviewService.createReview(new CreateReviewRequest(100L, 10L, 5, "Review")))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(() -> reviewService.checkEligibility(10L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    @DisplayName("BR-REVIEW-01: Review must be REJECTED when order is not COMPLETED")
    void createReview_whenOrderNotCompleted_shouldBeRejected() {
        Order pendingOrder = Order.builder()
                .id(101L)
                .user(testUser)
                .status(OrderStatus.CONFIRMED)
                .items(new ArrayList<>())
                .build();

        OrderItem item = OrderItem.builder()
                .id(1002L)
                .order(pendingOrder)
                .product(testProduct)
                .build();
        pendingOrder.getItems().add(item);

        when(userRepository.findByEmailIgnoreCase(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(orderRepository.findByIdWithLock(101L)).thenReturn(Optional.of(pendingOrder));

        CreateReviewRequest request = new CreateReviewRequest(101L, 10L, 5, "Test review");

        assertThatThrownBy(() -> reviewService.createReview(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("COMPLETED");
    }

    @Test
    @DisplayName("BR-REVIEW-01: Duplicate review for same order item must be rejected")
    void createReview_whenDuplicate_shouldBeRejected() {
        Order completedOrder = Order.builder()
                .id(102L)
                .user(testUser)
                .status(OrderStatus.COMPLETED)
                .items(new ArrayList<>())
                .build();

        OrderItem item = OrderItem.builder()
                .id(1003L)
                .order(completedOrder)
                .product(testProduct)
                .build();
        completedOrder.getItems().add(item);

        when(userRepository.findByEmailIgnoreCase(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(orderRepository.findByIdWithLock(102L)).thenReturn(Optional.of(completedOrder));
        when(reviewRepository.existsByOrderIdAndProductId(102L, 10L)).thenReturn(true);

        CreateReviewRequest request = new CreateReviewRequest(102L, 10L, 4, "Second review attempt");

        assertThatThrownBy(() -> reviewService.createReview(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("đã gửi đánh giá");
    }

    @Test
    @DisplayName("checkEligibility should return true when user has completed order with product")
    void checkEligibility_whenEligible_shouldReturnTrue() {
        Order completedOrder = Order.builder()
                .id(103L)
                .user(testUser)
                .status(OrderStatus.COMPLETED)
                .items(new ArrayList<>())
                .build();

        OrderItem item = OrderItem.builder()
                .id(1004L)
                .order(completedOrder)
                .product(testProduct)
                .build();
        completedOrder.getItems().add(item);

        when(userRepository.findByEmailIgnoreCase(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(orderRepository.findUnreviewedPurchaseIds(1L, 10L, OrderStatus.COMPLETED, PageRequest.of(0, 1)))
                .thenReturn(List.of(103L));

        ReviewEligibilityResponse response = reviewService.checkEligibility(10L);

        assertThat(response.eligible()).isTrue();
        assertThat(response.eligibleOrderId()).isEqualTo(103L);
    }
}
