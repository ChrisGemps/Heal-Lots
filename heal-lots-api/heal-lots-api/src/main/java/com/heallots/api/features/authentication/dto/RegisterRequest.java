package com.heallots.api.features.authentication.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String fullName;
    private String email;
    private String password;
    private String phone;
    private String birthday;
    private String gender;
    private String address;
}
