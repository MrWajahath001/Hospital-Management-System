package com.hospitalmanagement.controller;

import com.hospitalmanagement.model.*;
import com.hospitalmanagement.repository.*;
import com.hospitalmanagement.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            String username = credentials.get("username");
            String password = credentials.get("password");

            System.out.println("=== LOGIN ATTEMPT ===");
            System.out.println("Username: " + username);

            User user = userRepository.findByUsername(username).orElse(null);

            if (user == null) {
                System.out.println("User not found: " + username);
                return ResponseEntity.status(401).body(createResponse("User not found"));
            }

            if (!passwordEncoder.matches(password, user.getPassword())) {
                System.out.println("Invalid password for user: " + username);
                return ResponseEntity.status(401).body(createResponse("Invalid credentials"));
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getUsername());
            System.out.println("✅ Login successful for: " + username + " | Token: " + token.substring(0, 20) + "...");

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("fullName", user.getFullName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole().toString());
            response.put("token", token); // Add JWT token

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Login error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(createResponse("Login failed: " + e.getMessage()));
        }
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getDepartments() {
        try {
            return ResponseEntity.ok(departmentRepository.findAll());
        } catch (Exception e) {
            System.err.println("Error getting departments: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/register/patient")
    public ResponseEntity<?> registerPatient(@RequestBody Map<String, Object> request) {
        try {
            String username = (String) request.get("username");

            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(createResponse("Username already exists"));
            }

            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode((String) request.get("password")));
            user.setFullName((String) request.get("fullName"));
            user.setEmail((String) request.get("email"));
            user.setRole(Role.PATIENT);
            userRepository.save(user);

            Patient patient = new Patient();
            patient.setUser(user);
            patient.setContactNumber((String) request.get("contactNumber"));
            patientRepository.save(patient);

            // Generate JWT token for auto-login
            String token = jwtUtil.generateToken(user.getUsername());
            System.out.println("✅ Patient registered: " + username + " | Token generated");

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Patient registered successfully");
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("fullName", user.getFullName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole().toString());
            response.put("token", token);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Patient registration error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(createResponse("Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/register/doctor")
    public ResponseEntity<?> registerDoctor(@RequestBody Map<String, Object> request) {
        try {
            String username = (String) request.get("username");

            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body(createResponse("Username already exists"));
            }

            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode((String) request.get("password")));
            user.setFullName((String) request.get("fullName"));
            user.setEmail((String) request.get("email"));
            user.setRole(Role.DOCTOR);
            userRepository.save(user);

            Doctor doctor = new Doctor();
            doctor.setUser(user);
            doctor.setSpecialization((String) request.get("specialization"));

            Long deptId = Long.valueOf(request.get("departmentId").toString());
            Department dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            doctor.setDepartment(dept);

            doctorRepository.save(doctor);

            // Generate JWT token for auto-login
            String token = jwtUtil.generateToken(user.getUsername());
            System.out.println("✅ Doctor registered: " + username + " | Token generated");

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Doctor registered successfully");
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("fullName", user.getFullName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole().toString());
            response.put("token", token);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Doctor registration error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(createResponse("Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String newPassword = request.get("newPassword");

            System.out.println("=== PASSWORD RESET ATTEMPT ===");
            System.out.println("Username: " + username);

            User user = userRepository.findByUsername(username).orElse(null);

            if (user == null) {
                System.out.println("User not found for password reset: " + username);
                return ResponseEntity.badRequest().body(createResponse("User not found"));
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            System.out.println("✅ Password reset successful for: " + username);
            return ResponseEntity.ok(createResponse("Password reset successfully"));
        } catch (Exception e) {
            System.err.println("❌ Password reset error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(createResponse("Password reset failed: " + e.getMessage()));
        }
    }

    private Map<String, String> createResponse(String message) {
        Map<String, String> response = new HashMap<>();
        response.put("message", message);
        return response;
    }
}
