package com.heallots.api.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookAppointmentRequest {
    private String serviceName;
    private String specialistName;
    private String appointmentDate;
    private String timeSlot;
    private String reason;
    private String notes;
}
