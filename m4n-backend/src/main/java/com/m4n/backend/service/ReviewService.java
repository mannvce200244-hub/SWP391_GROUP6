package com.m4n.backend.service;

import com.m4n.backend.dto.request.CreateReviewRequest;
import com.m4n.backend.dto.response.ReviewEligibilityResponse;
import com.m4n.backend.dto.response.ReviewResponse;
import com.m4n.backend.dto.response.ReviewPageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ReviewService {

    ReviewResponse createReview(CreateReviewRequest request);

    List<ReviewResponse> getProductReviews(Long productId);

    ReviewPageResponse getProductReviewPage(Long productId, Pageable pageable);

    ReviewEligibilityResponse checkEligibility(Long productId);
}
