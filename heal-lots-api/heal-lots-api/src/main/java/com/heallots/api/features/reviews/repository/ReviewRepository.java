package com.heallots.api.features.reviews.repository;

import com.heallots.api.features.reviews.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findBySpecialistName(String specialistName);
    List<Review> findByAppointmentId(UUID appointmentId);
    List<Review> findByPatientEmail(String patientEmail);

    @Query("SELECT DISTINCT r.specialistName FROM Review r")
    List<String> findAllSpecialists();
}
