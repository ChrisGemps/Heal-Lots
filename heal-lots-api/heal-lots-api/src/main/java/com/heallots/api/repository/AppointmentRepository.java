package com.heallots.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.heallots.api.model.Appointment;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    List<Appointment> findByUserId(UUID userId);
    List<Appointment> findAllByOrderByCreatedAtDesc();
}
