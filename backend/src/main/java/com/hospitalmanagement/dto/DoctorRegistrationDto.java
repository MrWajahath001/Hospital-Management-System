package com.hospitalmanagement.dto;

import lombok.Data;

@Data
public class DoctorRegistrationDto {
    private String username;
    private String password;
    private String fullName;
    private String specialization;
    private Long departmentId;
}
