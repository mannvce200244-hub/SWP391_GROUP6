package com.m4n.backend.controller;

import com.m4n.backend.service.ProductImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class ProductImageController {
    private final ProductImageService images;

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG)
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofDays(1)))
                .body(images.getImage(filename));
    }
}
