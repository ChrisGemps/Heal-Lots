package com.heallots.api.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private String fullName;
    private String email;
    private String phone;
    private String birthday;
    private String gender;
    private String address;
    private String profilePictureUrl;
}
