package com.hospitalmanagement.controller;

import com.hospitalmanagement.model.*;
import com.hospitalmanagement.repository.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/patient")
public class PatientController {

    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private DoctorRepository doctorRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    private Patient getCurrentPatient() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        return patientRepository.findByUserId(user.getId()).orElse(null);
    }

    @GetMapping("/doctors")
    public ResponseEntity<?> getAllDoctors() {
        try {
            System.out.println("=== FETCHING ALL DOCTORS ===");
            List<Doctor> doctors = doctorRepository.findAll();
            System.out.println("Found " + doctors.size() + " doctors");

            // Return doctors with user information
            List<java.util.Map<String, Object>> doctorList = doctors.stream()
                    .map(doctor -> {
                        java.util.Map<String, Object> doctorMap = new java.util.HashMap<>();
                        doctorMap.put("id", doctor.getId());
                        doctorMap.put("specialization", doctor.getSpecialization());
                        doctorMap.put("maxPatientsPerDay", doctor.getMaxPatientsPerDay());

                        if (doctor.getUser() != null) {
                            doctorMap.put("fullName", doctor.getUser().getFullName());
                            doctorMap.put("email", doctor.getUser().getEmail());
                        }

                        if (doctor.getDepartment() != null) {
                            doctorMap.put("departmentName", doctor.getDepartment().getName());
                        }

                        return doctorMap;
                    })
                    .collect(java.util.stream.Collectors.toList());

            System.out.println("Returning " + doctorList.size() + " doctors to frontend");
            return ResponseEntity.ok(doctorList);
        } catch (Exception e) {
            System.err.println("Error fetching doctors: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Failed to load doctors"));
        }
    }

    @PostMapping("/appointments")
    public ResponseEntity<?> bookAppointment(@Valid @RequestBody Appointment appointment) {
        try {
            // Custom validation: Allow appointments within last 1 minute or in the future
            // This accounts for minor timing differences while preventing past bookings
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime appointmentTime = appointment.getAppointmentTime();

            if (appointmentTime != null) {
                LocalDateTime bufferTime = now.minusMinutes(1);
                if (appointmentTime.isBefore(bufferTime)) {
                    return ResponseEntity.badRequest()
                            .body(java.util.Map.of("message",
                                    "Appointment date and time cannot be in the past. Please select a valid time."));
                }
            }

            Patient patient = getCurrentPatient();
            if (patient == null) {
                // Auto-create patient profile if simple user
                UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication()
                        .getPrincipal();
                User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
                patient = new Patient();
                patient.setUser(user);
                patientRepository.save(patient);
            }

            // Ensure doctor is properly set
            if (appointment.getDoctor() != null && appointment.getDoctor().getId() != null) {
                Doctor doctor = doctorRepository.findById(appointment.getDoctor().getId())
                        .orElseThrow(() -> new RuntimeException("Doctor not found"));
                appointment.setDoctor(doctor);
            }

            appointment.setPatient(patient);
            appointment.setStatus(AppointmentStatus.PENDING);
            appointmentRepository.save(appointment);

            return ResponseEntity.ok(java.util.Map.of("message", "Appointment booked successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Booking failed: " + e.getMessage()));
        }
    }

    @GetMapping("/appointments")
    public List<Appointment> getMyAppointments() {
        Patient patient = getCurrentPatient();
        if (patient == null)
            return List.of();
        return appointmentRepository.findByPatientId(patient.getId());
    }

    @GetMapping("/medical-records")
    public ResponseEntity<?> getMyMedicalRecords() {
        try {
            Patient patient = getCurrentPatient();
            if (patient == null) {
                return ResponseEntity.ok(List.of());
            }

            List<MedicalRecord> records = medicalRecordRepository.findByPatientId(patient.getId());

            // Return records with doctor information
            List<java.util.Map<String, Object>> recordList = records.stream()
                    .map(record -> {
                        java.util.Map<String, Object> recordMap = new java.util.HashMap<>();
                        recordMap.put("id", record.getId());
                        recordMap.put("diagnosis", record.getDiagnosis());
                        recordMap.put("prescription", record.getPrescription());
                        recordMap.put("recordDate", record.getRecordDate());
                        recordMap.put("reportFilePath", record.getReportFilePath());

                        if (record.getDoctor() != null && record.getDoctor().getUser() != null) {
                            recordMap.put("doctorName", record.getDoctor().getUser().getFullName());
                            recordMap.put("doctorSpecialization", record.getDoctor().getSpecialization());
                        }

                        return recordMap;
                    })
                    .collect(java.util.stream.Collectors.toList());

            return ResponseEntity.ok(recordList);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Failed to load medical records"));
        }
    }

    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id) {
        try {
            Patient patient = getCurrentPatient();
            Appointment appointment = appointmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Appointment not found"));

            // Verify ownership
            if (!appointment.getPatient().getId().equals(patient.getId())) {
                return ResponseEntity.status(403)
                        .body(java.util.Map.of("message", "You can only cancel your own appointments"));
            }

            appointmentRepository.delete(appointment);
            return ResponseEntity.ok(java.util.Map.of("message", "Appointment cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Failed to cancel appointment"));
        }
    }

    @DeleteMapping("/appointments/clear")
    public ResponseEntity<?> clearAppointmentHistory() {
        try {
            Patient patient = getCurrentPatient();
            List<Appointment> appointments = appointmentRepository.findByPatientId(patient.getId());
            appointmentRepository.deleteAll(appointments);
            return ResponseEntity.ok(java.util.Map.of("message", "Appointment history cleared successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Failed to clear history"));
        }
    }
}
