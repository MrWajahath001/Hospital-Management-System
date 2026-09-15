package com.hospitalmanagement.controller;

import com.hospitalmanagement.model.*;
import com.hospitalmanagement.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/doctor")
public class DoctorController {

    @Autowired
    private DoctorRepository doctorRepository;
    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private MedicalRecordRepository medicalRecordRepository;
    @Autowired
    private UserRepository userRepository;

    private Doctor getCurrentDoctor() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        return doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
    }

    @GetMapping("/appointments")
    public List<Appointment> getAppointments() {
        Doctor doctor = getCurrentDoctor();
        // Simplified: return all. In real app, filter by date.
        return appointmentRepository.findByDoctorId(doctor.getId());
    }

    @GetMapping("/patients/{patientId}/history")
    public List<MedicalRecord> getPatientHistory(@PathVariable Long patientId) {
        return medicalRecordRepository.findByPatientId(patientId);
    }

    @PostMapping("/appointments/{appointmentId}/complete")
    public ResponseEntity<?> completeAppointment(@PathVariable Long appointmentId, @RequestBody MedicalRecord record) {
        Appointment appointment = appointmentRepository.findById(appointmentId).orElseThrow();
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);

        record.setPatient(appointment.getPatient());
        record.setDoctor(appointment.getDoctor());
        medicalRecordRepository.save(record);

        return ResponseEntity.ok(java.util.Map.of("message", "Appointment completed and medical record added"));
    }

    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<?> deleteAppointment(@PathVariable Long id) {
        try {
            Doctor doctor = getCurrentDoctor();
            Appointment appointment = appointmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Appointment not found"));

            // Verify ownership
            if (!appointment.getDoctor().getId().equals(doctor.getId())) {
                return ResponseEntity.status(403)
                        .body(java.util.Map.of("message", "You can only delete your own appointments"));
            }

            appointmentRepository.delete(appointment);
            return ResponseEntity.ok(java.util.Map.of("message", "Appointment deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Failed to delete appointment"));
        }
    }

    @DeleteMapping("/appointments/clear")
    public ResponseEntity<?> clearAppointmentHistory() {
        try {
            Doctor doctor = getCurrentDoctor();
            List<Appointment> appointments = appointmentRepository.findByDoctorId(doctor.getId());
            // We might want to filter only completed/cancelled ones, but user asked for
            // "clear history"
            // Assuming this clears the view for the doctor.
            // Ideally, we'd just hide them or have a 'deleted_by_doctor' flag, but for this
            // scope, delete is fine
            // as long as MedicalRecords persist (which they do, linked to patient/doctor
            // IDs directly).
            appointmentRepository.deleteAll(appointments);
            return ResponseEntity.ok(java.util.Map.of("message", "Appointment history cleared successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Failed to clear history"));
        }
    }
}
