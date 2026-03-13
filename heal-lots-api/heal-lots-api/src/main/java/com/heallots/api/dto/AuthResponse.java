package com.heallots.api.dto;

import lombok.*;
import com.heallots.api.model.User;

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
        private String role;

        public static UserDto fromUser(User user) {
            UserDto dto = new UserDto();
            dto.setId(user.getId().toString());
            dto.setFullName(user.getFullName());
            dto.setEmail(user.getEmail());
            dto.setRole(user.getRole() != null ? user.getRole() : "USER");
            return dto;
        }
    }
}
