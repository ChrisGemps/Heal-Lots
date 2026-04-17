package com.heallots.api.features.authentication.dto;

import lombok.*;
import com.heallots.api.features.authentication.model.User;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserDto user;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private String id;
        private String fullName;
        private String email;
        private String phone;
        private String birthday;
        private String gender;
        private String address;
        private String profilePictureUrl;
        private String role;
        private String createdAt;

        public static UserDto fromUser(User user) {
            UserDto dto = new UserDto();
            dto.setId(user.getId().toString());
            dto.setFullName(user.getFullName());
            dto.setEmail(user.getEmail());
            dto.setPhone(user.getPhone());
            dto.setBirthday(user.getBirthday());
            dto.setGender(user.getGender());
            dto.setAddress(user.getAddress());
            dto.setProfilePictureUrl(user.getProfilePictureUrl());
            dto.setRole(user.getRole() != null ? user.getRole() : "USER");
            dto.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
            return dto;
        }
    }
}
