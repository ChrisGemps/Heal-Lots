package com.heallots.api.features.authentication.service;

import com.heallots.api.features.authentication.model.User;
import com.heallots.api.features.authentication.repository.UserRepository;
import com.heallots.api.features.authentication.dto.LoginRequest;
import com.heallots.api.features.authentication.dto.RegisterRequest;
import com.heallots.api.features.authentication.dto.AuthResponse;
import com.heallots.api.features.authentication.dto.UpdateProfileRequest;
import com.heallots.api.config.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.Locale;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest req) throws Exception {
        String normalizedEmail = normalizeEmail(req.getEmail());
        if (normalizedEmail == null) {
            throw new IllegalArgumentException("Email is required.");
        }

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new Exception("An account with this email already exists.");
        }

        User user = new User();
        user.setFullName(trimToNull(req.getFullName()));
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setPhone(trimToNull(req.getPhone()));
        user.setBirthday(trimToNull(req.getBirthday()));
        user.setGender(trimToNull(req.getGender()));
        user.setAddress(trimToNull(req.getAddress()));
        user.setRole("USER");

        User savedUser;
        try {
            savedUser = userRepository.save(user);
        } catch (DataIntegrityViolationException ex) {
            throw new Exception("An account with this email already exists.");
        }
        String token = jwtUtil.generateToken(savedUser.getEmail());

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUser(AuthResponse.UserDto.fromUser(savedUser));
        return response;
    }

    public AuthResponse login(LoginRequest req) throws Exception {
        String normalizedEmail = normalizeEmail(req.getEmail());
        Optional<User> userOpt = normalizedEmail == null
                ? Optional.empty()
                : userRepository.findByEmailIgnoreCase(normalizedEmail);
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
        Optional<User> userOpt = findUserByEmail(email);
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
        Optional<User> userOpt = findUserByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found.");
        }

        User user = userOpt.get();
        
        if (req.getFullName() != null) user.setFullName(trimToNull(req.getFullName()));
        if (req.getPhone() != null) user.setPhone(trimToNull(req.getPhone()));
        if (req.getBirthday() != null) user.setBirthday(trimToNull(req.getBirthday()));
        if (req.getGender() != null) user.setGender(trimToNull(req.getGender()));
        if (req.getAddress() != null) user.setAddress(trimToNull(req.getAddress()));
        if (req.getProfilePictureUrl() != null) user.setProfilePictureUrl(trimToNull(req.getProfilePictureUrl()));

        if (req.getEmail() != null) {
            String normalizedEmail = normalizeEmail(req.getEmail());
            if (normalizedEmail == null) {
                throw new IllegalArgumentException("Email is required.");
            }

            boolean emailTakenByAnotherUser = userRepository.findByEmailIgnoreCase(normalizedEmail)
                    .filter(existingUser -> !existingUser.getId().equals(user.getId()))
                    .isPresent();
            if (emailTakenByAnotherUser) {
                throw new IllegalArgumentException("An account with this email already exists.");
            }

            user.setEmail(normalizedEmail);
        }

        try {
            return userRepository.save(user);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }
    }

    public User updateProfilePicture(String email, String profilePictureUrl) throws Exception {
        Optional<User> userOpt = findUserByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found.");
        }

        User user = userOpt.get();
        user.setProfilePictureUrl(profilePictureUrl);
        return userRepository.save(user);
    }

    private Optional<User> findUserByEmail(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null) {
            return Optional.empty();
        }

        return userRepository.findByEmailIgnoreCase(normalizedEmail);
    }

    private String normalizeEmail(String email) {
        String trimmedEmail = trimToNull(email);
        if (trimmedEmail == null) {
            return null;
        }

        return trimmedEmail.toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
    }
}
