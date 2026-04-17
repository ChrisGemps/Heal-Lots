package com.heallots.api.features.authentication.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import com.heallots.api.features.authentication.dto.RegisterRequest;
import com.heallots.api.features.authentication.dto.LoginRequest;
import com.heallots.api.features.authentication.dto.AuthResponse;
import com.heallots.api.features.authentication.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        try {
            AuthResponse response = authService.register(req);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String message = e.getMessage() != null ? e.getMessage() : "Registration failed. Please try again.";
            // Return 409 only for duplicate email, 400 for other validation errors
            int statusCode = message.contains("already exists") ? 409 : 400;
            return ResponseEntity.status(statusCode).body(new ErrorResponse(message));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            AuthResponse response = authService.login(req);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage()));
        }
    }

    static class ErrorResponse {
        public String message;
        public ErrorResponse(String message) {
            this.message = message;
        }
    }
}
