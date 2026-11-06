package com.m4n.backend.service.serviceImpl;

import com.m4n.backend.dto.request.*;
import com.m4n.backend.dto.response.AdminProductDetailResponse;
import com.m4n.backend.entity.MediaType;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.service.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@Service
@Slf4j
public class ProductImageServiceImpl implements ProductImageService {
    private final ProductService products;
    private final Path directory;
    private final String publicBaseUrl;

    public ProductImageServiceImpl(ProductService products,
            @Value("${m4n.media.directory:./data/product-images}") String directory,
            @Value("${m4n.media.public-base-url:http://localhost:8080/api/v1/media}") String publicBaseUrl) {
        this.products = products;
        this.directory = Path.of(directory).toAbsolutePath().normalize();
        this.publicBaseUrl = publicBaseUrl.replaceAll("/+$", "");
    }

    @Override
    @Transactional
    public AdminProductDetailResponse create(CreateProductRequest request, List<MultipartFile> images) {
        List<CreateProductMediaRequest> media = new ArrayList<>(request.media() == null ? List.of() : request.media());
        for (String url : storeImages(images)) {
            media.add(new CreateProductMediaRequest(MediaType.IMAGE, url, request.name(), media.size()));
        }
        return products.createProduct(new CreateProductRequest(request.code(), request.barcode(), request.name(),
                request.price(), request.categoryId(), request.artisanId(), request.craftVillageId(), request.material(),
                request.dimensions(), request.musicalRange(), request.origin(), request.description(), media,
                request.lowStockThreshold(), request.billableWeightKg(), request.bulkySurcharge()));
    }

    @Override
    @Transactional
    public AdminProductDetailResponse update(Long productId, UpdateProductRequest request, List<MultipartFile> images) {
        List<ProductMediaItemRequest> media = new ArrayList<>(request.media() == null
                ? products.getAdminProductDetail(productId).media().stream().map(m -> new ProductMediaItemRequest(
                    m.id(), MediaType.valueOf(m.type()), m.url(), m.alt(), m.sortOrder())).toList() : request.media());
        for (String url : storeImages(images)) {
            media.add(new ProductMediaItemRequest(null, MediaType.IMAGE, url, request.name(), media.size()));
        }
        return products.updateProduct(productId, new UpdateProductRequest(request.name(), request.barcode(), request.price(),
                request.categoryId(), request.artisanId(), request.craftVillageId(), request.material(), request.dimensions(),
                request.musicalRange(), request.origin(), request.description(), request.isActive(), media,
                request.lowStockThreshold(), request.billableWeightKg(), request.bulkySurcharge()));
    }

    private List<String> storeImages(List<MultipartFile> images) {
        if (images == null || images.size() > 10) throw new IllegalArgumentException("Mỗi lần lưu tối đa 10 ảnh.");
        List<Path> created = new ArrayList<>();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    for (Path file : created) {
                        try { Files.deleteIfExists(file); }
                        catch (IOException ex) { log.error("Could not remove an image after transaction rollback; storage cleanup is required."); }
                    }
                }
            }
        });
        List<String> urls = new ArrayList<>();
        for (MultipartFile image : images) {
            if (image == null || image.isEmpty() || image.getSize() > 5L * 1024 * 1024) {
                throw new IllegalArgumentException("Ảnh phải là JPEG/PNG, không rỗng và tối đa 5 MB.");
            }
            try (var input = image.getInputStream(); ImageInputStream stream = ImageIO.createImageInputStream(input)) {
                var readers = ImageIO.getImageReaders(stream);
                if (!readers.hasNext()) throw new IllegalArgumentException("Tệp không phải ảnh JPEG/PNG hợp lệ.");
                ImageReader reader = readers.next();
                try {
                    if (!Set.of("JPEG", "PNG").contains(reader.getFormatName().toUpperCase(Locale.ROOT))) {
                        throw new IllegalArgumentException("Chỉ hỗ trợ ảnh JPEG/PNG.");
                    }
                    reader.setInput(stream, true, true);
                    int width = reader.getWidth(0), height = reader.getHeight(0);
                    if (width <= 0 || height <= 0 || (long) width * height > 16_000_000) {
                        throw new IllegalArgumentException("Ảnh tối đa 16 triệu điểm ảnh.");
                    }
                    BufferedImage decoded = reader.read(0);
                    Files.createDirectories(directory);
                    Path file = directory.resolve(UUID.randomUUID() + ".png");
                    Files.createFile(file);
                    created.add(file);
                    if (!ImageIO.write(decoded, "png", file.toFile())) throw new IOException();
                    urls.add(publicBaseUrl + "/" + file.getFileName());
                } finally { reader.dispose(); }
            } catch (IOException ex) {
                throw new IllegalArgumentException("Không thể đọc hoặc lưu ảnh. Vui lòng thử ảnh JPEG/PNG khác.");
            }
        }
        return urls;
    }

    @Override
    public Resource getImage(String filename) {
        if (filename == null || !filename.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.png")) {
            throw new ResourceNotFoundException("Không tìm thấy ảnh.");
        }
        Path file = directory.resolve(filename);
        if (!Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS)) throw new ResourceNotFoundException("Không tìm thấy ảnh.");
        return new FileSystemResource(file);
    }
}
