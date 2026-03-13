package com.heallots.api.service;

import com.heallots.api.model.User;
import com.heallots.api.repository.UserRepository;
import com.heallots.api.dto.LoginRequest;
import com.heallots.api.dto.RegisterRequest;
import com.heallots.api.dto.AuthResponse;
import com.heallots.api.config.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest req) throws Exception {
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new Exception("An account with this email already exists.");
        }

        User user = new User();
        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole("USER");

        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getEmail());

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUser(AuthResponse.UserDto.fromUser(savedUser));
        return response;
    }

    public AuthResponse login(LoginRequest req) throws Exception {
        Optional<User> userOpt = userRepository.findByEmail(req.getEmail());
        if (userOpt.isEmpty()) {
            throw new Exception("Invalid email or password.");
        }
        
        User user = userOpt.get();
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new Exception("Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUser(AuthResponse.UserDto.fromUser(user));
        return response;
    }
}
