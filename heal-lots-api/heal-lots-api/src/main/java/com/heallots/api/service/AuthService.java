package com.heallots.api.service;

import com.heallots.api.model.User;
import com.heallots.api.repository.UserRepository;
import com.heallots.api.dto.LoginRequest;
import com.heallots.api.dto.RegisterRequest;
import com.heallots.api.dto.AuthResponse;
import com.heallots.api.dto.UpdateProfileRequest;
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
        user.setPhone(req.getPhone());
        user.setBirthday(req.getBirthday());
        user.setGender(req.getGender());
        user.setAddress(req.getAddress());
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

    public void changePassword(String email, String currentPassword, String newPassword) throws Exception {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found.");
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User updateProfile(String email, UpdateProfileRequest req) throws Exception {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found.");
        }

        User user = userOpt.get();
        
        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getEmail() != null) user.setEmail(req.getEmail());
        if (req.getPhone() != null) user.setPhone(req.getPhone());
        if (req.getBirthday() != null) user.setBirthday(req.getBirthday());
        if (req.getGender() != null) user.setGender(req.getGender());
        if (req.getAddress() != null) user.setAddress(req.getAddress());
        if (req.getProfilePictureUrl() != null) user.setProfilePictureUrl(req.getProfilePictureUrl());
        
        return userRepository.save(user);
    }

    public User updateProfilePicture(String email, String profilePictureUrl) throws Exception {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found.");
        }

        User user = userOpt.get();
        user.setProfilePictureUrl(profilePictureUrl);
        return userRepository.save(user);
    }
}
