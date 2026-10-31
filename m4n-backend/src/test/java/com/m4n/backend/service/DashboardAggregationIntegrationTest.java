package com.m4n.backend.service;

import com.m4n.backend.entity.Invoice;
import com.m4n.backend.entity.InvoiceItem;
import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderItem;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.entity.Product;
import com.m4n.backend.repository.CategoryRepository;
import com.m4n.backend.repository.InvoiceRepository;
import com.m4n.backend.repository.OrderItemRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class DashboardAggregationIntegrationTest {

    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private UserRepository userRepository;

    @Test
    void overallBestSellerIsRankedAfterCombiningChannelsAndMergingHistoricalNames() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        var category = categoryRepository.findAll().getFirst();
        var customer = userRepository.findByEmailIgnoreCase("customer@m4n.vn").orElseThrow();
        var staff = userRepository.findByEmailIgnoreCase("pos@m4n.vn").orElseThrow();
        Order order = Order.builder().orderCode("TOP-ORDER-" + suffix).user(customer)
                .customerName("Khách kiểm thử").customerPhone("0900000000").customerEmail(customer.getEmail())
                .shippingAddress("Địa chỉ kiểm thử").totalAmount(BigDecimal.ZERO).finalAmount(BigDecimal.ZERO)
                .status(OrderStatus.COMPLETED).paymentMethod("COD").isPaid(true).build();
        Invoice invoice = Invoice.builder().invoiceCode("TOP-INVOICE-" + suffix).staff(staff)
                .subtotal(BigDecimal.ZERO).finalAmount(BigDecimal.ZERO).paymentMethod("CASH").build();

        for (int index = 0; index < 20; index++) {
            Product product = productRepository.save(Product.builder().code("TOP-" + suffix + "-" + index)
                    .name("Sản phẩm kiểm thử " + index).price(BigDecimal.ONE).category(category).build());
            if (index < 10) addOrderItem(order, product, 110000, product.getName());
            else addInvoiceItem(invoice, product, 110000);
        }
        Product shared = productRepository.save(Product.builder().code("TOP-" + suffix + "-SHARED")
                .name("Sản phẩm bán nhiều nhất cả hai kênh").price(BigDecimal.ONE).category(category).build());
        addOrderItem(order, shared, 100000, "Tên sản phẩm tại thời điểm mua trực tuyến");
        addInvoiceItem(invoice, shared, 100000);
        orderRepository.saveAndFlush(order);
        invoiceRepository.saveAndFlush(invoice);

        var products = orderItemRepository.findTopSellingProductsAcrossChannels(OrderStatus.COMPLETED, PageRequest.of(0, 5));

        assertThat(products).hasSize(5);
        assertThat(products.getFirst().getProductId()).isEqualTo(shared.getId());
        assertThat(products.getFirst().getQuantitySold()).isEqualTo(200000);
        assertThat(products.getFirst().getRevenue()).isEqualByComparingTo("200000");
        assertThat(products.getFirst().getCategoryName()).isEqualTo(category.getName());
    }

    private void addOrderItem(Order order, Product product, int quantity, String historicalName) {
        order.getItems().add(OrderItem.builder().order(order).product(product).productCode(product.getCode())
                .productName(historicalName).price(BigDecimal.ONE).quantity(quantity).build());
    }

    private void addInvoiceItem(Invoice invoice, Product product, int quantity) {
        invoice.getItems().add(InvoiceItem.builder().invoice(invoice).product(product).productCode(product.getCode())
                .productName(product.getName()).unitPrice(BigDecimal.ONE).quantity(quantity)
                .lineAmount(BigDecimal.valueOf(quantity)).build());
    }
}
