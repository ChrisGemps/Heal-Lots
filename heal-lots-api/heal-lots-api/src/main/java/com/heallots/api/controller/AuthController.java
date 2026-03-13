package com.heallots.api.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import com.heallots.api.dto.RegisterRequest;
import com.heallots.api.dto.LoginRequest;
import com.heallots.api.dto.AuthResponse;
import com.heallots.api.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        try {
            AuthResponse response = authService.register(req);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(409).body(new ErrorResponse(e.getMessage()));
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
