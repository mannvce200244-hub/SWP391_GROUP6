package com.m4n.backend.service;

import com.m4n.backend.dto.request.CreateProductRequest;
import com.m4n.backend.entity.Category;
import com.m4n.backend.repository.CategoryRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.ByteArrayOutputStream;
import java.nio.file.*;
import java.math.BigDecimal;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class ProductImageIntegrationTest {
    static final Path DIR;
    static { try { DIR = Files.createTempDirectory("m4n-product-images-test-"); }
        catch (java.io.IOException ex) { throw new ExceptionInInitializerError(ex); } }
    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        registry.add("m4n.media.directory", () -> DIR.toString());
    }
    @Autowired ProductImageService images;
    @Autowired ProductService products;
    @Autowired CategoryRepository categories;
    @Autowired WebApplicationContext context;
    Category category;
    @BeforeEach void fixture() { category = categories.saveAndFlush(Category.builder()
            .code("LONG-CATEGORY-" + UUID.randomUUID()).name("Upload fixture").build()); }

    @Test void uploadSavesProductMediaAndPublicCatalogWithZeroInitialStock() throws Exception {
        var result = images.create(request(null), List.of(png("../../unsafe.png")));
        assertThat(result.code()).hasSizeLessThanOrEqualTo(50);
        assertThat(result.stockQuantity()).isZero();
        assertThat(result.media()).hasSize(1);
        var publicProduct = products.getProductDetail(result.id());
        assertThat(publicProduct.media().getFirst().url()).isEqualTo(result.media().getFirst().url());
        String filename = result.media().getFirst().url().substring(result.media().getFirst().url().lastIndexOf('/') + 1);
        assertThat(filename).matches("[0-9a-f-]{36}\\.png");
        assertThat(ImageIO.read(images.getImage(filename).getInputStream()).getWidth()).isEqualTo(8);
        assertThatThrownBy(() -> images.getImage("../application.properties")).isInstanceOf(com.m4n.backend.exception.ResourceNotFoundException.class);
    }

    @Test void persistenceFailureRemovesUploadedFilesAndRejectsInvalidImages() throws Exception {
        var first = images.create(request("UPLOAD-DUP-" + UUID.randomUUID()), List.of(png("first.png")));
        long before;
        try (var files = Files.list(DIR)) { before = files.count(); }
        assertThatThrownBy(() -> images.create(request(first.code()), List.of(png("failed.png"))))
                .isInstanceOf(com.m4n.backend.exception.DuplicateResourceException.class);
        try (var files = Files.list(DIR)) { assertThat(files.count()).isEqualTo(before); }
        assertThatThrownBy(() -> images.create(request(null), List.of(new MockMultipartFile("images", "fake.png", "image/png", "<script/>".getBytes()))))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void multipartCreationRequiresAdminAndServesReencodedPublicImage() throws Exception {
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        var json = new MockMultipartFile("product", "", "application/json", new ObjectMapper().writeValueAsBytes(request(null)));
        mvc.perform(multipart("/api/v1/admin/products/with-images").file(json).file(png("image.png")))
                .andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/v1/admin/products/with-images").file(json).file(png("image.png"))
                        .with(user("customer@example.test").roles("CUSTOMER")))
                .andExpect(status().isForbidden());
        mvc.perform(multipart("/api/v1/admin/products/with-images").file(json)
                        .with(user("admin@example.test").roles("ADMIN")))
                .andExpect(status().isBadRequest());
        var created = mvc.perform(multipart("/api/v1/admin/products/with-images").file(json).file(png("image.png"))
                        .with(user("admin@example.test").roles("ADMIN")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.stockQuantity").value(0)).andReturn();
        var response = new ObjectMapper().readTree(created.getResponse().getContentAsString());
        String url = response.path("media").get(0).path("url").asText();
        mvc.perform(get("/api/v1/media/" + url.substring(url.lastIndexOf('/') + 1)))
                .andExpect(status().isOk()).andExpect(content().contentType("image/png"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    private CreateProductRequest request(String code) {
        return new CreateProductRequest(code, null, "Uploaded instrument", BigDecimal.valueOf(100000), category.getId(),
                null, null, "Wood", "30 x 20 x 10 cm", null, null, "Upload fixture", List.of(), 5, BigDecimal.ONE, BigDecimal.ZERO);
    }
    private MockMultipartFile png(String filename) throws Exception {
        var bytes = new ByteArrayOutputStream(); ImageIO.write(new BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB), "png", bytes);
        return new MockMultipartFile("images", filename, "image/png", bytes.toByteArray());
    }
    @AfterAll static void cleanup() throws Exception {
        try (var files = Files.list(DIR)) { for (Path file : files.toList()) Files.delete(file); }
        Files.delete(DIR);
    }
}
