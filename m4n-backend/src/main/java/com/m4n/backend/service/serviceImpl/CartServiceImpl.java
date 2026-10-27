package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.AddToCartRequest;
import com.m4n.backend.dto.request.UpdateCartItemRequest;
import com.m4n.backend.dto.response.CartResponse;
import com.m4n.backend.entity.Cart;
import com.m4n.backend.entity.CartItem;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.exception.ProductNotFoundException;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.mapper.CartMapper;
import com.m4n.backend.repository.CartItemRepository;
import com.m4n.backend.repository.CartRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.CartService;
import com.m4n.backend.service.ProductPricingService;
import com.m4n.backend.validation.MoneyValidation;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartMapper cartMapper;
    private final ProductPricingService productPricingService;

    public CartServiceImpl(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            CartMapper cartMapper,
            ProductPricingService productPricingService
    ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.cartMapper = cartMapper;
        this.productPricingService = productPricingService;
    }

    @Override
    @Transactional
    public CartResponse getMyCart() {
        User user = getAuthenticatedUser();
        Cart cart = getOrCreateCart(user);
        return cartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addToCart(AddToCartRequest request) {
        if (request.quantity() == null || request.quantity() <= 0) {
            throw new IllegalArgumentException("Số lượng sản phẩm tối thiểu là 1.");
        }
        User user = getAuthenticatedUser();
        Cart cart = getOrCreateCart(user);

        Product product = productRepository.findByIdAndIsActiveTrue(request.productId())
                .orElseThrow(() -> new ProductNotFoundException(request.productId()));

        // Check if item already in cart
        CartItem existingItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId())
                .orElse(null);
        validateTotalQuantity(cart, null, request.quantity());

        if (existingItem != null) {
            try {
                existingItem.setQuantity(Math.addExact(existingItem.getQuantity(), request.quantity()));
            } catch (ArithmeticException exception) {
                throw new IllegalArgumentException("Số lượng sản phẩm vượt quá giới hạn hỗ trợ.");
            }
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.quantity())
                    .build();
            cartItemRepository.save(newItem);
            cart.getItems().add(newItem);
        }

        // Re-fetch cart with all items to map fresh response
        Cart updatedCart = cartRepository.findWithItemsByUserId(user.getId()).orElse(cart);
        return cartResponse(updatedCart);
    }

    @Override
    @Transactional
    public CartResponse updateCartItem(Long itemId, UpdateCartItemRequest request) {
        if (request.quantity() == null || request.quantity() < 0) {
            throw new IllegalArgumentException("Số lượng sản phẩm không được âm.");
        }
        User user = getAuthenticatedUser();
        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Mục giỏ hàng không tồn tại: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new AccessDeniedException("Bạn không có quyền chỉnh sửa mục giỏ hàng này");
        }
        validateTotalQuantity(cart, itemId, request.quantity());

        if (request.quantity() <= 0) {
            cart.getItems().remove(item);
        } else {
            item.setQuantity(request.quantity());
            cartItemRepository.save(item);
        }

        Cart updatedCart = cartRepository.findWithItemsByUserId(user.getId()).orElse(cart);
        return cartResponse(updatedCart);
    }

    @Override
    @Transactional
    public CartResponse removeCartItem(Long itemId) {
        User user = getAuthenticatedUser();
        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Mục giỏ hàng không tồn tại: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new AccessDeniedException("Bạn không có quyền xóa mục giỏ hàng này");
        }

        cart.getItems().remove(item);

        Cart updatedCart = cartRepository.findWithItemsByUserId(user.getId()).orElse(cart);
        return cartResponse(updatedCart);
    }

    @Override
    @Transactional
    public CartResponse clearMyCart() {
        User user = getAuthenticatedUser();
        Cart cart = getOrCreateCart(user);

        if (cart.getItems() != null && !cart.getItems().isEmpty()) {
            cart.getItems().clear();
        }

        Cart updatedCart = cartRepository.findWithItemsByUserId(user.getId()).orElse(cart);
        return cartResponse(updatedCart);
    }

    private CartResponse cartResponse(Cart cart) {
        CartResponse response = cartMapper.toCartResponse(cart, productPricingService.resolvePrices(
                cart.getItems().stream().map(CartItem::getProduct).distinct().toList()));
        MoneyValidation.requireSupported(response.totalAmount());
        MoneyValidation.requireSupported(response.originalTotalAmount());
        return response;
    }

    private Cart getOrCreateCart(User user) {
        return cartRepository.findWithItemsByUserId(user.getId())
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .user(user)
                            .build();
                    return cartRepository.save(newCart);
                });
    }

    private void validateTotalQuantity(Cart cart, Long replacedItemId, int quantity) {
        long total = quantity;
        for (CartItem item : cart.getItems()) {
            if (replacedItemId == null || !replacedItemId.equals(item.getId())) total += item.getQuantity();
        }
        if (total > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Số lượng sản phẩm vượt quá giới hạn hỗ trợ.");
        }
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            throw new AccessDeniedException("Vui lòng đăng nhập để thực hiện thao tác này");
        }

        String email = authentication.getName();
        // A customer row also exists before their first cart. This lock serializes
        // cart creation, mutations and checkout without locking a nullable cart row.
        User user = userRepository.findByEmailIgnoreCaseWithLock(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng"));
        if (user.getRole().getName() != RoleName.CUSTOMER) {
            throw new AccessDeniedException("Giỏ hàng chỉ dành cho tài khoản khách hàng.");
        }
        return user;
    }
}
