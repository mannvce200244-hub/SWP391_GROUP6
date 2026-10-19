package com.m4n.backend.service;

import com.m4n.backend.dto.request.CreateReviewRequest;
import com.m4n.backend.dto.response.ReviewEligibilityResponse;
import com.m4n.backend.dto.response.ReviewResponse;

import java.util.List;

public interface ReviewService {

    ReviewResponse createReview(CreateReviewRequest request);

    List<ReviewResponse> getProductReviews(Long productId);

    ReviewEligibilityResponse checkEligibility(Long productId);
}
