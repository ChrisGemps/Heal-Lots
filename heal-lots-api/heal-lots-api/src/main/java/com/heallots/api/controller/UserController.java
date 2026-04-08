package com.heallots.api.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;
import com.heallots.api.dto.ChangePasswordRequest;
import com.heallots.api.dto.UpdateProfileRequest;
import com.heallots.api.dto.AuthResponse;
import com.heallots.api.service.AuthService;
import com.heallots.api.config.JwtUtil;
import com.heallots.api.model.User;
import com.heallots.api.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/user")
public class UserController {
    
    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

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

    @PostMapping("/upload-profile-picture")
    public ResponseEntity<?> uploadProfilePicture(@RequestHeader("Authorization") String authHeader, @RequestParam("file") MultipartFile file) {
        try {
            String email = extractEmailFromAuthHeader(authHeader);
            
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.status(400).body(new ErrorResponse("File is empty."));
            }
            if (file.getSize() > 5 * 1024 * 1024) { // 5MB limit
                return ResponseEntity.status(400).body(new ErrorResponse("File size must be under 5MB."));
            }
            if (!file.getContentType().startsWith("image/")) {
                return ResponseEntity.status(400).body(new ErrorResponse("File must be an image."));
            }
            
            // Create uploads directory using absolute path
            // Get the current working directory and create uploads folder there
            Path uploadsDir = Paths.get(System.getProperty("user.dir"), "uploads", "profile-pictures").toAbsolutePath();
            Files.createDirectories(uploadsDir);
            
            // Generate unique filename
            String extension = getFileExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadsDir.resolve(filename);
            
            // Save file to disk
            Files.write(filePath, file.getBytes());
            System.out.println("Profile picture saved to: " + filePath.toString());
            
            // Update user profile with just the filename (will be served via /api/user/profile-picture/{filename})
            User updatedUser = authService.updateProfilePicture(email, filename);
            
            AuthResponse.UserDto userDto = AuthResponse.UserDto.fromUser(updatedUser);
            return ResponseEntity.ok(userDto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to upload profile picture: " + e.getMessage()));
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }
        return "." + filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    @GetMapping("/profile-picture/{filename}")
    public ResponseEntity<?> getProfilePicture(@PathVariable String filename) {
        try {
            // Security: only allow alphanumeric and common file chars
            if (!filename.matches("[a-zA-Z0-9._-]+")) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Invalid filename."));
            }
            
            Path filePath = Paths.get(System.getProperty("user.dir"), "uploads", "profile-pictures", filename).toAbsolutePath();
            
            // Verify the file exists
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            
            // Read file
            byte[] fileBytes = Files.readAllBytes(filePath);
            
            // Determine content type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            // Return file with proper headers
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                    .body(fileBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to retrieve profile picture."));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers(@RequestHeader("Authorization") String authHeader) {
        try {
            extractEmailFromAuthHeader(authHeader); // Verify token is valid
            List<User> users = userRepository.findAll();
            List<AuthResponse.UserDto> userDtos = users.stream()
                    .map(AuthResponse.UserDto::fromUser)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(userDtos);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to fetch users."));
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
