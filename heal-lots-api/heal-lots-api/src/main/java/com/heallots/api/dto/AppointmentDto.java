package com.heallots.api.dto;

import lombok.*;
import com.heallots.api.model.Appointment;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDto {
    private String id;
    private String patientName;
    private String patientEmail;
    private String serviceName;
    private String specialistName;
    private String appointmentDate;
    private String timeSlot;
    private String reason;
    private String notes;
    private String status;
    private String rescheduleReason;
    private String cancellationReason;
    private String createdAt;

    public static AppointmentDto fromAppointment(Appointment appt) {
        AppointmentDto dto = new AppointmentDto();
        dto.setId(appt.getId().toString());
        dto.setPatientName(appt.getUser().getFullName());
        dto.setPatientEmail(appt.getUser().getEmail());
        dto.setServiceName(appt.getServiceName());
        dto.setSpecialistName(appt.getSpecialistName());
        dto.setAppointmentDate(appt.getAppointmentDate());
        dto.setTimeSlot(appt.getTimeSlot());
        dto.setReason(appt.getReason());
        dto.setNotes(appt.getNotes());
        dto.setStatus(appt.getStatus());
        dto.setRescheduleReason(appt.getRescheduleReason());
        dto.setCancellationReason(appt.getCancellationReason());
        dto.setCreatedAt(appt.getCreatedAt() != null ? appt.getCreatedAt().toString() : null);
        return dto;
    }
}
