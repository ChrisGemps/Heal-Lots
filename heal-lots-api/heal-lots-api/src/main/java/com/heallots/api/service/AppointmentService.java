package com.heallots.api.service;

import com.heallots.api.model.Appointment;
import com.heallots.api.model.User;
import com.heallots.api.repository.AppointmentRepository;
import com.heallots.api.repository.UserRepository;
import com.heallots.api.dto.BookAppointmentRequest;
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

    public Appointment updateAppointmentStatus(UUID appointmentId, String newStatus) throws Exception {
        Optional<Appointment> apptOpt = appointmentRepository.findById(appointmentId);
        if (apptOpt.isEmpty()) {
            throw new IllegalArgumentException("Appointment not found.");
        }

        Appointment appt = apptOpt.get();
        appt.setStatus(newStatus);
        return appointmentRepository.save(appt);
    }

    public Appointment updateAppointment(UUID appointmentId, String appointmentDate, String timeSlot, String rescheduleReason) throws Exception {
        Optional<Appointment> apptOpt = appointmentRepository.findById(appointmentId);
        if (apptOpt.isEmpty()) {
            throw new IllegalArgumentException("Appointment not found.");
        }

        Appointment appt = apptOpt.get();
        appt.setAppointmentDate(appointmentDate);
        appt.setTimeSlot(timeSlot);
        appt.setStatus("Pending");
        // Store reschedule reason in notes for tracking
        if (rescheduleReason != null && !rescheduleReason.trim().isEmpty()) {
            appt.setNotes("Rescheduled: " + rescheduleReason);
        }
        return appointmentRepository.save(appt);
    }
}
