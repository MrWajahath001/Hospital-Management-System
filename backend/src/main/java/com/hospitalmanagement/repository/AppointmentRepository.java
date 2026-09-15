package com.hospitalmanagement.repository;

import com.hospitalmanagement.model.Appointment;
import com.hospitalmanagement.model.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.time.LocalDateTime;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDoctorId(Long doctorId);

    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByDoctorIdAndAppointmentTimeBetween(Long doctorId, LocalDateTime start, LocalDateTime end);

    List<Appointment> findByDoctorIdAndStatus(Long doctorId, AppointmentStatus status);
}
