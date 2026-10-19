package com.m4n.backend.controller;

import com.m4n.backend.dto.request.CreateReviewRequest;
import com.m4n.backend.dto.response.ReviewEligibilityResponse;
import com.m4n.backend.dto.response.ReviewResponse;
import com.m4n.backend.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@Tag(name = "Product Reviews", description = "Customer product reviews and purchase eligibility checking following BR-REVIEW-01")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Submit a product review", description = "Allows customer to review a product from an eligible COMPLETED order.")
    public ResponseEntity<ReviewResponse> createReview(@Valid @RequestBody CreateReviewRequest request) {
        ReviewResponse response = reviewService.createReview(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get product reviews", description = "Returns all approved reviews for a given product (public).")
    public ResponseEntity<List<ReviewResponse>> getProductReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId));
    }

    @GetMapping("/eligibility/{productId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Check review eligibility", description = "Verifies if the authenticated customer is eligible to review the product.")
    public ResponseEntity<ReviewEligibilityResponse> checkEligibility(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.checkEligibility(productId));
    }
}
