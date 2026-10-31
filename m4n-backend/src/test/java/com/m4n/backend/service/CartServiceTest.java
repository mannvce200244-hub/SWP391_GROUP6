package com.m4n.backend.service;

import com.m4n.backend.dto.request.AddToCartRequest;
import com.m4n.backend.dto.response.CartResponse;
import com.m4n.backend.entity.Cart;
import com.m4n.backend.entity.CartItem;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.mapper.CartMapper;
import com.m4n.backend.repository.CartItemRepository;
import com.m4n.backend.repository.CartRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.service.serviceImpl.CartServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    private CartMapper cartMapper;
    private CartService cartService;
    private User testUser;

    @Mock private ProductPricingService productPricingService;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.lenient().when(productPricingService.resolvePrices(any())).thenAnswer(inv -> {
            java.util.List<Product> requested = inv.getArgument(0);
            return requested.stream().collect(java.util.stream.Collectors.toMap(Product::getId,
                    product -> new ProductPrice(product.getPrice(), product.getPrice(), BigDecimal.ZERO, null), (first, duplicate) -> first));
        });

        cartMapper = new CartMapper();
        cartService = new CartServiceImpl(cartRepository, cartItemRepository, productRepository, userRepository, cartMapper, productPricingService);

        Role role = Role.builder().id(1L).name(RoleName.CUSTOMER).build();
        testUser = User.builder()
                .id(1L)
                .email("customer@m4n.vn")
                .fullName("Nguyễn Văn Khách")
                .role(role)
                .isActive(true)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("customer@m4n.vn", "N/A", Collections.emptyList())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldAddToCartWithoutDeductingStock() {
        when(userRepository.findByEmailIgnoreCaseWithLock("customer@m4n.vn")).thenReturn(Optional.of(testUser));

        Cart cart = Cart.builder().id(10L).user(testUser).items(new ArrayList<>()).build();
        when(cartRepository.findWithItemsByUserId(1L)).thenReturn(Optional.of(cart));

        Product product = Product.builder()
                .id(1L)
                .code("TRN-001")
                .name("Đàn Tranh 16 Dây")
                .price(new BigDecimal("8500000"))
                .isActive(true)
                .build();
        when(productRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductId(10L, 1L)).thenReturn(Optional.empty());

        CartResponse response = cartService.addToCart(new AddToCartRequest(1L, 2));

        assertThat(response).isNotNull();
        // Verifies that a cart item was persisted
        verify(cartItemRepository).save(any(CartItem.class));
        // Verifies Cart item count matches
        assertThat(cart.getItems()).hasSize(1);
        assertThat(cart.getItems().get(0).getQuantity()).isEqualTo(2);
    }

    @Test
    void shouldIncrementQuantityWhenProductAlreadyInCart() {
        when(userRepository.findByEmailIgnoreCaseWithLock("customer@m4n.vn")).thenReturn(Optional.of(testUser));

        Product product = Product.builder()
                .id(1L)
                .code("TRN-001")
                .name("Đàn Tranh 16 Dây")
                .price(new BigDecimal("8500000"))
                .isActive(true)
                .build();

        Cart cart = Cart.builder().id(10L).user(testUser).items(new ArrayList<>()).build();
        CartItem existingItem = CartItem.builder().id(100L).cart(cart).product(product).quantity(1).build();
        cart.getItems().add(existingItem);

        when(cartRepository.findWithItemsByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findByIdAndIsActiveTrue(1L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductId(10L, 1L)).thenReturn(Optional.of(existingItem));

        cartService.addToCart(new AddToCartRequest(1L, 3));

        assertThat(existingItem.getQuantity()).isEqualTo(4);
        verify(cartItemRepository).save(existingItem);
    }

    @Test
    void shouldRejectQuantityOverflowWithoutMutatingCart() {
        when(userRepository.findByEmailIgnoreCaseWithLock(testUser.getEmail())).thenReturn(Optional.of(testUser));
        Product product = Product.builder().id(1L).price(BigDecimal.ONE).isActive(true).build();
        Cart cart = Cart.builder().id(10L).user(testUser).items(new ArrayList<>()).build();
        CartItem item = CartItem.builder().id(100L).cart(cart).product(product).quantity(Integer.MAX_VALUE).build();
        cart.getItems().add(item);
        when(cartRepository.findWithItemsByUserId(testUser.getId())).thenReturn(Optional.of(cart));
        when(productRepository.findByIdAndIsActiveTrue(product.getId())).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId())).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> cartService.addToCart(new AddToCartRequest(product.getId(), 1)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("vượt quá giới hạn");
        assertThat(item.getQuantity()).isEqualTo(Integer.MAX_VALUE);
        verify(cartItemRepository, never()).save(any());
    }
}
