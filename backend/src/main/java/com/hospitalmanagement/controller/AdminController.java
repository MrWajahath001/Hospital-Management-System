package com.hospitalmanagement.controller;

import com.hospitalmanagement.dto.DoctorRegistrationDto;
import com.hospitalmanagement.model.*;
import com.hospitalmanagement.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private DoctorRepository doctorRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    // Department Management
    @PostMapping("/departments")
    public Department addDepartment(@RequestBody Department department) {
        return departmentRepository.save(department);
    }

    @GetMapping("/departments")
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable Long id) {
        departmentRepository.deleteById(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Department deleted"));
    }

    // Doctor Management
    @PostMapping("/doctors")
    public ResponseEntity<?> addDoctor(@RequestBody DoctorRegistrationDto doctorDto) {
        // Create User
        if (userRepository.findByUsername(doctorDto.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username taken");
        }
        User user = new User();
        user.setUsername(doctorDto.getUsername());
        user.setPassword(passwordEncoder.encode(doctorDto.getPassword()));
        user.setRole(Role.DOCTOR);
        user.setFullName(doctorDto.getFullName());
        user = userRepository.save(user); // Save User first

        // Create Doctor
        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setSpecialization(doctorDto.getSpecialization());

        Department dept = departmentRepository.findById(doctorDto.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));
        doctor.setDepartment(dept);

        doctorRepository.save(doctor);
        return ResponseEntity.ok(java.util.Map.of("message", "Doctor added successfully"));
    }

    @DeleteMapping("/doctors/{id}")
    public ResponseEntity<?> deleteDoctor(@PathVariable Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        User user = doctor.getUser();

        // 1. Delete associated appointments
        List<Appointment> appointments = appointmentRepository.findByDoctorId(id);
        appointmentRepository.deleteAll(appointments);

        // 2. Unlink medical records (set doctor to null)
        List<MedicalRecord> medicalRecords = medicalRecordRepository.findByDoctorId(id);
        for (MedicalRecord record : medicalRecords) {
            record.setDoctor(null);
            medicalRecordRepository.save(record);
        }

        // 3. Delete doctor
        doctorRepository.delete(doctor);

        // 4. Delete associated user
        if (user != null) {
            userRepository.delete(user);
        }

        return ResponseEntity.ok(java.util.Map.of("message", "Doctor deleted successfully"));
    }

    // Appointment Approval
    @PutMapping("/appointments/{id}/approve")
    public ResponseEntity<?> approveAppointment(@PathVariable Long id) {
        Appointment appointment = appointmentRepository.findById(id).orElseThrow();
        appointment.setStatus(AppointmentStatus.APPROVED);
        appointmentRepository.save(appointment);
        return ResponseEntity.ok(java.util.Map.of("message", "Appointment approved"));
    }

    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<?> deleteAppointment(@PathVariable Long id) {
        appointmentRepository.deleteById(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Appointment deleted successfully"));
    }

    @PutMapping("/appointments/{id}/reject")
    public ResponseEntity<?> rejectAppointment(@PathVariable Long id) {
        Appointment appointment = appointmentRepository.findById(id).orElseThrow();
        appointment.setStatus(AppointmentStatus.REJECTED);
        appointmentRepository.save(appointment);
        return ResponseEntity.ok(java.util.Map.of("message", "Appointment rejected"));
    }

    @GetMapping("/appointments")
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }
}
