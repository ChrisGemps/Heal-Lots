package com.heallots.api.features.reviews.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequest {
    private String appointmentId;
    private String specialistName;
    private String serviceName;
    private Integer rating; // 1-5
    private String reviewText;
    private String patientName;
    private String patientEmail;
}
