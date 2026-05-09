package com.heallots.api.features.authentication.service;

import com.heallots.api.config.JwtUtil;
import com.heallots.api.features.authentication.dto.AuthResponse;
import com.heallots.api.features.authentication.dto.LoginRequest;
import com.heallots.api.features.authentication.dto.RegisterRequest;
import com.heallots.api.features.authentication.model.User;
import com.heallots.api.features.authentication.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerNormalizesEmailBeforeCheckingDuplicates() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Test User",
                "  Person@Example.COM ",
                "secret123",
                "09171234567",
                "2000-01-01",
                "female",
                "Manila"
        );

        when(userRepository.existsByEmailIgnoreCase("person@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encoded-password");

        User savedUser = new User();
        savedUser.setId(UUID.randomUUID());
        savedUser.setEmail("person@example.com");
        savedUser.setPassword("encoded-password");
        savedUser.setRole("USER");

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtUtil.generateToken("person@example.com")).thenReturn("jwt-token");

        AuthResponse response = authService.register(request);

        assertEquals("person@example.com", response.getUser().getEmail());
        verify(userRepository).existsByEmailIgnoreCase("person@example.com");
    }

    @Test
    void registerReturnsDuplicateMessageWhenDatabaseRejectsDuplicateEmail() {
        RegisterRequest request = new RegisterRequest(
                "Test User",
                "person@example.com",
                "secret123",
                "09171234567",
                "2000-01-01",
                "female",
                "Manila"
        );

        when(userRepository.existsByEmailIgnoreCase("person@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenThrow(new DataIntegrityViolationException("duplicate"));

        Exception exception = assertThrows(Exception.class, () -> authService.register(request));

        assertEquals("An account with this email already exists.", exception.getMessage());
    }

    @Test
    void loginUsesCaseInsensitiveNormalizedEmailLookup() throws Exception {
        LoginRequest request = new LoginRequest("  PERSON@example.com ", "secret123");

        User existingUser = new User();
        existingUser.setId(UUID.randomUUID());
        existingUser.setEmail("person@example.com");
        existingUser.setPassword("encoded-password");
        existingUser.setRole("USER");

        when(userRepository.findByEmailIgnoreCase("person@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("secret123", "encoded-password")).thenReturn(true);
        when(jwtUtil.generateToken("person@example.com")).thenReturn("jwt-token");

        AuthResponse response = authService.login(request);

        assertEquals("person@example.com", response.getUser().getEmail());
        verify(userRepository).findByEmailIgnoreCase("person@example.com");
        verify(userRepository, never()).findByEmail(any());
    }
}
