package com.heallots.api.features.appointments.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import com.heallots.api.features.appointments.model.Appointment;
import com.heallots.api.features.appointments.dto.BookAppointmentRequest;
import com.heallots.api.features.appointments.dto.AppointmentDto;
import com.heallots.api.features.appointments.service.AppointmentService;
import com.heallots.api.config.JwtUtil;
import lombok.Data;
import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:3000")
public class AppointmentController {
    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(@RequestHeader("Authorization") String authHeader, @RequestBody BookAppointmentRequest req) {
        try {
            String email = extractEmailFromAuthHeader(authHeader);
            Appointment appointment = appointmentService.bookAppointment(email, req);
            AppointmentDto dto = AppointmentDto.fromAppointment(appointment);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to book appointment."));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllAppointments(@RequestHeader("Authorization") String authHeader) {
        try {
            extractEmailFromAuthHeader(authHeader); // Verify token is valid (admin only check should be done here, but for now we allow all)
            List<Appointment> appointments = appointmentService.getAllAppointments();
            List<AppointmentDto> dtos = appointments.stream()
                    .map(AppointmentDto::fromAppointment)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to fetch appointments."));
        }
    }

    @GetMapping("/user")
    public ResponseEntity<?> getUserAppointments(@RequestHeader("Authorization") String authHeader) {
        try {
            String email = extractEmailFromAuthHeader(authHeader);
            List<Appointment> appointments = appointmentService.getUserAppointments(email);
            List<AppointmentDto> dtos = appointments.stream()
                    .map(AppointmentDto::fromAppointment)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to fetch user appointments."));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateAppointmentStatus(@RequestHeader("Authorization") String authHeader, 
                                                     @PathVariable String id,
                                                     @RequestBody StatusUpdateRequest req) {
        try {
            extractEmailFromAuthHeader(authHeader);
            Appointment appointment = appointmentService.updateAppointmentStatus(UUID.fromString(id), req.getStatus(), req.getCancellationReason());
            AppointmentDto dto = AppointmentDto.fromAppointment(appointment);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to update appointment status."));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAppointment(@RequestHeader("Authorization") String authHeader,
                                               @PathVariable String id,
                                               @RequestBody RescheduleRequest req) {
        try {
            extractEmailFromAuthHeader(authHeader);
            Appointment appointment = appointmentService.updateAppointment(UUID.fromString(id), req.getAppointmentDate(), req.getTimeSlot(), req.getRescheduleReason(), req.getStatus());
            AppointmentDto dto = AppointmentDto.fromAppointment(appointment);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to update appointment."));
        }
    }

    private String extractEmailFromAuthHeader(String authHeader) throws Exception {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing or invalid authorization header.");
        }
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            throw new IllegalArgumentException("Invalid or expired token.");
        }
        return jwtUtil.getEmailFromToken(token);
    }

    static class ErrorResponse {
        public String message;
        public ErrorResponse(String message) {
            this.message = message;
        }
    }

    @Data
    static class StatusUpdateRequest {
        public String status;
        public String cancellationReason;
    }

    @Data
    static class RescheduleRequest {
        public String appointmentDate;
        public String timeSlot;
        public String rescheduleReason;
        public String status;
    }
}
