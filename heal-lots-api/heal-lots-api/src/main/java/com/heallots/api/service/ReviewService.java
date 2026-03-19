package com.heallots.api.service;

import com.heallots.api.model.Review;
import com.heallots.api.model.Appointment;
import com.heallots.api.model.User;
import com.heallots.api.repository.ReviewRepository;
import com.heallots.api.repository.AppointmentRepository;
import com.heallots.api.repository.UserRepository;
import com.heallots.api.dto.ReviewRequest;
import com.heallots.api.dto.ReviewDto;
import com.heallots.api.dto.SpecialistRatingDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReviewService {
    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    public Review submitReview(String email, ReviewRequest req) throws Exception {
        // Validate rating
        if (req.getRating() == null || req.getRating() < 1 || req.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }

        // Check if review already exists for this appointment
        UUID appointmentId = UUID.fromString(req.getAppointmentId());
        List<Review> existingReviews = reviewRepository.findByAppointmentId(appointmentId);
        if (!existingReviews.isEmpty()) {
            throw new IllegalArgumentException("You have already submitted a review for this appointment.");
        }

        // Get user
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found.");
        }

        User user = userOpt.get();

        // Get appointment
        Optional<Appointment> apptOpt = appointmentRepository.findById(appointmentId);
        if (apptOpt.isEmpty()) {
            throw new IllegalArgumentException("Appointment not found.");
        }

        Appointment appointment = apptOpt.get();

        // Create review
        Review review = new Review();
        review.setAppointment(appointment);
        review.setUser(user);
        review.setSpecialistName(req.getSpecialistName());
        review.setServiceName(req.getServiceName());
        review.setRating(req.getRating());
        review.setReviewText(req.getReviewText() != null ? req.getReviewText().trim() : "");
        review.setPatientName(req.getPatientName());
        review.setPatientEmail(req.getPatientEmail());

        return reviewRepository.save(review);
    }

    public List<Review> getReviewsBySpecialist(String specialistName) {
        return reviewRepository.findBySpecialistName(specialistName);
    }

    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

    public List<ReviewDto> getAllReviewsWithProfiles() {
        List<Review> reviews = reviewRepository.findAll();
        return reviews.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private ReviewDto convertToDto(Review review) {
        ReviewDto dto = new ReviewDto();
        dto.setId(review.getId().toString());
        dto.setSpecialistName(review.getSpecialistName());
        dto.setServiceName(review.getServiceName());
        dto.setRating(review.getRating());
        dto.setReviewText(review.getReviewText());
        dto.setPatientName(review.getPatientName());
        dto.setPatientEmail(review.getPatientEmail());
        dto.setCreatedAt(review.getCreatedAt());
        
        // Fetch the user's profile picture
        if (review.getUser() != null) {
            dto.setPatientProfilePictureUrl(review.getUser().getProfilePictureUrl());
        }
        
        return dto;
    }

    public List<Review> getReviewsByAppointment(UUID appointmentId) {
        return reviewRepository.findByAppointmentId(appointmentId);
    }

    public List<Review> getReviewsByPatient(String patientEmail) {
        return reviewRepository.findByPatientEmail(patientEmail);
    }

    public boolean hasReviewForAppointment(UUID appointmentId) {
        List<Review> reviews = reviewRepository.findByAppointmentId(appointmentId);
        return !reviews.isEmpty();
    }

    public Map<String, Map<String, Object>> getSpecialistRatings() {
        Map<String, Map<String, Object>> ratings = new HashMap<>();

        // Get all specialists
        List<String> specialists = reviewRepository.findAllSpecialists();

        for (String specialist : specialists) {
            List<Review> reviews = reviewRepository.findBySpecialistName(specialist);
            if (!reviews.isEmpty()) {
                double avgRating = reviews.stream()
                        .mapToInt(Review::getRating)
                        .average()
                        .orElse(0.0);
                
                long reviewCount = reviews.size();

                Map<String, Object> data = new HashMap<>();
                data.put("rating", Math.round(avgRating * 10.0) / 10.0); // Round to 1 decimal place
                data.put("reviews", reviewCount);

                ratings.put(specialist, data);
            }
        }

        return ratings;
    }
}
