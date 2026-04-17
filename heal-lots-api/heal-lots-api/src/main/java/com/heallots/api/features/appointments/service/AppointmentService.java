package com.heallots.api.features.appointments.service;

import com.heallots.api.features.appointments.model.Appointment;
import com.heallots.api.features.authentication.model.User;
import com.heallots.api.features.appointments.repository.AppointmentRepository;
import com.heallots.api.features.authentication.repository.UserRepository;
import com.heallots.api.features.appointments.dto.BookAppointmentRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AppointmentService {
    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    public Appointment bookAppointment(String email, BookAppointmentRequest req) throws Exception {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found.");
        }

        User user = userOpt.get();
        Appointment appointment = new Appointment();
        appointment.setUser(user);
        appointment.setServiceName(req.getServiceName());
        appointment.setSpecialistName(req.getSpecialistName());
        appointment.setAppointmentDate(req.getAppointmentDate());
        appointment.setTimeSlot(req.getTimeSlot());
        appointment.setReason(req.getReason());
        appointment.setNotes(req.getNotes());
        appointment.setStatus("Pending");

        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Appointment> getUserAppointments(String email) throws Exception {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found.");
        }

        return appointmentRepository.findByUserId(userOpt.get().getId());
    }

    public Appointment updateAppointmentStatus(UUID appointmentId, String newStatus, String cancellationReason) throws Exception {
        Optional<Appointment> apptOpt = appointmentRepository.findById(appointmentId);
        if (apptOpt.isEmpty()) {
            throw new IllegalArgumentException("Appointment not found.");
        }

        Appointment appt = apptOpt.get();
        appt.setStatus(newStatus);
        if (cancellationReason != null && !cancellationReason.trim().isEmpty()) {
            appt.setCancellationReason(cancellationReason);
        }
        return appointmentRepository.save(appt);
    }

    public Appointment updateAppointment(UUID appointmentId, String appointmentDate, String timeSlot, String rescheduleReason, String status) throws Exception {
        Optional<Appointment> apptOpt = appointmentRepository.findById(appointmentId);
        if (apptOpt.isEmpty()) {
            throw new IllegalArgumentException("Appointment not found.");
        }

        Appointment appt = apptOpt.get();
        appt.setAppointmentDate(appointmentDate);
        appt.setTimeSlot(timeSlot);
        if (status != null && !status.trim().isEmpty()) {
            appt.setStatus(status);
        } else {
            appt.setStatus("Pending");
        }
        if (rescheduleReason != null && !rescheduleReason.trim().isEmpty()) {
            appt.setRescheduleReason(rescheduleReason);
        }
        return appointmentRepository.save(appt);
    }
}
