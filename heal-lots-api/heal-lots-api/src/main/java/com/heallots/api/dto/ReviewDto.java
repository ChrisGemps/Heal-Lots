package com.heallots.api.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDto {
    private String id;
    private String specialistName;
    private String serviceName;
    private Integer rating;
    private String reviewText;
    private String patientName;
    private String patientEmail;
    private String patientProfilePictureUrl;
    private LocalDateTime createdAt;
}
