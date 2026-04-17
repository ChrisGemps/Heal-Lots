package com.heallots.api.features.reviews.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import com.heallots.api.features.reviews.model.Review;
import com.heallots.api.features.reviews.dto.ReviewRequest;
import com.heallots.api.features.reviews.dto.ReviewDto;
import com.heallots.api.features.reviews.service.ReviewService;
import com.heallots.api.config.JwtUtil;
import lombok.Data;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:3000")
public class ReviewController {
    @Autowired
    private ReviewService reviewService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("")
    public ResponseEntity<?> submitReview(@RequestHeader("Authorization") String authHeader, @RequestBody ReviewRequest req) {
        try {
            String email = extractEmailFromAuthHeader(authHeader);
            Review review = reviewService.submitReview(email, req);
            return ResponseEntity.ok(new SuccessResponse("Review submitted successfully.", review.getId().toString()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to submit review: " + e.getMessage()));
        }
    }

    @GetMapping("")
    public ResponseEntity<?> getAllReviews() {
        try {
            List<ReviewDto> reviews = reviewService.getAllReviewsWithProfiles();
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to fetch reviews."));
        }
    }

    @GetMapping("/specialist-ratings")
    public ResponseEntity<?> getSpecialistRatings(@RequestHeader("Authorization") String authHeader) {
        try {
            extractEmailFromAuthHeader(authHeader);
            Map<String, Map<String, Object>> ratings = reviewService.getSpecialistRatings();
            return ResponseEntity.ok(ratings);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to fetch specialist ratings."));
        }
    }

    @GetMapping("/appointment/{appointmentId}/reviewed")
    public ResponseEntity<?> checkAppointmentReviewed(@RequestHeader("Authorization") String authHeader, 
                                                      @PathVariable String appointmentId) {
        try {
            extractEmailFromAuthHeader(authHeader);
            boolean reviewed = reviewService.hasReviewForAppointment(java.util.UUID.fromString(appointmentId));
            Map<String, Boolean> response = new java.util.HashMap<>();
            response.put("reviewed", reviewed);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to check review status."));
        }
    }

    private String extractEmailFromAuthHeader(String authHeader) throws Exception {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid authorization header.");
        }
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            throw new IllegalArgumentException("Invalid or expired token.");
        }
        return jwtUtil.getEmailFromToken(token);
    }

    @Data
    public static class ErrorResponse {
        private String error;
        public ErrorResponse(String error) {
            this.error = error;
        }
    }

    @Data
    public static class SuccessResponse {
        private String message;
        private String reviewId;
        public SuccessResponse(String message, String reviewId) {
            this.message = message;
            this.reviewId = reviewId;
        }
    }
}
