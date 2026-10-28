package com.m4n.backend.service;

import com.m4n.backend.dto.request.*;
import com.m4n.backend.dto.response.AdminProductDetailResponse;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import java.util.List;

public interface ProductImageService {
    AdminProductDetailResponse create(CreateProductRequest request, List<MultipartFile> images);
    AdminProductDetailResponse update(Long productId, UpdateProductRequest request, List<MultipartFile> images);
    Resource getImage(String filename);
}
