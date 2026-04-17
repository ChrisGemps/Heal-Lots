package com.heallots.api.features.reviews.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SpecialistRatingDto {
    private String specialistName;
    private Double rating;
    private Long reviews;
}
