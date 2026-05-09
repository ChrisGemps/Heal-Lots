package com.heallots.api.config;

import io.jsonwebtoken.security.WeakKeyException;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;

class JwtUtilTest {

    @Test
    void generateAndReadTokenWithShortPlainSecret() {
        JwtUtil jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", "short-render-secret");
        ReflectionTestUtils.setField(jwtUtil, "jwtExpiration", 3600000L);

        String token = assertDoesNotThrow(() -> jwtUtil.generateToken("user@example.com"));
        String email = assertDoesNotThrow(() -> jwtUtil.getEmailFromToken(token));

        assertEquals("user@example.com", email);
    }

    @Test
    void generateTokenWithTooShortBase64SecretStillProducesValidHs512Key() {
        JwtUtil jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEy");
        ReflectionTestUtils.setField(jwtUtil, "jwtExpiration", 3600000L);

        assertDoesNotThrow(() -> jwtUtil.generateToken("user@example.com"));
    }
}
