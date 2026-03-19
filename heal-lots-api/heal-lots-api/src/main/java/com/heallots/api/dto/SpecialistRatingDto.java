package com.heallots.api.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SpecialistRatingDto {
    private String specialistName;
    private Double rating;
    private Long reviews;
}
