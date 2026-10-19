package com.m4n.backend.serviceImpl;

import com.m4n.backend.dto.request.CreateReviewRequest;
import com.m4n.backend.dto.response.ReviewEligibilityResponse;
import com.m4n.backend.dto.response.ReviewResponse;
import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.Review;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import org.springframework.security.access.AccessDeniedException;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.ReviewRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ReviewResponse createReview(CreateReviewRequest request) {
        User user = getAuthenticatedUser();

        // 1. Verify Product exists
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + request.productId()));

        // 2. Verify Order exists and belongs to user
        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + request.orderId()));

        if (order.getUser() == null || !order.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền đánh giá đơn hàng này");
        }

        // 3. BR-REVIEW-01: Order must have status COMPLETED
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new IllegalArgumentException("Chỉ có thể đánh giá sản phẩm từ đơn hàng đã hoàn thành (COMPLETED).");
        }

        // 4. Verify Order contains the product
        boolean containsProduct = order.getItems().stream()
                .anyMatch(item -> item.getProduct() != null && item.getProduct().getId().equals(product.getId()));
        if (!containsProduct) {
            throw new IllegalArgumentException("Đơn hàng này không chứa sản phẩm mà bạn muốn đánh giá.");
        }

        // 5. Unique check: only one review per order item
        if (reviewRepository.existsByOrderIdAndProductId(order.getId(), product.getId())) {
            throw new IllegalArgumentException("Bạn đã gửi đánh giá cho sản phẩm này trong đơn hàng đã chọn.");
        }

        // 6. Build and save Review
        Review review = Review.builder()
                .product(product)
                .user(user)
                .order(order)
                .rating(request.rating())
                .comment(request.comment() != null ? request.comment().trim() : null)
                .build();

        Review saved = reviewRepository.save(review);
        log.info("Customer {} submitted a {}-star review for product [{}] from order [{}]",
                user.getEmail(), saved.getRating(), product.getCode(), order.getOrderCode());

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getProductReviews(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewEligibilityResponse checkEligibility(Long productId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return new ReviewEligibilityResponse(false, null, "Vui lòng đăng nhập để đánh giá.");
        }

        User user = userRepository.findByEmailIgnoreCase(auth.getName()).orElse(null);
        if (user == null) {
            return new ReviewEligibilityResponse(false, null, "Tài khoản không tồn tại.");
        }
        if (user.getRole().getName() != RoleName.CUSTOMER) {
            throw new AccessDeniedException("Chỉ khách hàng mới có thể kiểm tra điều kiện đánh giá.");
        }

        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        for (Order order : orders) {
            if (order.getStatus() == OrderStatus.COMPLETED) {
                boolean containsProduct = order.getItems().stream()
                        .anyMatch(item -> item.getProduct() != null && item.getProduct().getId().equals(productId));
                if (containsProduct) {
                    boolean alreadyReviewed = reviewRepository.existsByOrderIdAndProductId(order.getId(), productId);
                    if (!alreadyReviewed) {
                        return new ReviewEligibilityResponse(true, order.getId(), "Quý khách đủ điều kiện đánh giá sản phẩm này.");
                    }
                }
            }
        }

        return new ReviewEligibilityResponse(false, null, "Bạn chỉ có thể đánh giá sau khi đã mua và hoàn thành đơn hàng chứa sản phẩm này.");
    }

    private ReviewResponse mapToResponse(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getProduct().getId(),
                r.getUser().getId(),
                r.getUser().getFullName(),
                r.getOrder().getId(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt()
        );
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            throw new AccessDeniedException("Vui lòng đăng nhập để thực hiện thao tác này");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng"));
        if (user.getRole().getName() != RoleName.CUSTOMER) {
            throw new AccessDeniedException("Chỉ khách hàng mới có thể đánh giá sản phẩm.");
        }
        return user;
    }
}
