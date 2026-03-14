package com.heallots.api.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import com.heallots.api.dto.ChangePasswordRequest;
import com.heallots.api.dto.UpdateProfileRequest;
import com.heallots.api.dto.AuthResponse;
import com.heallots.api.service.AuthService;
import com.heallots.api.config.JwtUtil;
import com.heallots.api.model.User;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
    
    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestHeader("Authorization") String authHeader, @RequestBody ChangePasswordRequest req) {
        try {
            String email = extractEmailFromAuthHeader(authHeader);
            authService.changePassword(email, req.getCurrentPassword(), req.getNewPassword());
            return ResponseEntity.ok(new SuccessResponse("Password updated successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to update password."));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestHeader("Authorization") String authHeader, @RequestBody UpdateProfileRequest req) {
        try {
            String email = extractEmailFromAuthHeader(authHeader);
            User updatedUser = authService.updateProfile(email, req);
            AuthResponse.UserDto userDto = AuthResponse.UserDto.fromUser(updatedUser);
            return ResponseEntity.ok(userDto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to update profile."));
        }
    }

    private String extractEmailFromAuthHeader(String authHeader) throws Exception {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing or invalid authorization header.");
        }
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            throw new IllegalArgumentException("Invalid or expired token.");
        }
        return jwtUtil.getEmailFromToken(token);
    }

    static class SuccessResponse {
        public String message;
        public SuccessResponse(String message) {
            this.message = message;
        }
    }

    static class ErrorResponse {
        public String message;
        public ErrorResponse(String message) {
            this.message = message;
        }
    }
}
