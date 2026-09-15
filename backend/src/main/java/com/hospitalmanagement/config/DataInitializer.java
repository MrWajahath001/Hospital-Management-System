package com.hospitalmanagement.config;

import com.hospitalmanagement.model.Role;
import com.hospitalmanagement.model.User;
import com.hospitalmanagement.model.Department;
import com.hospitalmanagement.model.Doctor;
import com.hospitalmanagement.model.Patient;
import com.hospitalmanagement.repository.UserRepository;
import com.hospitalmanagement.repository.DepartmentRepository;
import com.hospitalmanagement.repository.DoctorRepository;
import com.hospitalmanagement.repository.PatientRepository;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private DoctorRepository doctorRepository;
    @Autowired
    private PatientRepository patientRepository;

    @Override
    public void run(String... args) throws Exception {
        // 1. Admin
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            admin.setFullName("System Admin");
            userRepository.save(admin);
            System.out.println("Default Admin user created: admin / admin123");
        }

        // 2. Departments
        if (departmentRepository.count() == 0) {
            createDepartment("Cardiology", "Heart and cardiovascular system");
            createDepartment("Neurology", "Brain and nervous system");
            createDepartment("Pediatrics", "Medical care of infants, children, and adolescents");
            createDepartment("Orthopedics", "Musculoskeletal system");
            System.out.println("Default Departments created.");
        }

        // 3. Doctors & Patients (Demo Data)
        if (doctorRepository.count() == 0) {
            // Cardio Doctor
            createDoctor("doctor_cardio", "doc123", "Dr. Sarah Heart", "Cardiologist", "Cardiology");
            // Neuro Doctor
            createDoctor("doctor_neuro", "doc123", "Dr. John Brain", "Neurologist", "Neurology");
            System.out.println("Default Doctors created.");
        }

        if (patientRepository.count() == 0) {
            createPatient("patient_john", "pat123", "John Doe");
            createPatient("patient_jane", "pat123", "Jane Smith");
            System.out.println("Default Patients created.");
        }
    }

    private void createDepartment(String name, String desc) {
        Department dept = new Department();
        dept.setName(name);
        dept.setDescription(desc);
        departmentRepository.save(dept);
    }

    private void createDoctor(String username, String password, String name, String specialization, String deptName) {
        if (userRepository.findByUsername(username).isPresent())
            return;

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(Role.DOCTOR);
        user.setFullName(name);
        user = userRepository.save(user);

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setSpecialization(specialization);
        // Find department (assuming they exist from step 2)
        departmentRepository.findAll().stream()
                .filter(d -> d.getName().equals(deptName))
                .findFirst()
                .ifPresent(doctor::setDepartment);

        doctorRepository.save(doctor);
    }

    private void createPatient(String username, String password, String name) {
        if (userRepository.findByUsername(username).isPresent())
            return;

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(Role.PATIENT);
        user.setFullName(name);
        user = userRepository.save(user);

        Patient patient = new Patient();
        patient.setUser(user);
        patient.setMedicalHistory("No significant history.");
        patientRepository.save(patient);
    }
}
